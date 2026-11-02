// Chapter 3 (centrepiece 2): pushing your own body. A jointed mannequin does push-ups (full, on
// the knees, hands on a bench, feet on a box), the dand, and dips. For each pose triceps.js works
// out (1) the share of body weight on the hands by balancing turning effects about the toes (or
// knees), counting every body segment (de Leva 1996 masses, Winter lengths), and (2) the elbow
// torque per arm from that hand force about the elbow's hinge, solved in 3D with elbows about 45°
// out from the body; triceps pull = torque / 2.2 cm.
// Check against measurement (force plates; Wurm, Ebben et al., ISBS 2010 / J Strength Cond Res
// 2011, figures read in search summaries): push-up 64% of body mass, knees 49%, hands on a 30 cm box
// 55% and 61 cm 41%, feet on a 30 cm box 70% and 61 cm 74%. Our rigid model gives about 62%, 45%,
// 57%, 49%, 66% and 69% at the top: within about 5 points, except the steepest incline (8 points).
// Suprak et al. (J Strength Cond Res 25:497, 2011): more weight on the hands at the bottom than at
// the top. Elbow torques are a rough model (they assume the hands push straight down; real hands
// also push sideways and backwards), so read them as comparisons, not exact values.
// Dand: Wikipedia "Hindu push-up" (described in Indian wrestling since at least the 19th century).
import { THREE, clamp, approach, canvasTexture } from '../kit.js';
import { makeFigure, makeBench, makeBars, board, panel, tint, fitNarrow, compactReadout, inReel , reelView } from '../figure.js';
import { pushup, dand, dip, BODY, G } from '../triceps.js';

const EX = {
  pushup: { label: 'Push-up', short: 'Push-up' },
  knee: { label: 'Knees', short: 'On knees' },
  incline: { label: 'Incline', short: 'Hands on bench' },
  decline: { label: 'Feet up', short: 'Feet on box' },
  dand: { label: 'Dand', short: 'Dand' },
  dip: { label: 'Dips', short: 'Dips' },
};
const MEASURED = { pushup: 64, knee: 49 };
const VIEWS = { floor: { pos: [3, 8, 24], target: [3, 6, 0] }, dip: { pos: [-4.5, 13, 27], target: [-4, 11.5, 0] } };

function solve(ex, depth, h, mass) {
  if (ex === 'dand') return dand(depth, BODY.H, mass);
  if (ex === 'dip') return dip(depth, BODY.H, mass);
  return pushup(ex, depth, h, 'shoulder', BODY.H, mass);
}

function draw(g, w, h, s) {
  panel(g, w, h);
  if (!s) return;
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('How much of you do your hands carry?', 34, 52);
  g.font = '20px sans-serif'; g.fillStyle = 'rgba(232,238,248,.6)'; g.fillText('bar: at the bottom · tick: at the top · dot: measured', 34, 82);
  const rows = ['knee', 'incline', 'pushup', 'decline', 'dand', 'dip'];
  const L = 230, R = w - 90, T = 112, rh = (h - T - 30) / rows.length;
  rows.forEach((k, i) => {
    const y = T + i * rh, on = k === s.ex;
    let top, bot;
    if (k === 'dand') { let mx = 0; for (let p = 0; p < 0.8; p += 0.04) mx = Math.max(mx, dand(p).frac); top = dand(0).frac; bot = mx; }
    else if (k === 'dip') { top = bot = 1; }
    else { top = pushup(k, 0, 0.45).frac; bot = pushup(k, 1, 0.45).frac; }
    g.fillStyle = on ? '#ffd166' : 'rgba(232,238,248,.75)'; g.font = (on ? 'bold ' : '') + '24px sans-serif';
    g.fillText(EX[k].short, 34, y + rh * 0.62);
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(L, y + rh * 0.2, R - L, rh * 0.55);
    g.fillStyle = on ? '#ff8a5c' : 'rgba(255,138,92,.45)'; g.fillRect(L, y + rh * 0.2, (R - L) * bot, rh * 0.55);
    g.fillStyle = '#e8eef8'; g.fillRect(L + (R - L) * top - 2, y + rh * 0.1, 4, rh * 0.75);
    if (MEASURED[k]) { g.fillStyle = '#8ef0ff'; g.beginPath(); g.arc(L + (R - L) * MEASURED[k] / 100, y + rh * 0.475, 8, 0, 7); g.fill(); }
    g.fillStyle = '#e8eef8'; g.font = '21px sans-serif'; g.fillText(Math.round(bot * 100) + '%', Math.min(R + 8, L + (R - L) * bot + 8), y + rh * 0.62);
  });
  g.fillStyle = 'rgba(232,238,248,.5)'; g.font = '18px sans-serif'; g.fillText('incline and feet-up use a 45 cm bench', 34, h - 14);
}

