// Chapter 1: the triceps brachii up close. A large right arm seen from behind and to the side:
// the long head (from the shoulder blade), the lateral head and the deep medial head (from the
// back of the humerus), their common tendon onto the olecranon, and the small anconeus.
// Sources: Gray's Anatomy 42nd ed.; Wikipedia "Triceps" (origins, insertion, radial nerve, the
// axillary-nerve variant of the long head, fibre types: medial head mostly type I, lateral head
// more type II, long head mixed). Volumes: Vidt et al., J Biomech 45:334, 2011 (MRI, 18 older
// adults): triceps 304 cm³, biceps 143, brachialis 97, brachioradialis 42, anconeus 6.4 cm³.
import { THREE, clamp, approach } from '../kit.js';
import { makeArm, tint, fitNarrow, compactReadout, inReel , reelView } from '../figure.js';
import { VOL, tricepsShare, HEADS } from '../triceps.js';

const INFO = {
  long: { t: 'Long head', d: 'Starts on the shoulder blade, just below the shoulder joint, so it crosses two joints: it straightens the elbow and pulls the arm down and back.' },
  lateral: { t: 'Lateral head', d: 'Starts high on the back of the humerus, on the outer side. It is the horseshoe you see from the side when the arm is straight.' },
  medial: { t: 'Medial head', d: 'Lies deep, on the lower back of the humerus. It works in almost every elbow straightening, even light ones.' },
  anc: { t: 'Anconeus', d: 'A small triangle from the outer elbow to the ulna. It helps straighten and steady the elbow; some call it a fourth head.' },
};

const REELV = [{ pos: [-6.6, 8.2, 5.7], target: [-1.6, 7.8, -1] }];

