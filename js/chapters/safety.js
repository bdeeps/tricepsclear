// Chapter 5: training safely. The mannequin shows good form and common faults in push-ups and
// dips; the joint under strain glows. No diagnosis or treatment advice: "see a doctor" only.
// Sources:
//  - NHS "How to warm up before exercising" (reviewed 2026): warm up at least 6 minutes; get advice
//    first if you have a health problem, an injury, symptoms, a recent heart attack or operation,
//    or are pregnant or have recently given birth; stop immediately on pain or feeling unwell.
//    NHS adult guidelines (2024): speak to your GP first if you have not exercised for some time
//    or have medical conditions or concerns. NHS strength page: start gradually, build over weeks.
//  - WHO 2020 guidelines: older adults, varied activity with balance and strength on 3+ days a week;
//    people living with disability get the same recommendations, adapted to ability.
//  - Dips and the shoulder: the usual coaching cue is to stop about where the upper arm is level
//    with the floor (a cue, not a measured injury threshold); deep dips put the front of the
//    shoulder at the end of its range under full body weight.
//  - Anabolic steroids: NHS "Anabolic steroid misuse" (reviewed January 2026): heart attack or
//    stroke, liver or kidney problems, high blood pressure, blood clots, high cholesterol,
//    infertility and shrunken testicles in men, a deeper voice and body hair in women, stunted
//    growth in teenagers, aggression, mood swings, paranoia; they are addictive. They are on the
//    WADA Prohibited List (S1 anabolic agents); in India NADA enforces the code under the National
//    Anti-Doping Act, 2022.
import { THREE, clamp, approach } from '../kit.js';
import { makeFigure, makeBars, tint, fitNarrow, compactReadout, inReel, blob , reelView } from '../figure.js';
import { pushup, dip, BODY } from '../triceps.js';

const F = {
  good: { label: 'Good form', joint: null, ok: true, title: 'Good form', what: 'Body in one straight line, hands under the shoulders, elbows about 45° from the body, lower under control.', fix: 'Stop the set while your form is still good.' },
  sag: { label: 'Sagging hips', joint: 'hip', title: 'Hips sagging', what: 'The middle drops and the lower back arches, so the back takes strain instead of the arms and trunk.', fix: 'Squeeze your bum and brace your belly; use an easier version (knees or a bench) until you can hold the line.' },
  flare: { label: 'Elbows out', joint: 'sh', title: 'Elbows flared out wide', what: 'Elbows straight out to the sides crowd the front of the shoulder and shift work away from the triceps.', fix: 'Tuck the elbows to about 45° from your body, like an arrow, not a T.' },
  wrist: { label: 'Wrists', joint: 'wrist', title: 'Wrists bent right back', what: 'Flat palms bend the wrist back about 90° under a big share of your weight. Sore wrists are common at first.', fix: 'Spread your fingers, build up slowly, or use an incline, fists or push-up handles to keep the wrist straighter.' },
  deep: { label: 'Too-deep dips', joint: 'sh', title: 'Dips taken too deep', what: 'Below level, the front of the shoulder is stretched to the end of its range while carrying all your weight.', fix: 'Stop about where the upper arm is level with the floor; build up with bench dips or band-assisted dips.' },
  lock: { label: 'Slamming lockout', joint: 'el', title: 'Snapping the elbows straight', what: 'Throwing the elbow into full lock with momentum loads the joint and tendon, not the muscle.', fix: 'Straighten fully but smoothly; control the lowering, about two to three seconds.' },
};

const REELV = [{ pos: [11.5, 8.5, 11], target: [2.5, 3.5, 0] }];