const REELV = [{ pos: [10.5, 8, 13], target: [2.5, 3.5, 0] }, { pos: [11, 8.5, 12], target: [3, 3.5, 0] }];

export default {
  id: 'pushing',
  short: 'Pushing',
  title: 'Push-ups, dands and dips',
  subtitle: 'Your own body is the weight. How you place it decides how much your arms must push.',
  view: VIEWS.floor,
  learn: `<p>In a <b>push-up</b> your body is a long plank that pivots on your toes. Your hands hold up the head end, your toes the rest. Balance the turning effects about the toes and the hands carry about <b>two-thirds</b> of your weight: force plates measured about <b>64%</b>, and our model gets close.</p>
    <p>That gives you a ladder. On your <b>knees</b> the pivot moves closer, so the hands carry less (about half). With your hands on a <b>bench</b>, your body stands up more and the share falls further. With your <b>feet up</b> on a box it rises towards three-quarters. <b>Dips</b> on parallel bars carry all of you.</p>
    <p>The <b>dand</b>, the "Hindu push-up" of Indian <b>akharas</b>, starts with hips high, swoops the chest down and forward close to the floor, then arches up with straight arms. The load on the hands changes all the way through, and the elbows bend and straighten under it.</p>
    <p>Why the <b>triceps</b>? At the bottom your elbows are bent, and the floor pushes up on your hands some way from the elbow. That makes a <b>torque</b> that tries to bend the elbow more. Only the elbow straighteners can resist it, and the triceps grips just 2 cm behind the joint, so it pulls with well over a thousand newtons. Your chest and shoulders do much of the rest (see ShouldersClear, <a href="/shouldersclear/">/shouldersclear/</a>). In <b>close-grip bench presses</b> and <b>pushdowns</b> the load is the bar or the cable instead of your body.</p>
    <p class="tip"><b>Try it:</b> step through Knees, Incline, Push-up and Feet up with the depth slider at the bottom, and watch the share climb. Then play the dand.</p>`,
  terms: [
    { t: 'Pivot', d: 'The point the body turns about: your toes in a push-up, your knees in a knee push-up.' },
    { t: 'Dand', d: 'The flowing Indian push-up of wrestlers’ akharas: hips high, swoop low, arch up.' },
    { t: 'Dips', d: 'Lowering and pushing your whole body up between parallel bars by bending and straightening the elbows.' },
    { t: 'Progression', d: 'Moving to a slightly harder version as you get stronger: wall, bench, knees, floor, feet up.' },
  ],
  defaults: { ex: 'pushup', depth: 0.6, h: 0.45, mass: 60, reps: true, labels: true },
  controls: [
    { key: 'ex', type: 'seg', label: 'Exercise', options: Object.entries(EX).map(([v, e]) => ({ v, label: e.label })) },
    { key: 'depth', type: 'range', label: 'How far down (or dand phase)', min: 0, max: 1, step: 0.01, ends: ['top', 'bottom'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'h', type: 'range', label: 'Bench or box height', min: 0.15, max: 0.9, step: 0.01, ends: ['15 cm', '90 cm'], fmt: (v) => Math.round(v * 100) + ' cm', hint: 'For the incline and feet-up versions.' },
    { key: 'mass', type: 'range', label: 'Body mass', min: 35, max: 110, step: 1, ends: ['35 kg', '110 kg'], fmt: (v) => v + ' kg' },
    { key: 'reps', type: 'toggle', label: 'Do reps' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  onChange(s, key) { if (key === 'depth') s.reps = false; },
  quiz: [
    { q: 'In a normal push-up, roughly how much of your body weight do your hands carry?', options: ['About 10%', 'About two-thirds', 'All of it', 'Exactly half'], answer: 1, why: 'The toes are the pivot and your centre of mass sits nearer the hands, so they carry roughly 60–70%. Force plates measured about 64%.' },
    { q: 'Which change makes a push-up easier?', options: ['Putting your feet on a box', 'Putting your hands on a bench', 'Going lower', 'Adding a backpack'], answer: 1, why: 'Hands on a bench tilt your body up, so the hands carry a smaller share of your weight.' },
    { q: 'Why does a push-up work the triceps hardest near the bottom?', options: ['Because the floor is closer', 'The bent elbow puts the hand’s push further from the joint, so the torque is bigger', 'Because you breathe out', 'It doesn’t'], answer: 1, why: 'With the elbow bent, the upward push on the hand acts well away from the elbow, so the triceps must resist a large bending torque.' },
  ],
  reel: [
    { ms: 5200, caption: 'In a push-up your toes are the pivot, and your hands carry about two-thirds of you.', set: { ex: 'pushup', h: 0.45, mass: 60, reps: false, labels: false }, anim: { depth: [0, 1] }, act: (s, inst) => inst.reel?.(0), spin: 0 },
    { ms: 5600, caption: 'The dand of Indian akharas swoops low and arches up, loading the arms all the way.', set: { ex: 'dand', h: 0.45, mass: 60, reps: false, labels: false }, anim: { depth: [0, 0.8] }, act: (s, inst) => inst.reel?.(1), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(-6.5, 0, 0); stage.root.add(root);
    const fig = makeFigure(); root.add(fig.group);
    const bench = makeBench(0.45, 6, 3.4); root.add(bench);
    const box = makeBench(0.45, 6, 2.6); root.add(box);
    const bars = makeBars(); root.add(bars);
    const ct = canvasTexture(1024, 620, draw);
    const brd = board(ct, 10, 6.05); brd.position.set(9.6, 12.6, -3); stage.root.add(brd);
    const L = (h, a, c) => tint(stage.label(h, [0, 0, 0], fig.anchors[a]), c);
    const labs = { tri: L('Triceps', 'triR', 'long'), hand: L('', 'hand', 'gold') };
    const pivotLab = tint(stage.label('Pivot', [0, 0, 0], root), 'cyan');
    const fit = fitNarrow(stage, { pos: [12, 9, 17], target: [2.5, 3.5, 0] });
    let ph = 0, cur = null, lastEx = '', lastKey = '', tDraw = 1, lastView = 'floor';
    const api = {
      reel: (i) => reelView(stage, REELV[i]),
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fit();
        if (s.reps) { ph += dt * (s.ex === 'dand' ? 0.28 : 0.45); s.depth = s.ex === 'dand' ? ph % 1 : 0.5 - 0.5 * Math.cos(ph * Math.PI); }
        cur = solve(s.ex, s.depth, s.h, s.mass);
        const isDip = s.ex === 'dip';
        // dips: the figure hangs between the bars; push-ups: on the floor, bench or box
        const pose = { ...cur };
        if (isDip) pose.ankle = [cur.K[0] - 0.36, cur.K[1] - 0.25];
        root.position.x = isDip ? 2.5 : -6.5;
        if (s.ex === 'dand') pose.P = [cur.P[0], cur.P[1]];
        fig.pose(pose, { act: clamp(cur.force / 2500, 0, 1), H: BODY.H });
        bench.visible = s.ex === 'incline'; box.visible = s.ex === 'decline'; bars.visible = isDip;
        if (bench.visible) { bench.setHeight(s.h - 0.02); bench.position.set(cur.Hd[0] * 10, 0, 0); }
        if (box.visible) { box.setHeight(s.h); box.position.set(cur.P[0] * 10, 0, 0); }
        if (isDip) bars.place(cur.Hd[1] * 10 - 0.25, cur.H3[2] * 10 + 0.2);
        const vk = isDip ? 'dip' : 'floor';
        if (vk !== lastView && !inReel()) { lastView = vk; stage.setView(VIEWS[vk].pos, VIEWS[vk].target, 0.8); }
        if (s.ex !== lastEx) { lastEx = s.ex; }
        const show = s.labels && !inReel();
        labs.tri.visible = show; labs.hand.visible = show && !narrow;
        labs.hand.element.textContent = `${Math.round(cur.handN)} N per hand`;
        pivotLab.visible = show && !isDip && !narrow;
        if (cur.P) pivotLab.position.set(cur.P[0] * 10, cur.P[1] * 10 - 1.2, 1.5);
        brd.visible = !narrow && !isDip && !inReel();
        tDraw += dt;
        const key = [s.ex, s.h.toFixed(2)].join();
        if (key !== lastKey && (tDraw > 0.15 || inReel())) { lastKey = key; tDraw = 0; ct.redraw(s); }
      },
      readout: (s) => {
        const r = cur || solve(s.ex, s.depth, s.h, s.mass);
        const kg = r.frac * s.mass;
        return `<div class="big">Hands carry ${Math.round(r.frac * 100)}% of you</div>
          <div class="row"><span>That is</span><b>${kg.toFixed(0)} kg of your ${s.mass} kg</b></div>
          <div class="row"><span>Triceps pull, each arm</span><b>${Math.round(r.force).toLocaleString('en')} N</b></div>
          <div class="row"><span>Elbow torque, each arm</span><b>${r.torque.toFixed(0)} N·m</b></div>
          <div class="row"><span>Elbow bend</span><b>${Math.round(r.elbowDeg)}°</b></div>
          <small>${r.elbowDeg < 12 ? 'Arms locked straight: the bones take the load and the triceps can rest.' : (s.ex === 'dip' ? 'Rough model: the bars push straight up, elbows pointing back.' : 'Rough model: the hands push straight down, elbows about 45° out.')}${MEASURED[s.ex] ? ` Measured: about ${MEASURED[s.ex]}%.` : ''}</small>`;
      },
    };
    return compactReadout(stage, api);
  },
};
