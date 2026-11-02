// Chapter 2 (centrepiece 1): why arm position changes which head works, and how hard.
// The same arm as chapter 1, now with a shoulder angle, an elbow angle, a body tilt (standing,
// lying on a bench, bent over) and a resistance (a dumbbell pulls straight down; a cable pulls
// towards its pulley). Models (triceps.js):
//  - headLengths(): every head lengthens by r·Δθ as the elbow bends (r = 2.2 cm); only the long
//    head also lengthens as the arm goes up (shoulder moment arm about 1.5 cm). Percentages are
//    of an illustrative "best" length, set at elbow 60° with the arm by the side.
//  - forceLength(): a smooth bell standing in for the measured length–tension curve.
//  - elbowDemand(): torque about the elbow from the load (33 cm out) and the forearm's own weight
//    (1.5 kg, 15 cm out), in the body's own frame; triceps pull = torque / 2.2 cm.
// Evidence: Maeo et al., Eur J Sport Sci 23(7):1240–1250 (2023, online 2022): 21 untrained adults,
// one arm trained overhead and the other with the arm at the side (cable elbow extensions,
// 5 sets × 10 reps, 2 days a week, 12 weeks, MRI). Long head +28.5% vs +19.6%; lateral + medial
// +14.6% vs +10.5%; whole triceps +19.9% vs +13.9%, even though the overhead arm always used
// 34–39% lighter loads. Limits: one study, beginners, 12 weeks, only two positions compared.
// Supporting idea: training at longer muscle lengths often (not always) grows muscle more, e.g.
// Maeo et al., Med Sci Sports Exerc 53:825 (2021), seated vs lying leg curls; reviews call the
// evidence promising but still mixed (e.g. Pedrosa et al., Eur J Sport Sci 2023; Wolf et al.,
// Int J Strength Cond 2023). These two are named from memory and were not re-checked at source.
import { THREE, clamp, approach, canvasTexture } from '../kit.js';
import { makeArm, makeDumbbell, makeBench, stick, setStick, board, panel, tint, fitNarrow, compactReadout, inReel, AK , reelView } from '../figure.js';
import { headLengths, forceLength, elbowDemand, HEADS, ARM, D2R } from '../triceps.js';

const EX = {
  pushdown: { label: 'Pushdown', beta: 0, resist: 'cable', shoulder: 0, range: [0, 100], load: 15, note: 'Arm by your side: the long head is much shorter than overhead.' },
  overhead: { label: 'Overhead', beta: 0, resist: 'weight', shoulder: 170, range: [20, 140], load: 10, note: 'Arm overhead: the long head is stretched long.' },
  lying: { label: 'Lying', beta: 90, resist: 'weight', shoulder: 100, range: [10, 130], load: 10, note: 'Lying extension ("skull crusher"): the long head is fairly long.' },
  kickback: { label: 'Kickback', beta: -90, resist: 'weight', shoulder: -10, range: [0, 100], load: 5, note: 'Bent over: the load only bites as the arm straightens.' },
};
const ROOTY = { 0: 9, 90: 7.6, '-90': 9 };

function demand(s, elbow) { return elbowDemand({ shoulder: s.shoulder, elbow, load: s.load, beta: s.beta, resist: s.resist, cableDir: [0, 1] }); }

