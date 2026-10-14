#!/usr/bin/env python3
"""Generate the DeepSeek Harness (DSH) avatar.

Original artwork: a satnav-blue disc carrying a white "harness wheel" —
a solid core, eight tapered spokes and a yoke ring.

Outputs
-------
assets/avatar.svg      vector source, 512x512 viewBox
assets/avatar.png      512x512 raster, for GitHub-style profile slots
assets/avatar-128.png  128x128 raster, for inline README badges

Run:  python3 assets/make_avatar.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

# --- design tokens ---------------------------------------------------------
SIZE = 512
BG = "#1552F0"          # satnav blue
FG = "#FFFFFF"          # mark colour

CORE_R = 54.0           # solid centre
SPOKE_IN = 54.0         # spokes start at the core edge
SPOKE_OUT = 205.0       # ... and run past the yoke ring
SPOKE_N = 8             # every 45 degrees
SPOKE_W_IN = 30.0       # angular width at the core (degrees)
SPOKE_W_OUT = 4.0       # angular width at the tip (degrees)

RING_R_OUT = 140.0      # yoke ring, outer edge
RING_R_IN = 117.0       # yoke ring, inner edge

SS = 4                  # supersampling factor for anti-aliasing
OUT_DIR = Path(__file__).resolve().parent


def _pt(radius: float, degrees: float) -> tuple[float, float]:
    """Polar -> cartesian, 0 degrees pointing up, clockwise."""
    a = math.radians(degrees - 90.0)
    return (math.cos(a) * radius, math.sin(a) * radius)


def _spoke_polygon(centre_deg: float) -> list[tuple[float, float]]:
    half_in = SPOKE_W_IN / 2.0
    half_out = SPOKE_W_OUT / 2.0
    return [
        _pt(SPOKE_IN, centre_deg - half_in),
        _pt(SPOKE_OUT, centre_deg - half_out),
        _pt(SPOKE_OUT, centre_deg + half_out),
        _pt(SPOKE_IN, centre_deg + half_in),
    ]


def _scaled(points: list[tuple[float, float]], s: float) -> list[tuple[float, float]]:
    c = SIZE / 2.0 * s
    return [(c + x * s, c + y * s) for x, y in points]


def _ellipse(r: float, s: float) -> list[float]:
    c = SIZE / 2.0 * s
    rr = r * s
    return [c - rr, c - rr, c + rr, c + rr]


def render_raster() -> Image.Image:
    n = SIZE * SS
    img = Image.new("RGB", (n, n), BG)
    d = ImageDraw.Draw(img)

    for i in range(SPOKE_N):
        poly = _spoke_polygon(i * (360.0 / SPOKE_N))
        d.polygon(_scaled(poly, SS), fill=FG)

    d.ellipse(_ellipse(RING_R_OUT, SS), fill=FG)
    d.ellipse(_ellipse(RING_R_IN, SS), fill=BG)
    d.ellipse(_ellipse(CORE_R, SS), fill=FG)

    return img.resize((SIZE, SIZE), Image.LANCZOS)


def svg() -> str:
    def polar(r: float, deg: float) -> tuple[float, float]:
        x, y = _pt(r, deg)
        return (SIZE / 2.0 + x, SIZE / 2.0 + y)

    def fmt(p: tuple[float, float]) -> str:
        return f"{p[0]:.2f},{p[1]:.2f}"

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" '
        f'width="{SIZE}" height="{SIZE}" role="img" '
        f'aria-label="DeepSeek Harness avatar">',
        "  <title>DeepSeek Harness</title>",
        f'  <circle cx="{SIZE/2}" cy="{SIZE/2}" r="{SIZE/2}" fill="{BG}"/>',
        '  <g fill="#FFFFFF">',
    ]
    for i in range(SPOKE_N):
        angle = i * (360.0 / SPOKE_N)
        corners = [polar(r, d) for r, d in _spoke_polygon(angle)]
        points = " ".join(fmt(p) for p in corners)
        parts.append(f'    <polygon points="{points}"/>')
    parts.append("  </g>")
    parts.append(f'  <circle cx="{SIZE/2}" cy="{SIZE/2}" r="{RING_R_OUT}" fill="#FFFFFF"/>')
    parts.append(f'  <circle cx="{SIZE/2}" cy="{SIZE/2}" r="{RING_R_IN}" fill="{BG}"/>')
    parts.append(f'  <circle cx="{SIZE/2}" cy="{SIZE/2}" r="{CORE_R}" fill="#FFFFFF"/>')
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = render_raster()
    img.save(OUT_DIR / "avatar.png")
    img.resize((128, 128), Image.LANCZOS).save(OUT_DIR / "avatar-128.png")
    (OUT_DIR / "avatar.svg").write_text(svg(), encoding="utf-8")
    print("wrote avatar.svg, avatar.png, avatar-128.png to", OUT_DIR)


if __name__ == "__main__":
    main()
