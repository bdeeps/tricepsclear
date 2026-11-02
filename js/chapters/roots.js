// Chapter 6: where triceps training comes from. A wrestler does dands in the soft earth of an
// akhara, with a gada (mace) at the side; a board steps through the timeline in history.json.
// Sources are listed in history.json; the key ones: Wikipedia "Hindu push-up" (dands described in
// Indian wrestling since at least the 19th century, citing Vyayama Dipika, 1896); Joseph S. Alter,
// The Wrestler's Body (University of California Press, 1992); Wikipedia "The Great Gama" (1878–1960;
// 1910 John Bull belt in London; daily training reported as thousands of dands and baithaks, numbers
// vary between accounts); Wikipedia "Friedrich Ludwig Jahn" and "Parallel bars" (Turnplatz,
// Hasenheide, Berlin, 1811); Wikipedia "Eugen Sandow" (Strength and How to Obtain It, 1897; 1901
// Great Competition; India, 1905); Todd, Shurley & Todd, J Strength Cond Res 26:2913 (2012) on
// DeLorme's 1945 progressive resistance exercise; Maeo et al. 2023.
import { THREE, clamp, approach, canvasTexture } from '../kit.js';
import { makeFigure, makePit, makeGada, board, panel, tint, fitNarrow, compactReadout, inReel , reelView } from '../figure.js';
import { dand, BODY } from '../triceps.js';

// A short list for the board (the full, sourced list is history.json).
export const MILESTONES = [
  { year: 1811, date: '1811', t: 'Parallel bars', d: 'Friedrich Ludwig Jahn sets up the first open-air gymnastics ground in Berlin, with parallel bars: home of the dip.' },
  { year: 1896, date: 'by 1896', t: 'Dand in print', d: 'Indian exercise books describe dands and baithaks, long practised by wrestlers in akharas.' },
  { year: 1897, date: '1897', t: 'Strength and How to Obtain It', d: 'Strongman Eugen Sandow sells a home-training book; he tours India in 1905.' },
  { year: 1910, date: '1910', t: 'The Great Gama', d: 'Gama of Punjab wins the John Bull belt in London. Accounts report thousands of dands a day (numbers vary).' },
  { year: 1945, date: '1945', t: 'Progressive resistance', d: 'Army doctor Thomas DeLorme rebuilds injured soldiers with sets of 10 reps, adding weight as they get stronger.' },
  { year: 1966, date: '1966', t: 'Length–tension', d: 'Gordon, Huxley and Julian show a muscle fibre’s force depends on how much its filaments overlap.' },
  { year: 2017, date: '2017', t: 'Sets and loads', d: 'Meta-analyses link more weekly sets to more growth and show light and heavy loads both build muscle.' },
  { year: 2019, date: '2019', t: 'Fit India', d: 'India launches the Fit India Movement on National Sports Day, 29 August.' },
  { year: 2023, date: '2023', t: 'Overhead wins (in one study)', d: 'Maeo and colleagues find overhead extensions grow the triceps about 40% more than arm-by-side ones.' },
];

function draw(g, w, h, s) {
  panel(g, w, h);
  if (!s) return;
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('From the akhara to the lab', 34, 50);
  const T = 84, rh = (h - T - 16) / MILESTONES.length;
  let on = 0; MILESTONES.forEach((m, i) => { if (s.year >= m.year) on = i; });
  MILESTONES.forEach((m, i) => {
    const y = T + i * rh, act = i === on;
    if (act) { g.fillStyle = 'rgba(255,209,102,.12)'; g.fillRect(20, y + 2, w - 40, rh - 4); }
    g.fillStyle = act ? '#ffd166' : 'rgba(232,238,248,.55)'; g.font = (act ? 'bold ' : '') + '22px sans-serif';
    g.fillText(m.date, 34, y + rh * 0.62);
    g.fillStyle = act ? '#fff' : 'rgba(232,238,248,.8)'; g.fillText(m.t, 150, y + rh * 0.62);
  });
}

const REELV = [{ pos: [10.5, 8, 12], target: [2, 3.5, 0] }];

