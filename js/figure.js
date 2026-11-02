// TricepsClear's 3D models: a large anatomical arm (bones, the three heads of the triceps, the
// anconeus, ghosted elbow flexors) and a simple jointed mannequin that can push, dip and do dands.
// Shapes are stylised; positions follow standard anatomy (Gray's Anatomy 42nd ed.) and the side-
// view maths in triceps.js. Helper functions for labels and boards follow MuscleClear's muscle.js.
import { THREE, M, clamp, lerp, smooth } from './kit.js';
import { HEADS, ARM, D2R } from './triceps.js';

export const BONE = 0xe8e2d0, TENDON = 0xf1ead8, SKIN = 0xd9a47e, FLEX = 0x9a5a62;

// ---------------------------------------------------------------- label and board helpers
const TINT = { long: HEADS.long.color, lateral: HEADS.lateral.color, medial: HEADS.medial.color, red: '#ff8a8a', gold: '#ffd166', cyan: '#8ef0ff', good: '#6ee7a8', white: '#e8eef8', purple: '#c9a7ff', blue: '#9db4ff' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !inReel()) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
export function board(ct, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function panel(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.88)'; rrect(g, 0, 0, w, h, 20); g.fill(); }

// ---------------------------------------------------------------- geometry helpers
export const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.55, ...o });
export function blob(r, pos, mat, seg = 28) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(...r); m.position.set(...pos); m.castShadow = true;
  return m;
}
// A unit cylinder along +Y you can stretch between two points every frame.
const CYL = new THREE.CylinderGeometry(1, 1, 1, 18);
export function stick(r, mat) { const m = new THREE.Mesh(CYL, mat); m.castShadow = true; m.userData.r = r; return m; }
const UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
export function setStick(m, A, B, r = m.userData.r) {
  const a = V(A), b = V(B); tmp.copy(b).sub(a);
  const len = Math.max(1e-4, tmp.length());
  m.position.copy(a).addScaledVector(tmp, 0.5);
  m.quaternion.setFromUnitVectors(UP, tmp.normalize());
  m.scale.set(r, len, r);
}
// A muscle belly: a spindle of unit length along +Y, fat in the middle and tapering.
const SPINDLE = (() => {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.03 + Math.pow(Math.sin(Math.PI * t), 0.7), t - 0.5)); }
  const g = new THREE.LatheGeometry(pts, 28); g.computeVertexNormals(); return g;
})();
export function spindle(mat) { const m = new THREE.Mesh(SPINDLE, mat); m.castShadow = true; return m; }
// Place a spindle between A and B with half-width r; its flat side (flat < 1) faces `out`.
export function aim(m, A, B, r, out = [0, 0, 1], flat = 1) {
  const a = V(A), b = V(B), y = b.clone().sub(a), len = y.length(); y.normalize();
  let z = V(out); z.sub(y.clone().multiplyScalar(z.dot(y)));
  if (z.lengthSq() < 1e-6) z = new THREE.Vector3(1, 0, 0).cross(y);
  z.normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.set(r, len, r * flat);
  return m;
}
export const muscleMat = (hex) => std({ color: hex, emissive: hex, emissiveIntensity: 0.08, roughness: 0.5 });

// 2D helpers in the side-view plane
const r2 = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const P3 = (p2, z = 0) => new THREE.Vector3(p2[0], p2[1], z);

