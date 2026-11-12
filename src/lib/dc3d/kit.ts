/**
 * Small Three.js toolkit shared by every 3D lesson scene: a stage (renderer,
 * camera, orbit controls, HTML labels, camera fly-to), packets that travel
 * along paths, and the physical building blocks (buildings, racks, servers).
 * Loaded only when a 3D figure scrolls into view.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export { THREE };
export type V3 = [number, number, number];
export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const C = {
  azure: 0x0078d4,
  azureLight: 0x50a5ea,
  green: 0x13a10e,
  red: 0xd13438,
  amber: 0xffb900,
  purple: 0x8764b8,
  rack: 0x1f2a37,
  wall: 0xe9eef4,
  roof: 0x9fb2c6,
  steel: 0x7b8a9a,
  concrete: 0xc9d3dd,
  grass: 0xcfe3c4,
  cold: 0x4aa3ff,
  hot: 0xff6a3d,
};

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isDark = () => document.documentElement.dataset.theme === 'dark';

export function mat(color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...o });
}

/** Box whose base sits on y = 0 at the given position. */
export function box(w: number, h: number, d: number, m: THREE.Material, at: V3 = [0, 0, 0]) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(...at);
  return mesh;
}

export function cyl(r: number, h: number, m: THREE.Material, at: V3 = [0, 0, 0], seg = 20) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(...at);
  return mesh;
}

export function tube(points: THREE.Vector3[], r: number, color: number, opacity = 1) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
  const m = mat(color, { emissive: color, emissiveIntensity: 0.35, transparent: opacity < 1, opacity });
  return { mesh: new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r, 8, false), m), curve, mat: m };
}

export function arc(a: THREE.Vector3, b: THREE.Vector3, lift: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += lift;
  return new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

interface Label { el: HTMLElement; at: () => THREE.Vector3; show: boolean }
interface Flight { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t: number; ms: number }

export class Stage {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  labels: Label[] = [];
  private tickers: ((t: number, dt: number) => void)[] = [];
  private flight: Flight | null = null;
  private running = false;
  private last = 0;
  private visible = true;
  private ro: ResizeObserver;
  private io: IntersectionObserver;

  constructor(private host: HTMLElement, private labelLayer: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.prepend(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
    this.camera.position.set(90, 90, 120);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 220;
    this.controls.addEventListener('start', () => { this.flight = null; });

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a9bb0, 1.9);
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(30, 60, 25);
    this.scene.add(hemi, sun);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(host);
    this.resize();
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onTick(fn: (t: number, dt: number) => void) { this.tickers.push(fn); }

  /** Fly the camera to a position looking at a target. */
  fly(pos: V3 | THREE.Vector3, target: V3 | THREE.Vector3, ms = 1400) {
    const to = Array.isArray(pos) ? v(...pos) : pos.clone();
    const tTo = Array.isArray(target) ? v(...target) : target.clone();
    if (reducedMotion() || ms === 0) {
      this.camera.position.copy(to);
      this.controls.target.copy(tTo);
      this.flight = null;
      return;
    }
    this.flight = { from: this.camera.position.clone(), to, tFrom: this.controls.target.clone(), tTo, t: 0, ms };
  }

  label(text: string, at: V3 | THREE.Vector3 | (() => THREE.Vector3), cls = '') {
    const el = document.createElement('div');
    el.className = `d3-label ${cls}`;
    el.innerHTML = text;
    this.labelLayer.append(el);
    const fixed = Array.isArray(at) ? v(...at) : at instanceof THREE.Vector3 ? at : null;
    const lab: Label = { el, at: fixed ? () => fixed : (at as () => THREE.Vector3), show: true };
    this.labels.push(lab);
    return {
      set: (t: string) => { el.innerHTML = t; },
      show: (s: boolean) => { lab.show = s; },
      cls: (c: string, on: boolean) => el.classList.toggle(c, on),
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      if (!this.visible || document.hidden) return;
      if (this.flight) {
        const f = this.flight;
        f.t = Math.min(1, f.t + (dt * 1000) / f.ms);
        const e = f.t < 0.5 ? 4 * f.t ** 3 : 1 - (-2 * f.t + 2) ** 3 / 2;
        this.camera.position.lerpVectors(f.from, f.to, e);
        this.controls.target.lerpVectors(f.tFrom, f.tTo, e);
        if (f.t >= 1) this.flight = null;
      }
      for (const fn of this.tickers) fn(now / 1000, dt);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.placeLabels();
    };
    requestAnimationFrame(loop);
  }

  private tmp = new THREE.Vector3();
  private placeLabels() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    for (const l of this.labels) {
      if (!l.show) { l.el.style.display = 'none'; continue; }
      this.tmp.copy(l.at()).project(this.camera);
      const off = this.tmp.z > 1 || Math.abs(this.tmp.x) > 1.05 || Math.abs(this.tmp.y) > 1.05;
      l.el.style.display = off ? 'none' : '';
      if (!off) l.el.style.transform = `translate(-50%,-100%) translate(${((this.tmp.x + 1) / 2) * w}px, ${((1 - this.tmp.y) / 2) * h}px)`;
    }
  }

  dispose() {
    this.running = false;
    this.ro.disconnect();
    this.io.disconnect();
    this.renderer.dispose();
  }
}

/* ------------------------------------------------------------------ */
/* Packets: glowing dots that travel along a path                      */
/* ------------------------------------------------------------------ */

interface Packet { mesh: THREE.Mesh; curve: THREE.Curve<THREE.Vector3>; t: number; speed: number; done?: () => void; bounce?: number }

export class Packets {
  private live: Packet[] = [];
  private pool: THREE.Mesh[] = [];
  private geo: THREE.SphereGeometry;
  private mats = new Map<number, THREE.Material>();

  constructor(private stage: Stage, size = 0.35, private parent: THREE.Object3D = stage.scene) {
    this.geo = new THREE.SphereGeometry(size, 12, 10);
    stage.onTick((_, dt) => this.update(dt));
  }

  private m(color: number) {
    if (!this.mats.has(color)) this.mats.set(color, new THREE.MeshBasicMaterial({ color }));
    return this.mats.get(color)!;
  }

  /** Send a packet along a curve. `bounce` (0..1) makes it stop there and return (blocked). */
  send(curve: THREE.Curve<THREE.Vector3>, color: number, seconds = 1.6, done?: () => void, bounce?: number) {
    const mesh = this.pool.pop() ?? new THREE.Mesh(this.geo);
    mesh.material = this.m(color);
    mesh.visible = true;
    this.parent.add(mesh);
    this.live.push({ mesh, curve, t: 0, speed: 1 / seconds, done, bounce });
  }

  clear() {
    for (const p of this.live) { p.mesh.visible = false; this.pool.push(p.mesh); }
    this.live = [];
  }

  private update(dt: number) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.t += p.speed * dt;
      let at = p.t;
      if (p.bounce !== undefined && p.t > p.bounce) at = Math.max(0, 2 * p.bounce - p.t);
      if (p.t >= 1 || (p.bounce !== undefined && at <= 0 && p.t > p.bounce)) {
        p.mesh.visible = false;
        this.pool.push(p.mesh);
        this.live.splice(i, 1);
        p.done?.();
        continue;
      }
      p.curve.getPoint(at, p.mesh.position);
    }
  }
}

