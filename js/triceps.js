// TricepsClear's shared numbers and models. Pure maths, no three.js, so it can be tested in Node.
//
// Frames: everything is a side (sagittal) view. x points forwards (the way the person faces when
// standing), y points up (towards the head when standing). Angles in degrees unless named *Rad.
//
// ---------------------------------------------------------------- sources for the numbers
// Anatomy: long head from the infraglenoid tubercle of the scapula (so it crosses the shoulder),
//   lateral and medial heads from the back of the humerus either side of the radial groove, all
//   three into the olecranon of the ulna by a common tendon; radial nerve (Gray's Anatomy 42nd ed.;
//   Wikipedia "Triceps", which also notes the long head is supplied by the axillary nerve in some
//   people). Anconeus: small muscle from the lateral epicondyle to the olecranon, sometimes loosely
//   called a fourth head.
// Volumes: MRI of the dominant arm in 18 older adults (mean age 75): triceps 304 cm³, biceps 143,
//   brachialis 97, brachioradialis 42 cm³ (Vidt et al., J Biomech 45:334, 2011, table 3). So the
//   triceps is about 56% of the upper-arm muscles (triceps + biceps + brachialis), "a little over
//   half", not the two-thirds often quoted. Elbow extensors and flexors were each about 15% of the
//   whole upper limb's muscle volume (same paper, table 4).
// Elbow moment arm: the triceps acts about 2.3 cm behind the elbow (Murray et al., cadaver study
//   of 10 arms, as summarised by Kholinne et al., J Clin Med Res 10:1, 2018); MuscleClear uses
//   2.2 cm. We use 2.2 cm for all three heads.
// Long head at the shoulder: an extensor and adductor of the shoulder (cadaver tendon-excursion
//   studies). Its shoulder moment arm is about 1.5–2.5 cm in published models; we use 1.5 cm,
//   an approximation. Optimal fibre lengths about 13 cm (long head) and 11 cm (lateral, medial)
//   follow the Stanford upper-limb model (Holzbaur, Murray & Delp, Ann Biomed Eng 33:829, 2005);
//   these were not re-checked at the source, so treat the length percentages as illustrative.
// Arm segments for a 70 kg adult: upper arm 30 cm, forearm 26 cm, grip 33 cm from the elbow;
//   forearm + hand about 1.5 kg with its centre 15 cm out (de Leva, J Biomech 29:1223, 1996;
//   same numbers as MuscleClear's pairs chapter).
// Body segments (fractions of height H): ankle 0.039, knee 0.285, hip 0.530, shoulder 0.818,
//   upper arm 0.186, forearm 0.146 (Winter, Biomechanics and Motor Control of Human Movement,
//   4th ed., fig. 4.1). Mass fractions (de Leva 1996, male): head 6.94%, trunk 43.46%, upper arm
//   2.71%, forearm 1.62%, hand 0.61%, thigh 14.16%, shank 4.33%, foot 1.37% (each limb).
//   Centres of mass: thigh 41% from the hip, shank 45% from the knee (de Leva 1996).
// Push-up loads measured on force plates: regular 64% of body mass, knees 49%, hands on a 30 cm
//   box 55% and a 61 cm box 41%, feet on a 30 cm box 70% and a 61 cm box 74% (Wurm, Ebben et al.,
//   ISBS Proceedings 2010; also in J Strength Cond Res 2011). Those figures were read in search
//   summaries; the abstract we could read confirms only the order. Suprak et al. (J Strength Cond
//   Res 25:497, 2011) found more weight on the hands at the bottom than at the top.

export const D2R = Math.PI / 180;
export const G = 9.81;
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export const clampN = (v, a, b) => Math.min(b, Math.max(a, v));

export const VOL = { triceps: 304, biceps: 143, brachialis: 97, brachioradialis: 42, anconeus: 6.4 };
export const tricepsShare = () => VOL.triceps / (VOL.triceps + VOL.biceps + VOL.brachialis);

export const ARM = { upper: 0.30, fore: 0.26, grip: 0.33, massF: 1.5, comF: 0.15, rElbow: 0.022, rShoulder: 0.015 };

