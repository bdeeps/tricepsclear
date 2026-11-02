// Chapter 4: training the triceps. A slice through the upper arm: the triceps fibres at the back
// thicken week by week (the illustrative growth() model in triceps.js), while the board plots size
// and strength over the weeks and the rise in muscle protein synthesis after one session.
// Growth in depth (motor units, tension, satellite cells) is BicepsClear's chapter; here it is
// summarised and linked. Sources:
//  - WHO guidelines on physical activity and sedentary behaviour (2020; Bull et al., Br J Sports
//    Med 54:1451): muscle-strengthening on 2 or more days a week for adults; older adults also
//    balance and strength on 3 or more days. NHS (2024–26 pages): all major muscle groups on at
//    least 2 days; 8–12 reps per set, at least 2 sets, to the point where another rep is hard;
//    start gradually and build up over weeks.
//  - Volume: Schoenfeld, Ogborn & Krieger, J Sports Sci 35:1073 (2017): more weekly sets, more
//    growth; best supported up to about 10+ sets per muscle per week.
//  - Load: Schoenfeld, Grgic, Ogborn & Krieger, J Strength Cond Res 31:3508 (2017): low (≤60% 1RM)
//    and high loads grew muscle similarly when sets went to failure; heavy loads built more 1RM
//    strength.
//  - Protein synthesis: Phillips et al., Am J Physiol 273:E99 (1997), +112% at 3 h, +65% at 24 h,
//    +34% at 48 h in untrained people; MacDougall et al., Can J Appl Physiol 20:480 (1995), back
//    near baseline by 36 h in trained men.
//  - Protein: ICMR-NIN Dietary Guidelines for Indians (2024): about 0.83 g per kg body weight per
//    day for healthy adults, from food; advises against protein powders for healthy people.
//    FSSAI regulates protein powders as health supplements (foods), which may not claim to cure.
//  - Spot reduction: Kostek et al., Med Sci Sports Exerc 39:1177 (2007): 104 adults trained one
//    arm for 12 weeks; MRI found fat under the skin fell about equally in both arms.
//  - Maeo et al. 2023 (see chapter 2) anchors the model: +14–20% whole-triceps volume in 12 weeks.
import { THREE, clamp, approach, canvasTexture, swarm } from '../kit.js';
import { board, panel, tint, fitNarrow, compactReadout, inReel, blob, muscleMat, BONE , reelView } from '../figure.js';
import { growth, mpsAt, PROTEIN } from '../triceps.js';

