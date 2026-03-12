from PIL import Image
from collections import defaultdict

img = Image.open('smart-cushion-top-view.png')
w, h = img.size

visited = set()
regions = []

def flood_fill(sx, sy):
    stack = [(sx, sy)]
    pixels = []
    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        if x < 60 or x > 732 or y < 25 or y > 695:
            continue
        r, g, b = img.getpixel((x, y))
        if r < 200 or g < 200 or b < 200:
            continue
        visited.add((x, y))
        pixels.append((x, y))
        if len(pixels) > 5000:
            break
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
            nx, ny = x+dx, y+dy
            if (nx, ny) not in visited:
                stack.append((nx, ny))
    return pixels

for y in range(25, 695, 3):
    for x in range(60, 732, 3):
        if (x, y) in visited:
            continue
        r, g, b = img.getpixel((x, y))
        if r > 200 and g > 200 and b > 200:
            region = flood_fill(x, y)
            if len(region) > 30:
                xs = [p[0] for p in region]
                ys = [p[1] for p in region]
                cx = sum(xs) // len(xs)
                cy = sum(ys) // len(ys)
                bw = max(xs) - min(xs)
                bh = max(ys) - min(ys)
                aspect = bw / max(bh, 1)
                regions.append({
                    'cx': cx, 'cy': cy,
                    'w': bw, 'h': bh,
                    'area': len(region),
                    'aspect': aspect,
                    'bbox_x1': min(xs), 'bbox_y1': min(ys),
                    'bbox_x2': max(xs), 'bbox_y2': max(ys)
                })

regions.sort(key=lambda r: (r['cy'], r['cx']))

print(f"Found {len(regions)} white interior regions:\n")
for i, r in enumerate(regions):
    if 0.7 < r['aspect'] < 1.4:
        shape = 'square-ish'
    elif r['aspect'] > 1.4:
        shape = 'wide'
    else:
        shape = 'tall'
    print(f"  #{i+1}: center=({r['cx']},{r['cy']}), size={r['w']}x{r['h']}, area={r['area']}px, aspect={r['aspect']:.2f} ({shape})")
    print(f"       bbox=({r['bbox_x1']},{r['bbox_y1']})-({r['bbox_x2']},{r['bbox_y2']})")