function draw(g, w, h, s) {
  panel(g, w, h);
  if (!s) return;
  // left: length–tension
  const Lx = 40, Lw = w / 2 - 70, T = 110, B = h - 80;
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('How long is each head?', Lx, 52);
  g.font = '21px sans-serif'; g.fillStyle = 'rgba(232,238,248,.6)'; g.fillText('force it can make at that length', Lx, 82);
  const xl = (l) => Lx + ((l - 0.5) / 1.2) * Lw, yf = (f) => B - f * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(Lx, T - 10); g.lineTo(Lx, B); g.lineTo(Lx + Lw, B); g.stroke();
  g.fillStyle = 'rgba(232,238,248,.55)'; g.font = '20px sans-serif';
  [['short', 0.6], ['best', 1.0], ['long', 1.5]].forEach(([t, l]) => g.fillText(t, xl(l) - 18, B + 30));
  g.fillText('muscle length →', Lx + Lw - 150, B + 58);
  g.strokeStyle = '#c9a7ff'; g.lineWidth = 5; g.beginPath();
  for (let l = 0.5; l <= 1.7; l += 0.01) { const x = xl(l), y = yf(forceLength(l)); l === 0.5 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  const L = headLengths(s.shoulder, s.elbowNow);
  ['long', 'lateral', 'medial'].forEach((k, i) => {
    const l = clamp(L[k], 0.5, 1.7);
    g.fillStyle = HEADS[k].color; g.beginPath(); g.arc(xl(l), yf(forceLength(l)), k === 'long' ? 15 : 11, 0, 7); g.fill();
    g.font = 'bold 20px sans-serif'; g.fillText(HEADS[k].name.replace(' head', ''), Math.min(xl(l) + 16, Lx + Lw - 70), yf(forceLength(l)) - 14 - i * 22 * (k === 'long' ? 0 : 1));
  });
  // right: torque demanded through the rep
  const Rx = w / 2 + 30, Rw = w / 2 - 70;
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Torque the weight asks for', Rx, 52);
  g.font = '21px sans-serif'; g.fillStyle = 'rgba(232,238,248,.6)'; g.fillText('at the elbow, through the rep', Rx, 82);
  const pts = []; let mx = 10;
  for (let e = 0; e <= 150; e += 3) { const t = demand(s, e).torque; pts.push([e, t]); mx = Math.max(mx, t); }
  mx = Math.ceil(mx / 10) * 10;
  const xe = (e) => Rx + (e / 150) * Rw, yt = (t) => B - (t / mx) * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(Rx, T - 10); g.lineTo(Rx, B); g.lineTo(Rx + Rw, B); g.stroke();
  g.fillStyle = 'rgba(232,238,248,.55)'; g.font = '20px sans-serif';
  [0, 50, 100, 150].forEach((e) => g.fillText(e + '°', xe(e) - 14, B + 30));
  g.fillText('elbow bend →', Rx + Rw - 130, B + 58);
  [0, mx].forEach((t) => g.fillText(t + ' N·m', Rx + 6, yt(t) + (t ? 22 : -8)));
  const [r0, r1] = EX[s.ex]?.range || [0, 150];
  g.fillStyle = 'rgba(255,209,102,.10)'; g.fillRect(xe(r0), T - 10, xe(r1) - xe(r0), B - T + 10);
  g.strokeStyle = '#ffd166'; g.lineWidth = 5; g.beginPath(); pts.forEach(([e, t], i) => (i ? g.lineTo(xe(e), yt(t)) : g.moveTo(xe(e), yt(t)))); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(xe(s.elbowNow), yt(demand(s, s.elbowNow).torque), 11, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,209,102,.8)'; g.font = '19px sans-serif'; g.fillText('shaded: this exercise’s range', xe(r0) + 8, T + 8);
}

const REELV = [{ pos: [0, 12.5, 13], target: [0, 12, 0] }, { pos: [-2.5, 15.5, 11], target: [-2.5, 15, 0] }];

export default {
  id: 'positions',
  short: 'Arm position',
  title: 'Arm up, long head long',
  subtitle: 'Where your upper arm points decides how stretched the long head is, and where the exercise is hardest.',
  view: { pos: [4.5, 13, 27], target: [4.5, 11.5, 0] },
  learn: `<p>All three heads straighten the elbow, but only the <b>long head</b> also crosses the shoulder. So when your arm goes <b>up overhead</b>, the long head is pulled <b>longer</b> before you even bend the elbow. With the arm by your side (a pushdown), it is much shorter.</p>
    <p>A muscle's force depends on its length: the <b>length–tension curve</b>. Too short and its filaments crowd each other, too long and they barely overlap (the sliding filaments are in <a href="/muscleclear/#sliding">MuscleClear</a>). Overhead, the long head works far out on the long side of that curve.</p>
    <p>Does that matter for growth? A 2023 study by <b>Maeo and colleagues</b> trained 21 beginners for 12 weeks, one arm overhead and the other arm by the side. The overhead arm's long head grew about <b>28%</b> against about <b>20%</b>, and the whole triceps about <b>20%</b> against <b>14%</b>, even though it lifted lighter weights. That is <b>one study</b> in beginners, so treat it as a strong hint, not a law. Training muscles at <b>long lengths</b> often helps growth in other studies too, but not every study agrees.</p>
    <p>The <b>torque</b> the exercise asks for also changes through the rep. A weight pulls straight down, so it bites hardest when your forearm is level, measured sideways from the elbow (levers are in <a href="/torqueclear/">TorqueClear</a> and <a href="/skeletonclear/#levers">SkeletonClear</a>). The triceps grips only about <b>2 cm</b> behind the elbow, so it must pull about <b>15 times</b> harder than the weight in your hand.</p>
    <p class="tip"><b>Try it:</b> pick Pushdown, then Overhead, and watch the orange long-head dot slide along the curve. Then try Kickback and see where its torque peaks.</p>`,
  terms: [
    { t: 'Length–tension curve', d: 'How much force a muscle can make at each length: most in the middle, less when very short or very long.' },
    { t: 'Two-joint muscle', d: 'A muscle that crosses two joints, like the long head (shoulder and elbow), so both joints set its length.' },
    { t: 'Training at long lengths', d: 'Choosing exercises that load a muscle while it is stretched; often, not always, linked to more growth.' },
    { t: 'Torque', d: 'Turning effect: force × its sideways distance from the joint, in newton-metres.' },
  ],
  defaults: { ex: 'pushdown', beta: 0, resist: 'cable', shoulder: 0, elbow: 60, load: 15, reps: true, labels: true },
  onChange(s, key) {
    if (key === 'ex' && EX[s.ex]) { const e = EX[s.ex]; Object.assign(s, { beta: e.beta, resist: e.resist, shoulder: e.shoulder, load: e.load }); }
    else if (key === 'shoulder' || key === 'resist') s.ex = 'free';
  },
  controls: [
    { key: 'ex', type: 'seg', label: 'Exercise', options: Object.entries(EX).map(([v, e]) => ({ v, label: e.label })), fmt: (v) => (EX[v] ? '' : 'your own') },
    { key: 'shoulder', type: 'range', label: 'Upper arm angle', min: -30, max: 180, step: 1, ends: ['behind', 'overhead'], fmt: (v) => Math.round(v) + '°', hint: '0° = by your side, 90° = straight ahead, 180° = overhead (relative to your body).' },
    { key: 'elbow', type: 'range', label: 'Elbow bend', min: 0, max: 150, step: 1, ends: ['straight', 'bent'], fmt: (v) => Math.round(v) + '°' },
    { key: 'load', type: 'range', label: 'Weight or cable', min: 0, max: 30, step: 0.5, ends: ['0 kg', '30 kg'], fmt: (v) => v + ' kg' },
    { key: 'reps', type: 'toggle', label: 'Do reps' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Why does an overhead extension stretch the long head more than a pushdown?', options: ['The weight is heavier', 'The long head also crosses the shoulder, so raising the arm lengthens it', 'The elbow bends less', 'It uses the biceps'], answer: 1, why: 'Only the long head starts on the shoulder blade. Lifting the arm overhead pulls it longer before the elbow even bends.' },
    { q: 'In Maeo and colleagues’ 2023 study, what happened in the arm trained overhead?', options: ['It grew less', 'Its triceps grew more, even with lighter weights', 'Only the biceps grew', 'Nothing changed'], answer: 1, why: 'Whole-triceps growth was about 20% versus 14%, with lighter loads overhead. It was one 12-week study in beginners.' },
    { q: 'With a dumbbell in a standing overhead extension, where is the rep hardest?', options: ['With the elbow fully straight', 'Around where the forearm is level, deep in the bend', 'It is the same everywhere', 'Only at the very start'], answer: 1, why: 'A weight pulls straight down, so its turning effect is biggest when the forearm sticks out sideways from the elbow.' },
  ],
  reel: [
    { ms: 5200, caption: 'Only the long head crosses your shoulder, so raising the arm overhead stretches it.', set: { ex: 'free', beta: 0, resist: 'weight', elbow: 90, load: 8, reps: false, labels: false }, anim: { shoulder: [0, 170] }, act: (s, inst) => inst.reel?.(0), spin: 0 },
    { ms: 5200, caption: 'Trained overhead, beginners grew about 40% more triceps in 12 weeks in one study.', set: { ex: 'overhead', beta: 0, resist: 'weight', shoulder: 170, load: 10, reps: false, labels: false }, anim: { elbow: [30, 140] }, act: (s, inst) => inst.reel?.(1), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(-1, 9, 0); stage.root.add(root);
    const tilt = new THREE.Group(); root.add(tilt);
    const arm = makeArm(); tilt.add(arm.group);
    const bell = makeDumbbell(); stage.root.add(bell);
    const cableM = new THREE.MeshStandardMaterial({ color: 0xc8ced8, metalness: 0.6, roughness: 0.3 });
    const cable = stick(0.07, cableM); stage.root.add(cable);
    const handle = stick(0.16, new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.5 })); stage.root.add(handle);
    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x6b7484, metalness: 0.5 })); pulley.rotation.x = Math.PI / 2; stage.root.add(pulley);
    const bench = makeBench(0.42, 9, 3.2); bench.rotation.y = Math.PI / 2; bench.visible = false; stage.root.add(bench);
    const ct = canvasTexture(1024, 600, draw);
    const brd = board(ct, 12.4, 7.3); brd.position.set(12.6, 6.4, -1); stage.root.add(brd);
    const L = (h, a, c) => tint(stage.label(h, [0, 0, 0], arm.anchors[a]), c);
    const labs = { long: L('Long head', 'long', 'long'), lateral: L('Lateral head', 'lateral', 'lateral'), medial: L('Medial', 'medial', 'medial') };
    const loadLab = tint(stage.label('', [0, 0, 0], stage.root), 'gold');
    const fit = fitNarrow(stage, { pos: [-1, 11, 17], target: [-1, 10, 0] });
    let elbowNow = 60, betaNow = 0, shNow = 0, ph = 0, last = '', tDraw = 1;
    const W = new THREE.Vector3();
    return compactReadout(stage, {
      reel: (i) => reelView(stage, REELV[i]),
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fit();
        brd.visible = !narrow && !inReel();
        const ex = EX[s.ex];
        if (s.reps) {
          const [a, b] = ex ? ex.range : [10, 130];
          ph += dt * 0.55;
          s.elbow = a + (b - a) * (0.5 - 0.5 * Math.cos(ph * Math.PI));
        }
        elbowNow = approach(elbowNow, s.elbow, 9, dt); shNow = approach(shNow, s.shoulder, 5, dt); betaNow = approach(betaNow, s.beta, 4, dt);
        s.elbowNow = elbowNow;
        root.position.y = approach(root.position.y, ROOTY[String(s.beta)] ?? 12.5, 4, dt);
        tilt.rotation.z = betaNow * D2R;
        const Ls = headLengths(shNow, elbowNow), d = demand({ ...s, shoulder: shNow }, elbowNow);
        const act = clamp(d.torque / 45, 0, 1);
        arm.pose(shNow, elbowNow, { lengths: Ls, act, flexors: false });
        // weight or cable at the hand
        arm.anchors.hand.getWorldPosition(W); stage.root.worldToLocal(W);
        const isCable = s.resist === 'cable';
        bell.visible = !isCable; handle.visible = cable.visible = pulley.visible = isCable;
        bell.position.copy(W); bell.setMass(Math.max(0.5, s.load));
        if (isCable) { pulley.position.set(W.x + 0.6, 24, W.z); setStick(cable, W, pulley.position); setStick(handle, W.clone().add(new THREE.Vector3(0, 0, -1.2)), W.clone().add(new THREE.Vector3(0, 0, 1.2))); }
        bench.visible = s.beta === 90 && Math.abs(betaNow - 90) < 5;
        bench.position.set(root.position.x + 5.5, 0, -3.5);
        loadLab.position.copy(W).add(new THREE.Vector3(0, isCable ? 1.6 : -2.2, 1.5));
        loadLab.element.textContent = `${s.load} kg`;
        const show = s.labels && !inReel();
        Object.values(labs).forEach((l) => { l.visible = show && !narrow; }); loadLab.visible = show;
        const key = [s.ex, s.resist, Math.round(shNow), Math.round(elbowNow), s.load, s.beta].join();
        tDraw += dt;
        if (key !== last && (tDraw > 0.1 || inReel())) { last = key; tDraw = 0; ct.redraw({ ...s, shoulder: shNow, elbowNow }); }
      },
      readout: (s) => {
        const sh = s.shoulder, el = s.elbowNow ?? s.elbow, Ls = headLengths(sh, el), d = demand(s, el);
        const pct = (k) => Math.round(Ls[k] * 100) + '%';
        return `<div class="big">Triceps pull: ${Math.round(d.force).toLocaleString('en')} N</div>
          <div class="row"><span>Torque at the elbow</span><b>${d.torque.toFixed(1)} N·m</b></div>
          <div class="row"><span>Long head length</span><b style="color:${HEADS.long.color}">${pct('long')} of best</b></div>
          <div class="row"><span>Lateral and medial</span><b style="color:${HEADS.lateral.color}">${pct('lateral')} of best</b></div>
          <small>${EX[s.ex]?.note || 'Your own position.'} Pull = ${s.load > 0 ? (d.force / (s.load * 9.81)).toFixed(0) + '× the load' : 'torque ÷ 2.2 cm'}. Lengths: illustrative model.</small>`;
      },
    });
  },
};
