/**
 * AI-103 "genai" practice labs (GenAI & Agents). Ids start agt-. Every task is
 * checked from simulator events, and every `cli` hint completes its task when
 * run as written, in order, in a fresh simulator (scripts/qa/lab-check.ts).
 * The Python apps live in src/lib/sim/agentdev/genai.ts.
 */
import type { Sim } from '../engine';
import type { Lab } from '../labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const ran = (s: Sim, file: string) => ev(s, 'py.run', (d) => d.file === file && d.ok);

const RG = 'rg-agents-genai';
const RES = 'contoso-agents-genai';
const PROJ = 'order-desk';
const EP = `https://${RES}.services.ai.azure.com/api/projects/${PROJ}`;
const BASE = `az group create -n ${RG} -l eastus && az cognitiveservices account create -n ${RES} -g ${RG} -l eastus --kind AIServices --sku S0 --custom-domain ${RES} && az cognitiveservices account project create -n ${RES} -g ${RG} --project-name ${PROJ}`;
const dep = (name: string, model = name) => `az cognitiveservices account deployment create -n ${RES} -g ${RG} --deployment-name ${name} --model-name ${model} --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10`;
const setup = (...deployments: string[]) => [BASE, ...deployments.map((d) => dep(d))].join(' && ');
const hasDeploys = (s: Sim, ...names: string[]) => ev(s, 'foundry.create', (d) => d.name === RES) && ev(s, 'foundry.project', (d) => d.resource === RES && d.name === PROJ) && names.every((n) => ev(s, 'ai.deploy', (d) => d.resource === RES && d.name === n));
const exportEp = `export FOUNDRY_PROJECT_ENDPOINT="${EP}"`;
const epSet = (s: Sim) => ev(s, 'env.set', (d) => d.name === 'FOUNDRY_PROJECT_ENDPOINT' && d.value === EP);
const piped = (s: Sim, ...pkgs: string[]) => pkgs.every((p) => ev(s, 'pip.install', (d) => d.pkgs.includes(p)));

