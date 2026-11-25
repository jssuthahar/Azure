/**
 * AI-103 "extract" Cloud Shell commands (EDUCATION ONLY): an Azure AI Search
 * (Foundry IQ) pipeline, keyword / vector / hybrid / semantic queries, a
 * knowledge base for agents, and Content Understanding analyzers. Nothing
 * calls a real service: results come from small rules over a few fictional
 * documents (extract-data.ts), so labs can check what the learner did.
 *
 * Rules this module follows:
 * - New verbs only: `az search service ...`, `az cognitiveservices account project ...`,
 *   and the storage / role verbs only for resources that belong to this area
 *   (storage accounts starting `stagt`, the Search Index Data Reader and
 *   Storage Blob Data Reader roles on them), so AZ-104 and AI-200 keep theirs.
 * - New file names only (search_setup.py, query.py, knowledge.py, agent_kb.py,
 *   cu.py, setup-kb.sh and the sample files). AI-901's extract_app.py and the
 *   other area modules are untouched.
 * - `pip install` is claimed only when the line includes azure-search-documents
 *   and every package is one the simulator knows.
 * - Every run emits one `agx.*` event, plus `py.run`.
 * Names and API versions follow Microsoft Learn (checked 25 Nov 2026).
 */
import { SimError, SUB_ID, type Res } from '../engine';
import type { World } from '../world';
import { run, out, one, req, lc, uuid, type AdminOut, type Parsed } from '../admin/kit';
import { foundries, deploymentOf, createFoundry, deployModel, addProject, MODELS } from '../foundry';
import { POLICY_DOCS, CLAIM_DOCS, CONCEPTS, STOP, CLAIM_ANALYZER_JSON, SCRIPTS, type Doc } from './extract-data';

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
interface Chunk { id: string; file: string; title: string; text: string; vector: boolean }
interface Svc {
  name: string; rg: string; location: string; sku: string; identity: boolean; principal: string;
  roles: string[]; // "principalId|role"
  datasources: Record<string, { storage: string; container: string; auth: string }>;
  indexes: Record<string, { vector: boolean; semantic: boolean; foundry: string; embedding: string; chunks: Chunk[] }>;
  skillsets: Record<string, { skills: string[]; foundry: string; embedding: string }>;
  indexers: Record<string, { ds: string; index: string; skillset: string; imageAction: string; done: boolean }>;
  sources: Record<string, { index: string }>;
  bases: Record<string, { sources: string[]; effort: string; model: string }>;
}
interface Analyzer { id: string; json: any }
interface Agx {
  search: Record<string, Svc>;
  containers: Record<string, Record<string, string[]>>;
  defaults: { completion: string; embedding: string } | null;
  analyzers: Record<string, Analyzer>;
}
const agx = (w: World): Agx => ((w as any).agx ??= { search: {}, containers: {}, defaults: null, analyzers: {} } as Agx);
const env = (w: World): Record<string, string> => ((w as any).env ??= {});
const py = (msg: string) => new SimError(msg, 'Python');
const pid = (seed: string) => { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; const x = (n: number) => ((h * (n + 3)) >>> 0).toString(16).padStart(8, '0'); return `${x(1)}-${x(2).slice(0, 4)}-4${x(3).slice(1, 4)}-a${x(4).slice(1, 4)}-${x(5)}${x(6).slice(0, 4)}`; };
/** Principal id of the Foundry project "policy-agents" in ai-agt-kb01 (what the portal shows on its Identity page). */
export const PROJECT_PRINCIPAL = pid('ai-agt-kb01/policy-agents');
export const SEARCH_PRINCIPAL = pid('srch-agt-kb01');
const searchId = (s: Svc) => `/subscriptions/${SUB_ID}/resourceGroups/${s.rg}/providers/Microsoft.Search/searchServices/${s.name}`;
const ROLE_KEY: Record<string, string> = { 'search index data reader': 'search-reader', 'storage blob data reader': 'storage-reader' };

function svcOf(w: World): Svc {
  const name = env(w).SEARCH_SERVICE ?? 'srch-agt-kb01';
  const s = agx(w).search[name.toLowerCase()];
  if (!s) throw py(`azure.core.exceptions.ServiceRequestError: can't reach ${name}.search.windows.net. Create the service first (az search service create) and check SEARCH_SERVICE.`);
  return s;
}
function needPkgs(w: World, pkgs: string[]) {
  const have: string[] = (w as any).pip ?? [];
  const miss = pkgs.filter((p) => !have.includes(p));
  if (miss.length) throw py(`ModuleNotFoundError: No module named '${miss[0].replace(/-/g, '.')}'\nInstall it: pip install ${miss.join(' ')}`);
}
const hasRole = (s: Svc, principal: string, role: string) => s.roles.includes(`${principal.toLowerCase()}|${role}`);

/* ------------------------------------------------------------------ */
/* the sample files                                                    */
/* ------------------------------------------------------------------ */
const BASIC_ANALYZER_JSON = JSON.stringify({
  analyzerId: 'claim-basic', description: 'Claim forms, extract only', baseAnalyzerId: 'prebuilt-document',
  models: { completion: 'gpt-4.1-mini', embedding: 'text-embedding-3-small' },
  config: { returnDetails: false },
  fieldSchema: { fields: { ClaimNumber: { type: 'string', method: 'extract' }, PolicyNumber: { type: 'string', method: 'extract' }, TotalClaimed: { type: 'number', method: 'extract' } } },
}, null, 2);
const FILES: Record<string, string> = {
  ...SCRIPTS,
  'claim-analyzer.json': CLAIM_ANALYZER_JSON,
  'claim-analyzer-basic.json': BASIC_ANALYZER_JSON,
};
const BINARY = new Set([...Object.keys(POLICY_DOCS), ...Object.keys(CLAIM_DOCS)]);

/* ------------------------------------------------------------------ */
/* search: indexing                                                    */
/* ------------------------------------------------------------------ */
function storageOf(w: World, name: string): Res {
  const r = w.res.find((x) => x.type === 'storage' && x.name.toLowerCase() === (name ?? '').toLowerCase());
  if (!r) throw py(`azure.core.exceptions.ResourceNotFoundError: the storage account '${name}' was not found. Create it with az storage account create.`);
  return r;
}

