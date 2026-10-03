# tmap.py : TIME-to-go map for Mountain Climb (frames to finish from each 8px cell), backward Dijkstra on a
# physics-flavoured grid graph. usage: POLYS=/tmp/polys.json python3 tmap.py OUTPREFIX
import json, numpy as np, heapq, sys, os, math
from PIL import Image, ImageDraw
from scipy import ndimage
polys = json.load(open(os.environ.get('POLYS', '/tmp/polys.json')))
lvl = json.load(open(os.environ.get('LEVEL', '../levels/Mountain Climb.json')))
RES = 8.0; X0, X1, Y0, Y1 = -600, 12800, -400, 5200
W, H = int((X1 - X0) / RES), int((Y1 - Y0) / RES)
P = dict(VH=float(os.environ.get('VH', 4)), VUP=float(os.environ.get('VUP', 3.3)), VDN=float(os.environ.get('VDN', 10)),
         JH=float(os.environ.get('JH', 80)), VG=float(os.environ.get('VG', 18)), G=0.2778)
def cell(x, y): return int((y1c(y))), int((x - X0) / RES)
def y1c(y): return (Y1 - y) / RES
def tocell(x, y): return ((x - X0) / RES, (Y1 - y) / RES)
FR = 2.0; FW, FH = int((X1 - X0) / FR), int((Y1 - Y0) / FR); K = int(RES / FR)
solid = Image.new('L', (FW, FH), 0); haz = Image.new('L', (FW, FH), 0)
ds, dh = ImageDraw.Draw(solid), ImageDraw.Draw(haz)
def tof(x, y): return ((x - X0) / FR, (Y1 - y) / FR)
for p in polys:
    pts = [tof(x, y) for x, y in p['v']]
    if p['cls'] == 'spike':
        if p['sensor']: dh.polygon(pts, fill=255)
        else: ds.polygon(pts, fill=255)
    elif p['sensor'] or p['cls'] in ('finish', 'tip', 'checkpoint', 'control', 'grapple', 'gravity', 'direction', 'reset'): continue
    else: ds.polygon(pts, fill=255)
SF = np.array(solid) > 0; HF = np.array(haz) > 0
CL = float(os.environ.get('CLR', 8.5)); HCL = float(os.environ.get('HCL', 9))
freeF = (ndimage.distance_transform_edt(~SF) * FR > CL) & (ndimage.distance_transform_edt(~HF) * FR > HCL)
blocked = ~freeF.reshape(H, K, W, K).any(axis=(1, 3))
S = SF.reshape(H, K, W, K).mean(axis=(1, 3)) > 0.5
# support: within jump height above a solid, or within 2 cells sideways of a solid (wall contact re-arms the jump)
JHc = int(P['JH'] / RES)
TOUCH = ndimage.binary_dilation(S, np.ones((5, 5), bool)) & ~S
SUP = TOUCH.copy()
for k in range(1, JHc + 1): SUP[:-k, :] |= TOUCH[k:, :]
def rect(x0, y0, x1, y1):
    m = np.zeros((H, W), bool); c0, r1 = tocell(x0, y0); c1, r0 = tocell(x1, y1)
    m[max(0, int(r0)):int(r1) + 1, max(0, int(c0)):int(c1) + 1] = True; return m
GRAV = rect(8380, 1950, 8540, 3260); GRAP = rect(8700, 3600, 12800, 5200)
SUP |= GRAV
T = np.full((H, W), np.inf)
fx, fy = [(c['position']['x'], c['position']['y']) for c in lvl['children'] if c['class'] == 'finish'][0]
pq = []
fc, fr = tocell(fx, fy)
for r in range(int(fr) - 2, int(fr) + 3):
    for c in range(int(fc) - 2, int(fc) + 3): T[r, c] = 0; pq.append((0.0, r, c))
blocked[[p[1] for p in pq], [p[2] for p in pq]] = False
# pad arcs (forward edges pad->cell, cost t). Stored reversed: when cell is settled, relax pad.
rev = {}
G = P['G']
for o in lvl['children']:
    if o['class'] != 'bounce': continue
    px, py, a = o['position']['x'], o['position']['y'], o['rotation']['z']; s = o['scale']['y'] / 2
    nx, ny = -math.sin(a), math.cos(a)
    lx, ly = px + nx * (o['scale']['y'] / 2 + 10), py + ny * (o['scale']['y'] / 2 + 10)
    lc, lr = tocell(lx, ly); lr, lc = int(lr), int(lc); blocked[lr, lc] = False
    for dd in range(-88, 89, 4):
        th = math.atan2(ny, nx) + math.radians(dd)
        x, y, vx, vy = lx, ly, s * math.cos(th), s * math.sin(th)
        for t in range(1, 160):
            nxp, nyp = x + vx, y + vy - 0  # position update then gravity (matter: v += g; x += v)
            vy -= G; nxp, nyp = x + vx, y + vy
            c, r = int((nxp - X0) / RES), int((Y1 - nyp) / RES)
            if not (0 <= r < H and 0 <= c < W): break
            if blocked[r, c]:
                c2, r2 = int((nxp - X0) / RES), int((Y1 - y) / RES)
                if not blocked[r2, c2]: vy = 0; nyp = y; r = r2  # slide along floor/ceiling, keep vx (friction 0)
                else: break
            x, y = nxp, nyp
            rev.setdefault((r, c), []).append((lr, lc, t + 2))
print('pad arc edges', sum(len(v) for v in rev.values()), file=sys.stderr)
heapq.heapify(pq)
VH, VUP, VDN, VG = P['VH'], P['VUP'], P['VDN'], P['VG']
nb = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1) if dr or dc]
done = np.zeros((H, W), bool)
while pq:
    d, r, c = heapq.heappop(pq)
    if done[r, c]: continue
    done[r, c] = True
    for (pr, pc, t) in rev.get((r, c), ()):
        nd = d + t
        if nd < T[pr, pc]: T[pr, pc] = nd; heapq.heappush(pq, (nd, pr, pc))
    for dr, dc in nb:
        r2, c2 = r - dr, c - dc  # predecessor cell u=(r2,c2) moving by (dr,dc) to (r,c)
        if not (0 <= r2 < H and 0 <= c2 < W) or blocked[r2, c2] or done[r2, c2]: continue
        if GRAP[r2, c2]: cost = RES * math.hypot(dr, dc) / VG
        else:
            up = dr < 0  # row decreases = moving up
            if up and not SUP[r2, c2]: continue
            tv = RES / (VUP if up else VDN) if dr else 0
            th = RES / VH if dc else 0
            cost = max(tv, th)
        nd = d + cost
        if nd < T[r2, c2]: T[r2, c2] = nd; heapq.heappush(pq, (nd, r2, c2))
out = np.where(np.isfinite(T), T, -1).astype(np.float32)
pre = sys.argv[1]
out.tofile(pre + '.f32')
json.dump({'X0': X0, 'Y1': Y1, 'RES': RES, 'W': W, 'H': H, 'P': P}, open(pre + 'meta.json', 'w'))
print('done', np.isfinite(T).sum(), file=sys.stderr)