// ---------------------------------------------------------------- lengths of the three heads
// Fibre length relative to its best (optimal) length. Reference: elbow at 60°, arm by the side,
// where every head is set to 1.0 (illustrative). Bending the elbow lengthens all three heads by
// r·Δθ; raising the arm forwards and up (shoulder flexion) lengthens only the long head.
export const HEADS = {
  long: { name: 'Long head', Lopt: 0.13, color: '#ff8a5c', hex: 0xff8a5c },
  lateral: { name: 'Lateral head', Lopt: 0.11, color: '#ffd166', hex: 0xffd166 },
  medial: { name: 'Medial head', Lopt: 0.11, color: '#8ef0ff', hex: 0x8ef0ff },
};
export function headLengths(shoulderDeg, elbowDeg) {
  const dE = ARM.rElbow * (elbowDeg - 60) * D2R, dS = ARM.rShoulder * shoulderDeg * D2R;
  return { long: 1 + (dE + dS) / HEADS.long.Lopt, lateral: 1 + dE / HEADS.lateral.Lopt, medial: 1 + dE / HEADS.medial.Lopt };
}
// Active force–length curve, normalised: 1 at the best length, falling either side. The shape
// follows single-fibre data (Gordon, Huxley & Julian, J Physiol 184:170, 1966) scaled to whole
// muscle as a smooth bell (as in Hill-type models, e.g. Thelen, J Biomech Eng 125:70, 2003).
export const forceLength = (l) => Math.exp(-Math.pow((l - 1) / 0.45, 2));

// ---------------------------------------------------------------- torque the exercise demands
// Body tilt beta: 0 standing, +90 lying on your back (front of the body faces up), -90 bent over
// face-down (a kickback). Resistance 'weight' pulls along gravity; 'cable' pulls along the cable
// towards a pulley fixed in the room (given as a world direction).
export const gravityInBody = (betaDeg) => rot([0, -1], -betaDeg * D2R);
export function armPoints(shoulderDeg, elbowDeg) {
  const u = [Math.sin(shoulderDeg * D2R), -Math.cos(shoulderDeg * D2R)];
  const t = (shoulderDeg + elbowDeg) * D2R, f = [Math.sin(t), -Math.cos(t)];
  const E = add([0, 0], u, ARM.upper);
  return { u, f, E, Hd: add(E, f, ARM.grip), C: add(E, f, ARM.comF) };
}
// Elbow torque (N·m) that the extensors must supply, and the triceps pull that needs.
// Positive "flex" torque bends the elbow, so the triceps must resist it.
export function elbowDemand({ shoulder, elbow, load, beta = 0, resist = 'weight', cableDir = [0, 1] }) {
  const p = armPoints(shoulder, elbow), g = gravityInBody(beta);
  const r = [p.Hd[0] - p.E[0], p.Hd[1] - p.E[1]], rc = [p.C[0] - p.E[0], p.C[1] - p.E[1]];
  const dirW = resist === 'cable' ? rot(cableDir, -beta * D2R) : g;
  const F = [dirW[0] * load * G, dirW[1] * load * G], Fa = [g[0] * ARM.massF * G, g[1] * ARM.massF * G];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const flex = cross(r, F) + cross(rc, Fa);
  const torque = Math.max(0, flex);
  return { torque, flex, force: torque / ARM.rElbow, p };
}

// ---------------------------------------------------------------- the whole body pushing
// H in metres. Lengths from Winter (see top). The trunk line runs hip → shoulder; the head's
// centre sits 0.117 H beyond the shoulder along that line.
export const BODY = { H: 1.70, mass: 60 };
export const SEG = (H) => ({ ank: 0.039 * H, shank: 0.246 * H, thigh: 0.245 * H, trunk: 0.288 * H, head: 0.117 * H, ua: 0.186 * H, fa: 0.146 * H, hand: 0.05 * H });
export const MASS = { head: 0.0694, trunk: 0.4346, ua: 0.0271, fa: 0.0162, hand: 0.0061, thigh: 0.1416, shank: 0.0433, foot: 0.0137 };

