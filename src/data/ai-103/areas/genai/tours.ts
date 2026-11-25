/**
 * AI-103 genai area: guided walkthroughs of the Foundry portal (ai.azure.com)
 * for deploying and calling models, RAG, workflows, evaluations, the SDK
 * endpoint and connections, agents (design, tools, memory, multi-agent,
 * approvals, monitoring), prompt tuning, tracing and routing. Names follow
 * Microsoft Learn (checked 25 Nov 2026); screens are simplified. Education
 * only; nothing here talks to Azure or to a model.
 */
import { form, note, code, tbl, sel, txt, ro, pane, type Tour, type Step, type Screen, type Body, type Menu } from '../../tour-kit';

const FMENU: Menu = ['Overview', ['Discover', ['Model catalog', 'Foundry Tools']], ['Build', ['Agents', 'Workflows', 'Models + endpoints', 'Playgrounds', 'Knowledge', 'Evaluations']], ['Operate', ['Monitoring', 'Tracing']], ['Settings', ['Connected resources', 'Keys and endpoints']]];
/** A screen inside the Foundry project "order-desk" of the resource "contoso-agents". */
const fp = (active: string, body?: Body[], cmds?: string[]): Screen => ({ s: 'res', title: 'order-desk', type: 'Foundry project · contoso-agents', i: 'foundry', menu: FMENU, active, body, cmds, crumbs: ['contoso-agents'] });
const F = (sc: Screen, t: string, say: string, extra: Partial<Step> = {}): Step => ({ sc, t, say, chrome: 'foundry', ...extra });

const DEPLOYED = tbl(['Name', 'Model', 'Deployment type', 'Capacity (TPM)'], [['support-chat', 'gpt-4.1-mini', 'Global Standard', '50K'], ['label-fast', 'Phi-4-mini-instruct', 'Global Standard', '50K'], ['embed-small', 'text-embedding-3-small', 'Global Standard', '120K']], 'Model deployments', ['+ Deploy model']);