function runIndexer(w: World, s: Svc, name: string): string {
  const x = s.indexers[name];
  if (!x) throw py(`azure.core.exceptions.ResourceNotFoundError: indexer '${name}' not found.`);
  const ds = s.datasources[x.ds]; const idx = s.indexes[x.index]; const ss = x.skillset ? s.skillsets[x.skillset] : undefined;
  if (!ds || !idx) throw py(`azure.core.exceptions.HttpResponseError: the indexer refers to a data source or index that doesn't exist.`);
  const files = agx(w).containers[ds.storage]?.[ds.container] ?? [];
  if (ds.auth === 'identity' && !hasRole(s, s.principal, 'storage-reader')) {
    w.emit('agx.indexer.run', { name, index: x.index, ok: false, reason: 'forbidden', chunks: 0 });
    return `Indexer ${name}: ✗ transientFailure\n  Error: 403 This request is not authorized to perform this operation. The search service's managed identity (${s.principal}) needs the Storage Blob Data Reader role on ${ds.storage}.`;
  }
  if (x.done) {
    w.emit('agx.indexer.run', { name, index: x.index, ok: true, reason: 'unchanged', chunks: idx.chunks.length });
    return `Indexer ${name}: ✓ success\n  ${files.length} documents found, 0 new or changed, ${files.length} skipped (blob change detection).\n  Changed the skillset or imageAction? Reset the indexer first so every document is processed again:  python search_setup.py reset --name ${name}`;
  }
  const lines: string[] = [];
  const chunks: Chunk[] = [];
  let scannedIndexed = false;
  let failed = 0;
  const ocr = !!ss?.skills.includes('ocr'); const split = !!ss?.skills.includes('split'); const embed = !!ss?.skills.includes('embed');
  for (const f of files) {
    const d: Doc | undefined = POLICY_DOCS[f];
    if (!d) { lines.push(`  ✗ ${f}: unsupported file type`); failed++; continue; }
    if (d.scanned) {
      if (ocr && x.imageAction === 'generateNormalizedImages') { scannedIndexed = true; chunks.push({ id: `${f}_0`, file: f, title: d.title, text: d.chunks[0], vector: embed }); lines.push(`  ✓ ${f}: OCR read the image, 1 chunk`); }
      else { failed++; lines.push(`  ⚠ ${f}: no text extracted, 0 chunks${ocr ? ' (the OCR skill got no images: set imageAction to generateNormalizedImages)' : ' (it is an image and the skillset has no OCR skill)'}`); }
      continue;
    }
    const parts = split ? d.chunks : [d.chunks.join(' ')];
    parts.forEach((t, i) => chunks.push({ id: `${f}_${i}`, file: f, title: d.title, text: t, vector: embed }));
    lines.push(`  ✓ ${f}: ${parts.length} ${parts.length === 1 ? 'document' : 'chunks'}`);
  }
  idx.chunks = chunks; x.done = true;
  const vectorsMissing = idx.vector && !embed;
  w.emit('agx.indexer.run', { name, index: x.index, ok: true, reason: 'ran', chunks: chunks.length, files: files.length, failed, scanned: scannedIndexed, ocr, split, embed, imageAction: x.imageAction, vectorsMissing });
  return [`Indexer ${name}: ✓ success  (${files.length - failed} of ${files.length} documents succeeded)`, ...lines, `Index ${x.index}: ${chunks.length} documents${embed ? ', text_vector filled (1,536 dimensions)' : ''}`,
    ...(vectorsMissing ? ['⚠ The index has a vector field but the skillset has no embedding skill, so text_vector is empty and vector queries find nothing.'] : []),
    ...(!split ? ['⚠ No Text Split skill: each file is one search document, so results are whole files and long files lose detail.'] : [])].join('\n');
}

/** A quick, complete pipeline (the setup-kb.sh shortcut). */
function buildKb(w: World, semantic: boolean): string {
  const a = agx(w);
  const done: string[] = [];
  const rg = 'rg-agt-kb';
  if (!w.rg(rg)) { w.createRg(rg, 'eastus', {}, 'cli'); done.push(`resource group ${rg}`); }
  if (!w.res.some((r) => r.type === 'storage' && r.name === 'stagtkb01')) { w.createStorage({ rg, name: 'stagtkb01', sku: 'Standard_LRS' }, 'cli'); done.push('storage account stagtkb01'); }
  a.containers.stagtkb01 ??= {}; a.containers.stagtkb01.policies = Object.keys(POLICY_DOCS);
  const s = (a.search['srch-agt-kb01'] ??= newSvc('srch-agt-kb01', rg, 'eastus', 'basic', true));
  done.push('search service srch-agt-kb01 (managed identity on)');
  if (!s.roles.includes(`${s.principal}|storage-reader`)) s.roles.push(`${s.principal}|storage-reader`);
  let f = foundries(w).find((r) => r.name === 'ai-agt-kb01');
  if (!f) f = createFoundry(w, { rg, name: 'ai-agt-kb01', location: 'eastus' }, 'cli');
  if (!(f.props.deployments as any[]).some((d) => d.name === 'gpt-4.1-mini')) deployModel(w, f, { name: 'gpt-4.1-mini', model: 'gpt-4.1-mini' }, 'cli');
  if (!(f.props.deployments as any[]).some((d) => d.name === 'text-embedding-3-small')) deployModel(w, f, { name: 'text-embedding-3-small', model: 'text-embedding-3-small' }, 'cli');
  if (!(f.props.projects as string[]).includes('policy-agents')) addProject(w, f, 'policy-agents', 'cli');
  done.push('Foundry resource ai-agt-kb01 with gpt-4.1-mini, text-embedding-3-small and the project policy-agents');
  s.datasources['ds-policies'] = { storage: 'stagtkb01', container: 'policies', auth: 'identity' };
  s.indexes['policies-idx'] = { vector: true, semantic, foundry: 'ai-agt-kb01', embedding: 'text-embedding-3-small', chunks: [] };
  s.skillsets['ss-policies'] = { skills: ['ocr', 'split', 'embed'], foundry: 'ai-agt-kb01', embedding: 'text-embedding-3-small' };
  s.indexers['ixr-policies'] = { ds: 'ds-policies', index: 'policies-idx', skillset: 'ss-policies', imageAction: 'generateNormalizedImages', done: false };
  const res = runIndexer(w, s, 'ixr-policies');
  w.emit('agx.setup', { semantic });
  return `Set up (practice shortcut):\n${done.map((d) => `  ✓ ${d}`).join('\n')}\n  ✓ data source ds-policies, index policies-idx (vector${semantic ? ' + semantic configuration' : ''}), skillset ss-policies, indexer ixr-policies\n${res}`;
}
function newSvc(name: string, rg: string, location: string, sku: string, identity: boolean): Svc {
  return { name, rg, location, sku, identity, principal: name === 'srch-agt-kb01' ? SEARCH_PRINCIPAL : pid(name), roles: [], datasources: {}, indexes: {}, skillsets: {}, indexers: {}, sources: {}, bases: {} };
}

