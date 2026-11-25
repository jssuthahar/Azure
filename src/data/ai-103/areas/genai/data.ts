/**
 * AI-103 genai area: problem cards, exam-format items, games, comparisons and
 * service cards. Every item is ORIGINAL, written from the official skills
 * outline; none are real or recalled exam questions. Prices ($) are
 * illustrative and shown in the learner's currency. Facts checked on
 * Microsoft Learn, 25 Nov 2026.
 */
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });

export const PROBLEMS: Record<string, ProblemSolution> = {
  'deploy-and-consume-models': ps('Every call goes to the biggest model, and one deploy broke the app because it used the model name.', 'Deploy the right model for each job and have the app call the deployment name.', 'Foundry model deployments', [['🧠', 'Hard questions', 'A large or reasoning model deployment'], ['⚡', 'Thousands of simple labels', 'A small language model deployment'], ['🏷️', 'A model upgrade breaks the app', 'Call the deployment name, so the model behind it can change']]),
  'rag-in-an-application': ps('The chatbot answers return questions with a confident guess about a policy it has never read.', 'Retrieve the right policy chunks first and make the model answer from them with citations.', 'Retrieval-augmented generation with Azure AI Search', [['🎲', 'Guessed answers', 'Put retrieved chunks in the prompt'], ['🔎', 'Keyword search misses the paraphrase', 'Hybrid search: keywords plus vectors'], ['🤷', 'Invented answers when nothing matches', 'Instruct it to say “I don’t know”']]),
  'workflows-and-tool-augmented-flows': ps('One giant prompt classifies, extracts, looks things up and replies, and nobody can tell which part failed.', 'Split the work into steps with checks, retries and a safe fallback.', 'Multistep, tool-augmented flows', [['🧩', 'One prompt does everything', 'One job per step'], ['⏱', 'A system times out', 'Retry, then a fallback value'], ['✅', 'A wrong reply gets sent', 'A verify step before sending']]),
  'evaluate-models-and-apps': ps('A prompt tweak “felt better” in the demo, and two weeks later customers got invented refund promises.', 'Score a fixed test set with evaluators before and after every change.', 'Foundry evaluations', [['🎭', 'Made-up details', 'Groundedness evaluator'], ['🎯', 'Off-topic answers', 'Relevance evaluator'], ['🛡️', 'Harmful or injected content', 'Safety evaluators']]),
  'foundry-sdks-and-connectors': ps('An API key and a search URL were pasted into the repo, and every environment needs a code change.', 'Use the project endpoint, Entra ID sign-in and connections.', 'Foundry SDK (azure-ai-projects)', [['🔑', 'Keys in code', 'DefaultAzureCredential'], ['🔗', 'URLs copied per environment', 'Project connections'], ['🧰', 'Different clients for each service', 'AIProjectClient with the OpenAI-compatible client']]),
  'design-agents-roles-goals-and-tools': ps('The support agent invents order numbers and answers questions it should refuse.', 'Give it a clear role and goal, a strict tool schema and rules for missing information.', 'Foundry Agent Service', [['🎭', 'Vague behaviour', 'Role, goal and rules in the instructions'], ['🧾', 'Made-up arguments', 'Strict schema with required parameters'], ['💬', 'Lost context between turns', 'A conversation that stores the messages']]),
  'agents-with-retrieval-functions-and-memory': ps('The agent can’t see order data, can’t read the policy PDFs and forgets the customer every time.', 'Give it a function for live data, file search for documents and memory for the customer.', 'Agent tools and memory', [['📦', 'Live order status', 'Function calling'], ['📄', 'Policy documents', 'File search or Azure AI Search'], ['💾', '“I told you last week”', 'Memory scoped to the user']]),
  'multi-agent-orchestration': ps('A single agent with fifteen tools picks the wrong one and its instructions keep growing.', 'Split the work between specialist agents and choose an orchestration pattern.', 'Microsoft Agent Framework', [['➡️', 'Draft, then review', 'Sequential'], ['🔀', 'Independent checks', 'Concurrent'], ['🤝', 'Route to the right specialist', 'Handoff']]),
  'autonomous-workflows-with-approvals': ps('A helpful agent refunded ₹64,990 from a vague message, and nobody was asked.', 'Require approval for write actions and enforce hard limits in code.', 'Approval flows and guardrail code', [['💸', 'Money moves unchecked', 'Approval required on the tool'], ['🧱', 'Amounts nobody should approve', 'A hard limit inside the tool'], ['🧾', 'Who said yes?', 'The trace records the decision']]),
  'monitor-and-evaluate-agents': ps('The agent passes demos but real conversations show invented arguments and claimed actions.', 'Evaluate whole runs and group the failures into causes.', 'Agent evaluators and error analysis', [['🔧', 'Wrong or made-up tool arguments', 'Tool call accuracy'], ['🎯', 'Misunderstood the request', 'Intent resolution'], ['📋', 'Ignored the instructions', 'Task adherence']]),
  'prompt-engineering-and-parameters': ps('Product descriptions are wildly different each time, and some stop mid-sentence.', 'Tighten the instructions, add an example and set sensible parameters.', 'Prompt engineering and model parameters', [['🌡️', 'Too creative or too flat', 'Temperature or top P'], ['✂️', 'Cut-off replies', 'Raise max output tokens and check the status'], ['🔁', 'Wrong facts in the draft', 'A self-critique pass with a checklist']]),
  'tracing-and-token-analytics': ps('Replies take four seconds, the bill keeps growing, and nobody knows which step is to blame.', 'Trace every run and read tokens and latency by span.', 'OpenTelemetry tracing with Application Insights', [['🐢', 'Slow runs', 'Latency by span'], ['💰', 'Token spend', 'Tokens by model and operation'], ['🔒', 'Prompts holding personal data', 'Content recording off in production']]),
  'orchestrate-multiple-models': ps('Every request goes to the large model, including “what time do you open?”.', 'Answer with rules where code can decide, a small model for easy language work, and a large model only when needed.', 'Hybrid routing across models and rules', [['📏', 'Exact answers', 'A rules engine'], ['⚡', 'Easy classification', 'A small model'], ['🧠', 'Hard reasoning', 'A large or reasoning model']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'yesno', id: 'agt-g-yn-deployment', domain: 2, objective: '2.1.1', statements: [
    { text: 'An application that uses the Responses API must pass the deployment name in the model parameter.', answer: true },
    { text: 'A small language model is the best choice for multistep legal reasoning across long contracts.', answer: false },
    { text: 'Two deployments in the same Foundry resource may use the same deployment name if they use different models.', answer: false },
  ], explanation: 'Calls use the **deployment name**. Deployment names are unique within a resource. Hard multistep reasoning suits a large or reasoning model; small models suit simple, high-volume work.' },
  { kind: 'order', id: 'agt-g-order-rag', domain: 2, objective: '2.1.2', question: 'You are implementing RAG for a policy chatbot. Which four actions should you perform in sequence at query time?', actions: ['Embed or search the user question', 'Retrieve the top matching chunks from the index', 'Add the chunks to the prompt with instructions to cite them', 'Send the prompt to the chat model deployment', 'Retrain the chat model on the retrieved chunks'], answer: [0, 1, 2, 3], explanation: 'At query time you **search**, **retrieve**, **augment the prompt** and **generate**. Chunking and embedding the documents happens earlier, during ingestion, and retraining isn’t part of RAG.' },
  { kind: 'dropdown', id: 'agt-g-dd-eval', domain: 2, objective: '2.1.4', question: 'Complete each statement about evaluators.', parts: [
    'To detect an answer that contains claims not supported by the supplied context, use the ',
    { options: ['groundedness', 'fluency', 'coherence', 'similarity'], answer: 0 },
    ' evaluator. To check whether an agent called its tool with the right arguments, use ',
    { options: ['tool call accuracy', 'relevance', 'violence', 'F1 score'], answer: 0 },
    '.',
  ], explanation: '**Groundedness** compares the response with the context. **Tool call accuracy** judges the function calls an agent made.' },
  { kind: 'match', id: 'agt-g-match-orchestration', domain: 2, objective: '2.2.4', question: 'Match each requirement to the orchestration pattern.', itemsLabel: 'Patterns', items: ['Sequential', 'Concurrent', 'Handoff', 'Magentic'], targets: [
    { text: 'A drafting agent passes its output to a reviewing agent in a fixed order', answer: 0 },
    { text: 'A billing agent and a delivery agent analyse the same message at the same time and the results are merged', answer: 1 },
    { text: 'A triage agent passes the conversation to whichever specialist agent suits the request', answer: 2 },
    { text: 'A manager agent builds a plan for an open-ended task and assigns steps to specialists', answer: 3 },
  ], explanation: '**Sequential** is a fixed pipeline, **concurrent** fans out and aggregates, **handoff** moves control between agents, and **Magentic** uses a manager to plan and delegate.' },
  { kind: 'yesno', id: 'agt-g-yn-approval', domain: 2, objective: '2.2.5', statements: [
    { text: 'A tool configured to require approval pauses the run until a decision is returned.', answer: true },
    { text: 'An approval step is enough protection when a refund must never exceed a fixed legal limit.', answer: false },
    { text: 'Read-only lookup tools normally need the same approval as write actions.', answer: false },
  ], explanation: 'Approval **pauses** a run for a person. Absolute limits belong in **code**, because an approver can make a mistake. Read-only tools carry much less risk than tools that change data or move money.' },
  { kind: 'dropdown', id: 'agt-g-dd-params', domain: 2, objective: '2.3.1', question: 'Complete each statement about generation settings.', parts: [
    'For consistent, factual extraction you should use a ',
    { options: ['low temperature', 'high temperature', 'maximum top_p and temperature together', 'very small max output tokens'], answer: 0 },
    '. If a reply ends mid-sentence and the response status is incomplete, increase ',
    { options: ['max output tokens', 'temperature', 'the number of deployments', 'top_p'], answer: 0 },
    '.',
  ], explanation: 'Lower temperature gives steadier wording. A reply that stops early is usually capped by **max output tokens**.' },
  { kind: 'order', id: 'agt-g-order-trace', domain: 2, objective: '2.3.3', question: 'You must send traces from a Python agent to Application Insights. Which four actions should you perform in sequence?', actions: ['Connect an Application Insights resource to the Foundry project', 'Opt in to GenAI tracing with the environment variable', 'Configure Azure Monitor with the project’s connection string and instrument the SDK', 'Run the agent', 'Disable local authentication on the Foundry resource'], answer: [0, 1, 2, 3], explanation: 'Connect the **destination**, **opt in**, **configure the exporter and instrument**, then run. Disabling keys is a security task, not a tracing step.' },
  { kind: 'match', id: 'agt-g-match-routing', domain: 2, objective: '2.3.4', question: 'Match each request to the cheapest component that handles it correctly.', itemsLabel: 'Components', items: ['Rules engine', 'Small language model', 'Large or reasoning model'], targets: [
    { text: 'Refunds up to ₹5,000 are auto-approved by policy', answer: 0 },
    { text: 'Label 50,000 reviews as positive, neutral or negative', answer: 1 },
    { text: 'Compare three warranty plans against a café’s usage and recommend one', answer: 2 },
  ], explanation: 'A **policy limit** is exact, so code decides it. **Simple classification** at volume suits a small model. **Open-ended multi-part reasoning** is what the large model is for.' },
];

export const SORT: SortSet[] = [
  {
    id: 'agt-genai-which-tool', title: 'Which agent capability fits?', icon: '🧰', intro: 'Pick the tool or feature for each agent requirement.', topic: 'agents-with-retrieval-functions-and-memory',
    buckets: ['Function calling', 'File search or AI Search', 'Memory', 'Approval or guardrail'],
    items: [
      { text: 'Check the live delivery status of an order', bucket: 0, why: 'Live data in a system needs a function your code runs.' },
      { text: 'Call your company’s own pricing logic', bucket: 0, why: 'Custom code is a function tool.' },
      { text: 'Answer from a 40-page returns policy PDF', bucket: 1, why: 'Search over documents grounds the answer.' },
      { text: 'Ground answers on a product-manual index with citations', bucket: 1, why: 'Azure AI Search over curated content.' },
      { text: 'Remember a customer prefers WhatsApp updates', bucket: 2, why: 'Preferences that last across conversations belong in memory.' },
      { text: 'Recall a user’s name in a conversation next week', bucket: 2, why: 'Memory is long-term; the thread is short-term.' },
      { text: 'Pause before money is refunded', bucket: 3, why: 'Mark the tool as approval required.' },
      { text: 'Never refund above ₹20,000 whatever the model decides', bucket: 3, why: 'A hard limit in code.' },
    ],
  },
  {
    id: 'agt-genai-which-evaluator', title: 'Which evaluator finds it?', icon: '📏', intro: 'Match each problem to the evaluator or check that finds it.', topic: 'evaluate-models-and-apps',
    buckets: ['Groundedness', 'Relevance', 'Safety evaluator', 'Agent evaluator'],
    items: [
      { text: 'The answer promises a voucher the context never mentions', bucket: 0, why: 'Claims unsupported by the context are fabrications.' },
      { text: 'The answer cites facts that contradict the retrieved text', bucket: 0, why: 'Groundedness compares with the context.' },
      { text: 'The reply is accurate but answers a different question', bucket: 1, why: 'Relevance measures how well it answers the query.' },
      { text: 'The reply is vague and ignores what was asked', bucket: 1, why: 'Low relevance.' },
      { text: 'A document hides instructions the agent follows', bucket: 2, why: 'The indirect attack evaluator checks this.' },
      { text: 'A reply contains violent content', bucket: 2, why: 'Content harm evaluators score it.' },
      { text: 'The agent called a tool with an argument the user never gave', bucket: 3, why: 'Tool call accuracy.' },
      { text: 'The agent ignored an instruction to ask for the order number', bucket: 3, why: 'Task adherence.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Groundedness', topic: 'evaluate-models-and-apps', clues: ['I compare an answer with the context you supplied.', 'A fabricated voucher makes my score drop to 1.', 'I care about support, not about style.'] },
  { answer: 'Handoff', topic: 'multi-agent-orchestration', clues: ['Control moves from one agent to another.', 'Triage passes you to billing, billing passes you to delivery.', 'The conversation decides the route, not a fixed order.'] },
  { answer: 'approval_mode="always_require"', topic: 'autonomous-workflows-with-approvals', clues: ['I stop a run at one tool call.', 'A person must decide before the tool runs.', 'I belong on the tool that moves money.'] },
  { answer: 'DefaultAzureCredential', topic: 'foundry-sdks-and-connectors', clues: ['I try several ways to sign in, in order.', 'I let your laptop and a managed identity use the same code.', 'No key ever appears in the source.'] },
  { answer: 'Temperature', topic: 'prompt-engineering-and-parameters', clues: ['Turn me down for steady, factual wording.', 'Turn me up for brainstorming.', 'Reasoning models don’t take me at all.'] },
  { answer: 'Span', topic: 'tracing-and-token-analytics', clues: ['I’m one timed step inside a trace.', 'A model call, a tool call and an agent run are each me.', 'The slowest of me is the first thing to fix.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'multi-agent-orchestration-patterns-compared',
    title: 'Multi-Agent Orchestration Patterns: Sequential, Concurrent, Handoff, Group Chat, Magentic',
    seoTitle: 'Multi-Agent Orchestration Patterns Compared | AI-103',
    description: 'Sequential, concurrent, handoff, group chat and Magentic orchestration in Microsoft Agent Framework: how control moves, what each costs and when to pick it.',
    answer: 'Pick by **who decides the next step**. **Sequential** runs agents in a fixed line. **Concurrent** runs agents at the same time and merges the results. **Handoff** lets the current agent pass control to a better one. **Group chat** has a manager choose who speaks next. **Magentic** has a manager plan open-ended work and delegate it.',
    cols: ['Sequential', 'Concurrent', 'Handoff', 'Group chat', 'Magentic'],
    rows: [
      ['Who decides the next step', 'You, in advance', 'You, in advance (all at once)', 'The current agent', 'A manager picks the speaker', 'A manager plans and delegates'],
      ['Agents see', 'The previous output', 'The same input', 'The whole conversation', 'One shared conversation', 'The plan and results'],
      ['Speed', 'Adds up per step', 'About the slowest agent', 'Depends on the path', 'Several rounds', 'Most calls, slowest'],
      ['Predictability', 'High', 'High', 'Medium', 'Medium', 'Lowest'],
      ['Typical use', 'Draft, then review', 'Independent checks', 'Triage to specialists', 'Debate and refinement', 'Open-ended research tasks'],
    ],
    pick: [['Sequential', 'the steps and their order are known'], ['Concurrent', 'tasks are independent and speed matters'], ['Handoff', 'the right specialist depends on the conversation'], ['Magentic', 'the steps can’t be known up front']],
    examTip: '“A fixed pipeline, each agent builds on the last” = **sequential**. “Same input to several agents and combine” = **concurrent**. “Transfer the conversation to a specialist” = **handoff**. “A manager builds a plan and tracks tasks” = **Magentic**.',
    sim: { mode: 'agentgen', start: 7, tour: 'agt-genai-multi-agent', intro: 'Run each pattern and watch how control moves.' },
    lessons: ['multi-agent-orchestration'],
    faq: [['Do I always need several agents?', 'No. One agent with a few good tools is simpler and cheaper. Split into several agents when instructions grow long or tools start to collide.'], ['Where do I build these?', 'Microsoft Agent Framework has builders for each pattern, and Foundry Agent Service can host the agents.']],
  },
  {
    slug: 'prompt-engineering-vs-rag-vs-fine-tuning',
    title: 'Prompt Engineering vs RAG vs Fine-Tuning',
    seoTitle: 'Prompt Engineering vs RAG vs Fine-Tuning | AI-103',
    description: 'Compare prompt engineering, retrieval-augmented generation and fine-tuning for Foundry apps: what each changes, what it costs and which problem it solves.',
    answer: 'Start with **prompt engineering**: change the instructions and examples. Add **RAG** when the model needs **your current facts**. Consider **fine-tuning** only when you need a consistent **style or format** that prompts can’t deliver, because it changes behaviour but isn’t a reliable way to add facts.',
    cols: ['Prompt engineering', 'RAG', 'Fine-tuning'],
    rows: [
      ['What changes', 'The instructions and examples', 'The context sent with each question', 'The model’s weights'],
      ['Best for', 'Tone, format, rules', 'Private or fast-changing facts, citations', 'Consistent style or a narrow task at scale'],
      ['Effort', 'Minutes', 'Index and retrieval to build', 'Training data, training run and hosting'],
      ['Updating', 'Edit the text', 'Update the index', 'Train again'],
      ['Risk', 'Prompt drift', 'Bad retrieval gives bad answers', 'Needs good labelled data'],
    ],
    pick: [['Prompt engineering', 'the model knows enough and just needs better direction'], ['RAG', 'the answer must come from your documents'], ['Fine-tuning', 'you need a consistent format at high volume and prompts aren’t enough']],
    examTip: '“Answer from our latest policy documents” = **RAG**. “Always reply in this exact format” = **prompt first**, fine-tune only if that fails. Facts that change weekly never belong in fine-tuning.',
    sim: { mode: 'agentgen', start: 1, tour: 'agt-genai-rag', intro: 'Ask with and without retrieval.' },
    lessons: ['rag-in-an-application', 'prompt-engineering-and-parameters'],
    faq: [['Can I combine them?', 'Yes. Most production apps use good prompts and RAG, and a few add fine-tuning.'], ['Does RAG stop all made-up answers?', 'No. It lowers them. Tell the model to say it doesn’t know, and check groundedness with an evaluator.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'foundry-agent-service', name: 'Foundry Agent Service', cat: 'AI platform', icon: '🤖', model: 'Managed agent runtime', what: 'Hosts agents built from a model, instructions and tools. It stores conversations, runs tool calls, supports file search, Azure AI Search, MCP, functions and memory, and versions every change to an agent.', use: ['Support and order agents with tools', 'Agents grounded on company documents', 'Agents that remember users'], avoid: ['A single prompt with no tools (call the model directly)', 'Logic that must be exact (use code)'], feel: 2, price: 'No separate agent fee; you pay for model tokens and for the tools you use, such as Azure AI Search (illustrative)', sim: { mode: 'agentgen', start: 5, tour: 'agt-genai-design-agent', intro: 'Ask with and without an order number.' }, similar: ['microsoft-agent-framework', 'foundry-sdk-azure-ai-projects'], aws: 'Amazon Bedrock Agents', lesson: 'design-agents-roles-goals-and-tools' },
  { slug: 'microsoft-agent-framework', name: 'Microsoft Agent Framework', cat: 'AI tools', icon: '🧭', model: 'Open-source agent SDK', what: 'An open-source SDK for Python and .NET to build agents and workflows, with orchestration builders for sequential, concurrent, handoff, group chat and Magentic patterns, tools with approval modes, and a Foundry chat client.', use: ['Multi-agent workflows', 'Tools that need human approval', 'Code-first agent apps'], avoid: ['A simple one-agent chatbot (the Foundry SDK is enough)'], feel: 1, price: 'Free and open source; you pay for the models and services it calls (illustrative)', sim: { mode: 'agentgen', start: 7, tour: 'agt-genai-multi-agent', intro: 'Run each orchestration pattern.' }, similar: ['foundry-agent-service'], aws: 'Strands Agents SDK', lesson: 'multi-agent-orchestration' },
  { slug: 'foundry-sdk-azure-ai-projects', name: 'Foundry SDK (azure-ai-projects)', cat: 'AI tools', icon: '🧰', model: 'Client library', what: 'AIProjectClient connects an app to a Foundry project with one endpoint and Microsoft Entra ID. It returns an OpenAI-compatible client and gives access to deployments, connections, agents, evaluations and telemetry.', use: ['Calling model deployments from Python', 'Creating and running agents', 'Reading project connections'], avoid: ['Calling a model with a pasted API key'], feel: 1, price: 'Free library; you pay for the models and services your calls use (illustrative)', sim: { mode: 'agentgen', start: 4, tour: 'agt-genai-sdk', intro: 'Sign in keyless and read a connection.' }, similar: ['foundry-agent-service'], aws: 'AWS SDK for Bedrock runtime', lesson: 'foundry-sdks-and-connectors' },
];
