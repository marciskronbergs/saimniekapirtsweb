#!/usr/bin/env python3
"""Generate a HyperFrames 'pointing' reel (1080x1920) from a JSON spec.

Usage: build.py spec.json lang outdir
spec: segments [{vo, wav, speech:[start,end]}], hook{en,lv}, points[{en,lv,img}], captions_lv[...]
"""
import json, sys, re, html, subprocess, shutil, os

spec_path, lang, out = sys.argv[1], sys.argv[2], sys.argv[3]
spec = json.load(open(spec_path))
base = os.path.dirname(os.path.abspath(spec_path))
os.makedirs(out, exist_ok=True)
if os.path.exists(f"{out}/assets"):
    shutil.rmtree(f"{out}/assets")
shutil.copytree(f"{base}/assets", f"{out}/assets")

GAP, LEAD = 0.35, 0.3
segs, t = [], LEAD
for s in spec["segments"]:
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                       "-of", "csv=p=0", f"{base}/{s['wav']}"]).decode())
    segs.append({**s, "start": t, "dur": d})
    t += d + GAP
end_start = t
TOTAL = round(end_start + 2.4, 2)

# one voice track: segments placed with gaps
inputs, filt = [], []
for i, s in enumerate(segs):
    inputs += ["-i", f"{base}/{s['wav']}"]
    filt.append(f"[{i}]adelay={int(s['start']*1000)}|{int(s['start']*1000)}[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(segs)))
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                ";".join(filt) + f";{mix}amix=inputs={len(segs)}:normalize=0,apad=whole_dur={TOTAL}[o]",
                "-map", "[o]", "-ar", "48000", f"{out}/assets/vo.wav"], check=True)


def words_timed(text, start, sp0, sp1, pauses):
    """Spread words across speech span, weighted by length; snap to detected pauses."""
    words = text.split()
    w = [len(re.sub(r"\W", "", x)) + 2 + (3 if re.search(r"[.,:!?]$", x) else 0) for x in words]
    speech = (sp1 - sp0) - sum(b - a for a, b in pauses)
    unit = speech / sum(w)
    res, cur = [], sp0
    for word, wt in zip(words, w):
        for a, b in pauses:
            if abs(cur - a) < 0.15:
                cur = b
        res.append((word, start + cur, start + cur + wt * unit))
        cur += wt * unit
    return res


def groups(timed, n=3):
    out, g = [], []
    for item in timed:
        g.append(item)
        if len(g) >= n or re.search(r"[.,:!?]$", item[0]):
            out.append(g); g = []
    if g:
        out.append(g)
    return out


cap_html, cap_js = [], []
gid = 0
for si, s in enumerate(segs):
    if lang == "en":
        timed = words_timed(s["vo"], s["start"], *s["speech"], s.get("pauses", []))
        gs = groups(timed)
        for gi, g in enumerate(gs):
            g0, g1 = g[0][1], g[-1][2] + 0.12
            if gi + 1 < len(gs):
                g1 = min(g1, gs[gi + 1][0][1] - 0.01)
            spans = "".join(f'<span class="w" id="w{gid}_{k}">{html.escape(w)}</span>'
                            for k, (w, a, b) in enumerate(g))
            cap_html.append(f'<div class="cap clip" id="cap{gid}" data-start="{g0:.2f}" '
                            f'data-duration="{g1-g0:.2f}" data-track-index="5">{spans}</div>')
            for k, (w, a, b) in enumerate(g):
                cap_js.append(f'tl.to("#w{gid}_{k}",{{color:"#F2C14E",scale:1.08,duration:0.08}},{a:.2f});'
                              f'tl.to("#w{gid}_{k}",{{color:"#ffffff",scale:1,duration:0.1}},{b:.2f});')
            gid += 1
    else:
        chunks = spec["captions_lv"][si]
        sp0, sp1 = s["speech"]
        span = (sp1 - sp0) / len(chunks)
        for k, c in enumerate(chunks):
            a = s["start"] + sp0 + k * span
            cap_html.append(f'<div class="cap clip" id="cap{gid}" data-start="{a:.2f}" '
                            f'data-duration="{span:.2f}" data-track-index="5">{html.escape(c)}</div>')
            gid += 1