/* ------------------------------------------------------------------ */
/* search: querying                                                    */
/* ------------------------------------------------------------------ */
const toks = (s: string) => (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => !STOP.has(t));
/** Only words the toy embedding knows count: rare tokens such as error codes get blurred, as in real embeddings. */
const sense = (s: string) => new Set(toks(s).map((t) => CONCEPTS[t]).filter(Boolean));
interface Hit { c: Chunk; score: number; rerank?: number }

function keywordList(idx: { chunks: Chunk[] }, q: string): Hit[] {
  const qt = toks(q); const N = idx.chunks.length || 1;
  const bag = idx.chunks.map((c) => new Set(toks(`${c.title} ${c.text}`)));
  return idx.chunks.map((c, i) => ({ c, score: qt.reduce((n, t) => { if (!bag[i].has(t)) return n; const df = bag.filter((b) => b.has(t)).length; return n + Math.log(1 + N / df); }, 0) }))
    .filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
}
function vectorList(idx: { chunks: Chunk[] }, q: string): Hit[] {
  const qs = sense(q);
  const rows = idx.chunks.filter((c) => c.vector).map((c) => { const cs = sense(c.text); const inter = [...qs].filter((t) => cs.has(t)).length; return { c, score: 0.5 + (qs.size && cs.size ? (inter / Math.sqrt(qs.size * cs.size)) * 0.4 : 0) }; });
  return rows.sort((a, b) => b.score - a.score);
}
function search(idx: Svc['indexes'][string], q: string, mode: string, semantic: boolean, k = 50): Hit[] {
  let hits: Hit[];
  if (mode === 'keyword') hits = keywordList(idx, q);
  else if (mode === 'vector') hits = vectorList(idx, q).slice(0, k);
  else {
    const a = keywordList(idx, q); const b = vectorList(idx, q).slice(0, k); const m = new Map<string, Hit>();
    a.forEach((h, r) => m.set(h.c.id, { c: h.c, score: 1 / (60 + r + 1) }));
    b.forEach((h, r) => { const e = m.get(h.c.id); if (e) e.score += 1 / (60 + r + 1); else m.set(h.c.id, { c: h.c, score: 1 / (60 + r + 1) }); });
    hits = [...m.values()].sort((x, y) => y.score - x.score);
  }
  if (semantic) {
    const qs = sense(q); const qt = toks(q);
    hits = hits.slice(0, 50).map((h) => { const cs = sense(h.c.text); const inter = [...qs].filter((t) => cs.has(t)).length; const exact = qt.filter((t) => toks(h.c.text).includes(t)).length; return { ...h, rerank: Math.min(4, 0.4 + 3.2 * (qs.size ? inter / qs.size : 0) + 0.5 * exact) }; }).sort((x, y) => (y.rerank ?? 0) - (x.rerank ?? 0));
  }
  return hits;
}
const clip = (s: string, n = 78) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ------------------------------------------------------------------ */
/* Content Understanding                                               */
/* ------------------------------------------------------------------ */
function foundryFromCu(w: World): Res {
  const v = env(w).CU_ENDPOINT ?? env(w).FOUNDRY_ENDPOINT;
  if (!v) throw py(`KeyError: 'CU_ENDPOINT'\nSet it first: export CU_ENDPOINT="https://<resource>.services.ai.azure.com/" (the Foundry resource endpoint).`);
  const m = v.match(/^https:\/\/([a-z0-9-]+)\.(?:services\.ai|cognitiveservices)\.azure\.com\/?$/i);
  const r = m && foundries(w).find((x) => x.name.toLowerCase() === m[1].toLowerCase());
  if (!r) throw py(`azure.core.exceptions.ServiceRequestError: '${v}' doesn't match a Foundry resource. Use https://<resource>.services.ai.azure.com/`);
  return r;
}
const PREBUILT: Record<string, string> = { 'prebuilt-layout': 'Layout: OCR, tables, paragraphs', 'prebuilt-documentSearch': 'Document search: Markdown, figures, summary', 'prebuilt-invoice': 'Invoice fields' };

/* ------------------------------------------------------------------ */
/* the apps                                                            */
/* ------------------------------------------------------------------ */
type App = (argv: string[], w: World) => string;
const flag = (argv: string[], name: string) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined; };
const flags = (argv: string[], name: string) => { const i = argv.indexOf(name); if (i < 0) return []; const o: string[] = []; for (const a of argv.slice(i + 1)) { if (a.startsWith('--')) break; o.push(...a.split(',').map((x) => x.trim()).filter(Boolean)); } return o; };
const need = (argv: string[], name: string) => { const v = flag(argv, name); if (!v) throw py(`error: the following arguments are required: ${name}`); return v; };

function foundryByName(w: World, name: string): Res {
  const f = foundries(w).find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (!f) throw py(`azure.core.exceptions.ResourceNotFoundError: the Foundry resource '${name}' was not found.`);
  return f;
}
function embeddingDeployment(w: World, foundry: string, dep: string) {
  const f = foundryByName(w, foundry);
  const d = deploymentOf(f, dep);
  if (MODELS[d.model]?.kind !== 'embedding') throw py(`azure.core.exceptions.HttpResponseError: '${d.name}' (${d.model}) is not an embedding model. Deploy text-embedding-3-small and use its deployment name.`);
  return d;
}

