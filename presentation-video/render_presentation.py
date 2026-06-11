from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
FRAMES = ROOT / "frames"
OUT = ROOT / "amber-oak-cafe-client-tutorial.mp4"
VIDEO_ONLY = ROOT / "amber-oak-cafe-client-tutorial-video-only.mp4"
NARRATION = ROOT / "client-tutorial-narration.wav"
WIDTH, HEIGHT, FPS = 1920, 1080, 24

C = {
    "ink": "#1f2421", "cream": "#fffaf0", "oat": "#f2eadb", "amber": "#b7791f",
    "copper": "#a44f2f", "sage": "#58705a", "forest": "#22352b", "white": "#ffffff",
    "paper": "#fff7e8", "line": "#dfd3c4"
}


def font(size: int, bold: bool = False):
    paths = ["C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

FB = font(32, True); F = font(32); FS = font(25); FSB = font(25, True); FT = font(72, True); FH = font(46, True); FBRAND = font(30, True); FTY = font(21)


def wrap(draw, text, fnt, max_width):
    lines, line = [], ""
    for word in text.split():
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


def text(draw, xy, value, fnt, fill, max_width, gap=10):
    x, y = xy
    for line in wrap(draw, value, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        b = draw.textbbox((0, 0), line, font=fnt)
        y += b[3] - b[1] + gap
    return y


def rr(draw, box, fill, radius=24, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def base(title, subtitle="", dark=False):
    img = Image.new("RGB", (WIDTH, HEIGHT), C["forest"] if dark else C["cream"])
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, WIDTH, 94), fill=C["ink"] if dark else C["oat"])
    d.rectangle((0, 94, WIDTH, 98), fill=C["amber"])
    d.ellipse((WIDTH - 390, -210, WIDTH + 210, 390), fill="#c3832f" if dark else "#ead9ba")
    d.ellipse((-260, HEIGHT - 310, 360, HEIGHT + 210), fill="#8e462f" if dark else "#e6cfc1")
    d.text((92, 28), "Amber & Oak Cafe", font=FBRAND, fill=C["cream"] if dark else C["ink"])
    d.text((WIDTH - 535, 32), "Client Website Tutorial", font=FTY, fill=C["oat"] if dark else C["sage"])
    d.text((96, 144), title, font=FT, fill=C["white"] if dark else C["ink"])
    if subtitle:
        text(d, (100, 244), subtitle, F, C["oat"] if dark else "#5f625d", 1220, 12)
    return img


def bullet(title, subtitle, items, dark=False):
    img = base(title, subtitle, dark); d = ImageDraw.Draw(img); y = 395
    for item in items:
        rr(d, (120, y, 176, y + 56), C["amber"], 17)
        d.text((140, y + 10), ">", font=FB, fill=C["ink"])
        text(d, (206, y + 4), item, F, C["white"] if dark else C["ink"], 1420, 10)
        y += 112
    return img


def paste_shot(img, src, box):
    shot = Image.open(src).convert("RGB")
    x1, y1, x2, y2 = box; tw, th = x2 - x1, y2 - y1
    shot.thumbnail((tw, th), Image.LANCZOS)
    panel = Image.new("RGB", (tw, th), "#171717")
    panel.paste(shot, ((tw - shot.width) // 2, (th - shot.height) // 2))
    mask = Image.new("L", (tw, th), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, tw, th), 28, fill=255)
    img.paste(panel, (x1, y1), mask)


def visual():
    img = base("Homepage First Impression", "The first screen should quickly answer: who are you, what do you offer, and what should customers do next?")
    d = ImageDraw.Draw(img)
    paste_shot(img, ASSETS / "netlify-screenshot.webp", (88, 350, 1168, 964))
    rr(d, (98, 980, 1158, 1032), C["ink"], 18); d.text((126, 992), "Desktop view of the live Amber & Oak Cafe website", font=FS, fill=C["cream"])
    callouts = ["Restaurant name and premium cafe mood are visible immediately.", "View Menu helps customers check dishes and prices.", "WhatsApp CTA supports quick orders and reservations.", "The design is clean, warm, and suitable for a food business."]
    y = 372
    for c in callouts:
        rr(d, (1242, y, 1814, y + 102), C["white"], 24, C["line"])
        text(d, (1274, y + 22), c, FS, C["ink"], 508, 8)
        y += 134
    return img


def process():
    img = base("How Enquiries Reach the Business", "Customers do not need technology knowledge. They only need clear ways to take action.", True)
    d = ImageDraw.Draw(img)
    steps = [("1", "Customer browses", "They check food, price, photos, location, and opening hours."), ("2", "Customer contacts", "They tap WhatsApp for fast orders or use the form for enquiries."), ("3", "Business follows up", "The restaurant replies, confirms details, and turns interest into bookings.")]
    x = 115
    for n, h, body in steps:
        rr(d, (x, 420, x + 500, 810), "#2c4437", 26, C["sage"])
        rr(d, (x + 36, 456, x + 112, 532), C["amber"], 24)
        d.text((x + 61, 471), n, font=FB, fill=C["ink"])
        d.text((x + 36, 575), h, font=FH, fill=C["white"])
        text(d, (x + 38, 655), body, FS, C["oat"], 415, 9)
        x += 585
    return img


def mobile():
    img = base("Mobile Customer Experience", "Most restaurant visitors open the website from WhatsApp, Instagram, QR codes, or Google Maps.")
    d = ImageDraw.Draw(img)
    rr(d, (165, 320, 685, 1010), "#111111", 56); rr(d, (190, 350, 660, 980), C["paper"], 36)
    d.rectangle((215, 375, 635, 440), fill=C["ink"]); d.text((238, 392), "Amber & Oak", font=FSB, fill=C["cream"])
    rr(d, (535, 388, 612, 422), C["amber"], 14); d.text((560, 392), "Menu", font=FTY, fill=C["ink"])
    text(d, (238, 488), "A polished cafe website that is easy to read on a phone.", FH, C["ink"], 360, 12)
    rr(d, (238, 655, 492, 718), C["amber"], 22); d.text((274, 671), "View Menu", font=FSB, fill=C["ink"])
    rr(d, (238, 735, 555, 798), C["forest"], 22); d.text((270, 751), "WhatsApp Reservation", font=FSB, fill=C["cream"])
    for i, label in enumerate(["About", "Menu", "Gallery", "Contact"]): d.text((244, 845 + i * 34), label, font=FTY, fill=C["sage"])
    y = 390
    for c in ["Buttons are large enough for touch screens.", "The menu becomes compact, so the page stays clean.", "WhatsApp stays easy to reach for quick orders or reservations.", "This matters because many food customers browse on mobile first."]:
        rr(d, (830, y, 1660, y + 96), C["white"], 24, C["line"])
        text(d, (862, y + 22), c, FS, C["ink"], 748, 8); y += 124
    return img

SECTIONS = [
("Welcome", "Hello, and welcome. This short tutorial shows how your restaurant website works from a business point of view. You do not need to know programming. Think of this website as your online front door. It introduces the cafe, shows the menu, builds trust with photos, gives customers the location, and makes it easy for them to contact you through WhatsApp or the contact form."),
("Homepage", "When a customer first opens the website, the homepage gives them a clear first impression. They see the restaurant name, the premium cafe style, and simple action buttons. The View Menu button is for customers who want to check food and prices. The WhatsApp button is for people who are ready to order, ask a question, or make a reservation. This first screen is important because customers usually decide very quickly whether the business feels trustworthy."),
("Navigation", "The website is built as one smooth landing page. The navigation at the top lets customers jump to About, Menu, Gallery, Special Offer, Location, and Contact. This keeps the experience simple. A customer does not need to search through many pages. They can scroll naturally, or tap the section they care about. For a restaurant, this is useful because most visitors want only a few things: food, price, photos, location, opening hours, and contact details."),
("About", "The About section explains the story and feeling of the cafe. This area helps the business sound professional, warm, and real. For your own restaurant, this can be changed to describe your food style, your chef, your family business, your coffee, your halal status, your homemade recipes, or anything that makes the place special. The goal is to help customers feel comfortable before they visit or place an order."),
("Menu", "The Menu section shows the dishes, short descriptions, and prices. This helps customers decide faster. In this demo, the menu has realistic cafe items such as brunch plates, coffee, local fusion food, bowls, and dessert. For a real client, we can replace these with the actual menu, update prices, add best seller labels, or highlight signature dishes. This section is one of the most important parts of the website because food customers usually check the menu before contacting the business."),
("Gallery and Promotion", "The Gallery section uses food and cafe photos to build appetite and trust. Good photos can make the website feel more premium and help customers imagine the experience. The Special Offer section is for marketing. It can promote a weekend brunch set, lunch deal, festive package, opening promotion, catering offer, or limited-time discount. This gives the restaurant owner a place to push current campaigns without changing the whole website design."),
("Location", "The Location section gives practical information: the address, opening hours, map area, and customer visit details. This helps walk-in customers, takeaway customers, and people planning reservations. If the restaurant changes branch, opening time, or parking information, this section can be updated. Clear location information reduces repeated questions and helps customers visit with more confidence."),
("WhatsApp and Contact Form", "The website gives customers two easy contact options. The floating WhatsApp button stays visible while they scroll, so they can contact the restaurant at any time. This is useful for reservations, orders, catering questions, and fast enquiries. The contact form is for customers who prefer to send a message with their name, phone number, and request. The form checks that important fields are filled in before submission, so the business receives more useful enquiries."),
("Mobile", "The mobile layout is very important. Many restaurant customers open websites from WhatsApp links, Instagram profiles, Google Maps, QR codes, or a phone search. On a small screen, the design keeps the text readable, stacks the buttons clearly, and changes the navigation into a compact mobile menu. This means customers can still browse the menu, view the location, and contact the business without zooming or struggling with the page."),
("Handoff", "After the website is sold to a real business, the owner can request normal content changes. We can update the restaurant name, logo, menu items, prices, photos, address, opening hours, email, WhatsApp number, Google Maps link, special offer, and brand colours. The client does not need to touch the code. They only need to send the correct business details, and the website can be updated for their restaurant."),
("Closing", "That is the full client walkthrough. The main purpose of this website is to make the restaurant look professional online and help customers take action quickly. It supports browsing, trust, promotions, location information, WhatsApp enquiries, and contact form messages. For a small restaurant, cafe, kopitiam, or food business, this is a practical website that can be customized and launched for real customers.")]

SLIDES = [
("tutorial-01-welcome.png", 68, lambda: bullet("This Is Your Restaurant Website", "A simple walkthrough for the business owner. No programming knowledge needed.", ["The website acts as your online front door.", "Customers can browse food, offers, location, and contact options.", "The goal is to turn visitors into orders, enquiries, or reservations."], True)),
("tutorial-02-homepage.png", 84, visual),
("tutorial-03-navigation.png", 70, lambda: bullet("How Customers Move Around", "The site is one smooth landing page, so customers can scroll or tap a section from the top navigation.", ["About explains the restaurant story.", "Menu and Gallery help customers decide what to buy.", "Special Offer, Location, and Contact help turn interest into action."], False)),
("tutorial-04-about-menu.png", 102, lambda: bullet("About and Menu Sections", "These sections explain the business and show customers what they can order.", ["About can describe the food style, cafe story, chef, or brand promise.", "Menu items include names, descriptions, prices, and best-seller style labels.", "For a real client, the demo dishes and prices can be replaced with the actual menu.", "This is usually the section customers check before contacting the restaurant."], False)),
("tutorial-05-gallery-promo.png", 82, lambda: bullet("Photos and Promotions", "The visual sections help sell the food and support current marketing campaigns.", ["Gallery photos make the food and cafe atmosphere feel real.", "Special Offer can promote brunch sets, lunch deals, festive menus, or opening promos.", "This gives the owner a flexible area for seasonal campaigns."], True)),
("tutorial-06-location.png", 68, lambda: bullet("Location and Opening Hours", "This section helps customers visit the restaurant with confidence.", ["Address and opening hours answer common customer questions.", "Map information supports walk-ins, takeaway, and reservations.", "Branch, parking, and timing details can be updated later."], False)),
("tutorial-07-actions.png", 82, process),
("tutorial-08-mobile.png", 92, mobile),
("tutorial-09-handoff.png", 78, lambda: bullet("What You Can Change Later", "The client does not need to edit code. They only send business details that need updating.", ["Restaurant name, logo, tagline, menu, prices, and photos.", "Address, opening hours, email, Google Maps link, and WhatsApp number.", "Promotions, brand colours, and section text for future campaigns."], True)),
("tutorial-10-closing.png", 52, lambda: bullet("Ready for Real Customers", "The website is designed to make the business look professional and make customer action easy.", ["Customers can browse, trust, find, and contact the restaurant.", "The website can be customized for a cafe, kopitiam, restaurant, or small food business."], False))]


def narration(): return "\n\n".join(t for _, t in SECTIONS)


def write_docs():
    script = ["# Amber & Oak Cafe Client Tutorial Video Script", "", "Audience: non-technical restaurant owner/client", "Tone: clear, friendly, business-focused", ""]
    for i, (title, body) in enumerate(SECTIONS, 1): script += [f"## Chapter {i} - {title}", body, ""]
    (ROOT / "client-tutorial-script.md").write_text("\n".join(script), encoding="utf-8")
    (ROOT / "narration.txt").write_text(narration(), encoding="utf-8")
    (ROOT / "client-usage-notes.md").write_text("""# Client Usage Notes\n\nThis website is built for a restaurant, cafe, kopitiam, or small food business owner who wants a professional online presence without needing to understand code.\n\n## How customers use the website\n\n- Open the website from Google, Instagram, WhatsApp, QR code, or a shared link.\n- View the homepage to understand the restaurant style.\n- Tap Menu to check food, descriptions, and prices.\n- View Gallery to see food and cafe atmosphere.\n- Check Special Offer for current promotions.\n- Check Location for address and opening hours.\n- Tap WhatsApp for fast orders, reservations, or questions.\n- Use the contact form for enquiries that need a written message.\n\n## What the business owner can update later\n\n- Restaurant name, logo, tagline, and story.\n- Menu items, prices, descriptions, and best-seller labels.\n- Food photos, cafe photos, and promotional images.\n- Address, opening hours, Google Maps link, email, and WhatsApp number.\n- Promotions such as lunch sets, festive menus, opening deals, or catering offers.\n\n## Important handoff note\n\nThe client does not need to edit programming files. For normal updates, the client can send the new text, prices, photos, or contact details to the website provider, and the website can be updated for the business.\n""", encoding="utf-8")


def make_voice():
    ps = ROOT / "make_tutorial_narration.ps1"
    body = narration().replace("'", "''")
    ps.write_text(f"""Add-Type -AssemblyName System.Speech\n$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer\n$synth.SelectVoice('Microsoft Zira Desktop')\n$synth.Rate = -1\n$synth.Volume = 100\n$synth.SetOutputToWaveFile('{NARRATION}')\n$synth.Speak('{body}')\n$synth.Dispose()\n""", encoding="utf-8")
    subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ps)], check=True)


