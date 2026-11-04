// The frames of a scroll-scrubbed image sequence.
//
// All frames are fetched as compressed files (a few MB in all) with a few
// requests at a time, but only the ones near the frame being shown are decoded:
// 106 decoded 1600×900 frames would take over 600 MB. A frame that is not
// decoded yet is decoded on request and reported through onReady, so the
// caller can keep showing the last frame meanwhile and redraw when it lands.

export interface FrameSequenceOptions {
  urls: string[];
  // Requests in flight at once.
  concurrency?: number;
  // Decoded frames kept; the least recently used are released.
  keepDecoded?: number;
  onReady: (index: number) => void;
}

export class FrameSequence {
  private blobs: (Blob | null)[];
  private decoded = new Map<number, ImageBitmap>();
  private decoding = new Set<number>();
  private queue: number[] = [];
  private inFlight = 0;
  private started = false;
  // The frame on screen: never released, the canvas may need it again.
  private pinned = -1;
  private disposed = false;
  private controller = new AbortController();
  private readonly concurrency: number;
  private readonly keep: number;

  constructor(private opts: FrameSequenceOptions) {
    this.blobs = opts.urls.map(() => null);
    this.concurrency = opts.concurrency ?? 4;
    this.keep = opts.keepDecoded ?? 12;
  }

  get length() {
    return this.opts.urls.length;
  }

  // The first frames first, so the opening can be shown at once; the rest follow.
  load(firstCount = 6) {
    if (this.started) return;
    this.started = true;
    const order = this.opts.urls.map((_, i) => i);
    this.queue = [...order.slice(0, firstCount), ...order.slice(firstCount)];
    this.pump();
  }

  private pump() {
    while (!this.disposed && this.inFlight < this.concurrency && this.queue.length) {
      const i = this.queue.shift()!;
      if (this.blobs[i]) continue;
      this.inFlight++;
      fetch(this.opts.urls[i], { signal: this.controller.signal })
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status} ${this.opts.urls[i]}`))))
        .then((blob) => {
          if (this.disposed) return;
          this.blobs[i] = blob;
          // Someone was already waiting for this one.
          if (this.decoding.has(i)) {
            this.decoding.delete(i);
            this.get(i);
          }
        })
        .catch((err) => {
          if (!this.disposed && err?.name !== 'AbortError') console.warn('Frame failed to load:', err);
        })
        .finally(() => {
          this.inFlight--;
          this.pump();
        });
    }
  }

  // The frame if it is ready; otherwise null, and onReady(i) follows once it is.
  get(i: number): ImageBitmap | null {
    const hit = this.decoded.get(i);
    if (hit) {
      // Most recently used goes to the end.
      this.decoded.delete(i);
      this.decoded.set(i, hit);
      return hit;
    }
    if (this.decoding.has(i)) return null;
    this.decoding.add(i);
    const blob = this.blobs[i];
    if (!blob) {
      // Not downloaded yet: move it to the front of the queue.
      this.queue = [i, ...this.queue.filter((q) => q !== i)];
      this.pump();
      return null;
    }
    createImageBitmap(blob)
      .then((bmp) => {
        this.decoding.delete(i);
        if (this.disposed) {
          bmp.close();
          return;
        }
        this.decoded.set(i, bmp);
        this.evict();
        this.opts.onReady(i);
      })
      .catch((err) => {
        this.decoding.delete(i);
        console.warn('Frame failed to decode:', err);
      });
    return null;
  }

  // Marks the frame now on screen, so it stays decoded.
  pin(i: number) {
    this.pinned = i;
  }

  private evict() {
    for (const [index, bmp] of this.decoded) {
      if (this.decoded.size <= this.keep) break;
      if (index === this.pinned) continue;
      this.decoded.delete(index);
      bmp.close();
    }
  }

  dispose() {
    this.disposed = true;
    this.controller.abort();
    this.decoded.forEach((b) => b.close());
    this.decoded.clear();
    this.blobs = [];
    this.queue = [];
  }
}
