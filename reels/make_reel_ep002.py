#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_reel_ep002.py
==================

สร้างวิดีโอ Reel (แนวตั้ง 720x1280, 30 วินาที) สำหรับ Facebook
เรื่อง "คุณยายล้มในห้องน้ำ" เพื่อรณรงค์การปฐมพยาบาลเบื้องต้น / โปรโมต JIA CPR.

Requirements
------------
    pip install moviepy pillow numpy
    (ต้องมี ffmpeg ในเครื่อง — moviepy เรียกใช้)

ไฟล์ที่ต้องมี (วางไว้โฟลเดอร์เดียวกับสคริปต์)
    assets/290466.png   รูปคุณยายล้มในห้องน้ำ   (ถ้าไม่มี → หาไฟล์ 290466.png ในโฟลเดอร์)
    assets/music.mp3    เพลงประกอบ (ถ้าไม่มี → เรนเดอร์เงียบ ๆ พร้อมเตือน)

ฟอนต์
    ถ้ามี Sarabun / Noto Sans Thai ในเครื่องจะใช้เลย
    ถ้าไม่มี → ดาวน์โหลด Sarabun + Noto Emoji จาก Google Fonts อัตโนมัติ มาไว้ ./fonts

Output
    reel_ep002.mp4  (fps=30, H.264 + AAC)