const APPS: Record<string, App> = {
  'search_setup.py': (argv, w) => {
    needPkgs(w, ['azure-search-documents', 'azure-identity']);
    const s = svcOf(w);
    const sub = argv[0];
    if (sub === 'datasource') {
      const name = need(argv, '--name'); const storage = need(argv, '--storage'); const container = need(argv, '--container'); const auth = flag(argv, '--auth') ?? 'identity';
      storageOf(w, storage);
      if (!agx(w).containers[storage]?.[container]) throw py(`azure.core.exceptions.HttpResponseError: (InvalidDataSourceContainer) The container '${container}' doesn't exist in ${storage}. Create it and upload the files first.`);
      if (auth === 'identity' && !s.identity) throw py(`azure.core.exceptions.HttpResponseError: this search service has no managed identity. Create it with --identity-type SystemAssigned.`);
      s.datasources[name] = { storage, container, auth };
      w.emit('agx.datasource', { service: s.name, name, storage, container, auth });
      return `Data source ${name} created: Azure Blob Storage, container ${container}, ${auth === 'identity' ? 'managed identity (no keys stored)' : 'connection string with an account key'}.${auth === 'identity' && !hasRole(s, s.principal, 'storage-reader') ? `\nNote: the search service's identity (${s.principal}) still needs Storage Blob Data Reader on ${storage}.` : ''}`;
    }
    if (sub === 'index') {
      const name = need(argv, '--name'); const vector = argv.includes('--vector'); const semantic = argv.includes('--semantic');
      let emb = '', fnd = '';
      if (vector) { fnd = need(argv, '--foundry'); emb = need(argv, '--embedding-deployment'); embeddingDeployment(w, fnd, emb); }
      s.indexes[name] = { vector, semantic, foundry: fnd, embedding: emb, chunks: s.indexes[name]?.chunks ?? [] };
      w.emit('agx.index', { service: s.name, name, vector, semantic, dims: vector ? 1536 : 0 });
      return [`Index ${name} created.`, '  fields: chunk_id (key), parent_id, title, chunk (searchable)' + (vector ? ', text_vector (Collection(Edm.Single), 1,536 dimensions, vector profile "vp")' : ''),
        vector ? `  vectorizer: Azure OpenAI ${emb} on ${fnd} (embeds the query text at query time)` : '  no vector field: only keyword queries will work',
        semantic ? '  semantic configuration "default": title = title, content = chunk' : '  no semantic configuration: queryType semantic will be rejected'].join('\n');
    }
    if (sub === 'skillset') {
      const name = need(argv, '--name'); const skills = flags(argv, '--skills').map((x) => x.toLowerCase());
      const known = ['ocr', 'split', 'embed', 'pii', 'keyphrases', 'webapi', 'cu'];
      const bad = skills.find((x) => !known.includes(x));
      if (!skills.length || bad) throw py(`ValueError: --skills takes a comma-separated list from: ${known.join(', ')}${bad ? ` ('${bad}' is not one of them)` : ''}`);
      let fnd = '', emb = '';
      if (skills.includes('embed')) { fnd = need(argv, '--foundry'); emb = need(argv, '--embedding-deployment'); embeddingDeployment(w, fnd, emb); }
      s.skillsets[name] = { skills, foundry: fnd, embedding: emb };
      w.emit('agx.skillset', { service: s.name, name, skills });
      const names: Record<string, string> = { ocr: 'OcrSkill', split: 'SplitSkill (2,000 chars, 500 overlap)', embed: 'AzureOpenAIEmbeddingSkill', pii: 'PIIDetectionSkill', keyphrases: 'KeyPhraseExtractionSkill', webapi: 'WebApiSkill (custom)', cu: 'ContentUnderstandingSkill' };
      return `Skillset ${name} created with ${skills.length} skills:\n${skills.map((k) => `  - ${names[k]}`).join('\n')}${skills.includes('split') && skills.includes('embed') ? '\n  index projections: one search document per chunk, parent_id links to the file' : ''}`;
    }
    if (sub === 'indexer') {
      const name = need(argv, '--name'); const ds = need(argv, '--datasource'); const index = need(argv, '--index'); const skillset = flag(argv, '--skillset') ?? '';
      const imageAction = flag(argv, '--image-action') ?? 'none';
      if (!s.datasources[ds]) throw py(`azure.core.exceptions.ResourceNotFoundError: data source '${ds}' not found.`);
      if (!s.indexes[index]) throw py(`azure.core.exceptions.ResourceNotFoundError: index '${index}' not found.`);
      if (skillset && !s.skillsets[skillset]) throw py(`azure.core.exceptions.ResourceNotFoundError: skillset '${skillset}' not found.`);
      if (!['none', 'generateNormalizedImages', 'generateNormalizedImagePerPage'].includes(imageAction)) throw py(`ValueError: --image-action must be none, generateNormalizedImages or generateNormalizedImagePerPage.`);
      const existed = !!s.indexers[name];
      const prev = s.indexers[name];
      s.indexers[name] = { ds, index, skillset, imageAction, done: prev?.done ?? false };
      w.emit('agx.indexer', { service: s.name, name, ds, index, skillset, imageAction });
      if (existed) return `Indexer ${name} updated (imageAction ${imageAction}). It doesn't re-read unchanged files on its own. Reset it, then run it:\n  python search_setup.py reset --name ${name}\n  python search_setup.py run --name ${name}`;
      return `Indexer ${name} created (imageAction ${imageAction}). Running now…\n${runIndexer(w, s, name)}`;
    }
    if (sub === 'run' || sub === 'reset' || sub === 'status') {
      const name = need(argv, '--name');
      if (!s.indexers[name]) throw py(`azure.core.exceptions.ResourceNotFoundError: indexer '${name}' not found.`);
      if (sub === 'reset') { s.indexers[name].done = false; w.emit('agx.indexer.reset', { service: s.name, name }); return `Indexer ${name} reset. The next run processes every document again.`; }
      if (sub === 'status') { const x = s.indexers[name]; return `Indexer ${name}: ${x.done ? 'success' : 'not run yet'}; index ${x.index} holds ${s.indexes[x.index].chunks.length} documents.`; }
      return runIndexer(w, s, name);
    }
    throw py(`usage: python search_setup.py datasource|index|skillset|indexer|run|reset|status --name NAME ...`);
  },

  'query.py': (argv, w) => {
    needPkgs(w, ['azure-search-documents', 'azure-identity']);
    const s = svcOf(w);
    const q = argv[0] && !argv[0].startsWith('--') ? argv[0] : '';
    if (!q) throw py('usage: python query.py "your question" [--mode keyword|vector|hybrid] [--semantic]');
    const mode = flag(argv, '--mode') ?? 'keyword'; const semantic = argv.includes('--semantic');
    if (!['keyword', 'vector', 'hybrid'].includes(mode)) throw py('ValueError: --mode must be keyword, vector or hybrid.');
    const idxName = env(w).SEARCH_INDEX ?? 'policies-idx';
    const idx = s.indexes[idxName];
    if (!idx) throw py(`azure.core.exceptions.ResourceNotFoundError: index '${idxName}' not found on ${s.name}.`);
    if (mode !== 'keyword' && !idx.vector) throw py(`azure.core.exceptions.HttpResponseError: (InvalidRequestParameter) The index '${idxName}' has no vector field. Recreate it with --vector, or use --mode keyword.`);
    if (semantic && !idx.semantic) throw py(`azure.core.exceptions.HttpResponseError: (SemanticConfigurationNotFound) The index '${idxName}' has no semantic configuration named 'default'. Recreate the index with --semantic.`);
    const hits = search(idx, q, mode, semantic).slice(0, 3);
    const top = hits[0]?.c.file ?? '';
    w.emit('agx.query', { service: s.name, index: idxName, mode, semantic, q, results: hits.length, top, topTitle: hits[0]?.c.title ?? '' });
    const head = `Query (${mode}${semantic ? ' + semantic ranker' : ''}): ${q}`;
    if (!hits.length) return `${head}\n0 results.\nNone of the words you typed appear in the index. Keyword search only matches the tokens it indexed. Try --mode vector or --mode hybrid.`;
    const rows = hits.map((h, i) => `${i + 1}. ${semantic ? `reranker ${h.rerank!.toFixed(2)}` : `score ${h.score.toFixed(mode === 'hybrid' ? 4 : 2)}`}  ${h.c.title}\n   ${semantic ? `caption: ${clip(h.c.text.split('. ')[0], 90)}` : clip(h.c.text)}`);
    const note = mode === 'vector' && hits.every((h) => h.score <= 0.5001) ? '\n⚠ Every score is the same low value: the query has no words the embedding understands (an exact code), so the order is meaningless. Hybrid keeps the keyword match for this.' : mode === 'hybrid' ? '\n(Hybrid scores are Reciprocal Rank Fusion scores, so they are small numbers.)' : '';
    return `${head}\n${rows.join('\n')}${note}`;
  },

  'knowledge.py': (argv, w) => {
    needPkgs(w, ['requests', 'azure-identity']);
    const s = svcOf(w);
    const sub = argv[0];
    if (sub === 'source') {
      const name = need(argv, '--name'); const index = need(argv, '--index');
      if (!s.indexes[index]) throw py(`HTTPError: 404 index '${index}' not found.`);
      if (!s.indexes[index].semantic) throw py(`HTTPError: 400 (InvalidRequest) the index '${index}' has no semantic configuration. A knowledge source needs one, because agentic retrieval reranks every subquery.`);
      s.sources[name] = { index };
      w.emit('agx.kb.source', { service: s.name, name, index });
      return `PUT /knowledgesources/${name}  →  201 Created  (kind searchIndex, index ${index})`;
    }
    if (sub === 'base') {
      const name = need(argv, '--name'); const sources = flags(argv, '--sources'); const effort = flag(argv, '--effort') ?? 'minimal'; const model = flag(argv, '--model') ?? ''; const fnd = flag(argv, '--foundry') ?? '';
      if (!sources.length) throw py('error: --sources needs at least one knowledge source.');
      const miss = sources.find((x) => !s.sources[x]);
      if (miss) throw py(`HTTPError: 404 knowledge source '${miss}' not found. Create it first.`);
      if (!['minimal', 'low', 'medium'].includes(effort)) throw py(`ValueError: --effort must be minimal, low or medium.`);
      if (effort !== 'minimal') {
        if (!model || !fnd) throw py(`HTTPError: 400 (InvalidRequest) retrievalReasoningEffort '${effort}' plans queries with a model. Add --foundry <resource> --model <chat deployment>, or use --effort minimal.`);
        const d = deploymentOf(foundryByName(w, fnd), model);
        if (['embedding', 'image'].includes(MODELS[d.model]?.kind)) throw py(`HTTPError: 400 '${d.name}' is not a chat model.`);
      }
      s.bases[name] = { sources, effort, model };
      w.emit('agx.kb.base', { service: s.name, name, sources, effort, model });
      return `PUT /knowledgebases/${name}  →  201 Created  (api-version 2026-10-01)\n  sources: ${sources.join(', ')}\n  retrievalReasoningEffort: ${effort}${effort === 'minimal' ? ' (no model planning: one query to all sources)' : ` (${model} plans subqueries and picks sources)`}\n  outputMode: extractiveData`;
    }
    if (sub === 'retrieve') {
      const kb = need(argv, '--kb'); const question = need(argv, '--q');
      const b = s.bases[kb];
      if (!b) throw py(`HTTPError: 404 knowledge base '${kb}' not found.`);
      const plan = b.effort === 'minimal' ? [question] : question.split(/\?\s*|\band\b|;|,/i).map((x) => x.trim()).filter((x) => x.length > 3);
      const subs = plan.length ? plan : [question];
      const seen = new Map<string, Hit>();
      for (const sq of subs) for (const src of b.sources) { const idx = s.indexes[s.sources[src].index]; for (const h of search(idx, sq, 'hybrid', true).slice(0, 2)) if ((h.rerank ?? 0) >= 2.2 && !seen.has(h.c.id)) seen.set(h.c.id, h); }
      const refs = [...seen.values()];
      w.emit('agx.kb.retrieve', { service: s.name, kb, effort: b.effort, subqueries: subs.length, refs: refs.length, files: refs.map((r) => r.c.file) });
      return [`POST /knowledgebases/${kb}/retrieve`, `activity: ${b.effort === 'minimal' ? 'searchIndex (1 query)' : `modelQueryPlanning (${b.model}), then searchIndex × ${subs.length}`}`,
        ...subs.map((x, i) => `  subquery ${i + 1}: ${x}`), `response (${refs.length} passages):`,
        ...(refs.length ? refs.map((r, i) => `  [${i}] ${clip(r.c.text, 100)}  (ref ${i}: ${r.c.file})`) : ['  (nothing relevant: the agent should say it does not know)'])].join('\n');
    }
    throw py('usage: python knowledge.py source|base|retrieve ...');
  },

  'agent_kb.py': (argv, w) => {
    needPkgs(w, ['azure-ai-projects', 'azure-identity']);
    const s = svcOf(w);
    const v = env(w).FOUNDRY_PROJECT_ENDPOINT;
    if (!v) throw py(`KeyError: 'FOUNDRY_PROJECT_ENDPOINT'\nSet it first: export FOUNDRY_PROJECT_ENDPOINT="https://ai-agt-kb01.services.ai.azure.com/api/projects/policy-agents"`);
    const m = v.match(/^https:\/\/([a-z0-9-]+)\.services\.ai\.azure\.com\/api\/projects\/([\w-]+)\/?$/i);
    const f = m && foundries(w).find((r) => r.name.toLowerCase() === m[1].toLowerCase());
    if (!m || !f) throw py(`ValueError: '${v}' is not a project endpoint of one of your Foundry resources.`);
    if (!(f.props.projects as string[]).includes(m[2])) throw py(`azure.core.exceptions.ResourceNotFoundError: (NotFound) Project '${m[2]}' not found in '${f.name}'.`);
    const kb = need(argv, '--kb'); const agent = flag(argv, '--agent') ?? 'policy-agent'; const question = need(argv, '--question');
    const b = s.bases[kb];
    if (!b) throw py(`azure.core.exceptions.ResourceNotFoundError: knowledge base '${kb}' not found on ${s.name}.`);
    const projectId = pid(`${f.name}/${m[2]}`);
    if (!hasRole(s, projectId, 'search-reader')) {
      w.emit('agx.agent', { service: s.name, kb, agent, ok: false, reason: 'forbidden', question });
      throw py(`azure.core.exceptions.HttpResponseError: (403) The MCP tool call to ${s.name}.search.windows.net/knowledgebases/${kb}/mcp failed: Forbidden.\nThe project's managed identity (${projectId}) needs the Search Index Data Reader role on the search service.`);
    }
    const seen = new Map<string, Hit>();
    const subs = b.effort === 'minimal' ? [question] : question.split(/\?\s*|\band\b|;|,/i).map((x) => x.trim()).filter((x) => x.length > 3);
    for (const sq of subs.length ? subs : [question]) for (const src of b.sources) for (const h of search(s.indexes[s.sources[src].index], sq, 'hybrid', true).slice(0, 2)) if ((h.rerank ?? 0) >= 2.2) seen.set(h.c.id, h);
    const refs = [...seen.values()];
    w.emit('agx.agent', { service: s.name, kb, agent, ok: true, effort: b.effort, refs: refs.length, answered: refs.length > 0, question });
    if (!refs.length) return `Agent ${agent} (version 1) tool call: knowledge_base_retrieve → 0 passages\nanswer: I don't know. The knowledge base doesn't contain that.`;
    return `Agent ${agent} (version 1) tool call: knowledge_base_retrieve → ${refs.length} passages\nanswer: ${refs.slice(0, 2).map((r) => `${clip(r.c.text, 110)} 【${r.c.file}】`).join(' ')}`;
  },

  'cu.py': (argv, w) => {
    needPkgs(w, ['azure-ai-contentunderstanding', 'azure-identity']);
    const r = foundryFromCu(w); const a = agx(w);
    const sub = argv[0];
    if (sub === 'defaults') {
      const c = need(argv, '--completion'); const e = need(argv, '--embedding');
      const dc = deploymentOf(r, c); const de = deploymentOf(r, e);
      if (MODELS[de.model]?.kind !== 'embedding') throw py(`azure.core.exceptions.HttpResponseError: '${e}' is not an embedding deployment.`);
      if (['embedding', 'image'].includes(MODELS[dc.model]?.kind)) throw py(`azure.core.exceptions.HttpResponseError: '${c}' is not a chat deployment.`);
      a.defaults = { completion: dc.name, embedding: de.name };
      w.emit('agx.cu.defaults', { resource: r.name, completion: dc.name, embedding: de.name });
      return `PATCH /contentunderstanding/defaults  →  200\n  modelDeployments: { ${dc.name}: ${dc.name}, ${de.name}: ${de.name} }`;
    }
    if (sub === 'create') {
      const file = need(argv, '--file');
      const text = FILES[file];
      if (!text || !file.endsWith('.json')) throw py(`FileNotFoundError: [Errno 2] No such file or directory: '${file}'\nAnalyzer files here: claim-analyzer.json, claim-analyzer-basic.json`);
      const def = JSON.parse(text);
      const id = flag(argv, '--analyzer-id') ?? def.analyzerId;
      if (!a.defaults) throw py(`azure.core.exceptions.HttpResponseError: (ModelDeploymentNotConfigured) No default model deployments are set on this resource. Run: python cu.py defaults --completion gpt-4.1-mini --embedding text-embedding-3-small`);
      if (def.models?.completion && a.defaults.completion !== def.models.completion) throw py(`azure.core.exceptions.HttpResponseError: (ModelDeploymentNotFound) The analyzer uses '${def.models.completion}' but the default deployment is '${a.defaults.completion}'.`);
      a.analyzers[id] = { id, json: def };
      const fields = Object.entries<any>(def.fieldSchema.fields);
      w.emit('agx.cu.analyzer', { resource: r.name, id, base: def.baseAnalyzerId, fields: fields.map(([n]) => n), methods: fields.map(([, f]) => f.method), confidence: !!def.config?.estimateFieldSourceAndConfidence });
      return `PUT /contentunderstanding/analyzers/${id}  →  201 (long-running operation succeeded)\n  base: ${def.baseAnalyzerId}\n  fields: ${fields.map(([n, f]) => `${n} (${f.method})`).join(', ')}\n  confidence and source: ${def.config?.estimateFieldSourceAndConfidence ? 'on' : 'off'}`;
    }
    if (sub === 'analyze') {
      const file = argv[1] && !argv[1].startsWith('--') ? argv[1] : '';
      const d = CLAIM_DOCS[file];
      if (!d) throw py(`FileNotFoundError: '${file || '(none)'}'\nSample files: ${Object.keys(CLAIM_DOCS).join(', ')}`);
      const an = flag(argv, '--analyzer') ?? 'prebuilt-documentSearch';
      const custom = a.analyzers[an];
      if (!custom && !PREBUILT[an]) throw py(`azure.core.exceptions.ResourceNotFoundError: (AnalyzerNotFound) The analyzer '${an}' doesn't exist. Prebuilt: ${Object.keys(PREBUILT).join(', ')}. Custom: ${Object.keys(a.analyzers).join(', ') || '(none yet)'}`);
      if (an === 'prebuilt-invoice') throw py(`azure.core.exceptions.HttpResponseError: (NoFieldsFound) This is a claim form, not an invoice. Use a custom analyzer for claims.`);
      if (!a.defaults && (custom || an === 'prebuilt-documentSearch')) throw py(`azure.core.exceptions.HttpResponseError: (ModelDeploymentNotConfigured) Set default model deployments first: python cu.py defaults --completion gpt-4.1-mini --embedding text-embedding-3-small`);
      const lines: string[] = [`POST /contentunderstanding/analyzers/${an}:analyze  →  Succeeded  (${d.pages} page${d.pages > 1 ? 's' : ''})`];
      let conf = false; let low: string[] = []; let md = true; let nfields = 0;
      if (an === 'prebuilt-layout') { lines.push('markdown:', ...d.markdown.split('\n').map((x) => `  ${x}`), '(layout only: OCR, tables and paragraphs. No fields.)'); }
      else if (an === 'prebuilt-documentSearch') { lines.push('markdown:', ...d.markdown.split('\n').slice(0, 6).map((x) => `  ${x}`), '  …', `summary: ${d.summary}`, ...(d.figure ? [`figure: ${d.figure}`] : [])); }
      else {
        const def = custom!.json; conf = !!def.config?.estimateFieldSourceAndConfidence;
        const flds = Object.entries<any>(def.fieldSchema.fields);
        nfields = flds.length;
        lines.push('fields:');
        for (const [n, f] of flds) {
          const known = d.fields[n];
          let val = known?.[0] ?? '';
          if (f.method === 'classify') val = /water|pipe|flood/i.test(d.markdown) ? 'water damage' : /car|collision|reversed/i.test(d.markdown) ? 'collision' : 'other';
          if (f.method === 'generate') val = d.summary;
          const c = f.method === 'extract' ? known?.[1] : f.method === 'classify' ? 0.9 : 0.82;
          const tail = conf ? `  confidence ${c?.toFixed(2)}  source ${f.method === 'extract' ? known?.[2] : '(generated)'}${c !== undefined && c < 0.8 ? '  <-- send to a person' : ''}` : '';
          if (conf && c !== undefined && c < 0.8) low.push(n);
          lines.push(`  ${n}: ${clip(String(val), 70)}${tail}`);
        }
        if (!conf) lines.push('(No confidence or source: the analyzer was created without estimateFieldSourceAndConfidence, so you cannot tell which values to double-check.)');
        if (def.config?.returnDetails === false) md = true;
      }
      w.emit('agx.cu.analyze', { resource: r.name, analyzer: an, file, custom: !!custom, fields: nfields, confidence: conf, low, markdown: md });
      return lines.join('\n');
    }
    throw py('usage: python cu.py defaults|create|analyze ...');
  },
};
const FILE_KEYS = Object.keys(APPS);

