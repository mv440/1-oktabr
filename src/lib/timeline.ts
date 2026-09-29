// Yagona 1800 kadrli vaqt chizig‘i. Barcha animatsiyalar global vaqt (soniya) funksiyasi,
// shuning uchun 900–1799-kadrlar alohida render qilinganda ham holat noldan boshlanmaydi.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 1800;
export const CX = WIDTH / 2;
export const CY = HEIGHT / 2;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Ease = (x: number) => number;
export const linear: Ease = (x) => clamp01(x);
export const smooth: Ease = (x) => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};
export const smoother: Ease = (x) => {
  x = clamp01(x);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const easeOut: Ease = (x) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeOutQuint: Ease = (x) => 1 - Math.pow(1 - clamp01(x), 5);
export const easeIn: Ease = (x) => Math.pow(clamp01(x), 3);
export const easeInOutSine: Ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));

/** 0→1 oraliqda [a, b] soniyalar orasida. */
export const ramp = (t: number, a: number, b: number, ease: Ease = smoother) =>
  ease((t - a) / (b - a));

/** Kirish/chiqish oynasi: [a,b] da 0→1, [c,d] da 1→0. */
export const win = (t: number, a: number, b: number, c: number, d: number, ease: Ease = smoother) =>
  ramp(t, a, b, ease) * (1 - ramp(t, c, d, ease));

/** Deterministik psevdo-tasodifiy son (0..1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

export const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * Monoton kubik (Fritsch–Carlson) interpolyatsiya: tezlik uzluksiz, ortiqcha chayqalish yo‘q.
 * Kamera va nur trayektoriyasi shu orqali quriladi.
 */
export const monotone = (ts: number[], vs: number[]) => {
  const n = ts.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
  const m: number[] = new Array(n).fill(0);
  m[0] = 0;
  m[n - 1] = 0;
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i];
      m[i + 1] = tau * b * d[i];
    }
  }
  return (t: number) => {
    if (t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0;
    while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const u = (t - ts[i]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * vs[i] +
      (u3 - 2 * u2 + u) * h * m[i] +
      (-2 * u3 + 3 * u2) * vs[i + 1] +
      (u3 - u2) * h * m[i + 1]
    );
  };
};

// ---------------------------------------------------------------------------
// Dunyo koordinatalari
// ---------------------------------------------------------------------------

/** Kitob markazi (umurtqa/o‘rta chiziq) dunyo koordinatalarida. */
export const BOOK = {x: 960, y: 1180};

// Kamera kalit nuqtalari: [soniya, x, y, zoom]. 30-soniya kalit emas — kamera o‘sha paytda harakatda.
const CAM_KEYS: [number, number, number, number][] = [
  [0, 960, 540, 1.0],
  [4.6, 960, 548, 1.035],
  [9.4, 960, 1000, 1.17],
  [14.5, 960, 1008, 1.19],
  [21.4, 966, 1016, 1.205],
  [25, 990, 915, 1.15],
  [28, 1080, 812, 1.09],
  [31, 1400, 700, 1.035],
  [33.6, 1690, 652, 1.0],
  [35.8, 1706, 647, 0.99],
  [38.0, 1714, 644, 0.985],
  [43.2, 980, 800, 0.805],
  [47, 962, 790, 0.795],
  [60, 956, 780, 0.785],
];

const camX = monotone(CAM_KEYS.map((k) => k[0]), CAM_KEYS.map((k) => k[1]));
const camY = monotone(CAM_KEYS.map((k) => k[0]), CAM_KEYS.map((k) => k[2]));
const camZ = monotone(CAM_KEYS.map((k) => k[0]), CAM_KEYS.map((k) => Math.log(k[3])));

export type Cam = {x: number; y: number; z: number};
export const camera = (t: number): Cam => ({x: camX(t), y: camY(t), z: Math.exp(camZ(t))});

export const worldToScreen = (cam: Cam, x: number, y: number) => ({
  x: (x - cam.x) * cam.z + CX,
  y: (y - cam.y) * cam.z + CY,
});

/** Parallax qatlam uchun SVG transform: depth=1 — dunyo, depth<1 — uzoqroq. */
export const camTransform = (cam: Cam, depth = 1) => {
  const z = 1 + (cam.z - 1) * depth;
  const x = CX + (cam.x - CX) * depth;
  const y = CY + (cam.y - CY) * depth;
  return `translate(${CX} ${CY}) scale(${z}) translate(${-x} ${-y})`;
};

// ---------------------------------------------------------------------------
// Oltin nur (orb) trayektoriyasi — 22-soniyadan 33-soniyagacha uzluksiz
// ---------------------------------------------------------------------------
export const ORB_BIRTH = 21.7;
export const ORB_ARRIVE = 33.2;
const ORB_KEYS: [number, number, number][] = [
  [ORB_BIRTH, 960, 1045],
  [22.6, 962, 1020],
  [25, 1110, 905],
  [28, 1370, 770],
  [30.5, 1560, 695],
  // Yetib kelish nuqtasi — aynan shu paytdagi kamera markazi (ekran markazi).
  [ORB_ARRIVE, camX(ORB_ARRIVE), camY(ORB_ARRIVE)],
];
const orbX = monotone(ORB_KEYS.map((k) => k[0]), ORB_KEYS.map((k) => k[1]));
const orbY = monotone(ORB_KEYS.map((k) => k[0]), ORB_KEYS.map((k) => k[2]));
export const orbWorld = (t: number) => ({x: orbX(t), y: orbY(t)});