hook = spec["hook"][lang]
hook_lines = "".join(f'<div class="hl" id="hl{i}">{html.escape(l)}</div>' for i, l in enumerate(hook))
s0 = segs[0]
hook_end = segs[1]["start"]

pts_html, pts_js, imgs_html = [], [], []
imgs_html.append(f'<div class="pic clip" id="pic0" data-start="0" data-duration="{hook_end:.2f}" data-track-index="1">'
                 f'<img id="pimg0" src="assets/{spec["hook_img"]}" /></div>')
n = len(spec["points"])
for i, p in enumerate(spec["points"], start=1):
    s = segs[i]
    st = s["start"]
    nxt = segs[i + 1]["start"] if i + 1 < len(segs) else end_start
    imgs_html.append(f'<div class="pic clip" id="pic{i}" data-start="{st-0.15:.2f}" data-duration="{nxt-st+0.15:.2f}" '
                     f'data-track-index="1"><img id="pimg{i}" src="assets/{p["img"]}" /></div>')
    pts_html.append(f'<div class="pt clip" id="pt{i}" data-start="{st:.2f}" data-duration="{nxt-st:.2f}" data-track-index="4">'
                    f'<div class="num" id="num{i}">{i}/{n}</div><div class="ptxt" id="ptxt{i}">{html.escape(p[lang])}</div></div>')
    pts_js.append(f'tl.fromTo("#pimg{i}",{{scale:1.12,opacity:0}},{{scale:1.0,opacity:1,duration:0.45,ease:"power2.out"}},{st-0.15:.2f});'
                  f'tl.fromTo("#pimg{i}",{{xPercent:0}},{{xPercent:-3,duration:{nxt-st:.2f},ease:"none"}},{st+0.3:.2f});'
                  f'tl.fromTo("#ptxt{i}",{{y:40,opacity:0}},{{y:0,opacity:1,duration:0.4,ease:"back.out(1.6)"}},{st+0.1:.2f});'
                  f'tl.fromTo("#num{i}",{{scale:0.4,opacity:0}},{{scale:1,opacity:1,duration:0.3,ease:"back.out(2)"}},{st:.2f});'
                  f'tl.to("#arm",{{rotation:-7,duration:0.16,ease:"sine.out"}},{st:.2f});tl.to("#arm",{{rotation:0,duration:0.22,ease:"sine.inOut"}},{st+0.16:.2f});')

hook_js = "".join(
    f'tl.fromTo("#hl{i}",{{y:30,opacity:0}},{{y:0,opacity:1,duration:0.35,ease:"power3.out"}},{0.15+i*0.12:.2f});'
    for i in range(len(hook)))

label = {"en": "PLACEHOLDER: your pointing clip goes here",
         "lv": "AIZVIETOTĀJS: šeit būs Tavs pointing klips"}[lang]
end_txt = spec["end"][lang]