export const LABS: Lab[] = [
  /* ------------------------------------------------ deploy, consume, SDK */
  {
    id: 'agt-genai-deploy-call', title: 'Deploy two models and call them from Python', icon: '🚀', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso Retail wants one app that sends hard questions to a large model and simple ones to a small one. Deploy both, find the project endpoint, call each deployment keylessly, and see what happens when the app passes a model name instead of a deployment name.',
    learn: ['Deployments of a large and a small language model', 'The project endpoint and AIProjectClient', 'Calling the deployment name, not the model name', 'Reading connections and deployments from the project'],
    topics: ['deploy-and-consume-models', 'foundry-sdks-and-connectors'],
    tasks: [
      { text: `Create **${RG}**, a Foundry resource **${RES}**, a project **${PROJ}**, and two deployments: **gpt-4.1-mini** and **Phi-4-mini-instruct**.`, cli: setup('gpt-4.1-mini', 'Phi-4-mini-instruct'), check: (s) => hasDeploys(s, 'gpt-4.1-mini', 'Phi-4-mini-instruct') },
      { text: 'Show the project\'s **endpoint** with the Azure CLI.', cli: `az cognitiveservices account project show -n ${RES} -g ${RG} --project-name ${PROJ} --query properties.endpoints`, check: (s) => ev(s, 'agt.project.show', (d) => d.project === PROJ) },
      { text: 'Install **azure-ai-projects** and **azure-identity**, then set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install "azure-ai-projects>=2.3.0" azure-identity && ${exportEp}`, check: (s) => piped(s, 'azure-ai-projects', 'azure-identity') && epSet(s) },
      { text: 'Read **call_models.py**, then call both deployments with the same question.', cli: 'cat call_models.py && python call_models.py gpt-4.1-mini Phi-4-mini-instruct', check: (s) => ev(s, 'py.view', (d) => d.file === 'call_models.py') && ev(s, 'agt.call', (d) => d.kind === 'chat') && ev(s, 'agt.call', (d) => d.kind === 'slm') },
      { text: 'Pass **gpt-4.1**, a model that isn\'t a deployment here, and read the error.', cli: 'python call_models.py gpt-4.1', check: (s) => ev(s, 'py.run', (d) => d.file === 'call_models.py' && !d.ok) },
      { text: 'List what the project can reach with **list_connections.py**.', cli: 'python list_connections.py', check: (s) => ev(s, 'agt.connections.list', (d) => d.project === PROJ) && ran(s, 'list_connections.py') },
    ],
    wrap: 'A deployment is a named copy of a model with a version, a deployment type and capacity. Your app passes the deployment name to the OpenAI-compatible client that AIProjectClient returns, and signs in with DefaultAzureCredential, so no key lives in the code. A small model is cheaper and faster for easy work; a large one earns its price on hard work. Passing a model name that isn\'t a deployment gives a 404.',
  },

  /* ------------------------------------------------ RAG and evaluation */
  {
    id: 'agt-genai-rag-evaluate', title: 'Ground answers with RAG, then evaluate them', icon: '📚', level: 'Intermediate', minutes: 16, start: 'shell',
    intro: 'The Contoso chatbot guesses return policies. Connect Azure AI Search, ingest the policy documents, compare an answer with and without retrieval, then score a dataset to find the fabricated reply and check safety.',
    learn: ['A project connection to Azure AI Search', 'Chunking, embedding and uploading documents', 'Retrieve, augment, generate with citations', 'Groundedness, relevance and safety evaluators'],
    topics: ['rag-in-an-application', 'evaluate-models-and-apps'],
    tasks: [
      { text: `Create **${RG}**, **${RES}**, the project **${PROJ}**, and deploy **gpt-4.1-mini** and **text-embedding-3-small**.`, cli: setup('gpt-4.1-mini', 'text-embedding-3-small'), check: (s) => hasDeploys(s, 'gpt-4.1-mini', 'text-embedding-3-small') },
      { text: 'Install the SDK, Search and evaluation packages, then set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install "azure-ai-projects>=2.3.0" azure-identity azure-search-documents azure-ai-evaluation && ${exportEp}`, check: (s) => piped(s, 'azure-search-documents', 'azure-ai-evaluation') && epSet(s) },
      { text: 'Read **search-connection.yml**, then create the **search-contoso** connection.', cli: `cat search-connection.yml && az cognitiveservices account project connection create -n ${RES} -g ${RG} --project-name ${PROJ} --connection-name search-contoso --file search-connection.yml`, check: (s) => ev(s, 'py.view', (d) => d.file === 'search-connection.yml') && ev(s, 'agt.connection', (d) => d.name === 'search-contoso' && d.type === 'AzureAISearch') },
      { text: 'Chunk, embed and upload the documents with **ingest_docs.py**.', cli: 'python ingest_docs.py', check: (s) => ev(s, 'agt.rag.ingest', (d) => d.chunks >= 10) },
      { text: 'Ask about the damaged kettle **without retrieval** (`--no-retrieval`). Notice the guess.', cli: 'python rag_app.py --no-retrieval "How many days do I have to return a damaged kettle?"', check: (s) => ev(s, 'agt.rag.ask', (d) => !d.retrieval && !d.grounded) },
      { text: 'Ask the same question **with retrieval** and read the citation.', cli: 'python rag_app.py "How many days do I have to return a damaged kettle?"', check: (s) => ev(s, 'agt.rag.ask', (d) => d.retrieval && d.grounded && d.citations > 0) },
      { text: 'Score **rag-eval.jsonl** for **groundedness** and **relevance**. Find the fabricated row.', cli: 'python evaluate_app.py --data rag-eval.jsonl --evaluators groundedness,relevance', check: (s) => ev(s, 'agt.eval', (d) => d.fabricated && d.evaluators.includes('groundedness')) },
      { text: 'Run the **violence** and **indirect_attack** safety evaluators on the same dataset.', cli: 'python evaluate_app.py --data rag-eval.jsonl --evaluators violence,indirect_attack', check: (s) => ev(s, 'agt.eval', (d) => d.safety) },
    ],
    wrap: 'RAG makes the model answer from your content: search the index (hybrid keyword plus vector), put the best chunks in the prompt, and ask for citations and an honest "I don\'t know". Evaluators then prove it works. Groundedness compares the answer with the context and exposes fabrications, relevance checks it answers the question, and safety evaluators check harm and indirect attacks separately.',
  },

  /* ------------------------------------------------ flows and routing */
  {
    id: 'agt-genai-flow-route', title: 'Build a checked flow, then route between models', icon: '🧩', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'Contoso handles warranty claim emails. Run a five-step flow with a tool and a verification, break the tool to see the fallback, then cut the bill by sending only the hard requests to the large model.',
    learn: ['Classify, extract, call a tool, draft and verify', 'Retries and a safe fallback', 'Rules first, small model next, large model last', 'Comparing a single large model with a cascade'],
    topics: ['workflows-and-tool-augmented-flows', 'orchestrate-multiple-models'],
    tasks: [
      { text: `Create **${RG}**, **${RES}**, the project **${PROJ}**, and deploy **gpt-4.1-mini**, **Phi-4-mini-instruct** and **gpt-4.1**.`, cli: setup('gpt-4.1-mini', 'Phi-4-mini-instruct', 'gpt-4.1'), check: (s) => hasDeploys(s, 'gpt-4.1-mini', 'Phi-4-mini-instruct', 'gpt-4.1') },
      { text: 'Install the SDK and set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install "azure-ai-projects>=2.3.0" azure-identity && ${exportEp}`, check: (s) => piped(s, 'azure-ai-projects') && epSet(s) },
      { text: 'Read **claim_pipeline.py** and run the flow when every step works.', cli: 'cat claim_pipeline.py && python claim_pipeline.py', check: (s) => ev(s, 'py.view', (d) => d.file === 'claim_pipeline.py') && ev(s, 'agt.pipeline', (d) => d.verified && !d.toolFailed) },
      { text: 'Run it again with `--fail-tool` so the warranty check times out. Watch the fallback.', cli: 'python claim_pipeline.py --fail-tool', check: (s) => ev(s, 'agt.pipeline', (d) => d.toolFailed && d.fallback && !d.verified) },
      { text: 'Name the small and large deployments, then send four requests to the **large model only** (`--mode single`).', cli: 'export SMALL_DEPLOYMENT="Phi-4-mini-instruct" && export LARGE_DEPLOYMENT="gpt-4.1" && python route_requests.py --mode single', check: (s) => ev(s, 'agt.route', (d) => d.mode === 'single' && d.llmCalls === 4) },
      { text: 'Now route by **cascade**: rules first, then the small model, then the large one.', cli: 'python route_requests.py --mode cascade', check: (s) => ev(s, 'agt.route', (d) => d.mode === 'cascade' && d.rules >= 2 && d.llmCalls === 2) },
    ],
    wrap: 'A multistep flow gives every step one job and puts retries, fallbacks and a verification in code, so a failing tool leads to a safe hold instead of a confident wrong reply. Routing applies the same idea to models: rules answer what code can decide exactly, a small model handles easy language work and the large model only sees the hard requests, which lowers both cost and latency.',
  },

  /* ------------------------------------------------ design an agent, tools and memory */
  {
    id: 'agt-genai-agent-tools', title: 'Create an order agent with a function and memory', icon: '🤖', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Priya asks Contoso\'s order agent where her order is. Create the agent with a strict function schema and file search, see it ask for a missing order number instead of guessing, then give it memory so it remembers a preference next week.',
    learn: ['Role, goal and rules in instructions', 'A strict function schema with a required parameter', 'The model asks, your code runs the function', 'Memory that survives into a new conversation'],
    topics: ['design-agents-roles-goals-and-tools', 'agents-with-retrieval-functions-and-memory'],
    tasks: [
      { text: `Create **${RG}**, **${RES}**, the project **${PROJ}**, and deploy **gpt-4.1-mini** and **text-embedding-3-small**.`, cli: setup('gpt-4.1-mini', 'text-embedding-3-small'), check: (s) => hasDeploys(s, 'gpt-4.1-mini', 'text-embedding-3-small') },
      { text: 'Install the SDK and set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install "azure-ai-projects>=2.3.0" azure-identity && ${exportEp}`, check: (s) => piped(s, 'azure-ai-projects') && epSet(s) },
      { text: 'Read **order_agent.py**, then ask "Where is my order?" with **no order number**.', cli: 'cat order_agent.py && python order_agent.py "Where is my order?"', check: (s) => ev(s, 'py.view', (d) => d.file === 'order_agent.py') && ev(s, 'agt.function', (d) => !d.called && d.reason === 'missing-required') },
      { text: 'Ask again with **ORD-1042** and watch the model request the function.', cli: 'python order_agent.py "Where is my order ORD-1042?"', check: (s) => ev(s, 'agt.function', (d) => d.called && d.name === 'get_order_status') && ev(s, 'agt.agent.schema', (d) => d.strict && d.required.includes('order_id')) },
      { text: 'Turn on **memory** and ask in a new conversation.', cli: 'python order_agent.py memory "Any news on ORD-1042?"', check: (s) => ev(s, 'agt.memory', (d) => d.store === 'customer-memory') && ev(s, 'agt.function', (d) => d.memory && d.called) },
    ],
    wrap: 'An agent is a model plus instructions, tools and a conversation. A strict function schema with a required order_id makes the model ask the customer instead of inventing one. The model only requests the call; your code runs the function and sends the result back. The conversation holds short-term context, while memory, scoped to one user, carries what the agent learned into later conversations.',
  },

  /* ------------------------------------------------ multi-agent and approvals */
  {
    id: 'agt-genai-multi-approve', title: 'Orchestrate agents and gate a refund with approval', icon: '🤝', level: 'Intermediate', minutes: 15, start: 'shell',
    intro: 'A customer was charged twice and hasn\'t received the order. Run specialist agents in three patterns, then let a refund agent act with a person approving every refund and a hard limit in code.',
    learn: ['Sequential, concurrent and handoff orchestration', 'Microsoft Agent Framework with a Foundry client', 'Approval-required tools and paused runs', 'A hard limit that no approval can bypass'],
    topics: ['multi-agent-orchestration', 'autonomous-workflows-with-approvals'],
    tasks: [
      { text: `Create **${RG}**, **${RES}**, the project **${PROJ}** and a **gpt-4.1-mini** deployment.`, cli: setup('gpt-4.1-mini'), check: (s) => hasDeploys(s, 'gpt-4.1-mini') },
      { text: 'Install **agent-framework-foundry** and **azure-identity**, then set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install agent-framework-foundry azure-identity && ${exportEp}`, check: (s) => piped(s, 'agent-framework-foundry') && epSet(s) },
      { text: 'Run the support workflow as **sequential**, **concurrent** and **handoff** and compare.', cli: 'python support_workflow.py --pattern sequential && python support_workflow.py --pattern concurrent && python support_workflow.py --pattern handoff', check: (s) => ['sequential', 'concurrent', 'handoff'].every((p) => ev(s, 'agt.orchestrate', (d) => d.pattern === p)) },
      { text: 'Ask the refund agent for a **₹1,200** refund. The run pauses for approval.', cli: 'python refund_agent.py "Refund ₹1,200 for order ORD-1042, the kettle arrived broken."', check: (s) => ev(s, 'agt.approval.request', (d) => d.id === 'apr-1' && d.amount === 1200) },
      { text: 'Approve **apr-1** and watch the refund run.', cli: 'python refund_agent.py --approve apr-1', check: (s) => ev(s, 'agt.approval.decision', (d) => d.id === 'apr-1' && d.approved) },
      { text: 'Ask for **₹45,000**. A hard rule in code blocks it before any approval.', cli: 'python refund_agent.py "Refund ₹45,000 for order ORD-2210, the laptop was damaged."', check: (s) => ev(s, 'agt.guard', (d) => d.blocked && d.amount === 45000) },
      { text: 'Request **₹2,400** and **reject** it (**apr-2**).', cli: 'python refund_agent.py "Refund ₹2,400 for order ORD-1042, wrong colour." && python refund_agent.py --reject apr-2', check: (s) => ev(s, 'agt.approval.decision', (d) => d.id === 'apr-2' && !d.approved) },
    ],
    wrap: 'Orchestration patterns differ in who decides the next step: you in advance (sequential, concurrent), the current agent (handoff), or a manager (group chat, Magentic). For autonomy, let reads run freely and mark write tools as approval required, so the run pauses and a person decides. Amounts no one should approve belong in code, because a hard limit holds even when the model or the approver is wrong.',
  },

  /* ------------------------------------------------ monitor and trace */
  {
    id: 'agt-genai-observe', title: 'Evaluate agent runs, then trace and count tokens', icon: '📈', level: 'Intermediate', minutes: 16, start: 'shell',
    intro: 'The order agent passes demos, but real runs look odd. Score recorded runs with agent evaluators, read the error analysis, then switch on tracing to Application Insights and measure tokens and latency.',
    learn: ['Intent resolution, tool call accuracy and task adherence', 'Error analysis of failing runs', 'Connecting Application Insights', 'Opt-in tracing and token analytics'],
    topics: ['monitor-and-evaluate-agents', 'tracing-and-token-analytics'],
    tasks: [
      { text: `Create **${RG}**, **${RES}**, the project **${PROJ}** and a **gpt-4.1-mini** deployment.`, cli: setup('gpt-4.1-mini'), check: (s) => hasDeploys(s, 'gpt-4.1-mini') },
      { text: 'Install the SDK, evaluation and OpenTelemetry packages, then set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install "azure-ai-projects>=2.3.0" azure-identity azure-ai-evaluation opentelemetry-sdk azure-core-tracing-opentelemetry azure-monitor-opentelemetry && ${exportEp}`, check: (s) => piped(s, 'azure-ai-evaluation', 'azure-monitor-opentelemetry') && epSet(s) },
      { text: 'Score **agent-runs.jsonl** with the agent evaluators and read the error analysis.', cli: 'python evaluate_app.py --data agent-runs.jsonl', check: (s) => ev(s, 'agt.eval', (d) => d.data === 'agent-runs.jsonl' && d.agent && d.failedRows.length > 0) },
      { text: 'Connect Application Insights to the project with **appinsights-connection.yml**.', cli: `cat appinsights-connection.yml && az cognitiveservices account project connection create -n ${RES} -g ${RG} --project-name ${PROJ} --connection-name appi-agents --file appinsights-connection.yml`, check: (s) => ev(s, 'agt.connection', (d) => d.name === 'appi-agents' && d.type === 'AppInsights') },
      { text: 'Run **traced_agent.py** before opting in. Nothing is recorded.', cli: 'python traced_agent.py', check: (s) => ev(s, 'agt.trace', (d) => !d.enabled) },
      { text: 'Opt in with **AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING** and run again.', cli: 'export AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING="true" && python traced_agent.py', check: (s) => ev(s, 'agt.trace', (d) => d.enabled && d.spans >= 3 && !d.content) },
      { text: 'Report tokens and latency from the traces with **token_report.py**.', cli: 'python token_report.py', check: (s) => ev(s, 'agt.tokens', (d) => d.traces >= 1) },
    ],
    wrap: 'Agent evaluators read the whole run: intent resolution, tool call accuracy and task adherence. Error analysis turns failing rows into causes, such as a made-up argument or a claimed action with no tool call. Tracing is opt-in: connect Application Insights, enable GenAI tracing, and each run records spans with tokens and latency. Keep message-content capture off in production, because prompts and answers can hold personal data.',
  },

  /* ------------------------------------------------ prompt tuning */
  {
    id: 'agt-genai-tune', title: 'Tune a prompt and its parameters', icon: '🎛️', level: 'Beginner', minutes: 10, start: 'shell',
    intro: 'Contoso\'s product descriptions come out different every time. Change temperature, add an example, cap the length too low, and try a self-critique pass to see what each one does.',
    learn: ['Temperature and top_p', 'A few-shot example in the instructions', 'max_output_tokens and an incomplete status', 'Draft, critique, revise'],
    topics: ['prompt-engineering-and-parameters'],
    tasks: [
      { text: `Create **${RG}**, **${RES}**, the project **${PROJ}** and a **gpt-4.1-mini** deployment.`, cli: setup('gpt-4.1-mini'), check: (s) => hasDeploys(s, 'gpt-4.1-mini') },
      { text: 'Install the SDK and set **FOUNDRY_PROJECT_ENDPOINT**.', cli: `pip install "azure-ai-projects>=2.3.0" azure-identity && ${exportEp}`, check: (s) => piped(s, 'azure-ai-projects') && epSet(s) },
      { text: 'Generate a description at a **high temperature** (1.4).', cli: 'python tune_prompt.py --temperature 1.4', check: (s) => ev(s, 'agt.tune', (d) => d.temperature >= 1.2) },
      { text: 'Lower the temperature to **0.2** and add a **few-shot example**.', cli: 'python tune_prompt.py --temperature 0.2 --few-shot', check: (s) => ev(s, 'agt.tune', (d) => d.temperature <= 0.3 && d.fewShot) },
      { text: 'Set **max output tokens** to 30 and read the status.', cli: 'python tune_prompt.py --max-output-tokens 30', check: (s) => ev(s, 'agt.tune', (d) => d.finish === 'length') },
      { text: 'Add a **self-critique** pass that checks the draft against a checklist.', cli: 'python tune_prompt.py --temperature 0.2 --few-shot --self-critique', check: (s) => ev(s, 'agt.tune', (d) => d.critique && d.fewShot) },
    ],
    wrap: 'Instructions set the role, audience, rules and length. A worked example fixes format and tone faster than extra rules. Low temperature keeps wording steady and high temperature makes it varied, so tune temperature or top_p, not both. A max output token cap that is too low cuts the answer and the status says incomplete. A self-critique loop drafts, checks against a checklist and revises once.',
  },
];