/** Run a function every `sec` seconds while the stage is rendering. */
export function every(stage: Stage, sec: number, fn: () => void) {
  let acc = 0;
  stage.onTick((_, dt) => { acc += dt; if (acc >= sec) { acc = 0; fn(); } });
}

/** Simple timers that only advance while the stage renders. */
export function after(stage: Stage) {
  const jobs: { at: number; fn: () => void }[] = [];
  let now = 0;
  stage.onTick((_, dt) => {
    now += dt;
    for (let i = jobs.length - 1; i >= 0; i--) if (jobs[i].at <= now) { const j = jobs.splice(i, 1)[0]; j.fn(); }
  });
  const api = (sec: number, fn: () => void) => { jobs.push({ at: now + sec, fn }); };
  api.cancelAll = () => { jobs.length = 0; };
  return api;
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

export function ground(stage: Stage, size: number, color = C.concrete) {
  const g = new THREE.Mesh(new THREE.CircleGeometry(size, 64), mat(isDark() ? 0x2a3b52 : color));
  g.rotation.x = -Math.PI / 2;
  g.position.y = -0.02;
  stage.scene.add(g);
  return g;
}

export function plate(w: number, d: number, color: number, at: V3, opacity = 1) {
  const m = mat(color, { transparent: opacity < 1, opacity });
  return box(w, 0.12, d, m, at);
}

/** A datacenter-style building whose roof can lift off and walls fade to see inside. */
export function building(w: number, d: number, h: number, at: V3, wallColor: number = C.wall) {
  const group = new THREE.Group();
  group.position.set(...at);
  const wallMat = mat(wallColor, { transparent: true, opacity: 1 });
  const walls = box(w, h, d, wallMat);
  const roofMat = mat(C.roof, { transparent: true, opacity: 1 });
  const roof = box(w + 0.4, 0.3, d + 0.4, roofMat, [0, h, 0]);
  const stripMat = mat(0x3d5a78, { transparent: true, opacity: 1 });
  const strip = box(w + 0.05, 0.5, d + 0.05, stripMat, [0, h * 0.62, 0]);
  group.add(walls, strip, roof);
  let open = 0, target = 0;
  const update = (dt: number) => {
    if (open === target) return;
    open += Math.sign(target - open) * Math.min(Math.abs(target - open), dt * 2.5);
    wallMat.opacity = 1 - open * 0.88;
    stripMat.opacity = 1 - open * 0.9;
    roofMat.opacity = 1 - open;
    roof.position.y = h + open * 4;
    roof.visible = roofMat.opacity > 0.02;
    walls.renderOrder = open > 0 ? 2 : 0;
    wallMat.depthWrite = open < 0.5;
  };
  return {
    group, walls, wallMat, w, d, h,
    setOpen(o: boolean) { target = o ? 1 : 0; if (reducedMotion()) { open = target - 0.0001; update(1); open = target; } },
    update,
  };
}

const LED_ON = new THREE.MeshBasicMaterial({ color: 0x3cff6a });
const LED_ALT = new THREE.MeshBasicMaterial({ color: 0x3cff6a });
const LED_BLUE = new THREE.MeshBasicMaterial({ color: 0x55b6ff });

/** Blink the shared server LEDs; call once per stage. */
export function blinkLeds(stage: Stage) {
  stage.onTick((t) => {
    LED_ON.color.setHex(Math.sin(t * 9) > -0.2 ? 0x3cff6a : 0x0d4d1f);
    LED_ALT.color.setHex(Math.sin(t * 13 + 1) > 0 ? 0x3cff6a : 0x0d4d1f);
    LED_BLUE.color.setHex(Math.sin(t * 6 + 2) > 0.3 ? 0x55b6ff : 0x14324d);
  });
}

/** A server rack: frame plus a stack of servers with blinking LEDs. */
export function rack(at: V3, units = 9, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(...at);
  group.rotation.y = rotY;
  const frameMat = mat(C.rack, { roughness: 0.5, metalness: 0.3 });
  group.add(box(0.8, 2.3, 1.1, frameMat));
  const servers: THREE.Group[] = [];
  const sMat = mat(0x34495e, { roughness: 0.45, metalness: 0.4 });
  const ledGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
  for (let i = 0; i < units; i++) {
    const s = new THREE.Group();
    s.position.set(0, 0.18 + i * 0.22, 0.56);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.17, 0.04), sMat);
    s.add(face);
    for (let k = 0; k < 3; k++) {
      const led = new THREE.Mesh(ledGeo, (i + k) % 3 === 0 ? LED_ALT : k === 2 ? LED_BLUE : LED_ON);
      led.position.set(0.18 + k * 0.08, 0, 0.03);
      s.add(led);
    }
    group.add(s);
    servers.push(s);
  }
  return { group, servers, frameMat };
}

