/**
 * Builds the destination map artwork in the site's map projection (see src/lib/destination-map.ts):
 * - public/maps/sri-lanka-terrain.webp – shaded relief + bathymetry from AWS Terrain Tiles (SRTM / ETOPO1, public domain)
 * - src/lib/sri-lanka-coastline.ts – Natural Earth 1:10m coastline (public domain, via world-atlas)
 * Usage: node scripts/build-terrain-map.mjs   (downloads ~3.7 MB + 48 tiles into the OS temp dir; one-off)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(os.tmpdir(), "srilanka-terrain-cache");
fs.mkdirSync(path.join(DIR, "tiles"), { recursive: true });

const B = { west: 79.35, east: 82.05, south: 5.75, north: 9.95 };
const K = 125 * Math.cos((7.6 * Math.PI) / 180);
const project = (lat, lng) => [30 + (lng - B.west) * K, 35 + (B.north - lat) * 125];
const unproject = (x, y) => [B.north - (y - 35) / 125, B.west + (x - 30) / K];
const S = 2; // output pixels per viewBox unit
const W = 400 * S, H = 600 * S;

// ---------- coastline (world-atlas countries-10m, Natural Earth, public domain)
const TOPO = path.join(DIR, "countries-10m.json");
async function coastline() {
const topo = JSON.parse(fs.readFileSync(TOPO, "utf8"));
const geom = topo.objects.countries.geometries.find((g) => g.id === "144");
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => ((x += dx), (y += dy), [x * scale[0] + translate[0], y * scale[1] + translate[1]]));
});
const ring = (ids) => {
  const pts = [];
  for (const i of ids) {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    pts.push(...(pts.length ? a.slice(1) : a));
  }
  return pts.map(([lng, lat]) => project(lat, lng));
};
const rings = geom.arcs.flatMap((poly) => poly.map(ring));
const area = (r) => Math.abs(r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0) / 2);
const kept = rings.filter((r) => area(r) > 1.5); // drop specks
const simplify = (r) => r.filter((p, i) => i === 0 || Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]) > 0.6 || i === r.length - 1);
const d = kept.map((r) => "M" + simplify(r).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z").join("");
fs.writeFileSync(
  path.join(FRONTEND, "src/lib/sri-lanka-coastline.ts"),
  `/** Natural Earth 1:10m admin-0 coastline, Sri Lanka. Public domain.
 * Source: https://www.naturalearthdata.com (via the world-atlas countries-10m TopoJSON)
 * Terms: https://www.naturalearthdata.com/about/terms-of-use/
 * Projected using projectCoordinates in destination-map.ts; viewBox 0 0 400 600.
 * Regenerate with scripts/build-terrain-map.mjs (also writes public/maps/sri-lanka-terrain.webp). */
export const SRI_LANKA_COASTLINE =
  "${d}";
