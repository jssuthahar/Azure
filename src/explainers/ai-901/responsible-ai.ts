import type { ExplainerSpec, XStage } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';
import type { XApi } from '../../lib/explainer/player';

const P = [
  { k: 'fair', name: 'Fairness', icon: I.scale },
  { k: 'rel', name: 'Reliability & safety', icon: I.shield },
  { k: 'priv', name: 'Privacy & security', icon: I.lock },
  { k: 'inc', name: 'Inclusiveness', icon: I.users },
  { k: 'tra', name: 'Transparency', icon: I.eye },
  { k: 'acc', name: 'Accountability', icon: I.user },
];

/** One principle step: light its tile, show the problem, then the fix. */
const principle = (i: number, problem: string, fix: string, extra?: (m: XApi) => void) => (m: XApi) => {
  m.cls('.ra-tile', 'cur', false);
  m.cls(`.ra-tile.${P[i].k}`, 'cur');
  m.text('.ra-prob span', problem);
  m.text('.ra-fix span', fix);
  m.cls('.ra-case', 'is-fixed', false);
  m.show('.ra-case', 0, true);
  m.punch(`.ra-tile.${P[i].k}`, i);
  m.sfx.error();
  extra?.(m);
  m.after(1900, () => {
    m.cls('.ra-case', 'is-fixed');
    m.cls(`.ra-tile.${P[i].k}`, 'done');
    m.sfx.lock();
  });
};

const steps: XStage[] = [
  {
    title: 'A bank builds a loan AI',
    key: 'loan AI',
    desc: 'It decides who gets a loan. Six responsible AI principles are the checklist it must pass.',
    status: 'loan-ai · pre-launch review',
    say: "A bank builds an AI that helps decide who gets a loan. Microsoft's six responsible AI principles are the checklist it has to pass.",
    run: (m) => {
      m.show('.ra-tile', 120);
    },
  },
  {
    title: 'Fairness',
    key: 'Fairness',
    desc: 'Similar applicants must get similar outcomes, whatever group they belong to.',
    status: 'fairness · outcomes by group',
    say: 'Fairness. Two applicants with the same income get different answers because of their postcode. The team measures outcomes across groups and removes the bias.',
    run: principle(0, 'Same income, different postcode, different answer', 'Measure outcomes across groups and remove the biased feature', (m) => m.shake('.ra-apps .b')),
  },
  {
    title: 'Reliability and safety',
    key: 'Reliability',
    desc: 'It must work as expected, including on unusual inputs, and fail safely.',
    status: 'reliability · edge-case tests',
    say: "Reliability and safety. The model has to behave well on unusual applications too, so it's tested on edge cases, and it hands anything it isn't sure about to a person.",
    run: principle(1, 'An unusual application gets a confident, wrong answer', 'Test edge cases, monitor after launch, route low confidence to a person'),
  },
  {
    title: 'Privacy and security',
    key: 'Privacy',
    desc: 'Personal data is protected, collected with consent and safe from misuse.',
    status: 'privacy · PII masked',
    say: "Privacy and security. Applicants' bank statements and Aadhaar numbers are protected, collected with consent, and masked before anything is logged.",
    run: principle(2, 'Aadhaar numbers saved in plain text in chat logs', 'Collect with consent, mask PII, lock down access'),
  },
  {
    title: 'Inclusiveness',
    key: 'Inclusiveness',
    desc: 'It works for people of all abilities, languages and backgrounds.',
    status: 'inclusiveness · captions + languages',
    say: 'Inclusiveness. The app works with screen readers, understands Indian English accents, and supports regional languages, so nobody is shut out.',
    run: principle(3, 'The voice app fails on regional accents', 'Support screen readers, captions and regional languages'),
  },
  {
    title: 'Transparency',
    key: 'Transparency',
    desc: 'People know AI was involved and can see the main reasons for a result.',
    status: 'transparency · reasons shown',
    say: 'Transparency. Applicants are told that AI helped, and a declined applicant sees the main reasons for the decision.',
    run: principle(4, 'Declined, with no reason given', 'Say AI was used and show the main reasons for the result'),
  },
  {
    title: 'Accountability',
    key: 'Accountability',
    desc: 'People, not the model, answer for what it does.',
    status: 'accountability · named owner + appeals',
    say: 'Accountability. People, not the model, are answerable. A named team owns the system, reviews it before launch, and handles appeals.',
    run: principle(5, '“The algorithm decided” and nobody owns it', 'A named team owns it, reviews it and handles appeals'),
  },
  {
    title: 'Six principles, one system',
    key: 'Six principles',
    desc: 'Learn each one by the problem it solves. That’s how exam questions describe them.',
    status: 'review complete · 6 of 6',
    say: 'Fairness, reliability and safety, privacy and security, inclusiveness, transparency and accountability. Learn each one by the problem it solves, because that is how exam questions describe them.',
    run: (m) => {
      m.cls('.ra-tile', 'cur', false);
      m.hide('.ra-case');
      m.cls('.ra-app', 'ok');
      m.after(300, () => m.sfx.sparkle());
    },
  },
];