export default {
  id: 'anatomy',
  short: 'Three heads',
  title: 'One muscle, three heads',
  subtitle: 'The triceps is the big muscle on the back of your upper arm. It has three parts and one job.',
  view: { pos: [-12, 10.5, 8.5], target: [-1.6, 8.6, -0.6] },
  learn: `<p>"Triceps" means <b>three heads</b>. The <b>triceps brachii</b> fills the back of your upper arm, and its three parts start in different places but end on one strong tendon.</p>
    <p>The <b>long head</b> starts on your <b>shoulder blade</b>, just under the shoulder joint, so it crosses both the shoulder and the elbow. The <b>lateral head</b> starts high on the outer back of the arm bone (the <b>humerus</b>). The <b>medial head</b> lies deep underneath, lower down. All three join a shared tendon that grips the <b>olecranon</b>, the bony point of your elbow. A small helper, the <b>anconeus</b>, sits just beside it.</p>
    <p>Its job is to <b>straighten the elbow</b>: pushing a door, getting up off the floor, throwing, a push-up. The <b>biceps</b> in front does the opposite, so the two form an <b>antagonist pair</b> (how muscles pull and pair up is in <a href="/muscleclear/#pairs">MuscleClear</a>).</p>
    <p>It is the <b>biggest muscle in your upper arm</b>. You often hear "two-thirds of the arm", but MRI scans put it at a little over half: about ${Math.round(tricepsShare() * 100)}% of the muscle between shoulder and elbow. So if you want stronger or bigger arms, the triceps matters more than the biceps.</p>
    <p class="tip"><b>Try it:</b> pull the three heads apart, then tap each one. Bend the elbow and watch the tendon wrap round the olecranon.</p>`,
  terms: [
    { t: 'Triceps brachii', d: 'The three-headed muscle on the back of the upper arm that straightens the elbow.' },
    { t: 'Long head', d: 'The head that starts on the shoulder blade, so it also moves the shoulder.' },
    { t: 'Olecranon', d: 'The bony tip of your elbow, part of the ulna, where the triceps tendon attaches.' },
    { t: 'Anconeus', d: 'A small muscle at the outer elbow that helps the triceps straighten and steady the joint.' },
    { t: 'Radial nerve', d: 'The nerve that carries the signals that make the triceps contract.' },
  ],
  defaults: { explode: 0, elbow: 30, flexors: true, labels: true, pick: '' },
  controls: [
    { key: 'explode', type: 'range', label: 'Pull the heads apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'elbow', type: 'range', label: 'Elbow bend', min: 0, max: 140, step: 1, ends: ['straight', 'bent'], fmt: (v) => Math.round(v) + '°' },
    { key: 'flexors', type: 'toggle', label: 'Show the biceps side (ghosted)' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which head of the triceps also crosses the shoulder joint?', options: ['The lateral head', 'The medial head', 'The long head', 'None of them'], answer: 2, why: 'The long head starts on the shoulder blade, below the shoulder joint, so it acts on the shoulder as well as the elbow.' },
    { q: 'Where do all three heads attach at the elbow?', options: ['On the radius', 'On the olecranon of the ulna', 'On the humerus', 'On the wrist'], answer: 1, why: 'They share one tendon that grips the olecranon, the bony point of your elbow.' },
    { q: 'About how much of the upper arm’s muscle is triceps, by MRI volume?', options: ['About a tenth', 'A little over half', 'Nine-tenths', 'Exactly a third'], answer: 1, why: 'Scans put it at roughly 55–60% of the muscle between shoulder and elbow: the biggest muscle there, though less than the "two-thirds" people often say.' },
  ],
  reel: [
    { ms: 5200, caption: 'The triceps has three heads that share one tendon on the point of your elbow.', set: { elbow: 25, flexors: false, labels: false }, anim: { explode: [0, 0.9] }, act: (s, inst) => inst.reel?.(0), spin: 0.5 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 13; stage.root.add(root);
    const arm = makeArm(); root.add(arm.group);
    const L = (h, a, c) => tint(stage.label(h, [0, 0, 0], arm.anchors[a]), c);
    const labs = {
      long: L('Long head', 'long', 'long'), lateral: L('Lateral head', 'lateral', 'lateral'), medial: L('Medial head (deep)', 'medial', 'medial'),
      anc: L('Anconeus', 'anc', 'purple'), olec: L('Olecranon', 'olec', 'white'), bic: L('Biceps (front)', 'bic', 'red'), scap: L('Shoulder blade', 'scap', 'white'),
    };
    // tap a head to read about it
    const pickMap = new Map([[arm.heads.long.belly, 'long'], [arm.heads.lateral.belly, 'lateral'], [arm.heads.medial.belly, 'medial'], [arm.anc, 'anc']]);
    stage.pickables.push(...pickMap.keys());
    let picked = '', bend = 30, s0 = null;
    const fit = fitNarrow(stage, { pos: [-9.5, 11.5, 8], target: [-1.4, 9.8, -1] });
    return compactReadout(stage, {
      reel: (i) => reelView(stage, REELV[i]),
      update(dt, s) {
        dt = Math.max(0, dt); s0 = s;
        const narrow = fit();
        bend = approach(bend, s.elbow, 6, dt);
        arm.pose(0, bend, { explode: s.explode, act: picked ? 0.2 : 0, flexors: s.flexors });
        for (const [m, k] of pickMap) m.material.emissiveIntensity = k === picked ? 0.9 : 0.12;
        const show = s.labels && !inReel();
        Object.entries(labs).forEach(([k, l]) => { l.visible = show && (k !== 'bic' || s.flexors) && !(narrow && (k === 'scap' || k === 'bic')); });
      },
      pick(o) { picked = pickMap.get(o) || ''; },
      readout: () => {
        if (picked) { const i = INFO[picked]; return `<div class="big">${i.t}</div><small>${i.d}</small>`; }
        return `<div class="big">Triceps: ${VOL.triceps} cm³</div>
          <div class="row"><span>Biceps</span><b>${VOL.biceps} cm³</b></div>
          <div class="row"><span>Brachialis</span><b>${VOL.brachialis} cm³</b></div>
          <div class="row"><span>Triceps share of upper arm</span><b>about ${Math.round(tricepsShare() * 100)}%</b></div>
          <small>MRI muscle volumes, average of 18 adults aged about 75 (Vidt et al. 2011). Tap a head to read about it.</small>`;
      },
    });
  },
};