`,
);
console.log("coastline rings", kept.length, "chars", d.length);

return rings;
}

// land mask (even-odd scanline at pixel centres)
function landMask(rings) {
const mask = new Uint8Array(W * H);
for (let py = 0; py < H; py++) {
  const y = (py + 0.5) / S;
  const xs = [];
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length];
    if ((y1 <= y) !== (y2 <= y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    for (let px = Math.max(0, Math.ceil(xs[k] * S - 0.5)); px < Math.min(W, xs[k + 1] * S - 0.5); px++) mask[py * W + px] = 1;
  }
}
return mask;
}

// ---------- elevation (AWS Terrain Tiles, terrarium encoding; SRTM / ETOPO1)
const Z = 9;
const tx = (lng) => ((lng + 180) / 360) * 2 ** Z;
const ty = (lat) => ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z;
const [lat0, lng0] = unproject(0, 0), [lat1, lng1] = unproject(400, 600);
const X0 = Math.floor(tx(lng0)), X1 = Math.floor(tx(lng1)), Y0 = Math.floor(ty(lat0)), Y1 = Math.floor(ty(lat1));

async function main() {
  if (!fs.existsSync(TOPO)) {
    const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json");
    fs.writeFileSync(TOPO, Buffer.from(await res.arrayBuffer()));
  }
  const mask = landMask(await coastline());
  const TW = (X1 - X0 + 1) * 256, TH = (Y1 - Y0 + 1) * 256;
  const dem = new Float32Array(TW * TH);
  for (let X = X0; X <= X1; X++) for (let Y = Y0; Y <= Y1; Y++) {
    const file = path.join(DIR, "tiles", `${Z}-${X}-${Y}.png`);
    if (!fs.existsSync(file)) {
      const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${X}/${Y}.png`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const o = (j * 256 + i) * info.channels;
      dem[((Y - Y0) * 256 + j) * TW + (X - X0) * 256 + i] = data[o] * 256 + data[o + 1] + data[o + 2] / 256 - 32768;
    }
  }
  const sample = (lat, lng) => {
    const fx = (tx(lng) - X0) * 256 - 0.5, fy = (ty(lat) - Y0) * 256 - 0.5;
    const ix = Math.max(0, Math.min(TW - 2, Math.floor(fx))), iy = Math.max(0, Math.min(TH - 2, Math.floor(fy)));
    const ax = fx - ix, ay = fy - iy, g = (i, j) => dem[(iy + j) * TW + ix + i];
    return (g(0, 0) * (1 - ax) + g(1, 0) * ax) * (1 - ay) + (g(0, 1) * (1 - ax) + g(1, 1) * ax) * ay;
  };
  const elev = new Float32Array(W * H);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const [lat, lng] = unproject((px + 0.5) / S, (py + 0.5) / S);
    elev[py * W + px] = sample(lat, lng);
  }

  // Smoothed copy for the sea (raw bathymetry near the coast is speckled).
  const seaElev = Float32Array.from(elev, (v, i) => (mask[i] ? -1 : Math.min(0, v)));
  for (let pass = 0; pass < 3; pass++) for (const horiz of [true, false]) {
    const src = Float32Array.from(seaElev), R = 5;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      let sum = 0, n = 0;
      for (let k = -R; k <= R; k++) {
        const x = horiz ? px + k : px, y = horiz ? py : py + k;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        sum += src[y * W + x]; n++;
      }
      seaElev[py * W + px] = sum / n;
    }
  }
  const ramp = (stops, v) => {
    if (v <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
      const t = (v - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return stops[i - 1][1].map((c, k) => c + (stops[i][1][k] - c) * t);
    }
    return stops[stops.length - 1][1];
  };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  // Wet-zone (south-west) greens → dry-zone (north / east) olive at low elevations, then upland greens to bare summits.
  const wet = [[0, hex("#7fa86a")], [150, hex("#6f9b5e")], [500, hex("#5f8c55")], [1000, hex("#6e8f5c")], [1600, hex("#8e9a6e")], [2300, hex("#b8b393")]];
  const dry = [[0, hex("#bdbf8e")], [150, hex("#a9b37e")], [500, hex("#93a46e")], [1000, hex("#7f965f")], [1600, hex("#8e9a6e")], [2300, hex("#b8b393")]];
  const sea = [[-4000, hex("#5d93ab")], [-1500, hex("#73a7bc")], [-400, hex("#93bfcd")], [-80, hex("#b2d4dc")], [-20, hex("#c4e0e4")], [0, hex("#d3e9ea")]];

  const out = Buffer.alloc(W * H * 3);
  const cell = 888 / S; // metres per pixel (vertical)
  const az = (315 * Math.PI) / 180, alt = (45 * Math.PI) / 180, zf = 3.2;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px, o = i * 3;
    const e = (x, y) => elev[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
    let c;
    if (mask[i]) {
      const h = Math.max(0, elev[i]);
      const dzx = ((e(px + 1, py) - e(px - 1, py)) / (2 * cell)) * zf, dzy = ((e(px, py + 1) - e(px, py - 1)) / (2 * cell)) * zf;
      const slope = Math.atan(Math.hypot(dzx, dzy)), aspect = Math.atan2(dzy, -dzx);
      const shade = Math.cos(Math.PI / 2 - alt) * Math.cos(slope) + Math.sin(Math.PI / 2 - alt) * Math.sin(slope) * Math.cos(az - Math.PI / 2 - aspect);
      const [lat, lng] = unproject(px / S, py / S);
      // Rough rainfall proxy: wet zone = south-west quadrant of the island.
      const w = Math.min(1, Math.max(0, (7.6 - lat) * 0.9 + (80.75 - lng) * 0.9 + 0.3 + h / 1200));
      const base = ramp(wet, h).map((v, k) => v * w + ramp(dry, h)[k] * (1 - w));
      const f = 0.62 + 0.5 * (shade - 0.707) / 0.707 + 0.38;
      c = base.map((v) => v * Math.min(1.25, Math.max(0.55, f)));
    } else {
      c = ramp(sea, seaElev[i]);
    }
    out[o] = Math.min(255, Math.round(c[0])); out[o + 1] = Math.min(255, Math.round(c[1])); out[o + 2] = Math.min(255, Math.round(c[2]));
  }
  const dest = path.join(FRONTEND, "public/maps/sri-lanka-terrain.webp");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 80, smartSubsample: true }).toFile(dest);
  console.log("wrote", dest, fs.statSync(dest).size, "bytes; tiles", (X1 - X0 + 1) * (Y1 - Y0 + 1));
}
main().catch((e) => { console.error(e); process.exit(1); });
