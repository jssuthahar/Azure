/**
 * Microsoft Foundry in the practice simulator (AI-901): clicks through the real
 * lab page like a learner. Creates a Foundry resource with the portal wizard,
 * deploys a model, chats (text + image), builds an agent with tools, runs it,
 * then runs a Foundry SDK script in Cloud Shell. Fails on any page error or
 * if the lab's task checks don't tick.
 */
import { launch, BASE, watch, finish } from './lib.mjs';

const b = await launch();
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
const errs = [];
const fail = [];
watch(p, errs);
const sh = async (cmd) => { await p.click('[data-tab="shell"]'); await p.fill('.sim-in', cmd); await p.press('.sim-in', 'Enter'); await p.waitForTimeout(150); };
const portal = () => p.click('[data-tab="portal"]');
const blade = async (name) => { await p.click(`.sim-portal [data-act="blade"][data-arg="${name}"]`); await p.waitForTimeout(120); };
const done = async () => Number(await p.textContent('.sim-done'));

try {
  await p.goto(`${BASE}/ai-901/labs/ai-first-agent/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('msdb-lab-v1-')) localStorage.removeItem(k); });
  await p.reload({ waitUntil: 'networkidle' });
  await sh('az group create -n rg-ai-lab -l eastus');
  await portal();
  // Create a Foundry resource with the wizard
  await p.click('.sim-portal [data-act="svc"][data-arg="create"]');
  await p.click('.sim-portal [data-act="market"][data-arg="Microsoft Foundry"]');
  await p.fill('.sim-portal input[name="name"]', 'contoso-qa-1');
  await p.click('.sim-portal [data-act="wreview"]');
  await p.click('.sim-portal [data-act="wcreate"]');
  await p.click('.sim-portal button:has-text("Go to resource")', { timeout: 6000 });
  if (!(await p.isVisible('.sim-portal :text("services.ai.azure.com")'))) fail.push('Foundry overview did not show the endpoint');
  if ((await done()) < 1) fail.push('task 1 (Foundry + project) did not tick after the wizard');
  // Deploy a model
  await blade('Models + endpoints');
  await p.click('.sim-portal form[data-form="ai-deploy"] button.pt-primary');
  await p.waitForTimeout(200);
  if ((await done()) < 2) fail.push('task 2 (deploy gpt-4.1-mini) did not tick');
  // Chat, with an image attached
  await blade('Chat playground');
  await p.selectOption('.sim-portal select[name="attach"]', 'shelf-photo.jpg');
  await p.fill('.sim-portal input[name="user"]', 'What needs restocking?');
  await p.click('.sim-portal form[data-form="ai-chat"] button.pt-primary');
  await p.waitForTimeout(200);
  if (!(await p.textContent('.sim-portal .pa-ai-log'))?.includes('empty spaces')) fail.push('chat playground did not answer about the attached image');
  // Agent without tools, then with tools
  await blade('Agents');
  await p.fill('.sim-portal form[data-form="ai-agent"] input[name="name"]', 'support-agent');
  await p.fill('.sim-portal form[data-form="ai-agent"] textarea[name="instructions"]', 'You are Contoso support. Use the refund policy.');
  await p.click('.sim-portal form[data-form="ai-agent"] button.pt-primary');
  await p.waitForTimeout(200);
  await p.fill('.sim-portal form[data-form="ai-agent-run"] input[name="input"]', 'What is the refund limit for a damaged item?');
  await p.click('.sim-portal form[data-form="ai-agent-run"] button.pt-primary');
  await p.waitForTimeout(200);
  await p.check('.sim-portal input[name="t_file_search"]');
  await p.check('.sim-portal input[name="t_code_interpreter"]');
  await p.click('.sim-portal form[data-form="ai-agent"] button.pt-primary');
  await p.waitForTimeout(200);
  await p.fill('.sim-portal form[data-form="ai-agent-run"] input[name="input"]', 'What is the refund limit for a damaged item, and what is 15% of 4200?');
  await p.click('.sim-portal form[data-form="ai-agent-run"] button.pt-primary');
  await p.waitForTimeout(250);
  if (!(await p.textContent('.sim-portal .pa-ai-log'))?.includes('630')) fail.push('agent did not use the code interpreter');
  if ((await done()) !== 5) fail.push(`ai-first-agent finished ${await done()}/5 tasks`);
  // Other Foundry pages render without errors
  for (const tab of ['Model catalog', 'Images playground', 'Language', 'Speech', 'Content Understanding', 'Guardrails', 'Evaluations', 'Keys and Endpoint', 'Projects']) await blade(tab);
  // Foundry SDK script from Cloud Shell, using the endpoint of the resource created above
  await sh('pip install azure-ai-projects azure-identity');
  await sh('export FOUNDRY_PROJECT_ENDPOINT="https://contoso-qa-1.services.ai.azure.com/api/projects/proj-default"');
  await sh('python chat_app.py "When does the Chennai store open on Sunday?"');
  if (!(await p.textContent('.sim-out'))?.includes('10 AM')) fail.push('chat_app.py did not answer from Cloud Shell');
} catch (e) {
  fail.push(`flow broke: ${e.message.split('\n')[0]}`);
}
await b.close();
console.log('walked the Foundry lab: wizard, deploy, chat + image, agent + tools, every Foundry page, SDK script');
finish('Foundry simulator', [...fail, ...errs]);