def wav_len(path):
    with wave.open(str(path), "rb") as w: return w.getnframes() / float(w.getframerate())


def render():
    write_docs(); make_voice(); duration = wav_len(NARRATION) + 2
    FRAMES.mkdir(parents=True, exist_ok=True)
    total = sum(w for _, w, _ in SLIDES); concat = []
    for name, weight, maker in SLIDES:
        path = FRAMES / name; maker().save(path, "PNG")
        concat += [f"file '{path.as_posix()}'", f"duration {max(18, duration * weight / total):.3f}"]
    concat.append(f"file '{(FRAMES / SLIDES[-1][0]).as_posix()}'")
    (ROOT / "frames.txt").write_text("\n".join(concat), encoding="utf-8")
    ffmpeg = ROOT / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
    if not ffmpeg.exists(): raise SystemExit(f"FFmpeg not found at {ffmpeg}. Run npm install in presentation-video first.")
    subprocess.run([str(ffmpeg), "-y", "-f", "concat", "-safe", "0", "-i", str(ROOT / "frames.txt"), "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-movflags", "+faststart", str(VIDEO_ONLY)], check=True)
    subprocess.run([str(ffmpeg), "-y", "-i", str(VIDEO_ONLY), "-i", str(NARRATION), "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", str(OUT)], check=True)
    (ROOT / "video-metadata.json").write_text(json.dumps({"title": "Amber & Oak Cafe Client Tutorial", "audience": "Non-technical restaurant owner/client", "voice": "Microsoft Zira Desktop, rate -1", "duration_seconds": round(wav_len(NARRATION), 2), "output": str(OUT), "live_site": "https://amber-oak-cafe-brian-bccm.netlify.app", "github_repo": "https://github.com/Brian-bccm/AmberOakCafe"}, indent=2), encoding="utf-8")
    print(f"Rendered {OUT}")

if __name__ == "__main__": render()

