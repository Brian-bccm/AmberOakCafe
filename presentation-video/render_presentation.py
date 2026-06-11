from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
FRAMES = ROOT / "frames"
OUT = ROOT / "amber-oak-cafe-client-presentation.mp4"
WIDTH = 1920
HEIGHT = 1080
FPS = 24

COLORS = {
    "ink": "#1f2421",
    "cream": "#fffaf0",
    "oat": "#f2eadb",
    "amber": "#b7791f",
    "copper": "#a44f2f",
    "sage": "#58705a",
    "forest": "#22352b",
    "white": "#ffffff",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


FONT_TITLE = font(78, True)
FONT_H2 = font(48, True)
FONT_BODY = font(34)
FONT_BODY_BOLD = font(34, True)
FONT_SMALL = font(26)
FONT_TINY = font(22)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.ImageFont,
    fill: str,
    max_width: int,
    line_gap: int = 12,
) -> int:
    x, y = xy
    for line in wrap_text(draw, text, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += draw.textbbox((0, 0), line, font=fnt)[3] + line_gap
    return y


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, radius: int = 28, outline: str | None = None, width: int = 2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def base_slide(title: str, subtitle: str = "", dark: bool = False) -> Image.Image:
    bg = COLORS["forest"] if dark else COLORS["cream"]
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(img)
    # Soft cafe bands, not a one-note gradient.
    draw.rectangle((0, 0, WIDTH, 92), fill=COLORS["ink"] if dark else COLORS["oat"])
    draw.ellipse((WIDTH - 360, -180, WIDTH + 180, 360), fill=COLORS["amber"] if dark else "#ead9ba")
    draw.ellipse((-220, HEIGHT - 280, 320, HEIGHT + 180), fill=COLORS["copper"] if dark else "#e6cfc1")
    draw.text((96, 28), "Amber & Oak Cafe", font=FONT_SMALL, fill=COLORS["cream"] if dark else COLORS["ink"])
    draw.text((WIDTH - 500, 31), "Client Website Presentation", font=FONT_TINY, fill=COLORS["oat"] if dark else COLORS["sage"])
    draw.text((96, 145), title, font=FONT_TITLE, fill=COLORS["white"] if dark else COLORS["ink"])
    if subtitle:
        draw_wrapped(draw, (100, 250), subtitle, FONT_BODY, COLORS["oat"] if dark else "#5f625d", 1180)
    return img


def paste_screenshot(canvas: Image.Image, src: Path, box: tuple[int, int, int, int]):
    shot = Image.open(src).convert("RGB")
    x1, y1, x2, y2 = box
    target_w = x2 - x1
    target_h = y2 - y1
    shot.thumbnail((target_w, target_h), Image.LANCZOS)
    panel = Image.new("RGB", (target_w, target_h), "#111111")
    px = (target_w - shot.width) // 2
    py = (target_h - shot.height) // 2
    panel.paste(shot, (px, py))
    mask = Image.new("L", (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, target_w, target_h), radius=30, fill=255)
    canvas.paste(panel, (x1, y1), mask)


def bullet_slide(title: str, subtitle: str, bullets: list[str], dark: bool = False) -> Image.Image:
    img = base_slide(title, subtitle, dark=dark)
    draw = ImageDraw.Draw(img)
    y = 420 if subtitle else 310
    for bullet in bullets:
        rounded(draw, (120, y, 178, y + 58), COLORS["amber"], radius=18)
        draw.text((139, y + 12), "✓", font=FONT_BODY_BOLD, fill=COLORS["ink"])
        draw_wrapped(draw, (205, y + 8), bullet, FONT_BODY, COLORS["white"] if dark else COLORS["ink"], 1380)
        y += 105
    return img


def visual_slide(title: str, subtitle: str, screenshot: Path, callouts: list[str]) -> Image.Image:
    img = base_slide(title, subtitle)
    draw = ImageDraw.Draw(img)
    paste_screenshot(img, screenshot, (90, 360, 1170, 970))
    y = 390
    for callout in callouts:
        rounded(draw, (1245, y, 1810, y + 98), COLORS["white"], radius=24, outline="#dfd3c4")
        draw_wrapped(draw, (1275, y + 23), callout, FONT_SMALL, COLORS["ink"], 500, 8)
        y += 130
    return img


def proof_slide() -> Image.Image:
    img = base_slide("Code Test & Deployment Proof", "The website is not only visual. It was tested, built, committed, pushed, and deployed.", dark=True)
    draw = ImageDraw.Draw(img)
    rows = [
        ("npm.cmd test", "2 tests passed"),
        ("npm.cmd run lint", "Passed"),
        ("npm.cmd run build", "Vite production build passed"),
        ("GitHub", "github.com/Brian-bccm/AmberOakCafe"),
        ("Netlify", "Deploy state: ready"),
    ]
    y = 405
    for command, result in rows:
        rounded(draw, (120, y, 1800, y + 86), "#2c4437", radius=20, outline="#58705a")
        draw.text((160, y + 23), command, font=FONT_BODY_BOLD, fill=COLORS["amber"])
        draw.text((780, y + 23), result, font=FONT_BODY, fill=COLORS["white"])
        y += 105
    return img


SLIDES = [
    {
        "file": "slide-01-intro.png",
        "duration": 38,
        "image": lambda: bullet_slide(
            "Amber & Oak Cafe Website",
            "A 5-7 minute client walkthrough for a premium restaurant landing website.",
            [
                "Live website: amber-oak-cafe-brian-bccm.netlify.app",
                "Source code: github.com/Brian-bccm/AmberOakCafe",
                "Purpose: help customers browse, trust, contact, and reserve quickly.",
            ],
            dark=True,
        ),
    },
    {
        "file": "slide-02-homepage.png",
        "duration": 48,
        "image": lambda: visual_slide(
            "Homepage Walkthrough",
            "The first screen gives visitors the brand, value, and next action immediately.",
            ASSETS / "netlify-screenshot.webp",
            [
                "Hero headline builds a premium first impression.",
                "View Menu sends visitors to food and prices.",
                "WhatsApp CTA supports fast reservations.",
                "Stats add credibility without clutter.",
            ],
        ),
    },
    {
        "file": "slide-03-navigation.png",
        "duration": 40,
        "image": lambda: bullet_slide(
            "Smooth Navigation",
            "The one-page structure keeps the restaurant website easy for real customers.",
            [
                "About explains the cafe concept.",
                "Menu and Gallery answer the main customer questions.",
                "Special Offer, Location, and Contact drive action.",
            ],
        ),
    },
    {
        "file": "slide-04-business-sections.png",
        "duration": 54,
        "image": lambda: bullet_slide(
            "Business Sections",
            "Each section has a clear business purpose.",
            [
                "About: tells the client story and builds trust.",
                "Menu: shows realistic dishes, prices, tags, and descriptions.",
                "Gallery: sells the food and ambience visually.",
                "Promotion: supports seasonal offers or lunch sets.",
            ],
        ),
    },
    {
        "file": "slide-05-contact-actions.png",
        "duration": 46,
        "image": lambda: bullet_slide(
            "Customer Actions",
            "The website gives customers two direct ways to contact the restaurant.",
            [
                "Floating WhatsApp button stays visible while scrolling.",
                "Contact form validates name, phone, and message.",
                "Netlify Forms stores enquiries after deployment.",
            ],
            dark=True,
        ),
    },
    {
        "file": "slide-06-mobile.png",
        "duration": 44,
        "image": lambda: bullet_slide(
            "Mobile Experience",
            "Most restaurant visitors will open the site from phones, QR codes, WhatsApp, Instagram, or Google Maps.",
            [
                "Mobile menu keeps navigation compact.",
                "Buttons stack clearly for touch screens.",
                "The WhatsApp action remains easy to reach.",
                "Sections stay readable without horizontal scrolling.",
            ],
        ),
    },
    {
        "file": "slide-07-proof.png",
        "duration": 52,
        "image": proof_slide,
    },
    {
        "file": "slide-08-handoff.png",
        "duration": 48,
        "image": lambda: bullet_slide(
            "Client Handoff",
            "For a real restaurant client, the project is ready to customize.",
            [
                "Change restaurant name, tagline, menu, prices, images, and promotions.",
                "Update address, opening hours, Google Maps, email, and WhatsApp number.",
                "Use this as a freelance portfolio example for small business website jobs.",
            ],
            dark=True,
        ),
    },
]


def generate_slides() -> list[dict]:
    FRAMES.mkdir(parents=True, exist_ok=True)
    rendered = []
    for index, slide in enumerate(SLIDES, start=1):
        image = slide["image"]()
        path = FRAMES / slide["file"]
        image.save(path, "PNG")
        rendered.append({"path": path, "duration": slide["duration"]})
    return rendered


def write_concat_file(slides: list[dict]) -> Path:
    concat = ROOT / "frames.txt"
    lines = []
    for slide in slides:
        safe_path = slide["path"].as_posix()
        lines.append(f"file '{safe_path}'")
        lines.append(f"duration {slide['duration']}")
    lines.append(f"file '{slides[-1]['path'].as_posix()}'")
    concat.write_text("\n".join(lines), encoding="utf-8")
    return concat


def render_video(ffmpeg: Path):
    slides = generate_slides()
    concat = write_concat_file(slides)
    command = [
        str(ffmpeg),
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat),
        "-vf",
        f"fps={FPS},format=yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-movflags",
        "+faststart",
        str(OUT),
    ]
    subprocess.run(command, check=True)


def main():
    metadata = {
        "title": "Amber & Oak Cafe Client Presentation",
        "duration_seconds": sum(slide["duration"] for slide in SLIDES),
        "slides": [slide["file"] for slide in SLIDES],
    }
    (ROOT / "video-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    ffmpeg_path = ROOT / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
    if not ffmpeg_path.exists():
        raise SystemExit(f"FFmpeg not found at {ffmpeg_path}. Install ffmpeg-static in presentation-video first.")
    render_video(ffmpeg_path)
    print(f"Rendered {OUT}")


if __name__ == "__main__":
    main()