// Arms are solved in 3D: shoulders and hands sit either side of the midline (z), and the elbow
// bends towards a "pole" direction: back along the body, turned outwards by the flare angle
// (elbows about 45° from the body is the usual coaching cue). Body points are [x, y]; arm points
// are [x, y, z] for the right arm (z > 0); the left arm mirrors it.
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]) };
v3.norm = (a) => { const n = v3.len(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
export function elbowIK3(S, Hd, a, b, pole) {
  const d = v3.sub(Hd, S), dist = Math.min(a + b - 1e-6, Math.max(1e-6, v3.len(d))), dh = v3.norm(d);
  let pp = v3.sub(pole, [dh[0] * v3.dot(pole, dh), dh[1] * v3.dot(pole, dh), dh[2] * v3.dot(pole, dh)]);
  pp = v3.len(pp) < 1e-6 ? [0, 0, 1] : v3.norm(pp);
  const ca = clampN((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1), sa = Math.sqrt(1 - ca * ca);
  return v3.add(v3.add(S, dh, a * ca), pp, a * sa);
}
// Elbow torque from a push P (newtons, a 3D vector) at the hand, about the elbow's hinge axis.
export function hingeTorque(S, E, Hd, F) {
  const n = v3.norm(v3.cross(v3.sub(S, E), v3.sub(Hd, E)));
  return Math.abs(v3.dot(v3.cross(v3.sub(Hd, E), F), n));
}
const angle3 = (A, B, C) => { const u = v3.sub(A, B), v = v3.sub(C, B); return Math.acos(clampN(v3.dot(u, v) / (v3.len(u) * v3.len(v)), -1, 1)) / D2R; };
export const GRIP = {
  shoulder: { label: 'Under the shoulders', back: 0, half: 0.135, flare: 45 },
  diamond: { label: 'Close (diamond)', back: 0.07, half: 0.03, flare: 25 },
  wide: { label: 'Wide', back: 0, half: 0.24, flare: 70 },
};

// A pose: pivot P (where the body rests: toes or knees), hip Hp, shoulder S, hand Hd (x, y) on its
// support. Returns the joints, the share of body weight on the hands (moment balance about the
// pivot, all segments counted), and the elbow torque and triceps pull per arm.
export function bodyLoad({ P, Hp, S, Hd, knees = false, grip = 'shoulder', H = BODY.H, mass = BODY.mass, upright = false }) {
  const L = SEG(H), gp = GRIP[grip] || GRIP.shoulder;
  const unit = (d) => { const n = Math.hypot(...d) || 1; return [d[0] / n, d[1] / n]; };
  const trunkDir = unit([S[0] - Hp[0], S[1] - Hp[1]]), legDir = unit([Hp[0] - P[0], Hp[1] - P[1]]);
  const S3 = [S[0], S[1], 0.115 * H], H3 = [Hd[0], Hd[1], gp.half * H / 1.7 + 0.02];
  const fl = gp.flare * D2R, pole = [-trunkDir[0] * Math.cos(fl), -trunkDir[1] * Math.cos(fl), Math.sin(fl)];
  const E3 = elbowIK3(S3, H3, L.ua, L.fa + L.hand, pole);
  const K = knees ? P : add(P, legDir, L.shank);
  const segs = [
    [MASS.trunk, lerp2(S, Hp, 0.5)], [MASS.head, add(S, trunkDir, L.head)],
    [2 * MASS.thigh, lerp2(Hp, K, 0.41)],
    [2 * MASS.ua, lerp2(S, E3, 0.436)], [2 * MASS.fa, lerp2(E3, Hd, 0.43 * L.fa / (L.fa + L.hand))], [2 * MASS.hand, Hd],
  ];
  if (!knees) segs.push([2 * MASS.shank, lerp2(K, P, 0.45)], [2 * MASS.foot, P]);
  const frac = upright ? 1 : clampN(segs.reduce((s, [m, c]) => s + m * (c[0] - P[0]), 0) / (Hd[0] - P[0]), 0, 1);
  const handN = frac * mass * G / 2;                       // per hand, straight up
  const elbowDeg = 180 - angle3(S3, E3, H3);               // 0 = straight
  // A locked-out elbow (within about 8° of straight) is held by the joint itself.
  const lock = clampN((elbowDeg - 4) / 8, 0, 1);
  const torque = hingeTorque(S3, E3, H3, [0, handN, 0]) * lock;
  return { P, Hp, S, Hd, E: [E3[0], E3[1]], S3, E3, H3, K, frac, handN, elbowDeg, torque, force: torque / ARM.rElbow };
}

// Push-up family. depth 0 = arms straight (top), 1 = chest a few centimetres off the floor (shoulder joints about 27 cm above the hands).
// 'incline': hands on a bench of height h; 'decline': feet on a box of height h. At the top the
// arms lean halfway between straight down and square to the body, as photographs show; that is
// what makes inclines easier and declines harder.
export function pushup(kind, depth, h = 0.45, grip = 'shoulder', H = BODY.H, mass = BODY.mass) {
  const L = SEG(H), knees = kind === 'knee';
  const P = knees ? [0, 0.05] : [0, L.ank + (kind === 'decline' ? h : 0)];
  const lineLen = knees ? L.thigh + L.trunk : L.shank + L.thigh + L.trunk;
  const hs = kind === 'incline' ? h : 0, arm = L.ua + L.fa + L.hand;
  let th = 0.4;
  for (let i = 0; i < 60; i++) { const y = P[1] + lineLen * Math.sin(th) - arm * Math.cos(th * 0.5); th += (hs + 0.02 - y) / lineLen; }
  const S0 = [P[0] + lineLen * Math.cos(th), P[1] + lineLen * Math.sin(th)];
  const Hd = [S0[0] + arm * Math.sin(th * 0.5) - (GRIP[grip] || GRIP.shoulder).back * H, hs + 0.02];
  const yTop = S0[1], yBot = hs + 0.27;
  const ys = yTop + (yBot - yTop) * clampN(depth, 0, 1);
  const th2 = Math.asin(clampN((ys - P[1]) / lineLen, -1, 1));
  const u = [Math.cos(th2), Math.sin(th2)];
  const S = add(P, u, lineLen), Hp = add(P, u, knees ? L.thigh : L.shank + L.thigh);
  return { ...bodyLoad({ P, Hp, S, Hd, knees, grip, H, mass }), bodyDeg: th2 / D2R, hs, kind };
}

// Dand (the Indian "Hindu push-up"): hips high (a pike), swoop the chest down and forwards close
// to the floor, then push up into an arch with the hips low. Phase 0 → 1 runs one rep. Feet and
// hands stay put. Key poses are shoulder and hip positions (fractions of H), hand-picked to match
// photographs and coaching descriptions; the load comes from bodyLoad().
const DAND = [
  { k: 0.0, hip: [0.30, 0.52], sh: [0.70, 0.36] },   // pike: hips high, arms in line with the back
  { k: 0.35, hip: [0.36, 0.30], sh: [0.78, 0.17] },  // knees straight, elbows bend, chest dips
  { k: 0.6, hip: [0.40, 0.17], sh: [0.92, 0.14] },   // swoop forward, chest skims the floor
  { k: 1.0, hip: [0.44, 0.15], sh: [0.90, 0.42] },   // arch: arms straight, chest up, hips low
];
export function dand(phase, H = BODY.H, mass = BODY.mass) {
  const L = SEG(H), p = ((phase % 1) + 1) % 1;
  // play forwards 0→1 then glide back to the pike, so it loops smoothly
  const q = p < 0.8 ? p / 0.8 : 1 - (p - 0.8) / 0.2;
  let i = 1; while (i < DAND.length - 1 && q > DAND[i].k) i++;
  const a = DAND[i - 1], b = DAND[i], k = clampN((q - a.k) / (b.k - a.k), 0, 1), e = k * k * (3 - 2 * k);
  const P = [0, L.ank], Hd = [0.96 * H, 0.02];
  const hipRaw = lerp2(a.hip, b.hip, e).map((v) => v * H), shRaw = lerp2(a.sh, b.sh, e).map((v) => v * H);
  // keep the segment lengths right: legs straight from P, trunk fixed length
  const lg = L.shank + L.thigh, dh = [hipRaw[0] - P[0], hipRaw[1] - P[1]], nh = Math.hypot(...dh);
  const Hp = add(P, [dh[0] / nh, dh[1] / nh], lg);
  const ds = [shRaw[0] - Hp[0], shRaw[1] - Hp[1]], ns = Math.hypot(...ds);
  let S = add(Hp, [ds[0] / ns, ds[1] / ns], L.trunk);
  const reach = Math.hypot(Hd[0] - S[0], Hd[1] - S[1]), arm = L.ua + L.fa + L.hand;
  if (reach > arm * 0.999) S = add(Hd, [(S[0] - Hd[0]) / reach, (S[1] - Hd[1]) / reach], arm * 0.999);
  return { ...bodyLoad({ P, Hp, S, Hd, H, mass }), q };
}

// Dips on parallel bars: the body hangs from the hands, so the hands carry all of it. Going down,
// the shoulders drop about 33 cm and travel a little forward of the hands, the trunk leans
// forward, and the elbows point back (flare about 15°). We report how far the upper arm has
// dropped below level, since the usual cue is to stop about where it is level with the floor.
export function dip(depth, H = BODY.H, mass = BODY.mass) {
  const L = SEG(H), d = clampN(depth, 0, 1.4), arm = L.ua + L.fa + L.hand;
  const Hd = [0, 1.35], S = [0.015 * H + 0.05 * H * d, Hd[1] + arm * 0.985 - 0.2 * H * d];
  const lean = (6 + 30 * d) * D2R;
  const Hp = add(S, [-Math.sin(lean), -Math.cos(lean)], L.trunk);
  const S3 = [S[0], S[1], 0.115 * H], H3 = [Hd[0], Hd[1], 0.14 * H];
  const fl = 15 * D2R, E3 = elbowIK3(S3, H3, L.ua, L.fa + L.hand, [-Math.cos(fl), 0, Math.sin(fl)]);
  const elbowDeg = 180 - angle3(S3, E3, H3), lock = clampN((elbowDeg - 4) / 8, 0, 1);
  const handN = mass * G / 2, torque = hingeTorque(S3, E3, H3, [0, handN, 0]) * lock;
  const upperDeg = Math.atan2(E3[1] - S3[1], Math.hypot(E3[0] - S3[0], E3[2] - S3[2])) / D2R;   // 0 = level, -90 = hanging
  return { P: null, S, Hp, Hd, E: [E3[0], E3[1]], S3, E3, H3, K: add(Hp, [0.06, -1], L.thigh), frac: 1, handN, elbowDeg, torque, force: torque / ARM.rElbow, upperDeg };
}

// ---------------------------------------------------------------- growth (shared illustrative model)
// An illustrative model, NOT a prediction for any one person, shared in spirit with BicepsClear.
// Size: G(w) = Gmax · dose(sets) · effort(RIR) · load(%1RM) · (1 − e^(−w/τ)), Gmax 40%, τ 20 weeks,
// dose = s/(s+3). Anchor: about 10 hard sets a week near failure for 12 weeks gives about +14%,
// close to the +14–20% whole-triceps growth beginners made in Maeo et al. (Eur J Sport Sci 23:1240,
// 2023; 5 sets × 2 days, 12 weeks, MRI). Dose rises with weekly sets (Schoenfeld, Ogborn & Krieger,
// J Sports Sci 35:1073, 2017: more sets, more growth, best supported up to about 10+ a week). Loads
// from about 30% to 85% of 1RM grow muscle similarly when sets go near failure (Schoenfeld et al.,
// J Strength Cond Res 31:3508, 2017); below that the evidence is thin, so the model trims it.
// Strength adds a fast early "neural" part (better recruitment and coordination) on top of size.
export function growth(weeks, sets, rir, loadPct) {
  const dose = sets / (sets + 3);
  const effort = [1, 1, 0.94, 0.85, 0.72, 0.58][clampN(Math.round(rir), 0, 5)];
  const load = loadPct >= 30 ? 1 : 0.55 + 0.45 * (loadPct - 15) / 15;
  const size = 40 * dose * effort * clampN(load, 0.4, 1) * (1 - Math.exp(-weeks / 20));
  const neural = 18 * Math.min(1, dose * 1.6) * (1 - Math.exp(-weeks / 3));
  return { size, strength: size + neural, neural };
}
// Muscle protein synthesis after one hard session, relative to rest (Phillips et al., Am J Physiol
// 273:E99, 1997, untrained adults: +112% at 3 h, +65% at 24 h, +34% at 48 h). Trained people
// return to baseline sooner, by about 36 h (MacDougall et al., Can J Appl Physiol 20:480, 1995).
export const MPS = [[0, 0], [3, 112], [24, 65], [48, 34], [72, 0]];
export function mpsAt(h) {
  for (let i = 1; i < MPS.length; i++) if (h <= MPS[i][0]) { const [a, fa] = MPS[i - 1], [b, fb] = MPS[i]; return fa + (fb - fa) * (h - a) / (b - a); }
  return 0;
}

// ---------------------------------------------------------------- protein (ICMR-NIN)
// ICMR-NIN Dietary Guidelines for Indians (2024) and Nutrient Requirements (2020): about
// 0.83 g of protein per kg of body weight a day for healthy adults, from food. The guidelines advise
// against protein powders for healthy people and note intakes above about 1.6 g/kg add no further
// muscle gain with training (as reported in press summaries of the 2024 guidelines).
export const PROTEIN = { gPerKg: 0.83, plateau: 1.6 };