function draw(g, w, h, s) {
  panel(g, w, h);
  if (!s) return;
  const half = w * 0.56;
  // left: weeks model
  const L = 80, R = half - 30, T = 100, B = h - 70;
  g.fillStyle = '#e8eef8'; g.font = 'bold 28px sans-serif'; g.fillText('Over the weeks', 34, 48);
  g.font = '19px sans-serif'; g.fillStyle = 'rgba(232,238,248,.6)'; g.fillText('illustrative model, not a prediction', 34, 76);
  const ymax = 50, x = (wk) => L + (wk / 24) * (R - L), y = (v) => B - (v / ymax) * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(L, T - 10); g.lineTo(L, B); g.lineTo(R, B); g.stroke();
  g.fillStyle = 'rgba(232,238,248,.55)'; g.font = '19px sans-serif';
  [0, 6, 12, 18, 24].forEach((wk) => g.fillText(wk, x(wk) - 8, B + 26)); g.fillText('weeks', R - 56, B + 52);
  [0, 25, 50].forEach((v) => g.fillText('+' + v + '%', 14, y(v) + 6));
  const line = (f, col) => { g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); for (let wk = 0; wk <= 24; wk += 0.5) { const v = f(growth(wk, s.sets, s.rir, s.load)); wk ? g.lineTo(x(wk), y(v)) : g.moveTo(x(wk), y(v)); } g.stroke(); };
  line((r) => r.strength, '#ffd166'); line((r) => r.size, '#ff8a5c');
  const now = growth(s.weeks, s.sets, s.rir, s.load);
  g.fillStyle = '#fff'; [now.size, now.strength].forEach((v) => { g.beginPath(); g.arc(x(s.weeks), y(v), 9, 0, 7); g.fill(); });
  g.font = 'bold 20px sans-serif'; g.fillStyle = '#ffd166'; g.fillText('strength', x(20) - 30, y(growth(20, s.sets, s.rir, s.load).strength) - 12);
  g.fillStyle = '#ff8a5c'; g.fillText('muscle size', x(20) - 40, y(growth(20, s.sets, s.rir, s.load).size) + 30);
  // the Maeo et al. anchor: whole triceps +14–20% at 12 weeks
  g.strokeStyle = 'rgba(142,240,255,.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x(12), y(13.9)); g.lineTo(x(12), y(19.9)); g.stroke();
  g.fillStyle = '#8ef0ff'; g.font = '17px sans-serif'; g.fillText('a real study', x(12) + 8, y(22));
  // right: one session's protein synthesis
  const L2 = half + 50, R2 = w - 34;
  g.fillStyle = '#e8eef8'; g.font = 'bold 28px sans-serif'; g.fillText('After one session', half + 20, 48);
  g.font = '19px sans-serif'; g.fillStyle = 'rgba(232,238,248,.6)'; g.fillText('muscle building rate above rest', half + 20, 76);
  const x2 = (hr) => L2 + (hr / 72) * (R2 - L2), y2 = (v) => B - (v / 120) * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(L2, T - 10); g.lineTo(L2, B); g.lineTo(R2, B); g.stroke();
  g.fillStyle = 'rgba(232,238,248,.55)'; [0, 24, 48, 72].forEach((hr) => g.fillText(hr + ' h', x2(hr) - 14, B + 26));
  g.fillStyle = 'rgba(110,231,168,.25)'; g.beginPath(); g.moveTo(x2(0), y2(0));
  for (let hr = 0; hr <= 72; hr += 1) g.lineTo(x2(hr), y2(mpsAt(hr))); g.lineTo(x2(72), y2(0)); g.closePath(); g.fill();
  g.strokeStyle = '#6ee7a8'; g.lineWidth = 4; g.beginPath(); for (let hr = 0; hr <= 72; hr += 1) (hr ? g.lineTo(x2(hr), y2(mpsAt(hr))) : g.moveTo(x2(hr), y2(0))); g.stroke();
  g.fillStyle = '#6ee7a8'; g.font = 'bold 19px sans-serif'; g.fillText('+112% at 3 h', x2(5), y2(112) + 4); g.fillText('+34% at 48 h', x2(40), y2(34) - 14);
  g.fillStyle = 'rgba(232,238,248,.5)'; g.font = '16px sans-serif'; g.fillText('beginners, Phillips et al. 1997', L2, h - 18);
}

const REELV = [{ pos: [-3.2, 4.5, 8.5], target: [-3.2, 4, 0] }];

