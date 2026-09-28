#!/usr/bin/env python3
"""
build_ad.py — renders the "BGMI SCRIMS" vertical video ad (1080x1920, 30 fps, ~30 s).

Pipeline
  1. text overlays  : specs/content.json + specs/scenes.json  ->  node tools/text.js  ->  assets/tx/s*.png
  2. scene clips    : ai artwork + overlay -> Ken Burns zoom / grade / shake        ->  work/s*.mp4
  3. transitions    : 8 clips stitched with xfade + film grain                      ->  work/video.mp4
  4. sound          : Hindi VO (5 takes) + synthesised music bed, side-chain ducked  ->  work/mix.wav
  5. master         : 1080x1920 H.264 + AAC (loudness -14 LUFS) + poster frames

Usage
  python3 tools/build_ad.py                 # full build
  python3 tools/build_ad.py --skip-overlays # reuse already-rendered overlay PNGs
  python3 tools/build_ad.py --video-only    # skip audio stage
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

import imageio_ffmpeg

AD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.environ.get("FFMPEG") or imageio_ffmpeg.get_ffmpeg_exe()
NODE = shutil.which("node") or "node"

W, H = 1080, 1920
FPS = 30
XF = 0.35                     # cross-fade duration (short = punchier cuts, less text ghosting)
TAIL_FADE = 0.45

# ---------------------------------------------------------------- timeline
# duration of each scene; total = sum(dur) - XF*(n-1) = 30.0 s
SCENES = [
    dict(id="s1", bg="01_squad.png",          dur=3.50, zoom=0.10, dir="in",  shake=1, sat=1.16, con=1.06, bri=0.00),
    dict(id="s2", bg="03_airdrop.png",        dur=3.70, zoom=0.09, dir="out", shake=0, sat=1.12, con=1.05, bri=-0.01),
    dict(id="s3", bg="05_arena.png",          dur=3.855, zoom=0.11, dir="in",  shake=0, sat=1.14, con=1.06, bri=-0.03),
    dict(id="s4", bg="07_hud.png",            dur=4.0, zoom=0.06, dir="in",  shake=0, sat=1.05, con=1.04, bri=-0.04),
    dict(id="s5", bg="06_prize.png",          dur=4.450, zoom=0.12, dir="in",  shake=0, sat=1.16, con=1.06, bri=-0.02),
    dict(id="s6", bg="04_chicken_dinner.png", dur=4.5, zoom=0.11, dir="out", shake=1, sat=1.18, con=1.06, bri=-0.02),
    dict(id="s7", bg="02_face.png",           dur=4.30, zoom=0.07, dir="in",  shake=0, sat=1.10, con=1.05, bri=-0.05),
    dict(id="s8", bg="01_squad.png",          dur=4.10, zoom=0.05, dir="in",  shake=0, sat=1.12, con=1.05, bri=-0.07),
]
TRANSITIONS = ["fade", "smoothleft", "fade", "circleopen", "fade", "smoothup", "fade"]

# VO takes -> start time in the finished ad (aligned to the scenes that match them)
VO_TAKES = [
    ("vo1_hook.mp3", 0.35),      # s1 hook
    ("vo2_setup.mp3", 4.60),     # s2 custom rooms / competition
    ("vo3_details.mp3", 10.30),  # s4 timing + entry + rules cards
    ("vo4_cta.mp3", 18.00),      # s6 chicken dinner
    ("vo6_guide.mp3", 22.30),    # s7 how to join
    ("vo5_tag.mp3", 27.20),      # s8 end card
]


def log(msg):
    print(f"\033[36m▸\033[0m {msg}", flush=True)


def run(cmd, quiet=True):
    if not quiet:
        print("  " + " ".join(str(c) for c in cmd[:8]) + (" …" if len(cmd) > 8 else ""))
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stdout[-4000:])
        print(res.stderr[-4000:], file=sys.stderr)
        raise SystemExit(f"command failed ({res.returncode}): {cmd[0]} …")
    return res


def duration_of(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out)
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


# ---------------------------------------------------------------- 1. overlays
def render_overlays():
    content_path = os.path.join(AD, "specs", "content.json")
    scenes_path = os.path.join(AD, "specs", "scenes.json")
    content = json.load(open(content_path))
    raw = open(scenes_path).read()

    missing = []
    for token in set(re.findall(r"\{\{(\w+)\}\}", raw)):
        if token not in content:
            missing.append(token)
        raw = raw.replace("{{%s}}" % token, str(content[token]))
    if missing:
        raise SystemExit(f"content.json is missing: {missing}")

    doc = json.loads(raw)
    qr = os.path.join(AD, "assets", "qr.png")
    if os.path.exists(qr):
        for layer in doc["layers"]:
            if layer["id"] != "s7":
                continue
            layer["elements"] = [e for e in layer["elements"]
                                 if (e.get("text") or "").strip() != "[QR CODE]"]
            for e in layer["elements"]:
                if e.get("type") == "rect" and e.get("w") == 420:      # card behind the code
                    e.update({"color": "rgba(255,255,255,0.97)", "stroke": {"color": "#22d3ee", "width": 5}})
            layer["elements"].append({"type": "image", "src": "qr.png",
                                      "x": 356, "y": 996, "w": 368, "h": 368})
        log("assets/qr.png found → rendering it into the 'how to join' scene")

    rendered = os.path.join(AD, "specs", "_rendered.json")
    json.dump(doc, open(rendered, "w"), ensure_ascii=False, indent=1)

    tx_dir = os.path.join(AD, "assets", "tx")
    log(f"rendering text overlays → assets/tx/  (placeholders: {content['org']})")
    run([NODE, os.path.join(AD, "tools", "text.js"), rendered, tx_dir], quiet=False)


# ---------------------------------------------------------------- 2. scenes
def build_scene(scene, idx):
    dur = scene["dur"]
    frames = max(1, round(dur * FPS))
    amt = scene["zoom"]
    if scene["dir"] == "in":
        zexpr = f"min(1+{amt}*on/{frames},1+{amt})"
    else:
        zexpr = f"max(1+{amt}-{amt}*on/{frames},1)"

    chain = (
        f"[0:v]scale={int(W*1.1)}:{int(H*1.1)}:force_original_aspect_ratio=increase,"
        f"crop={int(W*1.1)}:{int(H*1.1)},"
        f"zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS}"
    )
    if scene["shake"]:
        chain += (f",crop={W-28}:{H-28}:x='(iw-{W-28})/2+sin(n/1.7)*11':"
                  f"y='(ih-{H-28})/2+cos(n/2.3)*11',scale={W}:{H}")
    chain += (f",eq=saturation={scene['sat']}:contrast={scene['con']}:brightness={scene['bri']}"
              f",vignette=PI/4.6,setsar=1[bg]")
    chain += ";[1:v]format=rgba,setsar=1[tx]"
    chain += ";[bg][tx]overlay=0:0:format=auto"

    head = ""
    if idx == 0:
        head = ",fade=t=in:st=0:d=0.28"
    tail = ""
    if idx == len(SCENES) - 1:
        tail = f",fade=t=out:st={dur - TAIL_FADE:.2f}:d={TAIL_FADE}"
    chain += f"{head}{tail},format=yuv420p[v]"

    out = os.path.join(AD, "work", f"{scene['id']}.mp4")
    run([FF, "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}",
         "-i", os.path.join(AD, "assets", scene["bg"]),
         "-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}",
         "-i", os.path.join(AD, "assets", "tx", f"{scene['id']}.png"),
         "-filter_complex", chain, "-map", "[v]", "-an",
         "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p",
         "-r", str(FPS), out])
    return out


# ---------------------------------------------------------------- 3. stitch
def stitch(clips, final_dur):
    inputs = []
    for c in clips:
        inputs += ["-i", c]

    parts, offset, prev = [], 0.0, "[0:v]"
    for i in range(1, len(clips)):
        offset += SCENES[i - 1]["dur"] - XF
        label = f"[x{i}]"
        parts.append(f"{prev}[{i}:v]xfade=transition={TRANSITIONS[i-1]}:"
                     f"duration={XF}:offset={offset:.3f}{label}")
        prev = label
    parts.append(f"{prev}noise=alls=5:allf=t+u,format=yuv420p[v]")

    out = os.path.join(AD, "work", "video.mp4")
    run([FF, "-y", *inputs, "-filter_complex", ";".join(parts), "-map", "[v]", "-an",
         "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
         "-r", str(FPS), "-t", f"{final_dur:.3f}", "-movflags", "+faststart", out])
    return out


# ---------------------------------------------------------------- 4. audio
def mix_audio(final_dur):
    bgm = os.path.join(AD, "audio", "bgm.wav")
    if not os.path.exists(bgm):
        log("synthesising music bed → audio/bgm.wav")
        run([sys.executable, os.path.join(AD, "tools", "bgm.py"), bgm])

    inputs = ["-i", bgm]
    parts = []
    vo_labels = []
    for i, (name, at) in enumerate(VO_TAKES):
        path = os.path.join(AD, "audio", name)
        if not os.path.exists(path):
            raise SystemExit(f"missing voice take: {path}")
        inputs += ["-i", path]
        ms = int(round(at * 1000))
        lab = f"[vo{i}]"
        parts.append(f"[{i + 1}:a]aresample=48000,aformat=channel_layouts=mono,"
                     f"adelay={ms}|{ms},volume=1.0{lab}")
        vo_labels.append(lab)

    parts.append("".join(vo_labels) +
                 f"amix=inputs={len(vo_labels)}:normalize=0,"
                 "acompressor=threshold=-16dB:ratio=3.2:attack=6:release=150:makeup=3dB,"
                 "highpass=f=90,volume=1.6[voa]")
    # a label can only be consumed once, so split the voice bus
    parts.append("[voa]asplit=2[vo_sc][vo_mix]")
    parts.append("[0:a]aresample=48000,volume=0.34,highpass=f=32[mus]")
    parts.append("[mus][vo_sc]sidechaincompress=threshold=0.045:ratio=6:attack=25:release=380[ducked]")
    parts.append("[ducked][vo_mix]amix=inputs=2:normalize=0,"
                 f"apad,atrim=0:{final_dur:.3f},"
                 "aformat=channel_layouts=stereo[aout]")

    premix = os.path.join(AD, "work", "premix.wav")
    log("mixing Hindi voiceover + music bed (side-chain ducked)")
    run([FF, "-y", *inputs, "-filter_complex", ";".join(parts), "-map", "[aout]",
         "-ar", "48000", "-c:a", "pcm_s16le", premix])

    # two-pass loudnorm so the delivered file really lands on -14 LUFS (social standard)
    probe = run([FF, "-hide_banner", "-i", premix, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                 "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", probe.stderr, re.S)
    out = os.path.join(AD, "work", "mix.wav")
    if m:
        stats = json.loads(m.group(0))
        log(f"loudnorm pass 1: I={stats['input_i']} LUFS  TP={stats['input_tp']} dBTP  "
            f"LRA={stats['input_lra']} LU → normalising to -14 LUFS")
        norm = (f"loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:print_format=summary:"
                f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
                f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
                f"offset={stats['target_offset']}")
    else:
        log("loudnorm pass 1 could not be parsed — falling back to single pass")
        norm = "loudnorm=I=-14:TP=-1.5:LRA=11"
    run([FF, "-y", "-i", premix, "-af", norm, "-ar", "48000", "-c:a", "pcm_s16le", out])
    return out


def master(video, audio, final_dur):
    out_dir = os.path.join(AD, "out")
    os.makedirs(out_dir, exist_ok=True)
    final = os.path.join(out_dir, "bgmi_scrims_ad_1080x1920.mp4")

    cmd = [FF, "-y", "-i", video]
    if audio:
        cmd += ["-i", audio]
    cmd += ["-map", "0:v"]
    if audio:
        cmd += ["-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    cmd += ["-c:v", "copy", "-t", f"{final_dur:.3f}", "-movflags", "+faststart", final]
    log("muxing master")
    run(cmd)

    # poster frames + a 6.5 s teaser cut
    posters = {"thumbnail_hook": 1.30, "thumbnail_chicken_dinner": 18.90, "thumbnail_endcard": 27.20}
    for name, at in posters.items():
        run([FF, "-y", "-ss", f"{at:.2f}", "-i", final, "-frames:v", "1", "-q:v", "3",
             os.path.join(out_dir, f"{name}.jpg")])
    teaser = os.path.join(out_dir, "bgmi_scrims_teaser_6s.mp4")
    run([FF, "-y", "-i", final, "-t", "6.5", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", teaser])
    return final, teaser


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-overlays", action="store_true")
    ap.add_argument("--skip-video", action="store_true",
                    help="reuse work/video.mp4 (video stage takes a few minutes)")
    ap.add_argument("--video-only", action="store_true")
    ap.add_argument("--overlays-only", action="store_true",
                    help="re-render the text overlays and exit (fast layout iteration)")
    args = ap.parse_args()

    if args.overlays_only:
        render_overlays()
        return

    os.makedirs(os.path.join(AD, "work"), exist_ok=True)
    os.makedirs(os.path.join(AD, "out"), exist_ok=True)

    final_dur = sum(s["dur"] for s in SCENES) - XF * (len(SCENES) - 1)
    log(f"target runtime: {final_dur:.2f} s ({len(SCENES)} scenes, {XF}s cross-fades)")
    print(f"  ffmpeg: {FF}")

    if not args.skip_overlays:
        render_overlays()
    else:
        log("reusing existing overlay PNGs")

    video = os.path.join(AD, "work", "video.mp4")
    if args.skip_video and os.path.exists(video):
        log("reusing work/video.mp4 (--skip-video)")
    else:
        clips = []
        for i, scene in enumerate(SCENES):
            log(f"scene {i + 1}/{len(SCENES)}  [{scene['id']}]  {scene['bg']}  {scene['dur']}s  "
                f"zoom-{scene['dir']} {scene['zoom']}")
            clips.append(build_scene(scene, i))
        video = stitch(clips, final_dur)
    audio = None if args.video_only else mix_audio(final_dur)
    final, teaser = master(video, audio, final_dur)

    log(f"done → {os.path.relpath(final, os.path.dirname(AD))}  "
        f"({duration_of(final):.2f} s, {os.path.getsize(final) / 1e6:.1f} MB)")
    log(f"bonus → {os.path.relpath(teaser, os.path.dirname(AD))}")


if __name__ == "__main__":
    main()