// ---------------------------------------------------------------- the anatomical arm
// One unit = 5 cm (20 per metre). The arm's root sits at the shoulder joint. We look at the
// person's RIGHT side: x forwards, y up, z towards their right (towards you).
export const AK = 20;
export function makeArm({ torso = true } = {}) {
  const group = new THREE.Group();
  const boneM = std({ color: BONE, roughness: 0.7 });
  const ghost = std({ color: SKIN, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
  const tendonM = std({ color: TENDON, roughness: 0.4 });
  const UA = ARM.upper * AK, FA = ARM.fore * AK, GRIP = ARM.grip * AK;
  // torso (ghost), head, scapula: these stay put
  const body = new THREE.Group(); group.add(body);
  if (torso) {
    body.add(blob([2.4, 6.4, 2.6], [-0.7, -5.4, -3.5], ghost), blob([1.6, 1.9, 1.5], [0.3, 3.6, -3.5], ghost), blob([0.7, 1.3, 0.7], [0, 1.6, -3.5], ghost));
  }
  const scapM = std({ color: BONE, roughness: 0.75, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.7, 0.2, -0.6, -2.0, -5.6, -2.4, -2.3, 0.9, -4.4, -0.7, 0.2, -0.6, -2.3, 0.9, -4.4, -0.2, 0.9, -1.0], 3));
  sg.computeVertexNormals();
  const scap = new THREE.Mesh(sg, scapM); body.add(scap);
  body.add(blob([0.45, 0.55, 0.45], [-0.45, -0.1, -0.35], boneM));          // glenoid rim

  // upper arm and forearm bones in a hierarchy: shoulder pivot → elbow pivot
  const sh = new THREE.Group(); group.add(sh);
  sh.add(blob([0.55, 0.55, 0.55], [0, 0, 0], boneM));                          // humeral head
  const hum = stick(0.33, boneM); setStick(hum, [0, -0.3, 0], [0, -UA + 0.3, 0]); sh.add(hum);
  sh.add(blob([0.55, 0.42, 0.85], [0, -UA + 0.1, 0], boneM));                  // condyles
  const el = new THREE.Group(); el.position.set(0, -UA, 0); sh.add(el);
  const ulna = stick(0.2, boneM); setStick(ulna, [-0.15, 0.1, -0.15], [0, -FA + 0.2, -0.25]); el.add(ulna);
  const radius = stick(0.19, boneM); setStick(radius, [0.15, -0.1, 0.2], [0.1, -FA + 0.2, 0.35]); el.add(radius);
  const olec = blob([0.42, 0.5, 0.42], [-0.45, 0.25, -0.1], boneM); el.add(olec); // olecranon, behind the joint
  const hand = blob([0.55, 1.0, 0.4], [0.05, -FA - 0.9, 0.05], std({ color: SKIN, transparent: true, opacity: 0.55 })); el.add(hand);
  const skinU = stick(1.3, ghost); setStick(skinU, [0, -0.2, 0], [0, -UA, 0]); sh.add(skinU);
  const skinF = stick(0.95, ghost); setStick(skinF, [0, 0, 0], [0, -FA, 0]); el.add(skinF);

  // muscles, rebuilt from points every frame
  const heads = {};
  for (const k of ['long', 'lateral', 'medial']) {
    const mat = muscleMat(HEADS[k].hex);
    heads[k] = { mat, belly: spindle(mat), t0: stick(0.09, tendonM), t1: stick(0.12, tendonM), t2: stick(0.14, tendonM), off: new THREE.Vector3() };
    group.add(heads[k].belly, heads[k].t0, heads[k].t1, heads[k].t2);
  }
  const ancM = muscleMat(0xc9a7ff), anc = spindle(ancM); group.add(anc);
  const flexM = std({ color: FLEX, transparent: true, opacity: 0.35, depthWrite: false });
  const bic = spindle(flexM), bicT = stick(0.1, flexM), brach = spindle(flexM); group.add(bic, bicT, brach);
  const capT = stick(0.16, tendonM); group.add(capT);                         // common tendon onto the olecranon

  // anchors for labels
  const anchors = {}; ['long', 'lateral', 'medial', 'anc', 'olec', 'bic', 'hand', 'elbow', 'scap'].forEach((k) => { anchors[k] = new THREE.Object3D(); group.add(anchors[k]); });

  let state = {};
  function pose(shoulderDeg, elbowDeg, { lengths = { long: 1, lateral: 1, medial: 1 }, act = 0, explode = 0, flexors = true } = {}) {
    const ts = shoulderDeg * D2R, te = elbowDeg * D2R;
    sh.rotation.z = ts; el.rotation.z = te;
    const u = [Math.sin(ts), -Math.cos(ts)], ph = r2(u, -Math.PI / 2);               // along and behind the humerus
    const f = [Math.sin(ts + te), -Math.cos(ts + te)], pf = r2(f, -Math.PI / 2);     // along and behind the forearm
    const at = (s, o, z = 0) => P3([u[0] * s + ph[0] * o, u[1] * s + ph[1] * o], z);
    const E = [u[0] * UA, u[1] * UA];
    const atF = (s, o, z = 0) => P3([E[0] + f[0] * s + pf[0] * o, E[1] + f[1] * s + pf[1] * o], z);
    const bis = (() => { const b = [ph[0] + pf[0], ph[1] + pf[1]], n = Math.hypot(...b) || 1; return [b[0] / n, b[1] / n]; })();
    const W = P3([E[0] + bis[0] * 0.95, E[1] + bis[1] * 0.95], 0);                     // tendon wraps behind the elbow
    const O = atF(-0.25, 0.5, -0.1);                                                    // olecranon
    const ex = smooth(explode);
    const offs = { long: P3([ph[0] * 2.4 * ex, ph[1] * 2.4 * ex], -1.6 * ex), lateral: P3([ph[0] * 1.8 * ex, ph[1] * 1.8 * ex], 2.0 * ex), medial: P3([ph[0] * 0.5 * ex, ph[1] * 0.5 * ex], 0.3 * ex) };
    const def = {
      long: { O: new THREE.Vector3(-0.55, -0.85, -0.45), A: at(1.3, 0.95, -0.45), B: at(4.7, 1.2, -0.35), r: 0.92 },
      lateral: { O: at(0.9, 0.42, 0.45), A: at(1.3, 0.75, 0.5), B: at(4.6, 1.05, 0.35), r: 0.85 },
      medial: { O: at(2.4, 0.35, 0), A: at(2.6, 0.5, 0), B: at(5.25, 0.75, 0.05), r: 0.65 },
    };
    for (const k of ['long', 'lateral', 'medial']) {
      const h = heads[k], d = def[k], o = offs[k], l = clamp(lengths[k] ?? 1, 0.5, 2);
      const A = d.A.clone().add(o), B = d.B.clone().add(o), Oo = d.O.clone().add(o), Wo = W.clone().add(o);
      // same volume: a stretched head gets slimmer, a shortened one fatter; working ones glow
      aim(h.belly, A, B, d.r * Math.sqrt(1 / l) * (1 + 0.08 * act), [ph[0], ph[1], k === 'long' ? -0.4 : k === 'lateral' ? 0.5 : 0], 0.78);
      setStick(h.t0, Oo, A, k === 'long' ? 0.12 : 0.08); setStick(h.t1, B, Wo); setStick(h.t2, Wo, ex > 0.02 ? Wo : O, 0.13);
      h.t2.visible = ex <= 0.02;
      h.mat.emissiveIntensity = 0.08 + 0.75 * act;
      anchors[k].position.copy(A).lerp(B, 0.5).add(P3([ph[0] * 0.9, ph[1] * 0.9], k === 'long' ? -0.6 : k === 'lateral' ? 0.9 : 0.4));
    }
    setStick(capT, W, O, 0.17);
    const ancA = atF(0, 0, 0.75).add(P3([ph[0] * 0.15, ph[1] * 0.15])), ancB = atF(1.5, 0.42, 0.35);
    aim(anc, ancA, ancB, 0.3, [pf[0], pf[1], 0.6], 0.6); ancM.emissiveIntensity = 0.08 + 0.5 * act;
    anchors.anc.position.copy(ancA).lerp(ancB, 0.5).add(new THREE.Vector3(0, 0, 0.8));
    anchors.olec.position.copy(O).add(P3([pf[0] * 0.5, pf[1] * 0.5], 0));
    anchors.elbow.position.copy(P3(E, 0.9));
    // flexors in front (ghosts): biceps from the shoulder blade to the radius, brachialis beneath
    const nh = [-ph[0], -ph[1]], nf = [-pf[0], -pf[1]];
    const bA = at(1.2, -0.95, 0.1), bB = at(4.6, -1.15, 0.15), bI = P3([E[0] + f[0] * 1.0 + nf[0] * 0.35, E[1] + f[1] * 1.0 + nf[1] * 0.35], 0.2);
    aim(bic, bA, bB, 0.75, [nh[0], nh[1], 0], 0.85); setStick(bicT, bB, bI);
    aim(brach, at(2.6, -0.45, 0.05), P3([E[0] + f[0] * 0.8 + nf[0] * 0.2, E[1] + f[1] * 0.8 + nf[1] * 0.2], 0), 0.55, [nh[0], nh[1], 0], 0.8);
    [bic, bicT, brach].forEach((m) => { m.visible = flexors; });
    anchors.bic.position.copy(bB).add(P3([nh[0] * 1.2, nh[1] * 1.2], 0.3));
    const Hd = [E[0] + f[0] * GRIP, E[1] + f[1] * GRIP];
    anchors.hand.position.copy(P3(Hd, 0));
    anchors.scap.position.set(-2.4, -2.6, -3.2);
    state = { E, Hd, u, f, ph, pf };
    return state;
  }
  pose(0, 30);
  return { group, heads, anc, bic, brach, hand, skinMats: [ghost], anchors, pose, get state() { return state; }, UA, FA, GRIP };
}

// A dumbbell (generic) whose plates grow with the mass, or a cable handle.
export function makeDumbbell() {
  const g = new THREE.Group();
  const plateM = std({ color: 0x3a3f4a, metalness: 0.6, roughness: 0.35 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 12), std({ color: 0xb9bec8, metalness: 0.9, roughness: 0.3 })); bar.rotation.x = Math.PI / 2; g.add(bar);
  const plates = [-1, 1].map((sz) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.35, 28), plateM); p.rotation.x = Math.PI / 2; p.position.z = sz * 1.15; p.castShadow = true; g.add(p); return p; });
  g.setMass = (kg) => plates.forEach((p) => { const r = 0.35 + 0.11 * Math.sqrt(kg); p.scale.set(r, 1, r); });
  g.setMass(5);
  return g;
}