export default {
  id: 'training',
  short: 'Training it',
  title: 'How the triceps grows',
  subtitle: 'Hard sets, enough of them, week after week, with food and sleep.',
  view: { pos: [3, 5.5, 20], target: [3, 5.6, 0] },
  learn: `<p><b>Growth in brief</b> (the full story is in BicepsClear, <a href="/bicepsclear/">/bicepsclear/</a>): when a set gets <b>hard</b>, your nervous system recruits more and bigger motor units, and the <b>tension</b> on the fibres signals them to build. For a day or two after a session the muscle makes protein faster than usual. Over <b>weeks</b>, each fibre gets thicker. In the first weeks most strength comes from the <b>nerves</b> learning the move, so you get stronger before you look different.</p>
    <p><b>What the evidence supports.</b> Train each muscle on <b>2 or more days</b> a week (WHO, NHS). Take sets close to failure: stop with about <b>0–3 reps in reserve</b>. More weekly sets give more growth, with good support for about <b>10 or more hard sets</b> per muscle a week. Weights from about <b>30% to 85%</b> of your one-rep max grow muscle similarly if the sets are hard, so light and heavy both work; heavy builds more maximum strength. Add a rep or a little weight when it gets easier: <b>progressive overload</b>.</p>
    <p>For the triceps, mix an <b>overhead</b> extension (long head stretched) with a <b>pressing</b> move (push-ups, dips, close-grip press) and a <b>pushdown</b>. Cues: keep the upper arm still in extensions, move only at the elbow, lower slowly, straighten fully without slamming the joint.</p>
    <p><b>Food.</b> ICMR-NIN's 2024 guidelines put adult needs at about <b>0.83 g of protein per kg</b> a day, from dal, milk and curd, eggs, fish, meat, soy, nuts. They advise <b>against protein powders</b> for healthy people; FSSAI treats them as food supplements, not medicines. Spread protein over your meals and sleep well.</p>
    <p><b>Myths.</b> Triceps exercises do not burn the fat on the back of your arm: training one arm for 12 weeks cut fat about equally in <b>both</b> arms (Kostek et al., 2007). Light weights do not "tone" while heavy ones "bulk": hard sets build muscle at either. Women do not suddenly get bulky. Genes and age change how fast you grow, not whether you can.</p>
    <p class="tip"><b>Try it:</b> set weekly sets to 0, then 4, 10 and 16, and play the weeks. Then leave lots of reps in reserve and see the curve flatten.</p>`,
  terms: [
    { t: 'Hypertrophy', d: 'Muscle growth: each fibre gets thicker with more contractile protein.' },
    { t: 'Reps in reserve', d: 'How many more reps you could have done when you stopped the set.' },
    { t: 'Progressive overload', d: 'Gradually asking more of a muscle: more reps, more weight or more sets.' },
    { t: 'Neural gains', d: 'Early strength from the nervous system learning to use the muscle, before it grows.' },
    { t: 'Spot reduction', d: 'The myth that exercising one body part burns the fat over it.' },
  ],
  defaults: { weeks: 12, sets: 10, rir: 1, load: 70, mass: 60, play: false },
  controls: [
    { key: 'weeks', type: 'range', label: 'Weeks of training', min: 0, max: 24, step: 0.1, ends: ['0', '24 weeks'], fmt: (v) => Math.round(v) + ' weeks' },
    { key: 'sets', type: 'range', label: 'Hard sets per week (triceps)', min: 0, max: 20, step: 1, ends: ['0', '20'], fmt: (v) => v + ' sets' },
    { key: 'rir', type: 'range', label: 'Reps left in reserve', min: 0, max: 5, step: 1, ends: ['to failure', '5 left'], fmt: (v) => v },
    { key: 'load', type: 'range', label: 'Weight, % of one-rep max', min: 20, max: 90, step: 1, ends: ['20%', '90%'], fmt: (v) => v + '%' },
    { key: 'mass', type: 'range', label: 'Your body mass (for protein)', min: 35, max: 110, step: 1, ends: ['35 kg', '110 kg'], fmt: (v) => v + ' kg' },
    { key: 'play', type: 'toggle', label: 'Play the weeks' },
  ],
  onChange(s, key) { if (key === 'weeks') s.play = false; },
  quiz: [
    { q: 'In the first few weeks of training, where does most of the strength gain come from?', options: ['Bigger muscle fibres', 'The nervous system learning to use the muscle', 'More bones', 'Protein powder'], answer: 1, why: 'Early gains are mostly neural: better recruitment and coordination. Visible growth takes weeks to months.' },
    { q: 'Which statement fits the evidence on weight and growth?', options: ['Only very heavy weights build muscle', 'Light weights only tone', 'Loads from about 30% to 85% of max grow muscle similarly if sets are hard', 'Weight does not matter at all, even for easy sets'], answer: 2, why: 'A 2017 meta-analysis found similar growth with low and high loads when sets went to failure; heavy loads built more maximum strength.' },
    { q: 'Do triceps exercises burn the fat on the back of the arm?', options: ['Yes, that is how toning works', 'No: fat loss happens across the body, not where you exercise', 'Only with light weights', 'Only in women'], answer: 1, why: 'Training one arm for 12 weeks cut fat about equally in both arms. Spot reduction is a myth.' },
  ],
  reel: [
    { ms: 5200, caption: 'Hard sets week after week thicken every fibre; strength comes first from your nerves.', set: { sets: 10, rir: 1, load: 70, play: false }, anim: { weeks: [0, 24] }, act: (s, inst) => inst.reel?.(0), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(-3.2, 4.0, 0); stage.root.add(root);
    // a slice of upper arm, cut face towards you: back of the arm (triceps) at the top
    const skin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 2.2, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0xd9a47e, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
    skin.rotation.x = Math.PI / 2; root.add(skin);
    const fat = new THREE.Mesh(new THREE.RingGeometry(3.7, 4.2, 64), new THREE.MeshStandardMaterial({ color: 0xf2d38a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    fat.position.z = 1.1; root.add(fat);
    const bone = blob([0.75, 0.75, 1.1], [0, -0.4, 0], new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.7 })); root.add(bone);
    const marrow = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshStandardMaterial({ color: 0xc98a5a })); marrow.position.set(0, -0.4, 1.12); root.add(marrow);
    // fibres: triceps (back, top) and flexors (front, bottom), as short parallel rods
    const geo = new THREE.CylinderGeometry(1, 1, 2, 10); geo.rotateX(Math.PI / 2);
    const tri = [], flex = [];
    for (let i = 0; i < 900 && (tri.length < 230 || flex.length < 130); i++) {
      const a = (i * 2.399963) % (Math.PI * 2), r = 1.15 + 2.35 * Math.sqrt(((i * 0.7548776662 + 0.31) % 1));
      const p = [r * Math.cos(a), r * Math.sin(a) - 0.2];
      if (Math.hypot(p[0], p[1] + 0.2) > 3.55) continue;
      if (p[1] > 0.15 && tri.length < 230) tri.push(p); else if (p[1] < -0.75 && flex.length < 130) flex.push(p);
    }
    const triS = swarm(tri.length, geo, muscleMat(0xff8a5c)), flexS = swarm(flex.length, geo, new THREE.MeshStandardMaterial({ color: 0x9a5a62, roughness: 0.6 }));
    root.add(triS, flexS);
    flex.forEach((p, i) => flexS.place(i, [p[0], p[1], 0], null, 0.15)); flexS.done();
    const ct = canvasTexture(1100, 560, draw);
    const brd = board(ct, 11.2, 5.7); brd.position.set(8.4, 3.6, -1); stage.root.add(brd);
    const labs = [tint(stage.label('Triceps (back of arm)', [0, 4.6, 1], root), 'long'), tint(stage.label('Biceps and brachialis (front)', [0, -4.7, 1], root), 'red'), tint(stage.label('Humerus', [1.4, -0.4, 1.2], root), 'white'), tint(stage.label('Fat under the skin', [-4.2, -2.8, 1], root), 'gold')];
    const fit = fitNarrow(stage, { pos: [-3.2, 4.4, 9.5], target: [-3.2, 3.4, 0] });
    let grownShown = -1, wk = 12, lastKey = '', tDraw = 1;
    return compactReadout(stage, {
      reel: (i) => reelView(stage, REELV[i]),
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fit();
        brd.visible = !narrow && !inReel();
        if (s.play) { s.weeks += dt * 3; if (s.weeks > 24) s.weeks = 0; }
        wk = approach(wk, s.weeks, 6, dt);
        const g = growth(wk, s.sets, s.rir, s.load);
        const k = Math.sqrt(1 + g.size / 100);                         // cross-section grows with size
        if (Math.abs(k - grownShown) > 0.001) {
          grownShown = k;
          tri.forEach((p, i) => { const c = [p[0] * (0.92 + 0.08 * k), (p[1] - 0.15) * k + 0.15]; triS.place(i, [c[0], c[1], 0], null, 0.15 * k); }); triS.done();
          // fat ring loses a little everywhere in the model only if you train; it stays even (no spot reduction)
        }
        triS.material.emissiveIntensity = 0.1 + 0.4 * clamp(g.size / 30, 0, 1);
        root.rotation.y = -0.35;
        tDraw += dt;
        const key = [s.sets, s.rir, s.load, Math.round(s.weeks * 4)].join();
        if (key !== lastKey && (tDraw > 0.12 || inReel())) { lastKey = key; tDraw = 0; ct.redraw(s); }
        labs.forEach((l) => { l.visible = !inReel() && !narrow; });
      },
      readout: (s) => {
        const g = growth(s.weeks, s.sets, s.rir, s.load), prot = PROTEIN.gPerKg * s.mass;
        return `<div class="big">Triceps size: +${g.size.toFixed(0)}%</div>
          <div class="row"><span>Strength</span><b>+${g.strength.toFixed(0)}%</b></div>
          <div class="row"><span>of which from nerves</span><b>+${g.neural.toFixed(0)}%</b></div>
          <div class="row"><span>Protein (ICMR-NIN)</span><b>about ${Math.round(prot)} g a day</b></div>
          <small>Illustrative model for a beginner, not a prediction. Real gains vary a lot between people.</small>`;
      },
    });
  },
};