/* ------------------------------------------------------------------ */
/* az verbs (new ones only)                                            */
/* ------------------------------------------------------------------ */
const SEARCH_SKUS = ['free', 'basic', 'standard', 'standard2', 'standard3', 'storage_optimized_l1', 'storage_optimized_l2'];
const ownScope = (scope: string | undefined) => /searchServices\//i.test(scope ?? '') || /storageAccounts\/stagt/i.test(scope ?? '');
const roleKey = (p: Parsed) => ROLE_KEY[lc(one(p, '--role'))];

const TABLE = {
  'search service create': (p: Parsed, w: World): AdminOut => {
    req(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const name = lc(one(p, '--name')); const rg = w.needRg(one(p, '--resource-group')!);
    if (!/^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/.test(name) || name.length < 2) throw new SimError(`The search service name '${name}' is invalid. Use 2–60 lowercase letters, numbers and dashes, starting and ending with a letter or number.`, 'InvalidName');
    if (agx(w).search[name]) throw new SimError(`The search service name '${name}' is already taken. Search service names are unique across Azure.`, 'ResourceNameNotAvailable');
    const sku = lc(one(p, '--sku') ?? 'basic');
    if (!SEARCH_SKUS.includes(sku)) throw new SimError(`'${sku}' is not a valid SKU. Use one of: ${SEARCH_SKUS.join(', ')}.`, 'InvalidSku');
    const identity = /system/i.test(one(p, '--identity-type') ?? '');
    const s = (agx(w).search[name] = newSvc(name, rg.name, one(p, '--location') ? w.checkLocation(one(p, '--location')!) : rg.location, sku, identity));
    w.emit('agx.search.create', { name, rg: rg.name, sku, identity });
    return out(p, { id: searchId(s), name, location: s.location, sku: { name: sku }, identity: identity ? { type: 'SystemAssigned', principalId: s.principal } : null, hostingMode: 'default', replicaCount: 1, partitionCount: 1, provisioningState: 'succeeded' });
  },
  'search service show': (p: Parsed, w: World): AdminOut => {
    req(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const s = agx(w).search[lc(one(p, '--name'))];
    if (!s || lc(s.rg) !== lc(one(p, '--resource-group'))) throw new SimError(`The Resource 'Microsoft.Search/searchServices/${one(p, '--name')}' under resource group '${one(p, '--resource-group')}' was not found.`, 'ResourceNotFound');
    return out(p, { id: searchId(s), name: s.name, sku: { name: s.sku }, identity: s.identity ? { type: 'SystemAssigned', principalId: s.principal } : null, endpoint: `https://${s.name}.search.windows.net` });
  },
  'storage container create': {
    when: (p: Parsed) => /^stagt/i.test(one(p, '--account-name') ?? ''),
    run: (p: Parsed, w: World): AdminOut => {
      req(p, [['--account-name', ''], ['--name', '-n']]);
      const acct = lc(one(p, '--account-name')); storageOf(w, acct);
      const c = (agx(w).containers[acct] ??= {});
      const created = !c[lc(one(p, '--name'))]; c[lc(one(p, '--name'))] ??= [];
      w.emit('agx.container', { account: acct, name: lc(one(p, '--name')) });
      return out(p, { created });
    },
  },
  'storage blob upload-batch': {
    extra: { '-s': '--source', '-d': '--destination' },
    when: (p: Parsed) => /^stagt/i.test(one(p, '--account-name') ?? ''),
    run: (p: Parsed, w: World): AdminOut => {
      req(p, [['--account-name', ''], ['--destination', ''], ['--source', '-s']]);
      const acct = lc(one(p, '--account-name')); storageOf(w, acct);
      const cont = lc(one(p, '--destination'));
      if (!agx(w).containers[acct]?.[cont]) throw new SimError(`The specified container does not exist: ${cont}. Create it first with az storage container create.`, 'ContainerNotFound');
      if (!/policy-docs\/?$/.test(one(p, '--source') ?? '')) throw new SimError(`The source folder '${one(p, '--source')}' was not found. The sample files are in ./policy-docs.`, 'PathNotFound');
      agx(w).containers[acct][cont] = Object.keys(POLICY_DOCS);
      w.emit('agx.blob.upload', { account: acct, container: cont, count: Object.keys(POLICY_DOCS).length });
      return out(p, Object.keys(POLICY_DOCS).map((f) => ({ Blob: `${cont}/${f}`, Type: 'upload', Result: 'OK' })), Object.keys(POLICY_DOCS).map((f) => ({ Blob: `${cont}/${f}`, Result: 'OK' })), ['Blob', 'Result']);
    },
  },
  'role assignment create': {
    when: (p: Parsed) => !!roleKey(p) && ownScope(one(p, '--scope')),
    run: (p: Parsed, w: World): AdminOut => {
      req(p, [['--assignee', ''], ['--role', ''], ['--scope', '']]);
      const key = roleKey(p)!; const scope = one(p, '--scope')!;
      const principal = lc(one(p, '--assignee', '--assignee-object-id'));
      const sm = scope.match(/searchServices\/([\w-]+)/i); const tm = scope.match(/storageAccounts\/(stagt[\w]*)/i);
      if (key === 'search-reader') {
        const s = sm && agx(w).search[lc(sm[1])];
        if (!s) throw new SimError(`The scope '${scope}' isn't a search service in this subscription. Search Index Data Reader is assigned on the search service.`, 'MissingSubscription');
        s.roles.push(`${principal}|search-reader`);
      } else {
        if (!tm) throw new SimError(`Storage Blob Data Reader is assigned on the storage account that holds the blobs. Use the storage account's resource id as the scope.`, 'MissingSubscription');
        const s = Object.values(agx(w).search).find((x) => x.principal.toLowerCase() === principal || x.name === principal);
        if (!s) throw new SimError(`Principal '${principal}' wasn't found. Use the search service's principalId from az search service show.`, 'PrincipalNotFound');
        s.roles.push(`${s.principal.toLowerCase()}|storage-reader`);
      }
      w.emit('agx.role', { principal, role: key, scope });
      return out(p, { id: `${scope}/providers/Microsoft.Authorization/roleAssignments/${uuid()}`, principalId: principal, roleDefinitionName: one(p, '--role'), scope });
    },
  },
  'cognitiveservices account project create': (p: Parsed, w: World): AdminOut => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', '']]);
    const r = w.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    addProject(w, r, one(p, '--project-name')!, 'cli');
    return out(p, { name: one(p, '--project-name'), identity: { type: 'SystemAssigned', principalId: pid(`${r.name}/${one(p, '--project-name')}`) }, properties: { endpoints: { 'AI Foundry API': `https://${r.name}.services.ai.azure.com/api/projects/${one(p, '--project-name')}` } } });
  },
  'cognitiveservices account project show': (p: Parsed, w: World): AdminOut => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', '']]);
    const r = w.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
    if (!(r.props.projects as string[]).includes(one(p, '--project-name')!)) throw new SimError(`Project '${one(p, '--project-name')}' was not found in '${r.name}'.`, 'ResourceNotFound');
    return out(p, { name: one(p, '--project-name'), identity: { type: 'SystemAssigned', principalId: pid(`${r.name}/${one(p, '--project-name')}`) } });
  },
};

