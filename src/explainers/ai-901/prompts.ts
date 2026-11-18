import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const spec: ExplainerSpec = {
  id: 'prompts',
  lesson: 'prompt-engineering',
  title: {
    main: 'Same model. Better prompt. <em>Better answer.</em>',
    sub: 'System and user messages, grounding, few-shot examples and a safety message, in one support bot.',
  },
  summary: 'An animation of a chat request for a Contoso Electronics support bot: a system message sets the rules, a user asks about returns, the ungrounded model invents a 60-day policy, grounding with the real policy fixes it, few-shot examples fix the format, and a safety system message handles an off-topic question.',
  html: `
  <div class="pr">
    <div class="pr-req msd-card">
      <div class="pr-rh"><span class="msd-label">Chat request · messages[ ]</span><span class="msd-chip">model: gpt-4.1-mini</span></div>
      <div class="pr-msg sys msd-reveal"><span class="pr-role">system</span><div><p class="pr-sys"></p>
        <p class="pr-policy msd-reveal">&lt;policy&gt; Returns are accepted within 30 days with a receipt. &lt;/policy&gt;</p>
        <p class="pr-shot msd-reveal">Example → {"intent":"return","answer":"…"}</p>
        <p class="pr-safe msd-reveal">Decline anything that isn’t about Contoso products.</p></div></div>
      <div class="pr-msg user msd-reveal"><span class="pr-role">user</span><p class="pr-q">Can I return my laptop after 3 weeks?</p></div>
    </div>
    <div class="pr-out">
      <div class="pr-ans msd-card msd-reveal"><span class="pr-role a">assistant</span><p class="pr-a"></p><span class="pr-tag msd-pill bad msd-reveal">${I.warn}Made up</span></div>
    </div>
    <div class="pr-flow"></div>
  </div>`,
  css: `
  @S .pr{ position:relative; height:100%; display:grid; grid-template-columns:1.25fr 1fr; gap:22px; }
  @S .pr-req{ padding:22px; display:flex; flex-direction:column; gap:16px; min-height:0; }
  @S .pr-rh{ display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center; }
  @S .pr-msg{ display:flex; gap:14px; align-items:flex-start; padding:16px; border-radius:18px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); }
  @S .pr-msg > div{ display:flex; flex-direction:column; gap:10px; flex:1; }
  @S .pr-role{ flex-shrink:0; font-family:var(--x-mono); font-size:19px; font-weight:700; padding:6px 12px; border-radius:10px; background:rgb(58 160 255 / .16); color:var(--x-a1); }
  @S .pr-msg.user .pr-role{ background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .pr-role.a{ background:rgb(63 185 80 / .16); color:var(--x-ok); align-self:flex-start; }
  @S .pr-msg p{ margin:0; font-size:24px; line-height:1.4; color:var(--x-text); }
  @S .pr-sys{ font-family:var(--x-mono); font-size:22px !important; min-height:62px; }
  @S .pr-policy{ font-family:var(--x-mono); font-size:21px !important; color:var(--x-cyan) !important; padding:10px 12px; border-radius:10px; background:rgb(34 211 238 / .08); }
  @S .pr-shot{ font-family:var(--x-mono); font-size:21px !important; color:var(--x-warn) !important; padding:10px 12px; border-radius:10px; background:rgb(240 166 74 / .08); }
  @S .pr-safe{ font-family:var(--x-mono); font-size:21px !important; color:var(--x-ok) !important; padding:10px 12px; border-radius:10px; background:rgb(63 185 80 / .08); }
  @S .pr-msg .msd-reveal:not(.show){ display:none; }
  @S .pr-out{ display:flex; flex-direction:column; justify-content:center; gap:18px; }
  @S .pr-ans{ padding:24px; display:flex; flex-direction:column; gap:14px; border-width:2px; }
  @S .pr-ans.bad{ border-color:var(--x-bad); }
  @S .pr-ans.good{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok), 0 0 40px rgb(63 185 80 / .2); }
  @S .pr-a{ margin:0; font-size:30px; line-height:1.4; color:#fff; min-height:84px; }
  @S .pr-a.mono{ font-family:var(--x-mono); font-size:25px; color:var(--x-cyan); }
  @S .pr-tag{ align-self:flex-start; } @S .pr-tag svg{ width:24px; height:24px; }
  @S .pr-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .pr{ grid-template-columns:1fr; grid-template-rows:1.5fr 1fr; }
  @P .pr-a{ font-size:28px; }
  `,
  stages: [
    {
      title: 'A prompt is a list of messages',
      key: 'list of messages',
      desc: 'Your app sends the model several messages, and each one has a role.',
      status: 'POST /chat/completions · 2 messages',
      say: "When your app calls a model, it doesn't send one line. It sends a list of messages, and each one has a role.",
      run: (m) => {
        m.show('.pr-msg', 300);
      },
    },
    {
      title: 'The system message sets the rules',
      key: 'system message',
      desc: 'Written by you, the developer: persona, scope, tone and format.',
      status: 'role: system · persona + rules',
      say: 'The system message is written by you, the developer. It sets the persona, the scope, the tone and the format.',
      run: (m) => {
        m.focus('.pr-msg.sys', '.pr-msg.user');
        m.type('.pr-sys', 'You are a support assistant for Contoso Electronics. Reply in at most 3 sentences.', 28);
      },
    },
    {
      title: 'The user asks',
      key: 'user',
      desc: 'The user message is what the person typed for this turn.',
      status: 'role: user · 1 question',
      say: 'The user message is what the person typed for this turn.',
      run: (m) => {
        m.focus('.pr-msg.user', '.pr-msg.sys');
        m.punch('.pr-msg.user', 2);
      },
    },
    {
      title: 'Without facts, it guesses',
      key: 'guesses',
      desc: 'With no policy to read, the model writes something that sounds right. 60 days is invented.',
      status: 'response · ungrounded',
      thinking: true,
      say: 'Without the facts, the model fills the gap with something that sounds right. Sixty days is made up.',
      run: (m) => {
        m.unfocus();
        m.stream('.pr-flow', { from: '.pr-req', to: '.pr-ans', count: 5, duration: 800, gap: 700, silent: true });
        m.show('.pr-ans', 0, true);
        m.after(500, () => m.type('.pr-a', 'Yes! Contoso accepts returns within 60 days.', 34));
        m.after(2300, () => { m.cls('.pr-ans', 'bad'); m.show('.pr-tag', 0, true); m.shake('.pr-ans'); });
      },
    },
    {
      title: 'Ground it in your data',
      key: 'Ground',
      desc: 'Paste the real policy between tags and say: answer only from this text.',
      status: 'grounded · answer from <policy>',
      say: 'So ground it. Paste the real policy between tags, and tell the model to answer only from that text. Now the answer is right.',
      run: (m) => {
        m.hide('.pr-tag');
        m.cls('.pr-ans', 'bad', false);
        m.show('.pr-policy', 0);
        m.sfx.lock();
        m.after(900, () => m.type('.pr-a', 'Yes. Returns are accepted within 30 days with a receipt.', 30));
        m.after(2800, () => { m.cls('.pr-ans', 'good'); m.sfx.chime(); });
      },
    },
    {
      title: 'Show examples for a fixed format',
      key: 'examples',
      desc: 'Two or three input and output pairs teach a format better than a paragraph of rules.',
      status: 'few-shot · JSON output',
      say: 'Need a fixed format your code can read? Show two or three examples. That is called few-shot prompting, and it beats a paragraph of rules.',
      run: (m) => {
        m.show('.pr-shot', 0);
        m.after(700, () => { m.cls('.pr-a', 'mono'); m.type('.pr-a', '{"intent":"return","answer":"Yes, within 30 days with a receipt."}', 18); });
      },
    },
    {
      title: 'Off-topic? Decline safely',
      key: 'Decline',
      desc: 'A safety system message says what to refuse. It works alongside Foundry guardrails.',
      status: 'safety system message + guardrails',
      say: "Last, add a safety system message that says what to refuse. It works alongside Foundry's guardrails, not instead of them.",
      run: (m) => {
        m.show('.pr-safe', 0);
        m.after(500, () => { m.text('.pr-q', 'Which shares should I buy this week?'); m.punch('.pr-msg.user', 1); });
        m.after(1300, () => { m.cls('.pr-a', 'mono', false); m.type('.pr-a', "I'm not sure, please contact support.", 30); });
      },
    },
  ],
  end: {
    title: 'Role, rules, facts, examples, limits',
    sub: 'Wrong tone? Fix the system message. Made-up facts? Ground it. Messy format? Add examples.',
  },
};

export default spec;