export default {
  id: 'safety',
  short: 'Safety',
  title: 'Strong elbows, happy shoulders',
  subtitle: 'Warm up, build up slowly, keep good form, and know when to see a doctor first.',
  view: { pos: [11, 9, 20], target: [3, 5, 0] },
  learn: `<p><b>Check first.</b> If you have heart disease, high blood pressure, are pregnant or have recently given birth, have a recent injury or operation, or have not exercised for a long time, <b>speak to a doctor</b> before starting (NHS). Strength training is good for almost everyone, but the right start depends on you.</p>
    <p><b>Warm up</b> for at least 6 minutes with easy movement and a light set. <b>Stop</b> straight away on sharp pain, a pop at the elbow, or if you feel unwell. Muscle tiredness and a little soreness a day or two later are normal; joint pain is not.</p>
    <p><b>Build up slowly.</b> A ladder for beginners and older adults: push-ups against a <b>wall</b>, then a kitchen counter, a <b>bench</b>, on your <b>knees</b>, then the floor. Add a few reps a week. Dips are an advanced move: they load the <b>front of the shoulder</b> and the elbow with all of your weight, so start with bench dips or band help, and stop about where your upper arm is level. Protect your <b>wrists</b> with an incline or handles if they ache.</p>
    <p>Strength work helps at every age. After about 30, people slowly lose muscle (see <a href="/muscleclear/#health">MuscleClear</a>); WHO advises older adults to add strength and balance work on <b>3 or more days</b> a week, which helps prevent falls. People living with a disability can adapt: seated band presses, wall push-ups, or a physiotherapist's plan. No ego-lifting: the weight you lift with good form is the right weight.</p>
    <p><b>Steroids and doping: plainly no.</b> Anabolic steroids can cause heart attacks and strokes, liver and kidney damage, high blood pressure, infertility, stunted growth in teenagers, aggression and depression, and they are addictive (NHS). They are banned in sport by <b>WADA</b> and in India by <b>NADA</b>. Protein powders are not needed by healthy people who eat enough (ICMR-NIN); avoid crash diets and dehydration tricks.</p>
    <p class="tip"><b>Try it:</b> step through the faults and watch which joint lights up, then read the fix.</p>`,
  terms: [
    { t: 'Warm-up', d: 'A few minutes of easy movement that raises muscle temperature and rehearses the move.' },
    { t: 'Range of motion', d: 'How far a joint moves in an exercise. Use the range you can control.' },
    { t: 'Anabolic steroids', d: 'Drugs related to testosterone; harmful when misused and banned in sport.' },
    { t: 'Sarcopenia', d: 'The slow loss of muscle and strength with age, which strength training can slow.' },
  ],
  defaults: { fault: 'good', reps: true, labels: true },
  controls: [
    { key: 'fault', type: 'seg', label: 'Show me', options: Object.entries(F).map(([v, f]) => ({ v, label: f.label })) },
    { key: 'reps', type: 'toggle', label: 'Do reps' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Who should speak to a doctor before starting strength training?', options: ['Nobody', 'People with heart disease, high blood pressure, pregnancy or a recent injury or operation', 'Only athletes', 'Only people over 80'], answer: 1, why: 'The NHS advises getting advice first if you have a health condition, symptoms, a recent heart attack or operation, or are pregnant.' },
    { q: 'How deep should most people go in a dip?', options: ['As deep as possible', 'About until the upper arm is level with the floor', 'Only a few centimetres', 'Until the shoulders touch the bars'], answer: 1, why: 'Going much lower stretches the front of the shoulder to the end of its range while it carries all your weight.' },
    { q: 'What is true about anabolic steroids?', options: ['They are a safe shortcut', 'They can damage the heart, liver and fertility, are addictive, and are banned in sport', 'They are vitamins', 'They only affect muscles'], answer: 1, why: 'The NHS lists heart attack, stroke, liver and kidney problems, infertility and mental health effects. WADA and NADA ban them.' },
  ],
  reel: [
    { ms: 4800, caption: 'Tuck elbows to about 45°, keep one straight line, and stop dips when the upper arm is level.', set: { fault: 'flare', reps: true, labels: false }, act: (s, inst) => inst.reel?.(0), spin: 0.25 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(-6.5, 0, 0); stage.root.add(root);
    const fig = makeFigure(); root.add(fig.group);
    const bars = makeBars(); root.add(bars);
    const ring = blob([0.9, 0.9, 0.9], [0, 0, 0], new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0.45, depthWrite: false })); root.add(ring);
    const tag = tint(stage.label('', [0, 0, 0], root), 'red');
    const fit = fitNarrow(stage, { pos: [9, 7, 11], target: [2, 3, 0] });
    let ph = 0, cur = null, lastF = '', pulse = 0;
    return compactReadout(stage, {
      reel: (i) => reelView(stage, REELV[i]),
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fit();
        if (s.reps) ph += dt * 0.45;
        const f = F[s.fault] || F.good, isDip = s.fault === 'deep';
        let d = s.reps ? 0.5 - 0.5 * Math.cos(ph * Math.PI) : 0.7;
        if (s.fault === 'lock') d = s.reps ? Math.pow(0.5 - 0.5 * Math.cos(ph * Math.PI), 0.4) : 0.7;
        if (isDip) { cur = dip(0.85 + 0.5 * d); }
        else cur = pushup('pushup', d * 0.9, 0.45, s.fault === 'flare' ? 'wide' : 'shoulder');
        const pose = { ...cur };
        if (s.fault === 'sag') { const drop = 0.11; pose.Hp = [cur.Hp[0], cur.Hp[1] - drop]; pose.K = [cur.K[0], cur.K[1] - drop * 0.45]; }
        if (isDip) pose.ankle = [cur.K[0] - 0.36, cur.K[1] - 0.25];
        root.position.x = isDip ? 2.5 : -6.5;
        fig.pose(pose, { act: clamp(cur.force / 2500, 0, 1), H: BODY.H });
        bars.visible = isDip;
        if (isDip) bars.place(cur.Hd[1] * 10 - 0.25, cur.H3[2] * 10 + 0.2);
        if (s.fault !== lastF) { lastF = s.fault; if (!inReel()) stage.setView(isDip ? [-4.5, 13, 27] : [11, 9, 20], isDip ? [-4, 11.5, 0] : [3, 5, 0], 0.8); }
        // glow on the joint at risk
        const j = { hip: fig.anchors.hip, sh: fig.anchors.shR, wrist: fig.anchors.wristR, el: fig.anchors.elbowR }[f.joint];
        pulse += dt * 4;
        ring.visible = !!j;
        if (j) { ring.position.copy(j.position); ring.scale.setScalar(0.9 + 0.15 * Math.sin(pulse)); }
        tag.visible = !!j && s.labels && !inReel();
        if (j) { tag.position.copy(j.position).add(new THREE.Vector3(0, 1.6, 1.5)); tag.element.textContent = f.title; }
      },
      readout: (s) => {
        const f = F[s.fault] || F.good;
        const extra = s.fault === 'deep' && cur ? `<div class="row"><span>Upper arm</span><b>${cur.upperDeg > 0 ? Math.round(cur.upperDeg) + '° below level' : 'above level'}</b></div>` : '';
        return `<div class="big">${f.title}</div>${extra}
          <div>${f.what}</div><div style="margin-top:6px"><b>${f.ok ? 'Keep it up:' : 'Fix:'}</b> ${f.fix}</div>`;
      },
    });
  },
};
