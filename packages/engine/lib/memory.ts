import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Fragment, OutcomeCard } from "@/types";
import { embedTexts } from "./embeddings";

const DB_PATH = process.env.EPISODIC_DB || "./memory/episodic.sqlite";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  task TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  outcome TEXT NOT NULL,
  lesson TEXT NOT NULL,
  citations_json TEXT NOT NULL,
  signals_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fragments (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  text TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  source TEXT,
  trust REAL,
  emb_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_frag_ts ON fragments(ts DESC);
CREATE INDEX IF NOT EXISTS idx_ep_ts ON episodes(ts DESC);

CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS fragment_concepts (
  fragment_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (fragment_id, concept_id)
);
CREATE INDEX IF NOT EXISTS idx_fc_frag ON fragment_concepts(fragment_id);
CREATE INDEX IF NOT EXISTS idx_fc_con ON fragment_concepts(concept_id);

-- Civic tables for Phase 15
CREATE TABLE IF NOT EXISTS representative_profile (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  constitution_path TEXT NOT NULL,
  memory_summary TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_active INTEGER NOT NULL,
  communication_prefs_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS civic_outbox (
  id TEXT PRIMARY KEY,
  packet_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  acknowledged_at INTEGER
);

CREATE TABLE IF NOT EXISTS civic_inbox (
  id TEXT PRIMARY KEY,
  packet_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  received_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS civic_questions (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  intent TEXT NOT NULL,
  principles_json TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at INTEGER NOT NULL,
  answered_at INTEGER,
  answer TEXT,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS civic_mood (
  id TEXT PRIMARY KEY,
  uncertainty REAL NOT NULL,
  novelty REAL NOT NULL,
  stability REAL NOT NULL,
  engagement REAL NOT NULL,
  source TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  node_count INTEGER
);

CREATE TABLE IF NOT EXISTS civic_reflections (
  id TEXT PRIMARY KEY,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  alignment_score REAL NOT NULL,
  drift_detected_json TEXT NOT NULL DEFAULT '[]',
  conflicts_detected_json TEXT NOT NULL DEFAULT '[]',
  questions_generated INTEGER NOT NULL DEFAULT 0,
  packets_sent INTEGER NOT NULL DEFAULT 0,
  packets_received INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Civic indexes
CREATE INDEX IF NOT EXISTS idx_civic_outbox_status ON civic_outbox(status);
CREATE INDEX IF NOT EXISTS idx_civic_outbox_created ON civic_outbox(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_inbox_status ON civic_inbox(status);
CREATE INDEX IF NOT EXISTS idx_civic_inbox_received ON civic_inbox(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_questions_status ON civic_questions(status);
CREATE INDEX IF NOT EXISTS idx_civic_questions_created ON civic_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_mood_timestamp ON civic_mood(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reflections_period ON civic_reflections(period_start DESC);
`);

export function writeOutcomeCard(card: OutcomeCard) {
  const stmt = db.prepare(`INSERT INTO episodes
    (id, ts, task, plan_json, outcome, lesson, citations_json, signals_json)
    VALUES (@id, @ts, @task, @plan, @outcome, @lesson, @cits, @sigs)`);
  stmt.run({
    id: card.id,
    ts: card.ts,
    task: card.task,
    plan: JSON.stringify(card.plan ?? []),
    outcome: card.outcome,
    lesson: card.lesson,
    cits: JSON.stringify(card.citations ?? []),
    sigs: JSON.stringify(card.signals ?? {})
  });
}

export function addFragment(text: string, tags: string[], trust = 0.6, emb?: number[]): Fragment {
  const frag: Fragment = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    text,
    tags,
    trust,
    emb: emb ?? []
  };
  const stmt = db.prepare(`INSERT INTO fragments
    (id, ts, text, tags_json, source, trust, emb_json)
    VALUES (@id, @ts, @text, @tags, '', @trust, @emb)`);
  stmt.run({
    id: frag.id,
    ts: frag.ts,
    text: frag.text,
    tags: JSON.stringify(frag.tags),
    trust: frag.trust ?? 0.6,
    emb: JSON.stringify(frag.emb ?? [])
  });
  return frag;
}

export function latestOutcomeCards(n = 10): OutcomeCard[] {
  const rows = db.prepare(`SELECT * FROM episodes ORDER BY ts DESC LIMIT ?`).all(n);
  return rows.map((r: any) => ({
    id: r.id,
    ts: r.ts,
    task: r.task,
    plan: JSON.parse(r.plan_json),
    outcome: r.outcome,
    lesson: r.lesson,
    citations: JSON.parse(r.citations_json),
    signals: JSON.parse(r.signals_json)
  }));
}

export function topConcepts(limit = 20): { name: string; count: number }[] {
  const rows = db.prepare(`
    SELECT c.name AS name, COUNT(*) AS count
    FROM fragment_concepts fc JOIN concepts c ON c.id = fc.concept_id
    GROUP BY c.id ORDER BY count DESC LIMIT ?`).all(limit);
  return rows as any[];
}

// Simple miner (turn tags/keywords into concept links)
const STOP = new Set(["the","a","an","and","or","to","of","in","on","for","with","is","it","that","this","as","at","by","be","are","was","were","from","about","into","over","under","if","then","so","we","you","i"]);

export function mineConceptsForFragment(f: Fragment) {
  // 1) Tags → strong concepts
  for (const t of f.tags || []) {
    if (t && t.length > 1) linkFragmentConcept(f.id, t.toLowerCase(), 1.0);
  }
  // 2) Keyword skim → light concepts
  const words = (f.text.toLowerCase().match(/\b[\w'-]{3,}\b/g) || [])
    .filter(w => !STOP.has(w))
    .slice(0, 40); // keep it light
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  Object.entries(counts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 5) // top 5 terms
    .forEach(([w, c]) => linkFragmentConcept(f.id, w, 0.5 + Math.min(0.5, c*0.05)));
}

export function fragmentsAll(limit = 500) {
  const rows = db.prepare(`SELECT * FROM fragments ORDER BY ts DESC LIMIT ?`).all(limit);
  return rows.map((r: any) => ({
    id: r.id,
    ts: r.ts,
    text: r.text,
    tags: JSON.parse(r.tags_json),
    source: r.source,
    trust: r.trust,
    emb: JSON.parse(r.emb_json)
  })) as Fragment[];
}

// Async helper to batch backfill (used by route)
export async function backfillEmbeddings(frags: Fragment[]) {
  const missing = frags.filter(f => !f.emb || f.emb.length === 0);
  if (missing.length === 0) return;

  const vecs = await embedTexts(missing.map(m => m.text));
  const up = db.prepare(`UPDATE fragments SET emb_json = ? WHERE id = ?`);
  missing.forEach((m, i) => {
    up.run(JSON.stringify(vecs[i] || []), m.id);
    m.emb = vecs[i] || [];
  });
}

export function latestLessons(n = 10): Fragment[] {
  const rows = db.prepare(`SELECT * FROM fragments ORDER BY ts DESC LIMIT ?`).all(100);
  const frags = rows.map((r: any) => ({
    id: r.id,
    ts: r.ts,
    text: r.text,
    tags: JSON.parse(r.tags_json),
    source: r.source,
    trust: r.trust,
    emb: JSON.parse(r.emb_json)
  })) as Fragment[];
  return frags.filter(f => f.tags.includes("lesson")).slice(0, n);
}

// === Civic Helper Functions (Phase 15) ===

/**
 * Save representative profile to database
 */
export function saveRepresentativeProfile(profile: any): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO representative_profile (
      id, display_name, constitution_path, memory_summary,
      public_key, created_at, last_active, communication_prefs_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    profile.id,
    profile.display_name,
    profile.constitution_path,
    profile.memory_summary,
    profile.public_key,
    profile.created_at,
    profile.last_active,
    JSON.stringify(profile.communication_prefs || {})
  );
}

/**
 * Load representative profile from database
 */
export function loadRepresentativeProfile(): any | null {
  const row = db.prepare(`
    SELECT * FROM representative_profile 
    ORDER BY created_at DESC LIMIT 1
  `).get() as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    display_name: row.display_name,
    constitution_path: row.constitution_path,
    memory_summary: row.memory_summary,
    public_key: row.public_key,
    created_at: row.created_at,
    last_active: row.last_active,
    communication_prefs: JSON.parse(row.communication_prefs_json)
  };
}

/**
 * Save civic question to database
 */
export function saveCivicQuestion(question: any): void {
  const stmt = db.prepare(`
    INSERT INTO civic_questions (
      id, content, intent, principles_json, triggered_by, 
      status, priority, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    question.id,
    question.content,
    question.intent,
    JSON.stringify(question.principles),
    question.triggered_by,
    question.status,
    question.priority || "medium",
    question.created_at
  );
}

/**
 * Get unanswered civic questions
 */
export function getUnansweredCivicQuestions(): any[] {
  const rows = db.prepare(`
    SELECT * FROM civic_questions 
    WHERE status = 'pending' 
    ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END,
      created_at DESC
  `).all();
  
  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    intent: row.intent,
    principles: JSON.parse(row.principles_json),
    triggered_by: row.triggered_by,
    status: row.status,
    priority: row.priority,
    created_at: row.created_at,
    answered_at: row.answered_at,
    answer: row.answer
  }));
}

/**
 * Answer a civic question
 */
export function answerCivicQuestion(questionId: string, answer: string): boolean {
  const stmt = db.prepare(`
    UPDATE civic_questions 
    SET status = 'answered', answer = ?, answered_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(answer, Date.now(), questionId);
  return result.changes > 0;
}

/**
 * Save civic packet to outbox
 */
export function saveCivicOutbox(packet: any): void {
  const stmt = db.prepare(`
    INSERT INTO civic_outbox (id, packet_json, status, created_at)
    VALUES (?, ?, 'pending', ?)
  `);
  
  stmt.run(
    packet.id,
    JSON.stringify(packet),
    Date.now()
  );
}

/**
 * Save civic packet to inbox
 */
export function saveCivicInbox(packet: any): void {
  const stmt = db.prepare(`
    INSERT INTO civic_inbox (id, packet_json, status, received_at)
    VALUES (?, ?, 'new', ?)
  `);
  
  stmt.run(
    packet.id,
    JSON.stringify(packet),
    Date.now()
  );
}

/**
 * Get civic outbox packets
 */
export function getCivicOutbox(limit = 20): any[] {
  const rows = db.prepare(`
    SELECT packet_json FROM civic_outbox 
    ORDER BY created_at DESC LIMIT ?
  `).all(limit);
  
  return rows.map((row: any) => JSON.parse(row.packet_json));
}

/**
 * Get civic inbox packets
 */
export function getCivicInbox(limit = 20): any[] {
  const rows = db.prepare(`
    SELECT packet_json FROM civic_inbox 
    ORDER BY received_at DESC LIMIT ?
  `).all(limit);
  
  return rows.map((row: any) => JSON.parse(row.packet_json));
}

/**
 * Record civic mood
 */
export function recordCivicMood(mood: any): void {
  const stmt = db.prepare(`
    INSERT INTO civic_mood (
      id, uncertainty, novelty, stability, engagement,
      source, timestamp, node_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    crypto.randomUUID(),
    mood.uncertainty,
    mood.novelty,
    mood.stability,
    mood.engagement,
    mood.source,
    mood.timestamp,
    mood.node_count || null
  );
}

/**
 * Get recent civic mood
 */
export function getRecentCivicMood(limit = 10): any[] {
  const rows = db.prepare(`
    SELECT * FROM civic_mood 
    ORDER BY timestamp DESC LIMIT ?
  `).all(limit);
  
  return rows.map((row: any) => ({
    uncertainty: row.uncertainty,
    novelty: row.novelty,
    stability: row.stability,
    engagement: row.engagement,
    source: row.source,
    timestamp: row.timestamp,
    node_count: row.node_count
  }));
}

export function upsertConcept(name: string): string {
  const id = crypto.randomUUID();
  try {
    db.prepare(`INSERT INTO concepts (id,name) VALUES (?,?)`).run(id, name);
    return id;
  } catch {
    const row = db.prepare(`SELECT id FROM concepts WHERE name = ?`).get(name) as any;
    return row?.id || id;
  }
}

export function linkFragmentConcept(fragmentId: string, conceptName: string, weight = 1.0) {
  const cid = upsertConcept(conceptName);
  db.prepare(`INSERT OR REPLACE INTO fragment_concepts (fragment_id, concept_id, weight) VALUES (?,?,?)`)
    .run(fragmentId, cid, weight);
}

export function conceptsForFragment(fragmentId: string): { name: string; weight: number }[] {
  const rows = db.prepare(`
    SELECT c.name, fc.weight 
    FROM fragment_concepts fc JOIN concepts c ON c.id = fc.concept_id
    WHERE fc.fragment_id = ? ORDER BY fc.weight DESC`).all(fragmentId);
  return rows as any[];
}
