import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet, RotateCw, ExternalLink } from 'lucide-react';

/**
 * Development-only device preview.
 *
 * The site is rendered inside an iframe rather than a scaled-down box, because
 * only a real nested browsing context gives the phone its own viewport: Tailwind
 * breakpoints, `vh` units and the popup's `h-[85vh]` all resolve against the
 * frame instead of the desktop window. `main.tsx` loads this module only when
 * `import.meta.env.DEV` is set, so nothing here reaches the production bundle.
 */

interface Device {
  id: string;
  label: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}

const devices: Device[] = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, icon: Smartphone },
  { id: 'iphone-15', label: 'iPhone 15', width: 393, height: 852, icon: Smartphone },
  { id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915, icon: Smartphone },
  { id: 'ipad-mini', label: 'iPad mini', width: 744, height: 1133, icon: Tablet },
];

// The framed copy of the site carries this flag so it renders the app plainly
// and does not open a preview inside the preview.
export const FRAME_PARAM = '__frame';

const STORAGE_KEY = 'sp-dev-preview';

type Stored = { deviceId: string; landscape: boolean } | null;

const readStored = (): Stored => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
};

const DevicePreviewShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = readStored();
  const startsInPreview =
    new URLSearchParams(window.location.search).get('preview') === 'phone' || !!stored;

  const [active, setActive] = useState(startsInPreview);
  const [device, setDevice] = useState<Device>(
    devices.find((d) => d.id === stored?.deviceId) ?? devices[1]
  );
  const [landscape, setLandscape] = useState(stored?.landscape ?? false);
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // The chosen device survives reloads; leaving the preview forgets it.
  useEffect(() => {
    try {
      if (active) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ deviceId: device.id, landscape }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* private mode - the preview simply will not be remembered */
    }
  }, [active, device.id, landscape]);

  const width = landscape ? device.height : device.width;
  const height = landscape ? device.width : device.height;

  // Shrink the frame only when the window is too small to show it life-size.
  useEffect(() => {
    if (!active) return;
    const fit = () => {
      const stage = stageRef.current;
      if (!stage) return;
      setScale(Math.min(1, (stage.clientHeight - 32) / height, (stage.clientWidth - 32) / width));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [active, width, height]);

  // Desktop scrollbars steal ~15px of viewport width and phones use overlay
  // scrollbars anyway, so the framed document hides its own.
  const hideFrameScrollbars = () => {
    try {
      const doc = frameRef.current?.contentDocument;
      if (!doc || doc.getElementById('dev-preview-scrollbars')) return;
      const style = doc.createElement('style');
      style.id = 'dev-preview-scrollbars';
      style.textContent =
        'html,body,*{scrollbar-width:none!important}' +
        '*::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}';
      doc.head.appendChild(style);
    } catch {
      /* nothing to do if the frame is not readable */
    }
  };

  const framePath = () => {
    const params = new URLSearchParams(window.location.search);
    params.set(FRAME_PARAM, '1');
    params.delete('preview');
    return `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  };

  // Keep the page the visitor browsed to inside the frame when switching back.
  const leavePreview = () => {
    try {
      const inner = frameRef.current?.contentWindow?.location;
      if (inner) {
        const params = new URLSearchParams(inner.search);
        params.delete(FRAME_PARAM);
        const query = params.toString();
        window.history.replaceState(null, '', inner.pathname + (query ? `?${query}` : ''));
      }
    } catch {
      /* the frame navigated somewhere unreadable - keep the current URL */
    }
    setActive(false);
  };

  if (!active) {
    return (
      <>
        {children}
        <button
          onClick={() => setActive(true)}
          title="Skatīt telefona izskatā (tikai izstrādē)"
          className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 rounded-full border border-green-500/40 bg-[#0a0a0a]/90 px-4 py-2 text-sm font-medium text-green-400 shadow-lg backdrop-blur transition hover:bg-green-600 hover:text-white"
        >
          <Smartphone className="h-4 w-4" />
          Telefons
        </button>
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-[#111]">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-[#0a0a0a] px-3 py-2">
        <button
          onClick={leavePreview}
          className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-gray-700"
        >
          <Monitor className="h-4 w-4" />
          Dators
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        {devices.map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                d.id === device.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {d.label}
            </button>
          );
        })}

        <button
          onClick={() => setLandscape((v) => !v)}
          title="Pagriezt"
          className="flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
        >
          <RotateCw className="h-4 w-4" />
          {width} x {height}
        </button>

        <span className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          {scale < 1 && <span>{Math.round(scale * 100)}%</span>}
          <a
            href={framePath()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition hover:text-gray-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Jaunā cilnē
          </a>
          <span>tikai izstrādē</span>
        </span>
      </div>

      {/* Stage */}
      <div ref={stageRef} className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <div
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="overflow-hidden rounded-[2rem] border-[10px] border-[#1c1c1c] bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10"
        >
          <iframe
            ref={frameRef}
            key={`${device.id}-${landscape}`}
            src={framePath()}
            title="SaimniekaPirts telefona priekšskatījums"
            onLoad={hideFrameScrollbars}
            className="h-full w-full border-0 bg-black"
          />
        </div>
      </div>
    </div>
  );
};

export default DevicePreviewShell;