export function az(tokens: string[], w: World): AdminOut | null {
  if (!tokens.length) return null;
  const t = TABLE as unknown as Record<string, any>;
  return run(t, tokens, w);
}

/* ------------------------------------------------------------------ */
/* shell                                                               */
/* ------------------------------------------------------------------ */
const MINE = ['azure-search-documents'];
const KNOWN = [...MINE, 'requests', 'azure-ai-projects', 'azure-identity', 'azure-ai-textanalytics', 'azure-cognitiveservices-speech', 'azure-ai-contentunderstanding', 'azure-ai-contentsafety', 'azure-ai-translation-text', 'openai', 'python-dotenv'];

export function shell(tokens: string[], w: World): AdminOut | null {
  const c = tokens[0]?.toLowerCase();
  const rest = tokens.slice(1);
  if (c === 'pip' || c === 'pip3') {
    if (rest[0] !== 'install') return null;
    const pkgs = rest.slice(1).map((p) => p.replace(/^["']|["']$/g, '').replace(/[<>=].*$/, '').toLowerCase()).filter((p) => !p.startsWith('-'));
    if (!pkgs.some((p) => MINE.includes(p)) || pkgs.some((p) => !KNOWN.includes(p))) return null;
    (w as any).pip = [...new Set([...((w as any).pip ?? []), ...pkgs])];
    w.emit('pip.install', { pkgs });
    return { out: `${pkgs.map((p) => `Collecting ${p}\n  Downloading ${p}-1.0.0-py3-none-any.whl`).join('\n')}\nSuccessfully installed ${pkgs.join(' ')}` };
  }
  if (c === 'cat' && rest[0] && (FILES[rest[0]] || BINARY.has(rest[0]))) {
    const f = rest[0];
    w.emit('py.view', { file: f });
    if (FILES[f]) return { out: FILES[f] };
    const d = POLICY_DOCS[f]; const cd = CLAIM_DOCS[f];
    return { out: d ? `(binary file: ${d.title}, ${d.pages} pages${d.scanned ? ', a scan with no text layer' : ''})` : `(binary file: ${cd.label})` };
  }
  if (c === 'bash' && rest[0] === 'setup-kb.sh') {
    try {
      const outText = buildKb(w, rest.includes('--semantic'));
      w.emit('py.run', { file: 'setup-kb.sh', ok: true, args: rest.slice(1) });
      return { out: outText };
    } catch (e) { if (e instanceof SimError) return { error: e.message }; throw e; }
  }
  if ((c === 'python' || c === 'python3') && rest[0] && FILE_KEYS.includes(rest[0])) {
    const file = rest[0]; const argv = rest.slice(1);
    try {
      const o = APPS[file](argv, w);
      w.emit('py.run', { file, ok: true, args: argv });
      return { out: o };
    } catch (e) {
      if (e instanceof SimError) {
        w.emit('py.run', { file, ok: false, args: argv, error: e.message.split('\n')[0] });
        return { error: `Traceback (most recent call last):\n  File "/home/learner/${file}", line 12, in <module>\n${e.message}` };
      }
      throw e;
    }
  }
  return null;
}

export const COMPLETIONS: string[] = [
  ...FILE_KEYS.map((f) => `python ${f}`),
  'pip install azure-search-documents azure-identity',
  'az search service create',
  'cat claim-analyzer.json',
  'bash setup-kb.sh --semantic',
];