/** Tint a material's emissive glow (used to highlight or fail things). */
export function glow(m: THREE.Material | THREE.Material[], color: number | null, intensity = 0.6) {
  for (const x of Array.isArray(m) ? m : [m]) {
    const s = x as THREE.MeshStandardMaterial;
    if (!s.emissive) continue;
    s.emissive.setHex(color ?? 0x000000);
    s.emissiveIntensity = color === null ? 0 : intensity;
  }
}

export function fence(stage: Stage, w: number, d: number, at: V3 = [0, 0, 0]) {
  const m = mat(C.steel, { transparent: true, opacity: 0.85 });
  const group = new THREE.Group();
  group.position.set(...at);
  const posts: V3[] = [];
  const step = 2;
  for (let x = -w / 2; x <= w / 2; x += step) posts.push([x, 0, -d / 2], [x, 0, d / 2]);
  for (let z = -d / 2 + step; z < d / 2; z += step) posts.push([-w / 2, 0, z], [w / 2, 0, z]);
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6);
  postGeo.translate(0, 0.8, 0);
  const inst = new THREE.InstancedMesh(postGeo, m, posts.length);
  const o = new THREE.Object3D();
  posts.forEach((p, i) => { o.position.set(...p); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); });
  group.add(inst);
  for (const y of [0.5, 1.5]) {
    const pts = [v(-w / 2, y, -d / 2), v(w / 2, y, -d / 2), v(w / 2, y, d / 2), v(-w / 2, y, d / 2), v(-w / 2, y, -d / 2)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x6b7b8c })));
  }
  stage.scene.add(group);
  return { group, mat: m };
}

/** A tiny person (for users, guards, engineers). */
export function person(color: number, at: V3, scale = 1) {
  const g = new THREE.Group();
  g.position.set(...at);
  g.scale.setScalar(scale);
  const m = mat(color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 10), m);
  body.position.y = 0.5;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), mat(0xf1c7a0));
  head.position.y = 1.08;
  g.add(body, head);
  return g;
}

/** A fan disc that can spin (cooling units, generators). */
export function fan(at: V3, r = 0.8) {
  const g = new THREE.Group();
  g.position.set(...at);
  const blades = new THREE.Group();
  const bm = mat(0x445566, { metalness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(r * 1.8, 0.04, 0.22), bm);
    b.rotation.y = (i * Math.PI) / 4;
    blades.add(b);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 6, 24), mat(C.steel));
  ring.rotation.x = Math.PI / 2;
  g.add(blades, ring);
  return { group: g, blades };
}

export function latLon(lat: number, lon: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return v(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