doc = f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>{html.escape(spec["title"])}</title>
<script src="assets/gsap.min.js"></script>
<style>
@font-face {{ font-family: "InterDisplay"; font-weight: 900; src: url("assets/InterDisplay-Black.otf"); }}
@font-face {{ font-family: "InterDisplay"; font-weight: 800; src: url("assets/InterDisplay-ExtraBold.otf"); }}
body {{ margin: 0; background: #0f1a12; }}
#root {{ position: relative; width: 100%; height: 100%; overflow: hidden;
  background: radial-gradient(120% 80% at 70% 90%, #2b3b26 0%, #121d14 55%, #0a110b 100%);
  font-family: "InterDisplay", sans-serif; color: #fff; }}
.pic {{ position: absolute; left: 44px; top: 120px; width: 700px; height: 860px; border-radius: 26px;
  overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.55); border: 3px solid rgba(255,255,255,.08); }}
.pic img {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
#person {{ position: absolute; right: -40px; bottom: 0; width: 640px; height: 1100px; }}
#ph {{ position: absolute; right: 40px; bottom: 30px; width: 520px; text-align: right; font-weight: 800;
  font-size: 22px; letter-spacing: 1px; color: rgba(255,255,255,.45); }}
.hookbox {{ position: absolute; left: 50px; right: 50px; top: 1010px; text-align: center; }}
.hl {{ font-weight: 900; font-size: 92px; line-height: 1.08; letter-spacing: -1px;
  text-shadow: 0 6px 0 rgba(0,0,0,.55), 0 10px 40px rgba(0,0,0,.8); }}
.pt {{ position: absolute; left: 60px; right: 60px; top: 1060px; text-align: center; }}
.num {{ display: inline-block; font-weight: 900; font-size: 44px; padding: 6px 26px; border-radius: 40px;
  background: #F2C14E; color: #1a1408; margin-bottom: 22px; }}
.ptxt {{ font-weight: 900; font-size: 84px; line-height: 1.08; letter-spacing: -1px;
  text-shadow: 0 6px 0 rgba(0,0,0,.55), 0 10px 40px rgba(0,0,0,.8); }}
.cap {{ position: absolute; left: 70px; right: 70px; top: 1560px; text-align: center; font-weight: 800;
  font-size: 54px; line-height: 1.18; text-shadow: 0 4px 0 rgba(0,0,0,.7), 0 6px 24px rgba(0,0,0,.9); }}
.w {{ display: inline-block; margin: 0 0.13em; }}
#endc {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: center; background: #0f1a12; }}
#endlogo {{ width: 260px; border-radius: 24px; }}
#endt {{ margin-top: 40px; font-weight: 900; font-size: 64px; text-align: center; }}
#endu {{ margin-top: 18px; font-weight: 800; font-size: 44px; color: #F2C14E; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="{TOTAL}">
  <audio id="vo" src="assets/vo.wav" data-start="0" data-duration="{TOTAL}" data-track-index="9"></audio>
  {''.join(imgs_html)}
  <svg id="person" viewBox="0 0 640 1100">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7d8f74"/><stop offset="1" stop-color="#3a4836"/></linearGradient></defs>
    <g id="arm" style="transform-origin: 300px 640px;">
      <path d="M300 640 L140 470 L70 330" stroke="url(#g)" stroke-width="78" stroke-linecap="round" fill="none"/>
      <path d="M70 330 L40 262" stroke="#8fa285" stroke-width="30" stroke-linecap="round"/>
    </g>
    <circle cx="380" cy="470" r="118" fill="url(#g)"/>
    <path d="M150 1100 C150 760 230 620 380 610 C530 620 620 760 620 1100 Z" fill="url(#g)"/>
  </svg>
  <div id="ph">{html.escape(label)}</div>
  <div class="hookbox clip" id="hook" data-start="0" data-duration="{hook_end:.2f}" data-track-index="3">{hook_lines}</div>
  {''.join(pts_html)}
  {''.join(cap_html)}
  <div id="endc" class="clip" data-start="{end_start:.2f}" data-duration="{TOTAL-end_start:.2f}" data-track-index="7">
    <img id="endlogo" src="assets/logo_on_light.png" />
    <div id="endt">{html.escape(end_txt)}</div>
    <div id="endu">saimniekapirts.lv</div>
  </div>
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
tl.fromTo("#pimg0",{{scale:1.15}},{{scale:1.0,duration:{hook_end:.2f},ease:"none"}},0);
tl.fromTo("#arm",{{rotation:-14}},{{rotation:0,duration:0.5,ease:"power2.out"}},0.1);
{hook_js}
{''.join(pts_js)}
{''.join(cap_js)}
tl.fromTo("#endlogo",{{scale:0.8,opacity:0}},{{scale:1,opacity:1,duration:0.5,ease:"back.out(1.7)"}},{end_start+0.1:.2f});
tl.fromTo("#endt",{{y:30,opacity:0}},{{y:0,opacity:1,duration:0.4}},{end_start+0.3:.2f});
tl.fromTo("#endu",{{y:30,opacity:0}},{{y:0,opacity:1,duration:0.4}},{end_start+0.45:.2f});
window.__timelines["main"] = tl;
</script>
</body>
</html>
"""
open(f"{out}/index.html", "w").write(doc)
print("total", TOTAL, "segments", [(round(s["start"], 2), round(s["dur"], 2)) for s in segs])