// ---------------------------------------------------------------- the mannequin
// One unit = 10 cm. Takes a pose from triceps.js (metres, side view) and draws a simple jointed
// figure: sticks for limbs, balls for joints, an egg for the trunk, triceps on the upper arms.
export const FK = 10;
export function makeFigure({ color = 0x9aa7bd } = {}) {
  const group = new THREE.Group();
  const bodyM = std({ color, roughness: 0.6, transparent: true, opacity: 0.92 });
  const jointM = std({ color: 0xc7d0de, roughness: 0.5 });
  const triM = [muscleMat(0xff8a5c), muscleMat(0xff8a5c)];
  const trunk = blob([1, 1, 1], [0, 0, 0], bodyM); group.add(trunk);
  const pelvis = blob([1, 1, 1], [0, 0, 0], bodyM); group.add(pelvis);
  const head = blob([1.0, 1.15, 0.95], [0, 0, 0], bodyM); group.add(head);
  const neck = stick(0.45, bodyM); group.add(neck);
  const limbs = {}, joints = {};
  const L = (k, r) => { limbs[k] = stick(r, bodyM); group.add(limbs[k]); };
  const J = (k, r) => { joints[k] = blob([r, r, r], [0, 0, 0], jointM); group.add(joints[k]); };
  for (const s of ['R', 'L']) {
    L('thigh' + s, 0.68); L('shank' + s, 0.5); L('foot' + s, 0.32); L('ua' + s, 0.45); L('fa' + s, 0.36);
    J('hip' + s, 0.7); J('knee' + s, 0.55); J('ankle' + s, 0.42); J('sh' + s, 0.6); J('el' + s, 0.45); J('hand' + s, 0.42);
  }
  const tri = ['R', 'L'].map((s, i) => { const m = spindle(triM[i]); group.add(m); return m; });
  const anchors = { triR: new THREE.Object3D(), elbowR: new THREE.Object3D(), shR: new THREE.Object3D(), wristR: new THREE.Object3D(), hip: new THREE.Object3D(), hand: new THREE.Object3D() };
  Object.values(anchors).forEach((a) => group.add(a));
  const X = (p, z = 0) => new THREE.Vector3(p[0] * FK, p[1] * FK, z * FK);

  function pose(b, { act = 0, H = 1.7, flare = 0 } = {}) {
    const unit = (d) => { const n = Math.hypot(...d) || 1; return [d[0] / n, d[1] / n]; };
    const td = unit([b.S[0] - b.Hp[0], b.S[1] - b.Hp[1]]);
    const hw = 0.09 * H, kw = 0.075 * H;
    // trunk: an egg from hip to shoulder, wide across the body
    const mid = [(b.S[0] + b.Hp[0]) / 2 + td[0] * 0.02, (b.S[1] + b.Hp[1]) / 2 + td[1] * 0.02];
    const tl = Math.hypot(b.S[0] - b.Hp[0], b.S[1] - b.Hp[1]);
    trunk.position.copy(X(mid)); trunk.rotation.set(0, 0, Math.atan2(td[1], td[0]) - Math.PI / 2);
    trunk.scale.set(0.07 * H * FK, tl * 0.6 * FK, 0.11 * H * FK);
    pelvis.position.copy(X(b.Hp)); pelvis.rotation.copy(trunk.rotation); pelvis.scale.set(0.065 * H * FK, 0.06 * H * FK, 0.1 * H * FK);
    const neckBase = [b.S[0] + td[0] * 0.02, b.S[1] + td[1] * 0.02], hc = [b.S[0] + td[0] * 0.13 * H, b.S[1] + td[1] * 0.13 * H];
    setStick(neck, X(neckBase), X(hc)); head.position.copy(X(hc)); head.rotation.copy(trunk.rotation);
    for (const [s, sg] of [['R', 1], ['L', -1]]) {
      const hip = X(b.Hp, sg * hw), knee = X(b.K, sg * kw);
      const ld = unit([b.K[0] - b.Hp[0], b.K[1] - b.Hp[1]]);
      let ankle;
      if (b.ankle) ankle = X(b.ankle, sg * kw);                             // given (dips, dand)
      else if (b.knees) ankle = X([b.K[0] - 0.246 * H, 0.05], sg * kw);     // shins resting on the floor
      else if (b.P) ankle = X(b.P, sg * kw);
      else ankle = X([b.K[0] + ld[0] * 0.246 * H, b.K[1] + ld[1] * 0.246 * H], sg * kw);
      setStick(limbs['thigh' + s], hip, knee); setStick(limbs['shank' + s], knee, ankle);
      const toe = ankle.clone().add(b.knees ? new THREE.Vector3(-1.2, -0.2, 0) : b.footDir ? new THREE.Vector3(...b.footDir) : new THREE.Vector3(0.5, -0.6, 0));
      setStick(limbs['foot' + s], ankle, toe);
      joints['hip' + s].position.copy(hip); joints['knee' + s].position.copy(knee); joints['ankle' + s].position.copy(ankle);
      const S = b.S3 ? new THREE.Vector3(b.S3[0] * FK, b.S3[1] * FK, sg * b.S3[2] * FK) : X(b.S, sg * 0.115 * H);
      const E = b.E3 ? new THREE.Vector3(b.E3[0] * FK, b.E3[1] * FK, sg * b.E3[2] * FK) : X(b.E, sg * 0.14 * H);
      const Hh = b.H3 ? new THREE.Vector3(b.H3[0] * FK, b.H3[1] * FK, sg * b.H3[2] * FK) : X(b.Hd, sg * 0.14 * H);
      if (flare) E.z += sg * flare * FK;
      setStick(limbs['ua' + s], S, E); setStick(limbs['fa' + s], E, Hh);
      joints['sh' + s].position.copy(S); joints['el' + s].position.copy(E); joints['hand' + s].position.copy(Hh);
      // triceps on the back of the upper arm: the side facing away from the forearm
      const ua = E.clone().sub(S), fa = Hh.clone().sub(E);
      let back = fa.clone().sub(ua.clone().multiplyScalar(fa.dot(ua) / ua.lengthSq())).multiplyScalar(-1);
      if (back.lengthSq() < 1e-4) back = new THREE.Vector3(-td[0], -td[1], 0).sub(ua.clone().multiplyScalar(new THREE.Vector3(-td[0], -td[1], 0).dot(ua) / ua.lengthSq()));
      back.normalize();
      const m = tri[s === 'R' ? 0 : 1];
      aim(m, S.clone().lerp(E, 0.12).addScaledVector(back, 0.42), S.clone().lerp(E, 0.86).addScaledVector(back, 0.42), 0.46, [back.x, back.y, back.z], 0.8);
      if (s === 'R') { anchors.triR.position.copy(S.clone().lerp(E, 0.5).addScaledVector(back, 1.3)); anchors.elbowR.position.copy(E); anchors.shR.position.copy(S); anchors.wristR.position.copy(Hh); anchors.hand.position.copy(Hh); }
    }
    anchors.hip.position.copy(X(b.Hp, 0.12 * H));
    triM.forEach((mm) => { mm.emissiveIntensity = 0.1 + 0.9 * clamp(act, 0, 1); mm.color.setHex(act > 0.05 ? 0xff7a4a : 0xb86a5a); });
  }
  return { group, pose, anchors, joints, limbs, tri, bodyM };
}