const spec: ExplainerSpec = {
  id: 'responsible-ai',
  lesson: 'responsible-ai-principles',
  title: {
    main: 'Six questions every AI <em>must answer</em>',
    sub: 'Microsoft’s responsible AI principles, applied to one loan approval system.',
  },
  summary: 'An animation of a bank’s loan approval AI going through Microsoft’s six responsible AI principles. For each one, a problem appears (a postcode bias, a confident wrong answer, unmasked Aadhaar numbers, accents not understood, no reasons given, no owner) followed by the fix.',
  html: `
  <div class="ra">
    <div class="ra-app msd-card">
      <div class="ra-ah">${I.app}<b>Loan approval AI</b><span class="msd-chip">Bank · India</span></div>
      <div class="ra-apps">
        <div class="a"><span>${I.user}</span><b>Applicant A</b><em>₹9 L/yr</em><i class="ok">Approved</i></div>
        <div class="b"><span>${I.user}</span><b>Applicant B</b><em>₹9 L/yr</em><i class="no">Declined</i></div>
      </div>
      <div class="ra-case msd-reveal">
        <div class="ra-prob">${I.warn}<span></span></div>
        <div class="ra-fix">${I.check}<span></span></div>
      </div>
    </div>
    <div class="ra-tiles">
      ${P.map((p) => `<div class="ra-tile ${p.k} msd-pop"><span class="ic">${p.icon}</span><b>${p.name}</b></div>`).join('')}
    </div>
  </div>`,
  css: `
  @S .ra{ height:100%; display:grid; grid-template-columns:1.15fr 1fr; gap:22px; }
  @S .ra-app{ padding:24px; display:flex; flex-direction:column; gap:18px; transition:border-color .3s, box-shadow .3s; }
  @S .ra-app.ok{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok), 0 0 50px rgb(63 185 80 / .2); }
  @S .ra-ah{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; color:#fff; font-size:30px; }
  @S .ra-ah svg{ width:40px; height:40px; color:var(--x-a1); }
  @S .ra-apps{ display:flex; flex-direction:column; gap:12px; }
  @S .ra-apps > div{ display:grid; grid-template-columns:48px 1fr auto auto; gap:14px; align-items:center; padding:14px 16px; border-radius:16px; background:rgb(14 20 32 / .9); border:1.5px solid var(--x-line); font-size:24px; }
  @S .ra-apps span{ width:48px; height:48px; border-radius:12px; display:grid; place-items:center; background:rgb(180 140 255 / .15); color:var(--x-you); }
  @S .ra-apps span svg{ width:28px; height:28px; }
  @S .ra-apps b{ color:#fff; } @S .ra-apps em{ font-style:normal; font-family:var(--x-mono); color:var(--x-dim); font-size:21px; }
  @S .ra-apps i{ font-style:normal; font-weight:800; font-size:20px; padding:6px 12px; border-radius:10px; }
  @S .ra-apps i.ok{ color:var(--x-ok); background:rgb(63 185 80 / .12); } @S .ra-apps i.no{ color:var(--x-bad); background:rgb(244 74 106 / .12); }
  @S .ra-case{ margin-top:auto; display:flex; flex-direction:column; gap:12px; }
  @S .ra-prob, @S .ra-fix{ display:flex; gap:14px; align-items:center; padding:16px 18px; border-radius:16px; font-size:25px; line-height:1.35; color:#fff; transition:opacity .35s, transform .35s; }
  @S .ra-prob svg, @S .ra-fix svg{ width:34px; height:34px; flex-shrink:0; }
  @S .ra-prob{ background:rgb(244 74 106 / .12); border:1.5px solid rgb(244 74 106 / .5); } @S .ra-prob svg{ color:var(--x-bad); }
  @S .ra-fix{ background:rgb(63 185 80 / .12); border:1.5px solid rgb(63 185 80 / .5); opacity:0; transform:translateY(10px); } @S .ra-fix svg{ color:var(--x-ok); }
  @S .ra-case.is-fixed .ra-fix{ opacity:1; transform:none; }
  @S .ra-case.is-fixed .ra-prob{ opacity:.5; text-decoration:line-through; }
  @S .ra-tiles{ display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:1fr; gap:14px; }
  @S .ra-tile{ display:flex; flex-direction:column; justify-content:center; gap:12px; padding:18px; border-radius:20px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s, box-shadow .3s, background .3s; }
  @S .ra-tile .ic{ width:58px; height:58px; border-radius:16px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .ra-tile .ic svg{ width:34px; height:34px; }
  @S .ra-tile b{ color:#fff; font-size:25px; }
  @S .ra-tile.cur{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 46px rgb(58 160 255 / .3); }
  @S .ra-tile.done .ic{ background:var(--x-ok); color:#0e1420; }
  @S .ra-tile.done{ border-color:rgb(63 185 80 / .6); }
  @P .ra{ grid-template-columns:1fr; grid-template-rows:auto 1fr; }
  @P .ra-tiles{ grid-template-columns:1fr 1fr 1fr; }
  @P .ra-tile{ padding:14px; gap:8px; } @P .ra-tile b{ font-size:21px; }
  @P .ra-prob, @P .ra-fix{ font-size:23px; }
  `,
  stages: steps,
  end: {
    title: 'Fair, reliable, private, inclusive, transparent, accountable',
    sub: 'Each principle answers one question. Spot the problem in the scenario and you’ve found the principle.',
  },
};

export default spec;