รัน: python3 make_reel_ep002.py
"""

import os
import sys
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from moviepy import (
    ImageClip,
    ColorClip,
    AudioFileClip,
    CompositeVideoClip,
    vfx,
    afx,
)

# ----------------------------------------------------------------------------
# ค่าคงที่ / การตั้งค่าโครงการ
# ----------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
FONTDIR = os.path.join(HERE, "fonts")

W, H = 720, 1280           # แนวตั้ง (Reel/TikTok/Shorts)
FPS = 30
DURATION = 30.0            # ความยาวรวม (วินาที)

IMAGE_CANDIDATES = [
    os.path.join(ASSETS, "290466.png"),
    os.path.join(HERE, "290466.png"),
]
MUSIC_CANDIDATES = [
    os.path.join(ASSETS, "music.mp3"),
    os.path.join(HERE, "music.mp3"),
]
OUTPUT = os.path.join(HERE, "reel_ep002.mp4")

# สีที่ใช้บ่อย (RGB)
WHITE = (255, 255, 255)
RED = (255, 55, 55)
YELLOW = (255, 214, 10)
ORANGE = (255, 149, 0)
GREEN = (52, 211, 100)
GREY = (170, 176, 186)
BLUE_BG = (0x1B, 0x2A, 0x4A)   # #1B2A4A
BLACK = (0, 0, 0)

# ----------------------------------------------------------------------------
# ฟอนต์: หาในเครื่องก่อน ถ้าไม่เจอค่อยดาวน์โหลด
# ----------------------------------------------------------------------------
# ระบุ (ชื่อไฟล์ปลายทาง, URL) — ใช้ raw.githubusercontent เพื่อความเสถียร
FONT_DOWNLOADS = {
    "Sarabun-Regular.ttf":
        "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf",
    "Sarabun-Bold.ttf":
        "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf",
    "Sarabun-ExtraBold.ttf":
        "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-ExtraBold.ttf",
    "NotoEmoji-Regular.ttf":
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notoemoji/NotoEmoji%5Bwght%5D.ttf",
}

# ตำแหน่งฟอนต์ไทยที่อาจมีอยู่แล้วในเครื่อง (Linux/macOS/Windows)
SYSTEM_THAI_HINTS = {
    "regular": ["Sarabun-Regular", "NotoSansThai-Regular", "Loma", "Garuda", "TH Sarabun New"],
    "bold": ["Sarabun-Bold", "NotoSansThai-Bold", "Loma-Bold", "Garuda-Bold"],
    "extrabold": ["Sarabun-ExtraBold", "Sarabun-Bold", "NotoSansThai-Bold"],
}


def _download(url, dest):
    print(f"  ↓ ดาวน์โหลดฟอนต์: {os.path.basename(dest)}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())


def ensure_fonts():
    """คืน dict ที่มี path ของ 'thai' (extrabold/bold/regular) และ 'emoji'."""
    os.makedirs(FONTDIR, exist_ok=True)

    def local(name):
        p = os.path.join(FONTDIR, name)
        return p if os.path.exists(p) else None

    def get(name):
        p = local(name)
        if p:
            return p
        try:
            _download(FONT_DOWNLOADS[name], os.path.join(FONTDIR, name))
            return os.path.join(FONTDIR, name)
        except Exception as e:  # เน็ตล่ม / โดนบล็อก
            print(f"  ! ดาวน์โหลด {name} ไม่สำเร็จ: {e}")
            return None

    fonts = {
        "extrabold": get("Sarabun-ExtraBold.ttf") or get("Sarabun-Bold.ttf"),
        "bold": get("Sarabun-Bold.ttf"),
        "regular": get("Sarabun-Regular.ttf"),
        "emoji": get("NotoEmoji-Regular.ttf"),
    }

    # fallback สุดท้าย: ฟอนต์ default ของ PIL (จะไม่รองรับไทย — เตือนไว้)
    if not fonts["regular"]:
        print("  ! ไม่พบฟอนต์ไทยเลย ตัวอักษรไทยอาจแสดงไม่ถูกต้อง")
    return fonts


FONTS = None            # เซ็ตใน main()
_FONT_CACHE = {}


def load_font(weight, size):
    key = (weight, size)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    path = FONTS.get(weight) or FONTS.get("bold") or FONTS.get("regular")
    try:
        f = ImageFont.truetype(path, size)
    except Exception:
        f = ImageFont.load_default()
    _FONT_CACHE[key] = f
    return f


def load_emoji_font(size):
    key = ("emoji", size)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    path = FONTS.get("emoji")
    try:
        f = ImageFont.truetype(path, size)
    except Exception:
        f = None
    _FONT_CACHE[key] = f
    return f


# ----------------------------------------------------------------------------
# ตัวเรนเดอร์ข้อความ (ไทย + emoji + เงา + ตัดบรรทัดอัตโนมัติ)
# ----------------------------------------------------------------------------
def _is_emoji(ch):
    o = ord(ch)
    return (
        0x1F000 <= o <= 0x1FAFF or   # emoji ต่าง ๆ
        0x2600 <= o <= 0x27BF or     # สัญลักษณ์ / dingbats
        0x2B00 <= o <= 0x2BFF or
        0x2190 <= o <= 0x21FF or     # ลูกศร
        o in (0x203C, 0x2049, 0x2122, 0x2139, 0x20E3, 0xFE0F)
    )


def _split_runs(word):
    """แยกคำเป็นชิ้น ๆ ว่าเป็น run 'emoji' หรือ 'text' โดยจัด keycap (เช่น 1️⃣)
    ให้ทั้งชุดไปที่ฟอนต์ emoji เพื่อให้ raqm ประกอบเป็นกล่องตัวเลขได้ถูกต้อง."""
    runs = []
    n = len(word)
    i = 0
    while i < n:
        ch = word[i]
        # keycap: [0-9#*] (+ FE0F) + 20E3  → emoji
        is_keycap = False
        if ch in "0123456789#*":
            j = i + 1
            if j < n and word[j] == "️":
                j += 1
            if j < n and word[j] == "⃣":
                is_keycap = True
        emoji = _is_emoji(ch) or is_keycap
        if runs and runs[-1][1] == emoji:
            runs[-1][0] += ch
        else:
            runs.append([ch, emoji])
        i += 1
    return [(t, e) for t, e in runs]


def _draw_word(draw, x, y, word, size, weight, fill):
    for run, emoji in _split_runs(word):
        f = load_emoji_font(size) if emoji else load_font(weight, size)
        if f is None:
            f = load_font(weight, size)
        draw.text((x, y), run, font=f, fill=fill)
        x += draw.textlength(run, font=f)
    return x


def _measure_line(words, size, weight):
    tmp = Image.new("RGBA", (2, 2))
    d = ImageDraw.Draw(tmp)
    total = 0.0
    space = d.textlength(" ", font=load_font(weight, size))
    for k, w in enumerate(words):
        for run, emoji in _split_runs(w):
            f = load_emoji_font(size) if emoji else load_font(weight, size)
            if f is None:
                f = load_font(weight, size)
            total += d.textlength(run, font=f)
        if k < len(words) - 1:
            total += space
    return total


def _wrap(text, size, weight, max_width):
    """ตัดบรรทัดตามช่องว่าง ให้ไม่เกิน max_width (รองรับ \\n บังคับขึ้นบรรทัด)."""
    out = []
    for forced in text.split("\n"):
        words = forced.split(" ")
        if not words:
            out.append("")
            continue
        line = []
        for w in words:
            trial = line + [w]
            if _measure_line(trial, size, weight) <= max_width or not line:
                line = trial
            else:
                out.append(" ".join(line))
                line = [w]
        out.append(" ".join(line))
    return out


def make_text_image(
    text,
    size=64,
    color=WHITE,
    weight="extrabold",
    max_width=None,
    align="center",
    line_spacing=1.18,
    shadow=True,
    shadow_color=(0, 0, 0),
    shadow_offset=(3, 4),
    shadow_blur=6,
    pad=None,
):
    """คืนภาพ RGBA (numpy array) ของข้อความ พร้อมเงานุ่ม รองรับไทย+emoji."""
    if max_width is None:
        max_width = int(W * 0.86)
    if pad is None:
        pad = int(size * 0.45)   # กันสระบน/วรรณยุกต์ไทย และหางล่างถูกตัด

    lines = _wrap(text, size, weight, max_width)

    line_h = int(size * line_spacing)
    text_w = int(max(1, max(_measure_line(l.split(" "), size, weight) for l in lines)))
    canvas_w = min(max_width, text_w) + pad * 2 + abs(shadow_offset[0]) + shadow_blur * 2
    canvas_h = line_h * len(lines) + pad * 2 + abs(shadow_offset[1]) + shadow_blur * 2

    # เลเยอร์เงา
    shadow_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_img)
    # เลเยอร์ตัวอักษร
    text_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    td = ImageDraw.Draw(text_img)

    y = pad
    for line in lines:
        lw = _measure_line(line.split(" "), size, weight)
        if align == "center":
            x = (canvas_w - lw) / 2
        elif align == "right":
            x = canvas_w - pad - lw
        else:
            x = pad
        # วาดเงา (ขยับตาม offset)
        if shadow:
            _draw_word_line(sd, x + shadow_offset[0], y + shadow_offset[1],
                            line, size, weight, shadow_color + (255,))
        _draw_word_line(td, x, y, line, size, weight, color + (255,))
        y += line_h

    if shadow and shadow_blur > 0:
        shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(shadow_blur))

    out = Image.alpha_composite(shadow_img, text_img)
    return np.array(out)


def _draw_word_line(draw, x, y, line, size, weight, fill):
    space = draw.textlength(" ", font=load_font(weight, size))
    words = line.split(" ")
    for k, w in enumerate(words):
        x = _draw_word(draw, x, y, w, size, weight, fill)
        if k < len(words) - 1:
            x += space


def text_clip(text, duration, start=0.0, **kw):
    """สร้าง ImageClip ของข้อความ (โปร่งใส) พร้อมกำหนดเวลาเริ่ม/ยาว."""
    arr = make_text_image(text, **kw)
    clip = ImageClip(arr, transparent=True).with_duration(duration).with_start(start)
    return clip


# ----------------------------------------------------------------------------
# พื้นหลัง
# ----------------------------------------------------------------------------
def solid_bg(color, duration, start=0.0):
    return ColorClip((W, H), color=color).with_duration(duration).with_start(start)


def cover_image(path):
    """โหลดรูป แล้ว crop ให้เต็มกรอบ 720x1280 (cover) คืนเป็น PIL RGB."""
    img = Image.open(path).convert("RGB")
    iw, ih = img.size
    scale = max(W / iw, H / ih)
    nw, nh = int(iw * scale + 0.5), int(ih * scale + 0.5)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - W) // 2
    top = (nh - H) // 2
    return img.crop((left, top, left + W, top + H))


def ken_burns(path, duration, start=0.0, zoom_start=1.0, zoom_end=1.10,
              darken=0.0):
    """Ken Burns effect: ค่อย ๆ zoom in ช้า ๆ. darken=0..1 คือความมืดที่เพิ่ม."""
    pil = cover_image(path)
    if darken > 0:
        overlay = Image.new("RGB", pil.size, (0, 0, 0))
        pil = Image.blend(pil, overlay, darken)
    base = ImageClip(np.array(pil)).with_duration(duration)

    def scale(t):
        return zoom_start + (zoom_end - zoom_start) * (t / duration)

    clip = base.resized(scale).with_position(("center", "center"))
    # ครอบด้วยกรอบ 720x1280 → ส่วนเกินจากการซูมจะถูก crop รอบ ๆ
    comp = CompositeVideoClip([clip], size=(W, H)).with_duration(duration)
    return comp.with_start(start)


# ----------------------------------------------------------------------------
# ประกอบแต่ละ Scene → คืน list ของ clip (พื้นหลัง + ข้อความ) พร้อมเวลา
# ----------------------------------------------------------------------------
def build_scenes(image_path):
    layers = []

    # ---- Scene 1 + 2 : รูปคุณยาย Ken Burns ต่อเนื่อง 0-7 วิ ----
    kb = ken_burns(image_path, duration=7.0, start=0.0,
                   zoom_start=1.0, zoom_end=1.18, darken=0.18)
    kb = kb.with_effects([vfx.FadeIn(1.0)])          # Scene1: fade in 1 วิ
    layers.append(kb)

    # Scene 1 (0-4): ข้อความขาว ตัวใหญ่ กลางจอ + fade in
    s1 = text_clip("คุณยาย 78 ปี\nล้มในห้องน้ำ...",
                   duration=4.0, start=0.0,
                   size=76, color=WHITE, weight="extrabold")
    s1 = s1.with_position(("center", H * 0.36)).with_effects([vfx.FadeIn(1.0)])
    layers.append(s1)

    # Scene 2 (4-7): ข้อความแดงตัวใหญ่มาก — กระพริบ 2 ครั้ง แล้วค้างไว้
    s2_txt = "⚠️ ห้ามรีบ\nพยุงลุกทันที!"
    s2_pos = ("center", H * 0.34)
    # ช่วง 4.0-5.6 กระพริบ 2 ครั้ง (on/off ครั้งละ 0.4 วิ)
    s2_blink = text_clip(s2_txt, duration=1.6, start=4.0,
                         size=92, color=RED, weight="extrabold")
    s2_blink = s2_blink.with_position(s2_pos).with_effects([vfx.Blink(0.4, 0.4)])
    layers.append(s2_blink)
    # ช่วง 5.6-7.0 แสดงค้างไว้
    s2_hold = text_clip(s2_txt, duration=1.4, start=5.6,
                        size=92, color=RED, weight="extrabold")
    s2_hold = s2_hold.with_position(s2_pos)
    layers.append(s2_hold)

    # ---- Scene 3 (7-10): พื้นดำ + โทร 1669 + slide in จากซ้าย ----
    layers.append(solid_bg(BLACK, duration=3.0, start=7.0))

    s3a_arr = make_text_image("📞 โทร 1669 ทันที", size=66, color=YELLOW,
                              weight="extrabold", max_width=int(W * 0.95))
    s3a = ImageClip(s3a_arr, transparent=True).with_duration(3.0).with_start(7.0)
    cw = s3a_arr.shape[1]
    y3a = H * 0.38

    def slide_x(t, target_x=(W - cw) / 2):
        # เลื่อนจากนอกจอซ้าย → เข้าที่ ภายใน 0.6 วิ (ease-out)
        d = 0.6
        if t >= d:
            return target_x
        p = t / d
        ease = 1 - (1 - p) * (1 - p)
        return -cw + (target_x + cw) * ease

    s3a = s3a.with_position(lambda t: (slide_x(t), y3a))
    layers.append(s3a)

    s3b = text_clip("บอกอาการ ตำแหน่ง อายุผู้ป่วย",
                    duration=3.0, start=7.0,
                    size=46, color=WHITE, weight="bold")
    s3b = s3b.with_position(("center", H * 0.56)).with_effects(
        [vfx.CrossFadeIn(0.6)])
    layers.append(s3b)

    # ---- Scene 4 (10-14): พื้นดำ + เผยทีละบรรทัด ห่างกัน 1 วิ ----
    layers.append(solid_bg(BLACK, duration=4.0, start=10.0))
    s4_lines = [
        ("1️⃣ อย่าเพิ่งเคลื่อนย้าย", WHITE),
        ("2️⃣ ประคองศีรษะให้นิ่ง", WHITE),
        ("3️⃣ ห้ามบิดคอ", RED),
        ("4️⃣ เฝ้าการหายใจ", WHITE),
    ]
    top4 = H * 0.30
    step4 = 130
    for i, (txt, col) in enumerate(s4_lines):
        start_i = 10.0 + i * 1.0
        dur_i = 14.0 - start_i
        c = text_clip(txt, duration=dur_i, start=start_i,
                      size=58, color=col, weight="extrabold", align="left",
                      max_width=int(W * 0.9))
        c = c.with_position(("center", top4 + i * step4)).with_effects(
            [vfx.FadeIn(0.4)])
        layers.append(c)

    # ---- Scene 5 (14-20): พื้นน้ำเงินเข้ม + บทเรียน + fade in ----
    layers.append(solid_bg(BLUE_BG, duration=6.0, start=14.0).with_effects(
        [vfx.FadeIn(0.8)]))
    s5a = text_clip("บทเรียนจากเคสนี้", duration=6.0, start=14.0,
                    size=66, color=WHITE, weight="extrabold")
    s5a = s5a.with_position(("center", H * 0.20)).with_effects([vfx.FadeIn(0.8)])
    layers.append(s5a)

    s5b = text_clip("ล้มศีรษะกระแทก อาจเลือดออกในสมอง\nแบบค่อยเป็นค่อยไป",
                    duration=6.0, start=14.0,
                    size=50, color=YELLOW, weight="bold")
    s5b = s5b.with_position(("center", H * 0.40)).with_effects([vfx.FadeIn(1.0)])
    layers.append(s5b)

    s5c = text_clip("ต้องให้แพทย์ตรวจแม้ดูปกติ!",
                    duration=6.0, start=14.0,
                    size=54, color=ORANGE, weight="extrabold")
    s5c = s5c.with_position(("center", H * 0.62)).with_effects([vfx.FadeIn(1.4)])
    layers.append(s5c)

    # ---- Scene 6 (20-25): พื้นดำ + call to action ----
    layers.append(solid_bg(BLACK, duration=5.0, start=20.0))
    s6a = text_clip("รู้ไว้ก่อน...\nช่วยชีวิตได้จริง ❤️",
                    duration=5.0, start=20.0,
                    size=70, color=WHITE, weight="extrabold")
    s6a = s6a.with_position(("center", H * 0.22)).with_effects([vfx.FadeIn(0.6)])
    layers.append(s6a)

    s6b = text_clip("เรียน CPR & First Aid", duration=5.0, start=20.0,
                    size=58, color=GREEN, weight="extrabold")
    s6b = s6b.with_position(("center", H * 0.50)).with_effects([vfx.FadeIn(0.9)])
    layers.append(s6b)

    s6c = text_clip("JIA Trainer Center\nThe Street Ratchada",
                    duration=5.0, start=20.0,
                    size=46, color=WHITE, weight="bold")
    s6c = s6c.with_position(("center", H * 0.64)).with_effects([vfx.FadeIn(1.1)])
    layers.append(s6c)

    # ---- Scene 7 (25-30): พื้นดำ + ช่องทางติดต่อ + fade out ช้า ----
    bg7 = solid_bg(BLACK, duration=5.0, start=25.0).with_effects(
        [vfx.FadeOut(2.0)])
    layers.append(bg7)
    s7a = text_clip("LINE: @jiacpr", duration=5.0, start=25.0,
                    size=62, color=WHITE, weight="extrabold")
    s7a = s7a.with_position(("center", H * 0.30)).with_effects(
        [vfx.FadeIn(0.6), vfx.FadeOut(2.0)])
    layers.append(s7a)

    s7b = text_clip("📞 0909791212", duration=5.0, start=25.0,
                    size=62, color=WHITE, weight="extrabold")
    s7b = s7b.with_position(("center", H * 0.45)).with_effects(
        [vfx.FadeIn(0.8), vfx.FadeOut(2.0)])
    layers.append(s7b)

    s7c = text_clip("ฉุกเฉิน โทร 1669", duration=5.0, start=25.0,
                    size=48, color=GREY, weight="bold")
    s7c = s7c.with_position(("center", H * 0.60)).with_effects(
        [vfx.FadeIn(1.0), vfx.FadeOut(2.0)])
    layers.append(s7c)

    return layers


# ----------------------------------------------------------------------------
# เสียง
# ----------------------------------------------------------------------------
def build_audio(music_path, duration):
    audio = AudioFileClip(music_path)
    effects = []
    # loop ให้ยาวครบ 30 วิ ถ้าเพลงสั้นกว่า (ยาวกว่าก็ตัด)
    effects.append(afx.AudioLoop(duration=duration))
    effects.append(afx.MultiplyVolume(0.20))          # ระดับเสียง 20%
    effects.append(afx.AudioFadeOut(3.0))             # fade out 3 วิสุดท้าย
    return audio.with_effects(effects)


# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------
def first_existing(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def main():
    global FONTS
    print("• เตรียมฟอนต์...")
    FONTS = ensure_fonts()

    image_path = first_existing(IMAGE_CANDIDATES)
    if not image_path:
        sys.exit("✗ ไม่พบรูป 290466.png — วางไว้ที่ reels/assets/290466.png")
    print(f"• รูป: {image_path}")

    print("• ประกอบฉากทั้ง 7 scene...")
    layers = build_scenes(image_path)

    video = CompositeVideoClip(layers, size=(W, H)).with_duration(DURATION)

    music_path = first_existing(MUSIC_CANDIDATES)
    if music_path:
        print(f"• เพลง: {music_path} (loop, 20%, fade out 3 วิ)")
        try:
            video = video.with_audio(build_audio(music_path, DURATION))
        except Exception as e:
            print(f"  ! ใส่เพลงไม่สำเร็จ ({e}) — เรนเดอร์แบบเงียบ")
    else:
        print("  ! ไม่พบ music.mp3 — เรนเดอร์แบบไม่มีเสียง "
              "(วางไฟล์ที่ reels/assets/music.mp3 แล้วรันใหม่เพื่อใส่เพลง)")

    print(f"• เรนเดอร์ → {OUTPUT}")
    video.write_videofile(
        OUTPUT,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        threads=os.cpu_count() or 4,
    )
    print(f"✓ เสร็จแล้ว: {OUTPUT}")


if __name__ == "__main__":
    main()