export default {
  id: 'roots',
  short: 'History',
  title: 'From dand to data',
  subtitle: 'Wrestlers built pushing strength in the earth pits of India long before labs measured it.',
  view: { pos: [2, 8, 26], target: [2, 6, 0] },
  learn: `<p>In India's <b>akharas</b>, the earth-floored gyms of <b>kushti</b> wrestling, the daily work was the <b>dand</b> (a swooping push-up) and the <b>baithak</b> (a deep squat), with the <b>gada</b> (mace) and <b>jodi</b> (clubs) for the shoulders. Exercise books in Indian languages described dands by the 1890s, and the practice is surely older.</p>
    <p>The most famous pehlwan, <b>Gama</b> of Punjab (1878–1960), won the John Bull world title in London in <b>1910</b>. Accounts of his routine report thousands of dands and baithaks a day, but the numbers differ from book to book, so treat them as <b>reports</b>, not records.</p>
    <p>In Europe, <b>Friedrich Ludwig Jahn</b> opened an open-air gymnastics ground in Berlin in <b>1811</b> with the first <b>parallel bars</b>, on which dips became a staple. Strongmen such as <b>Eugen Sandow</b>, who toured India in 1905, sold home training to millions. In <b>1945</b> an army doctor, <b>Thomas DeLorme</b>, showed that sets of about 10 reps, made heavier week by week, rebuilt injured soldiers: progressive overload.</p>
    <p>Labs then explained why. The <b>length–tension</b> curve (1966) showed force depends on filament overlap. Recent studies count sets and compare loads, and in <b>2023</b> a Japanese team found that training the triceps <b>overhead</b> grew it more. India launched the <b>Fit India Movement</b> in 2019 to get everyone moving.</p>
    <p class="tip"><b>Try it:</b> slide through the years, and watch the wrestler's dand: hips high, swoop low, arch up.</p>`,
  terms: [
    { t: 'Akhara', d: 'A traditional Indian wrestling gym with a pit of soft, tilled earth.' },
    { t: 'Kushti / pehlwani', d: 'Indian traditional wrestling; a wrestler is a pehlwan.' },
    { t: 'Baithak', d: 'A deep, rhythmic squat on the toes, the dand’s partner in akhara training.' },
    { t: 'Gada', d: 'A heavy club-like mace swung for shoulder and grip strength.' },
  ],
  defaults: { year: 1910, play: true },
  controls: [
    { key: 'year', type: 'range', label: 'Year', min: 1800, max: 2026, step: 1, ends: ['1800', '2026'], fmt: (v) => Math.round(v) },
    { key: 'play', type: 'toggle', label: 'Play through time' },
  ],
  onChange(s, key) { if (key === 'year') s.play = false; },
  quiz: [
    { q: 'What is a dand?', options: ['A wrestling throw', 'A flowing Indian push-up: hips high, swoop low, arch up', 'A type of dumbbell', 'A diet'], answer: 1, why: 'The dand, or "Hindu push-up", is the classic pushing exercise of Indian akharas, paired with the baithak squat.' },
    { q: 'Why should Gama’s famous daily rep counts be treated with care?', options: ['He never trained', 'They come from accounts that disagree with each other', 'They were measured by machines', 'They are banned'], answer: 1, why: 'Different books give different numbers, so they are reports rather than measured records.' },
    { q: 'What did Thomas DeLorme show in 1945?', options: ['That muscles can push', 'That sets of about 10 reps, made heavier over time, rebuild strength', 'That steroids are safe', 'That rest is useless'], answer: 1, why: 'His "progressive resistance exercise" with soldiers is an ancestor of progressive overload.' },
  ],
  reel: [
    { ms: 5000, caption: 'Wrestlers in Indian akharas built pushing strength with thousands of dands.', set: { year: 1910, play: false }, act: (s, inst) => inst.reel?.(0), spin: 0.35 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(-7.5, 0.3, 0); stage.root.add(root);
    const pit = makePit(11); pit.position.set(8, -0.3, 0); root.add(pit);
    const fig = makeFigure({ color: 0xb48a6a }); root.add(fig.group);
    const gada = makeGada(); gada.scale.setScalar(0.55); gada.position.set(-1.5, 0.3, -5); gada.rotation.z = 0.2; root.add(gada);
    const gada2 = makeGada(); gada2.scale.setScalar(0.4); gada2.position.set(-0.2, 0.3, -6.5); gada2.rotation.z = -0.15; root.add(gada2);
    const ct = canvasTexture(900, 640, draw);
    const brd = board(ct, 10.5, 7.5); brd.position.set(9.5, 11.5, -4); stage.root.add(brd);
    const labs = [tint(stage.label('Dand', [10, 5.5, 1], root), 'gold'), tint(stage.label('Gada (mace)', [-1.5, 6.6, -5], root), 'white')];
    const fit = fitNarrow(stage, { pos: [9, 7, 11], target: [2, 3, 0] });
    let ph = 0, lastY = -1;
    return compactReadout(stage, {
      reel: (i) => reelView(stage, REELV[i]),
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fit();
        brd.visible = !narrow && !inReel();
        if (s.play) { s.year += dt * 14; if (s.year > 2026) s.year = 1800; }
        ph += dt * 0.3;
        const b = dand(ph % 1, BODY.H, 60);
        fig.pose(b, { act: clamp(b.force / 2500, 0, 1), H: BODY.H });
        labs.forEach((l, i) => { l.visible = !inReel() && !(narrow && i); });
        const y = Math.round(s.year);
        if (y !== lastY) { lastY = y; ct.redraw(s); }
      },
      readout: (s) => {
        let m = MILESTONES[0]; MILESTONES.forEach((x) => { if (s.year >= x.year) m = x; });
        return `<div class="big">${m.date}: ${m.t}</div><small>${m.d}</small>`;
      },
    });
  },
};
