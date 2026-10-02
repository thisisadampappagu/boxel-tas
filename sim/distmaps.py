import json, numpy as np, heapq, sys
from PIL import Image, ImageDraw
from scipy import ndimage
import os
polys = json.load(open(os.environ.get('POLYS','mc_polys.json')))
RES = float(os.environ.get('RES','4')); X0, X1, Y0, Y1 = [float(v) for v in os.environ.get('BOUNDS','-600,12800,-400,5200').split(',')]
W, H = int((X1-X0)/RES), int((Y1-Y0)/RES)
def tocell(x, y): return ((x-X0)/RES, (Y1-y)/RES)
solid = Image.new('L', (W, H), 0); haz = Image.new('L', (W, H), 0)
ds, dh = ImageDraw.Draw(solid), ImageDraw.Draw(haz)
for p in polys:
    pts = [tocell(x, y) for x, y in p['v']]
    if p['cls'] == 'spike': dh.polygon(pts, fill=255)
    elif p['sensor'] or p['cls'] == 'finish': continue
    else: ds.polygon(pts, fill=255)
S = np.array(solid) > 0; Hz = np.array(haz) > 0
DIL = int(os.environ.get('DIL','2')); HDIL = int(os.environ.get('HDIL','3'))
blocked = ndimage.binary_dilation(S, structure=np.ones((2*DIL+1,2*DIL+1),bool)) | ndimage.binary_dilation(Hz, structure=np.ones((2*HDIL+1,2*HDIL+1),bool))
# air-ness: distance (in cells) from any solid surface
distS = ndimage.distance_transform_edt(~S)
AIR = distS > 6   # > 24px from solids

GOALS = json.load(open(sys.argv[4] if len(sys.argv) > 4 else 'phases.json'))
PREFIX = sys.argv[5] if len(sys.argv) > 5 else 'mc_dist_p'
nb = [(-1,0,1),(1,0,1),(0,-1,1),(0,1,1),(-1,-1,1.4142),(-1,1,1.4142),(1,-1,1.4142),(1,1,1.4142)]
out = []
ONLY = [int(v) for v in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
for k, g in enumerate(GOALS):
    if ONLY is not None and k not in ONLY: continue
    x0, y0, x1, y1 = g['rect']
    c0, r1 = tocell(x0, y0); c1, r0 = tocell(x1, y1)
    D = np.full((H, W), np.float32(1e9), dtype=np.float32)
    pq = []
    for r in range(int(r0), int(r1)+1):
        for c in range(int(c0), int(c1)+1):
            if 0 <= r < H and 0 <= c < W:
                D[r, c] = 0; pq.append((0.0, r, c))
    heapq.heapify(pq)
    UPC, SIDEC = float(sys.argv[1]) if len(sys.argv) > 1 else 4.0, float(sys.argv[2]) if len(sys.argv) > 2 else 1.5
    while pq:
        d, r, c = heapq.heappop(pq)
        if d > D[r, c]: continue
        air = AIR[r, c]
        for dr, dc, w in nb:
            rr, cc = r+dr, c+dc
            if 0 <= rr < H and 0 <= cc < W and not blocked[rr, cc]:
                # player moves (rr,cc) -> (r,c); dr = +1 means neighbor is below -> player moves UP
                if air:
                    if (dr > 0) != (os.environ.get('INV') == '1') and dr != 0: w *= UPC
                    elif dr == 0: w *= SIDEC
                nd = d + w
                if nd < D[rr, cc]: D[rr, cc] = nd; heapq.heappush(pq, (nd, rr, cc))
    D = np.where(D >= 1e8, np.float32(-1), D * RES).astype(np.float32)
    D.tofile(f'{PREFIX}{k}.f32')
    out.append(g['name'])
    print(k, g['name'], 'done', flush=True)
json.dump({'X0':X0,'Y1':Y1,'RES':RES,'W':W,'H':H,'phases':GOALS}, open(PREFIX + 'meta.json','w'))
