"""One-off generator for the PWA + favicon PNG icons.

No image libraries are available in this environment, so this renders a simple
gauge mark (matching the app's Gauge component) with a tiny pure-Python PNG
writer. Edges are anti-aliased analytically via signed-distance fields so it
stays fast without supersampling. Run from the frontend root:
    python3 scripts/generate_icons.py
"""
import os
import struct
import zlib

# Brand tokens (keep in sync with src/styles/tokens.css light accent).
ACCENT = (14, 165, 196)   # #0ea5c4
INK = (6, 16, 29)         # #06101d

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

CX, CY = 0.5, 0.5
R = 0.30          # gauge ring radius (unit box)
RING_T = 0.046    # ring half-thickness
NEEDLE = (0.155, -0.155)  # needle tip offset from centre
NEEDLE_T = 0.030  # needle half-thickness
HUB_R = 0.050


def _seg_dist(ax, ay, bx, by, px, py):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return ((px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2) ** 0.5


def _sdf_logo(lx, ly):
    """Signed distance to the union of ring + hub + needle (unit space)."""
    d_center = ((lx - CX) ** 2 + (ly - CY) ** 2) ** 0.5
    ring = abs(d_center - R) - RING_T
    hub = d_center - HUB_R
    needle = _seg_dist(CX, CY, CX + NEEDLE[0], CY + NEEDLE[1], lx, ly) - NEEDLE_T
    return min(ring, hub, needle)


def _sdf_roundrect(x, y, rc):
    dx = abs(x - 0.5) - (0.5 - rc)
    dy = abs(y - 0.5) - (0.5 - rc)
    ax, ay = (dx if dx > 0 else 0.0), (dy if dy > 0 else 0.0)
    return (ax * ax + ay * ay) ** 0.5 + min(max(dx, dy), 0.0) - rc


def _cov(sdf, pixel):
    """Anti-aliased coverage (0..1) for an SDF in unit space."""
    return max(0.0, min(1.0, 0.5 - sdf / pixel))


def render(size, scale, rounded):
    """Render an RGBA pixel buffer at `size` (analytic AA, one eval per pixel)."""
    buf = bytearray(size * size * 4)
    pixel = 1.0 / size
    for oy in range(size):
        v = (oy + 0.5) / size
        for ox in range(size):
            u = (ox + 0.5) / size
            mask_cov = _cov(_sdf_roundrect(u, v, 0.22), pixel) if rounded else 1.0
            if mask_cov <= 0.0:
                continue
            # Invert the logo scale about the centre.
            lx = CX + (u - CX) / scale
            ly = CY + (v - CY) / scale
            logo_cov = _cov(_sdf_logo(lx, ly), pixel / scale)
            r = round(INK[0] * logo_cov + ACCENT[0] * (1 - logo_cov))
            g = round(INK[1] * logo_cov + ACCENT[1] * (1 - logo_cov))
            b = round(INK[2] * logo_cov + ACCENT[2] * (1 - logo_cov))
            a = round(255 * mask_cov)
            i = (oy * size + ox) * 4
            buf[i], buf[i + 1], buf[i + 2], buf[i + 3] = r, g, b, a
    return bytes(buf)


def write_png(path, size, buf):
    def chunk(typ, data):
        return (struct.pack('>I', len(data)) + typ + data
                + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff))
    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)                       # filter type 0 (None)
        raw += buf[y * stride:(y + 1) * stride]
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    return len(png)


def main():
    jobs = [
        # (filename, size, logo scale, rounded corners)
        ('icon-192.png', 192, 1.0, True),
        ('icon-512.png', 512, 1.0, True),
        ('icon-maskable-192.png', 192, 0.72, False),
        ('icon-maskable-512.png', 512, 0.72, False),
        ('apple-touch-icon.png', 180, 0.80, False),
        ('favicon-32.png', 32, 1.0, True),
    ]
    for name, size, scale, rounded in jobs:
        buf = render(size, scale, rounded)
        path = os.path.join(OUT_DIR, name)
        nbytes = write_png(path, size, buf)
        print(f'wrote {name:24} {size}x{size}  {nbytes} bytes')


if __name__ == '__main__':
    main()