export const TOURS: Record<string, Tour> = {
  /* ===== 2.1.1: deploy and consume models ===== */
  'agt-genai-deploy': {
    title: 'Deploy a large and a small model, then call them',
    steps: [
      F(fp('Models + endpoints', [tbl(['Name', 'Model', 'Deployment type', 'Capacity (TPM)'], [], 'Model deployments')], ['+ Deploy model']), 'cmd:+ Deploy model', 'Open **Build ➜ Models + endpoints** and select **+ Deploy model**. A deployment is what your app calls.'),
      F(fp('Models + endpoints'), 'btn:Deploy', 'Pick **gpt-4.1-mini** for general work. The **deployment name** is the name your code will use, so choose one that describes the job, not the model.', { pane: pane('Deploy gpt-4.1-mini', [{ f: [txt('Deployment name *', 'support-chat', 'Your app passes this name, not the model name'), sel('Deployment type', 'Global Standard', 'Pay per token; processing can happen in any region'), sel('Model version', '2025-04-14', 'Pin it or let it auto-update to the default'), txt('Tokens per minute (thousands)', '50'), sel('Guardrail', 'Microsoft.DefaultV2')] }], ['Deploy', 'Cancel']) }),
      F(fp('Models + endpoints'), 'btn:Deploy', 'Add a **small language model** for cheap, high-volume work such as labelling. Same project, a second deployment.', { pane: pane('Deploy Phi-4-mini-instruct', [{ f: [txt('Deployment name *', 'label-fast'), sel('Deployment type', 'Global Standard'), txt('Tokens per minute (thousands)', '50')] }], ['Deploy', 'Cancel']) }),
      F(fp('Models + endpoints', [DEPLOYED]), 'row:support-chat', 'Both deployments appear. Open **support-chat** to test it.'),
      F(fp('Playgrounds'), 'menu:Tracing', 'In the **chat playground** pick the deployment, write instructions and ask a question. **View code** shows the same call as Python, using the project endpoint and keyless sign-in.', { pane: { title: 'Chat playground · support-chat', chat: [{ q: 'In one sentence, why do apps call a deployment name?', a: 'The deployment name points to one model version, deployment type and quota, so you can change the model behind it without changing the app.' }], body: [code('openai = project.get_openai_client()\nr = openai.responses.create(model="support-chat", input="...")\nprint(r.output_text, r.usage.input_tokens, r.usage.output_tokens)', 'View code')] } }),
    ],
  },

  /* ===== 2.1.2: RAG ===== */
  'agt-genai-rag': {
    title: 'Ground an answer on your own documents with Azure AI Search',
    steps: [
      F(fp('Connected resources', [tbl(['Name', 'Type', 'Target', 'Authentication'], [], 'Connected resources')], ['+ New connection']), 'cmd:+ New connection', 'Open **Settings ➜ Connected resources** and add a connection to **Azure AI Search**.'),
      F(fp('Connected resources'), 'btn:Add connection', 'Choose the search service and **Microsoft Entra ID** as the authentication method. The project’s managed identity needs **Search Index Data Reader** on the service.', { pane: pane('Connect Azure AI Search', [{ f: [sel('Azure AI Search service', 'srch-contoso-agents'), txt('Connection name', 'search-contoso'), sel('Authentication', 'Microsoft Entra ID', 'Keyless')] }], ['Add connection', 'Cancel']) }),
      F(fp('Knowledge', [tbl(['Index', 'Documents', 'Vector field', 'Embedding model'], [['policies-index', '10 chunks', 'contentVector', 'text-embedding-3-small']], 'Indexes')]), 'row:policies-index', 'The documents were **split into chunks** (about 500 tokens with a small overlap), **embedded**, and uploaded to **policies-index**. Open it.'),
      F(fp('Knowledge', [form([{ h: 'Search explorer', f: [txt('Query', 'How many days do I have to return a damaged kettle?'), sel('Search type', 'Hybrid (keyword + vector)'), sel('Top K', '3')] }], 'Search')]), 'btn:Search', 'Try a query. **Hybrid** search combines keywords and vectors, and returns the top chunks with their source file.'),
      F(fp('Playgrounds'), 'menu:Evaluations', 'In the chat playground add your data and test. The reply cites the chunk it used. Ask something the documents don’t cover, and it should say it doesn’t know.', { pane: { title: 'Chat playground · support-chat + policies-index', chat: [{ q: 'How many days do I have to return a damaged kettle?', a: 'Damaged or faulty items can be returned within **10 days** for a full refund. 【refund-policy.pdf#1】' }, { q: 'Do you sell gift cards?', a: 'I don’t know. The policy documents don’t cover gift cards.' }] } }),
    ],
  },

  /* ===== 2.1.3: workflows ===== */
  'agt-genai-workflow': {
    title: 'Build a classify, extract, check and draft flow',
    steps: [
      F(fp('Workflows', [tbl(['Workflow', 'Type', 'Last run'], [], 'Workflows')], ['+ Create workflow']), 'cmd:+ Create workflow', 'Open **Build ➜ Workflows**. A workflow lets you wire steps together visually, or in code, with branches and checks.'),
      F(fp('Workflows', [tbl(['Step', 'Kind', 'Setting'], [['1 Classify', 'Agent / model call', 'Temperature 0, labels: warranty, refund, other'], ['2 Extract', 'Model call', 'Structured output with a JSON schema'], ['3 check_warranty', 'Function', 'Retry 3 times, then go to Review'], ['4 Draft', 'Model call', 'Uses the facts from step 3'], ['5 Verify', 'Condition', 'Serial number quoted and date matches the tool']], 'Claim flow')]), 'row:3 check_warranty', 'Each step has one job. Step 3 calls a **real system** as a tool, so it has a **retry** and a branch for when the system is down.'),
      F(fp('Workflows', [form([{ h: 'Step 3 · check_warranty', f: [sel('On failure', 'Retry 3 times, then continue to “Review”'), sel('Timeout', '10 seconds'), txt('Fallback value', 'needs_human_review')] }], 'Save')]), 'btn:Save', 'Decide what happens on failure **before** it happens: retry, then a safe fallback that the next steps respect.'),
      F(fp('Workflows', [note('Run 1: all five steps passed. Reply sent.', 'ok'), note('Run 2: check_warranty timed out three times. The flow went to **Review** and nothing was sent.', 'warn')]), 'menu:Tracing', 'The run history shows which step each run reached. Tracing (a later lesson) shows the detail inside each step.'),
    ],
  },

  /* ===== 2.1.4: evaluate ===== */
  'agt-genai-evaluate': {
    title: 'Run evaluators on a dataset and read the scores',
    steps: [
      F(fp('Evaluations', [tbl(['Evaluation', 'Target', 'Status'], [], 'Evaluations')], ['+ New evaluation']), 'cmd:+ New evaluation', 'Open **Build ➜ Evaluations** and select **+ New evaluation**.'),
      F(fp('Evaluations'), 'btn:Create', 'Choose what to evaluate (a dataset, a model or an agent), the **dataset**, and the **evaluators**. AI-assisted ones use a **judge model**.', { pane: pane('Create an evaluation', [{ f: [sel('Evaluate', 'Dataset'), ro('Dataset', 'rag-eval.jsonl · 5 rows (query, context, response, ground_truth)'), sel('Evaluators', 'Groundedness, Relevance, Coherence, Violence'), sel('Judge model deployment', 'support-chat')] }], ['Create', 'Cancel']) }),
      F(fp('Evaluations', [tbl(['Row', 'Groundedness', 'Relevance', 'Coherence'], [['1', '5', '5', '5'], ['2', '5', '5', '5'], ['3', '5', '5', '5'], ['4', '1 ✗', '3', '4'], ['5', '4', '4', '5']], 'Results (1 to 5, pass at 3)')]), 'row:4', 'Row 4 scores **1 on groundedness**. Open it to see why.'),
      F(fp('Evaluations', [note('Query: When will my refund arrive?\nContext: Refunds reach the original payment method in 5 to 7 working days.\nResponse: “Refunds arrive instantly as store credit, plus a ₹500 voucher.”', 'bad'), note('The response promises things the context never says. That’s a **fabrication**. Fix the prompt or the retrieval, then run the evaluation again to prove it.', 'info')]), 'menu:Monitoring', '**Groundedness** compares the answer with the context you supplied. A low score on one row finds a fabrication that an average would hide.'),
    ],
  },

  /* ===== 2.1.5 + 2.1.6: SDK and connections ===== */
  'agt-genai-sdk': {
    title: 'Find the project endpoint and use it from the SDK',
    steps: [
      F(fp('Overview', [form([{ h: 'Project details', f: [ro('Project name', 'order-desk'), ro('Project endpoint', 'https://contoso-agents.services.ai.azure.com/api/projects/order-desk', 'Use this with AIProjectClient'), ro('Azure OpenAI endpoint', 'https://contoso-agents.openai.azure.com/')] }])]), 'f:Project endpoint', 'The project **Overview** shows the **project endpoint**. That one URL is what `AIProjectClient` needs.'),
      F(fp('Overview', [code('# pip install "azure-ai-projects>=2.3.0" azure-identity\nfrom azure.identity import DefaultAzureCredential\nfrom azure.ai.projects import AIProjectClient\n\nproject = AIProjectClient(\n    endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],\n    credential=DefaultAzureCredential())   # Microsoft Entra ID, no key\nopenai = project.get_openai_client()', 'Python')]), 'menu:Connected resources', 'Keep the endpoint in an **environment variable** and sign in with **DefaultAzureCredential**. Your own sign-in works on your laptop; a managed identity works in Azure.'),
      F(fp('Connected resources', [tbl(['Name', 'Type', 'Target', 'Authentication'], [['search-contoso', 'Azure AI Search', 'https://srch-contoso-agents.search.windows.net', 'Microsoft Entra ID']], 'Connected resources')], ['+ New connection']), 'row:search-contoso', 'A **connection** stores a target and how to authenticate to it. The app reads it with `project.connections.get("search-contoso")` instead of holding the URL or a key.'),
      F(fp('Connected resources', [form([{ h: 'Application Insights', f: [txt('Connection name', 'appi-agents'), ro('Authentication', 'Microsoft Entra ID')] }], 'Connect')]), 'btn:Connect', 'Connecting **Application Insights** lets the SDK find where traces should go. Later lessons use it.'),
    ],
  },

  /* ===== 2.2.1: design an agent ===== */
  'agt-genai-design-agent': {
    title: 'Define a role, a goal and a strict function tool',
    steps: [
      F(fp('Agents', [tbl(['Agent', 'Model', 'Versions'], [], 'Agents')], ['+ New agent']), 'cmd:+ New agent', 'Open **Build ➜ Agents** and create an agent. Each save becomes a numbered **version**.'),
      F(fp('Agents', [form([{ h: 'Setup', f: [txt('Agent name', 'order-agent'), sel('Model deployment', 'support-chat'), txt('Instructions', 'Role: Contoso Retail’s order assistant. Goal: tell customers where their order is. Always call get_order_status for order questions. If the order number is missing, ask for it. Never promise a date the tool didn’t return.')] }], 'Save')]), 'btn:Save', 'Instructions carry the **role**, the **goal** and the **rules**. Say what to do when information is missing.'),
      F(fp('Agents', [form([{ h: 'Tools · Add a function', f: [txt('Name', 'get_order_status'), txt('Description', 'Look up the delivery status of one order. Call it whenever the customer gives an order number.'), ro('Parameters', 'order_id (string, required): Order number, for example ORD-1042'), ['Strict schema', 'On', 'tg']] }], 'Add tool')]), 'btn:Add tool', 'A function tool is a **name**, a **description** and a **JSON schema**. Mark **order_id** required and the schema **strict**, so arguments always match.'),
      F(fp('Agents'), 'menu:Tracing', 'Test in the playground. Without a number the agent asks for it. With one, the model **requests** the function and your app runs it. Each chat is a **conversation** that stores the messages for you.', { pane: { title: 'Agent playground · order-agent v1', chat: [{ q: 'Where is my order?', a: 'Happy to check. What’s your order number? It looks like ORD-1234.' }, { q: 'ORD-1042', a: 'ORD-1042 shipped yesterday and arrives Friday. 【get_order_status】' }] } }),
    ],
  },

  /* ===== 2.2.2 + 2.2.3: retrieval, functions and memory ===== */
  'agt-genai-agent-tools': {
    title: 'Attach file search, a function and memory to one agent',
    steps: [
      F(fp('Agents', [form([{ h: 'Tools', f: [['File search', 'On (vector store: policies)', 'tg'], ro('Function', 'get_order_status'), sel('Add a tool', 'Azure AI Search · Code interpreter · MCP · OpenAPI · Content Understanding')] }], 'Save')]), 'btn:Save', 'Tools come in kinds. **File search** reads documents, **Azure AI Search** reads your index, **MCP** and **OpenAPI** call outside services, and a **function** runs your own code.'),
      F(fp('Agents', [form([{ h: 'File search', f: [txt('Vector store', 'policies'), ro('Files', 'refund-policy.pdf · delivery-faq.md · warranty.pdf'), ro('Chunking', 'Auto (800 tokens, 400 overlap)')] }], 'Update')]), 'btn:Update', 'File search chunks and embeds uploaded files into a **vector store**. The agent searches it when a question needs the documents.'),
      F(fp('Agents', [form([{ h: 'Memory (preview)', f: [['Memory', 'On', 'tg'], txt('Memory store', 'customer-memory'), txt('Scope', '{{$userId}}', 'One memory per customer'), ro('Needs', 'A chat deployment and an embedding deployment')] }], 'Save')]), 'btn:Save', '**Memory** keeps facts about a user across conversations. Set the **scope** so each customer only sees their own.'),
      F(fp('Agents'), 'menu:Tracing', 'Try it. A policy question uses file search, an order question uses the function, and a new conversation next week still knows the preference.', { pane: { title: 'Agent playground · order-agent v3', chat: [{ q: 'What is the return window for a damaged kettle?', a: 'Damaged items can be returned within **10 days**. 【refund-policy.pdf】' }, { q: '(next week, new conversation) Any news on ORD-1042?', a: 'It arrives Friday. I’ll send the tracking link on WhatsApp, as you asked last time.' }] } }),
    ],
  },

  /* ===== 2.2.4: multi-agent ===== */
  'agt-genai-multi-agent': {
    title: 'Connect specialist agents in a workflow',
    steps: [
      F(fp('Workflows', [tbl(['Workflow', 'Pattern', 'Agents'], [], 'Workflows')], ['+ Create workflow']), 'cmd:+ Create workflow', 'Open **Build ➜ Workflows** and create a workflow of agents.'),
      F(fp('Workflows', [tbl(['Agent', 'Job', 'Tools'], [['triage', 'Work out what the customer needs. Don’t answer.', 'none'], ['billing', 'Billing and refund questions', 'policy search'], ['delivery', 'Delivery questions', 'get_order_status'], ['writer', 'One friendly reply from the notes', 'none'], ['reviewer', 'Check the reply against policy', 'none']], 'Agents')]), 'row:triage', 'Give each agent **one narrow job** with its own instructions and tools. Small agents are easier to test than one agent that does everything.'),
      F(fp('Workflows', [form([{ h: 'Pattern', f: [sel('Orchestration', 'Sequential', 'Also: Concurrent · Handoff · Group chat · Magentic'), ro('Participants', 'triage → writer → reviewer')] }], 'Save')]), 'btn:Save', 'Pick the **orchestration pattern**. Sequential is a fixed line, concurrent fans out and merges, handoff passes control, group chat has a manager picking speakers, and Magentic plans open-ended work.'),
      F(fp('Workflows', [note('triage → “billing + delivery problem”\nwriter → drafts one reply\nreviewer → “APPROVED”', 'ok')]), 'menu:Tracing', 'Run it. The trace shows each agent’s turn, so you can see where the answer went wrong when it does.'),
    ],
  },

  /* ===== 2.2.5: approvals ===== */
  'agt-genai-approvals': {
    title: 'Require approval for a risky tool',
    steps: [
      F(fp('Agents', [form([{ h: 'Tools', f: [ro('lookup_order', 'Read-only · no approval'), ro('issue_refund', 'Writes money · approval required')] }, { h: 'issue_refund', f: [sel('Require approval', 'Always', 'Other values: Never · Per call by rule'), txt('Approvers', 'support-managers')] }], 'Save')]), 'btn:Save', 'Reads can run freely. **issue_refund** moves money, so set it to **always require approval**. The run stops at that call and waits.'),
      F(fp('Agents', [tbl(['Request', 'Tool', 'Amount', 'Status'], [['apr-1', 'issue_refund', '₹1,200', 'Pending']], 'Approval requests')]), 'row:apr-1', 'A paused run appears as a **pending request** with the exact arguments. The reviewer sees what would happen before it does.'),
      F(fp('Agents', [form([{ h: 'Review apr-1', f: [ro('Tool', 'issue_refund'), ro('Arguments', 'order_id: ORD-1042 · amount_inr: 1200'), sel('Decision', 'Approve', 'Or Reject')] }], 'Submit decision')]), 'btn:Submit decision', 'Approve or reject. The run resumes either way, and the decision is recorded.'),
      F(fp('Agents', [note('Approval does not replace limits in code. Refunds over ₹20,000 are blocked by a hard rule inside the tool, so nobody can approve them from the chat.', 'warn')]), 'menu:Tracing', 'Put **hard limits in code** for what no one should approve, and keep a trace so an auditor can see who decided and when.'),
    ],
  },

  /* ===== 2.2.6: monitor agents ===== */
  'agt-genai-monitor-agents': {
    title: 'Evaluate agent runs and read the error analysis',
    steps: [
      F(fp('Evaluations', [tbl(['Evaluation', 'Target', 'Status'], [], 'Evaluations')], ['+ New evaluation']), 'cmd:+ New evaluation', 'Open **Evaluations** and start a new evaluation of an **agent**.'),
      F(fp('Evaluations'), 'btn:Create', 'Choose the agent evaluators. They read the whole run, including tool calls.', { pane: pane('Create an evaluation', [{ f: [sel('Evaluate', 'Agent'), ro('Dataset', 'agent-runs.jsonl · 4 runs'), sel('Evaluators', 'Intent resolution, Tool call accuracy, Task adherence'), sel('Judge model deployment', 'support-chat')] }], ['Create', 'Cancel']) }),
      F(fp('Evaluations', [tbl(['Run', 'Intent resolution', 'Tool call accuracy', 'Task adherence'], [['1', '5', '5', 'Pass'], ['2', '3', '2 ✗', 'Fail'], ['3', '2 ✗', '1 ✗', 'Fail'], ['4', '5', '5', 'Pass']], 'Results')]), 'row:2', 'Runs 2 and 3 fail. Open run 2.'),
      F(fp('Evaluations', [note('Run 2 called get_order_status with order_id “ORD-0000”, which the user never gave.', 'bad'), note('Run 3 said “Your order is cancelled” without calling any tool.', 'bad'), note('Fix: instruct the agent to ask for a missing number, and add a cancel_order tool that requires approval.', 'ok')]), 'menu:Monitoring', '**Error analysis** groups failures into causes you can act on. Then re-run the same dataset to prove the fix.'),
    ],
  },

  /* ===== 2.3.1 + 2.3.2: tune ===== */
  'agt-genai-tune': {
    title: 'Tune instructions and generation parameters',
    steps: [
      F(fp('Playgrounds', [form([{ h: 'Instructions', f: [txt('System message', 'You are Contoso’s product copywriter. Write a product description for an Indian online shop. Plain English, mention the warranty, under 60 words.')] }], 'Apply changes')]), 'btn:Apply changes', 'Start with clear **instructions**: who the model is, the audience, the rules and the length.'),
      F(fp('Playgrounds', [form([{ h: 'Parameters', f: [txt('Temperature', '0.2', 'Lower = steadier wording; higher = more varied'), txt('Top P', '1', 'Change temperature or top P, not both'), txt('Max output tokens', '300', 'A cap on the answer length')] }], 'Apply changes')]), 'f:Temperature', 'For facts and extraction use a **low temperature**. Raise it for brainstorming. **Max output tokens** limits the reply, and too low a value cuts it off.'),
      F(fp('Playgrounds', [form([{ h: 'Few-shot example', f: [txt('Example input', 'steel water bottle'), txt('Example output', 'Keeps chai hot for 12 hours. Leak-proof lid, 1-year warranty.')] }], 'Apply changes')]), 'btn:Apply changes', 'One **worked example** often fixes format and tone faster than more rules.'),
      F(fp('Playgrounds'), 'menu:Evaluations', 'Compare outputs side by side, then lock in the winner with an evaluation. A reasoning model such as o4-mini ignores temperature and uses **reasoning effort** instead.', { pane: { title: 'Playground', chat: [{ q: 'steel mixer grinder, 750 W (temperature 0.2, one example)', a: 'Grinds chutney and dosa batter in seconds. 750 W motor, three jars, 1-year warranty.' }, { q: 'steel mixer grinder, 750 W (temperature 1.4, no example)', a: 'Whirl, blend, conquer! Your kitchen superhero has arrived…' }] } }),
    ],
  },

  /* ===== 2.3.3: tracing ===== */
  'agt-genai-tracing': {
    title: 'Read a trace with tokens and latency',
    steps: [
      F(fp('Connected resources', [tbl(['Name', 'Type', 'Target', 'Authentication'], [['appi-agents', 'Application Insights', 'appi-agents', 'Microsoft Entra ID']], 'Connected resources')]), 'row:appi-agents', 'Tracing needs an **Application Insights** connection on the project. That’s where the spans are stored.'),
      F(fp('Tracing', [tbl(['Trace', 'Agent', 'Duration', 'Tokens'], [['trace-1', 'order-agent', '3.7 s', '412 in / 96 out'], ['trace-2', 'order-agent', '1.2 s', '388 in / 52 out']], 'Traces')]), 'row:trace-1', 'The **Tracing** page lists runs with duration and tokens. Open the slow one.'),
      F(fp('Tracing', [tbl(['Span', 'Duration', 'Tokens'], [['invoke_agent order-agent', '2140 ms', '—'], ['chat support-chat (plan)', '610 ms', '412'], ['execute_tool get_order_status', '940 ms', '—'], ['chat support-chat (answer)', '590 ms', '96']], 'Spans')]), 'row:execute_tool get_order_status', 'Each **span** is one step: the agent run, a model call with its tokens, and a tool call. The tool call is the slowest, so that’s where to look first.'),
      F(fp('Tracing', [note('Message content (prompts and answers) is **not** recorded by default. Switching on content recording helps debugging but may capture personal data, so keep it for development.', 'warn'), code('export AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING=true\nexport OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=false', 'Environment')]), 'menu:Monitoring', 'Tracing in code is **opt-in** and content capture is a **separate** switch. **Monitoring** then gives token and latency charts from the same data.'),
    ],
  },

  /* ===== 2.3.4: route multiple models ===== */
  'agt-genai-route': {
    title: 'Deploy a small and a large model, then route between them',
    steps: [
      F(fp('Models + endpoints', [DEPLOYED]), 'row:label-fast', 'Deploy a **small** model for easy work and a **large** one for hard work. Each gets its own deployment name and quota.'),
      F(fp('Models + endpoints', [form([{ h: 'Model router (preview)', f: [txt('Deployment name', 'auto-router'), sel('Routing mode', 'Balanced', 'Also: Cost · Quality'), ro('Model subset', 'gpt-4.1-nano, gpt-4.1-mini, o4-mini')] }], 'Deploy')]), 'btn:Deploy', 'A **model router** deployment picks a model for each prompt for you. It’s one option. Another is your own routing code.'),
      F(fp('Playgrounds', [tbl(['Request', 'Handled by', 'Model calls'], [['What are your store hours?', 'Rules (lookup table)', '0'], ['Refund ₹1,200 for ORD-1042', 'Rules (limit in code)', '0'], ['Classify this review', 'label-fast (small model)', '1'], ['Compare three warranty plans for a café', 'large model', '1']], 'Hybrid routing')]), 'row:Classify this review', '**Rules first**, then the **small model**, and the **large model only when needed**. Two of four requests used no model at all.'),
      F(fp('Monitoring', [note('Single large model: 4 calls, relative cost 100. Rules, small and large: 2 calls, relative cost about 27.', 'ok')]), 'menu:Tracing', 'Watch **Monitoring** and **Tracing** to confirm the router sends what you expect, and tune the rules if too much reaches the large model.'),
    ],
  },
};