// Props: a bench or box, parallel bars, and the akhara's soft earth pit.
export function makeBench(h, w = 6, d = 4) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(d, 0.5, w), std({ color: 0x6b7484, roughness: 0.7 }));
  top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legs = [];
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = stick(0.18, std({ color: 0x3a3f4a, metalness: 0.6 })); g.add(l); legs.push([l, x * (d / 2 - 0.4), z * (w / 2 - 0.4)]); }
  g.setHeight = (hh) => { top.position.y = hh * FK - 0.25; legs.forEach(([l, x, z]) => setStick(l, [x, 0, z], [x, Math.max(0.01, hh * FK - 0.5), z])); g.visible = hh > 0.02; };
  g.setHeight(h);
  return g;
}
export function makeBars() {
  const g = new THREE.Group(), mat = std({ color: 0xb9bec8, metalness: 0.8, roughness: 0.3 }), legM = std({ color: 0x3a3f4a, metalness: 0.6 });
  g.bars = [];
  for (const z of [-1, 1]) {
    const bar = stick(0.22, mat); g.add(bar); g.bars.push(bar);
    const l1 = stick(0.25, legM), l2 = stick(0.25, legM); g.add(l1, l2);
    bar.userData.legs = [l1, l2]; bar.userData.side = z;
  }
  g.place = (y, zHalf) => g.bars.forEach((b) => { const z = b.userData.side * zHalf; setStick(b, [-6, y, z], [6, y, z], 0.22); setStick(b.userData.legs[0], [-4.5, 0, z], [-4.5, y, z], 0.25); setStick(b.userData.legs[1], [4.5, 0, z], [4.5, y, z], 0.25); });
  return g;
}
export function makePit(r = 14) {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.4, 0.3, 64), std({ color: 0x8a5a3c, roughness: 1 }));
  soil.position.y = 0.12; soil.receiveShadow = true; g.add(soil);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.3, 0.35, 10, 80), std({ color: 0x6e4a34, roughness: 1 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.3; g.add(rim);
  return g;
}
// A gada (Indian mace): a wooden handle with a heavy round head. Generic, unbranded.
export function makeGada() {
  const g = new THREE.Group();
  const handle = stick(0.22, std({ color: 0x7a5232, roughness: 0.8 })); setStick(handle, [0, 0, 0], [0, 7, 0]); g.add(handle);
  const headM = std({ color: 0x9a6a3a, roughness: 0.6, metalness: 0.2 });
  g.add(blob([1.6, 1.8, 1.6], [0, 8.2, 0], headM), blob([0.4, 0.5, 0.4], [0, 10.1, 0], headM));
  return g;
}

export { smooth, lerp };

// Reel framing: the studio films 1080×1920 (portrait), 1920×1080 and 1000×1000. Portrait views are
// given tight; wider frames back the camera off so the model still fits.
export function reelView(stage, v) {
  const a = stage.camera.aspect, f = a < 0.8 ? 1 : a < 1.2 ? 1.6 : 2.2;
  const p = v.pos.map((x, i) => v.target[i] + (x - v.target[i]) * f);
  stage.setView(p, v.target, 1.0);
}
