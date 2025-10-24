import type { Fragment } from "@/types";
import { cosine } from "./embeddings";

export type Retrieved = { id: string; text: string; tags: string[]; score: number; mode: "dense"|"bm25" };
type Corpus = { docs: {id:string; text:string; len:number}[]; avgLen:number; df: Map<string, number>; };

// --- Small stopword list
const STOP = new Set(["the","a","an","and","or","to","of","in","on","for","with","is","it","that","this","as","at","by","be","are","was","were","from","about","into","over","under","if","then","so","we","you","i"]);

// --- Build a transient BM25 corpus per request (fast enough for <= 800 docs)
function buildCorpus(frags: Fragment[]): Corpus {
  const docs = frags.map(f => ({ id: f.id, text: f.text.toLowerCase(), len: tokenCount(f.text) }));
  const N = docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) {
    const seen = new Set<string>();
    for (const w of tokenize(d.text)) {
      if (STOP.has(w)) continue;
      if (!seen.has(w)) { seen.add(w); df.set(w, (df.get(w) || 0) + 1); }
    }
  }
  const avgLen = docs.reduce((p,c)=>p+c.len,0) / N;
  return { docs, avgLen, df };
}

function tokenize(s: string) {
  return (s.match(/\b[\w'-]{2,}\b/g) || []).map(w => w.replace(/['']/g,"'"));
}
function tokenCount(s: string) { return tokenize(s).length; }
function termFreq(tokens: string[]) {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}
function idf(N: number, df: number) {
  // BM25 idf with +0.5 smoothing
  return Math.log(1 + (N - df + 0.5) / (df + 0.5));
}
export function bm25TopK(frags: Fragment[], query: string, k = 6, k1 = 1.5, b = 0.75): Retrieved[] {
  if (!frags.length) return [];
  const corpus = buildCorpus(frags);
  const N = corpus.docs.length;
  const qTokens = tokenize(query.toLowerCase()).filter(w => !STOP.has(w));
  const qSet = new Set(qTokens);

  // Precompute doc tfs
  const docTF = new Map<string, Map<string, number>>();
  for (const d of corpus.docs) docTF.set(d.id, termFreq(tokenize(d.text)));

  const scores: Retrieved[] = [];
  for (const d of corpus.docs) {
    let score = 0;
    const tf = docTF.get(d.id)!;
    for (const term of qSet) {
      const f = tf.get(term) || 0;
      if (f === 0) continue;
      const _idf = idf(N, corpus.df.get(term) || 0);
      const num = f * (k1 + 1);
      const den = f + k1 * (1 - b + b * (d.len / corpus.avgLen));
      score += _idf * (num / (den + 1e-9));
    }
    if (score > 0) {
      const frag = frags.find(x => x.id === d.id)!;
      scores.push({ id: d.id, text: frag.text, tags: frag.tags, score, mode: "bm25" });
    }
  }
  return scores.sort((a,b)=>b.score-a.score).slice(0, k);
}

// Dense (as before)
export function denseTopK(frags: Fragment[], qvec: number[], k = 6): Retrieved[] {
  const scored = frags
    .filter(f => f.emb && f.emb.length)
    .map(f => ({ id: f.id, text: f.text, tags: f.tags, score: cosine(f.emb!, qvec), mode: "dense" as const }));
  return scored.sort((a,b)=>b.score-a.score).slice(0, k);
}

// Reciprocal Rank Fusion (RRF)
export function rrfFuse(a: Retrieved[], b: Retrieved[], k = 6, kappa = 60) {
  const rank = (list: Retrieved[]) => new Map(list.map((x,i)=>[x.id, i+1]));
  const ra = rank(a), rb = rank(b);
  const all = new Map<string, Retrieved>();
  const ids = new Set([...a.map(x=>x.id), ...b.map(x=>x.id)]);
  for (const id of ids) {
    const A = a.find(x=>x.id===id);
    const B = b.find(x=>x.id===id);
    const rr = (r?: number) => 1 / (kappa + (r || 1));
    const fused = (rr(ra.get(id)) + rr(rb.get(id)));
    const rep = A || B!;
    all.set(id, { ...rep, score: fused });
  }
  return [...all.values()].sort((x,y)=>y.score-x.score).slice(0, k);
}