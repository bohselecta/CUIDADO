/**
 * Civic Ledger - Persistent Storage for Civic Records
 * Phase 15: Personal AI Representatives and Networked Polis
 * 
 * This module implements persistent storage for civic records including
 * outbox, inbox, questions, and representative profiles.
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { 
  CivicPacket, 
  CivicQuestion, 
  RepresentativeProfile, 
  CivicMood,
  CivicReflection,
  CivicStats
} from "@/src/types/civic";

// Database path
const DB_PATH = process.env.EPISODIC_DB || "./memory/episodic.sqlite";
const dir = path.dirname(DB_PATH);

// Ensure directory exists
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Create civic tables
db.exec(`
  -- Representative profiles
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

  -- Civic outbox (packets we've sent)
  CREATE TABLE IF NOT EXISTS civic_outbox (
    id TEXT PRIMARY KEY,
    packet_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, acknowledged
    created_at INTEGER NOT NULL,
    sent_at INTEGER,
    acknowledged_at INTEGER
  );

  -- Civic inbox (packets we've received)
  CREATE TABLE IF NOT EXISTS civic_inbox (
    id TEXT PRIMARY KEY,
    packet_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- new, reviewed, archived
    received_at INTEGER NOT NULL,
    reviewed_at INTEGER,
    archived_at INTEGER
  );

  -- Civic questions (AI-generated questions for user)
  CREATE TABLE IF NOT EXISTS civic_questions (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    intent TEXT NOT NULL,
    principles_json TEXT NOT NULL,
    triggered_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, answered, archived
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
    created_at INTEGER NOT NULL,
    answered_at INTEGER,
    answer TEXT,
    archived_at INTEGER
  );

  -- Civic mood tracking
  CREATE TABLE IF NOT EXISTS civic_mood (
    id TEXT PRIMARY KEY,
    uncertainty REAL NOT NULL,
    novelty REAL NOT NULL,
    stability REAL NOT NULL,
    engagement REAL NOT NULL,
    source TEXT NOT NULL, -- local, network
    timestamp INTEGER NOT NULL,
    node_count INTEGER
  );

  -- Civic reflections (periodic self-evaluations)
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

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_civic_outbox_status ON civic_outbox(status);
  CREATE INDEX IF NOT EXISTS idx_civic_outbox_created ON civic_outbox(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_civic_inbox_status ON civic_inbox(status);
  CREATE INDEX IF NOT EXISTS idx_civic_inbox_received ON civic_inbox(received_at DESC);
  CREATE INDEX IF NOT EXISTS idx_civic_questions_status ON civic_questions(status);
  CREATE INDEX IF NOT EXISTS idx_civic_questions_created ON civic_questions(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_civic_mood_timestamp ON civic_mood(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_civic_reflections_period ON civic_reflections(period_start DESC);
`);

/**
 * Save packet to outbox
 */
export function saveToOutbox(packet: CivicPacket): void {
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
 * Save packet to inbox
 */
export function saveToInbox(packet: CivicPacket): void {
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
 * Record a civic question
 */
export function recordQuestion(question: CivicQuestion): void {
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
 * Get unanswered questions
 */
export function getUnansweredQuestions(): CivicQuestion[] {
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
 * Answer a question
 */
export function answerQuestion(questionId: string, answer: string): boolean {
  const stmt = db.prepare(`
    UPDATE civic_questions 
    SET status = 'answered', answer = ?, answered_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(answer, Date.now(), questionId);
  return result.changes > 0;
}

/**
 * Archive a question
 */
export function archiveQuestion(questionId: string): boolean {
  const stmt = db.prepare(`
    UPDATE civic_questions 
    SET status = 'archived', archived_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(Date.now(), questionId);
  return result.changes > 0;
}

/**
 * Get civic history (outbox + inbox)
 */
export function getCivicHistory(limit = 50): {
  outbox: CivicPacket[];
  inbox: CivicPacket[];
} {
  const outboxRows = db.prepare(`
    SELECT packet_json FROM civic_outbox 
    ORDER BY created_at DESC LIMIT ?
  `).all(limit);
  
  const inboxRows = db.prepare(`
    SELECT packet_json FROM civic_inbox 
    ORDER BY received_at DESC LIMIT ?
  `).all(limit);
  
  return {
    outbox: outboxRows.map((row: any) => JSON.parse(row.packet_json)),
    inbox: inboxRows.map((row: any) => JSON.parse(row.packet_json))
  };
}

/**
 * Save representative profile
 */
export function saveRepresentativeProfile(profile: RepresentativeProfile): void {
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
 * Load representative profile
 */
export function loadRepresentativeProfile(): RepresentativeProfile | null {
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
 * Record civic mood
 */
export function recordCivicMood(mood: CivicMood): void {
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
export function getRecentCivicMood(limit = 10): CivicMood[] {
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

/**
 * Record civic reflection
 */
export function recordCivicReflection(reflection: CivicReflection): void {
  const stmt = db.prepare(`
    INSERT INTO civic_reflections (
      id, period_start, period_end, alignment_score,
      drift_detected_json, conflicts_detected_json,
      questions_generated, packets_sent, packets_received,
      summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    reflection.id,
    reflection.period_start,
    reflection.period_end,
    reflection.alignment_score,
    JSON.stringify(reflection.drift_detected),
    JSON.stringify(reflection.conflicts_detected),
    reflection.questions_generated,
    reflection.packets_sent,
    reflection.packets_received,
    reflection.summary,
    Date.now()
  );
}

/**
 * Get civic statistics
 */
export function getCivicStats(): CivicStats {
  const totalQuestions = db.prepare(`
    SELECT COUNT(*) as count FROM civic_questions
  `).get() as any;
  
  const unansweredQuestions = db.prepare(`
    SELECT COUNT(*) as count FROM civic_questions WHERE status = 'pending'
  `).get() as any;
  
  const packetsSent = db.prepare(`
    SELECT COUNT(*) as count FROM civic_outbox
  `).get() as any;
  
  const packetsReceived = db.prepare(`
    SELECT COUNT(*) as count FROM civic_inbox
  `).get() as any;
  
  const lastTick = db.prepare(`
    SELECT MAX(created_at) as last_tick FROM civic_questions
  `).get() as any;
  
  const representativeAge = db.prepare(`
    SELECT MIN(created_at) as created_at FROM representative_profile
  `).get() as any;
  
  const now = Date.now();
  const ageDays = representativeAge.created_at ? 
    Math.floor((now - representativeAge.created_at) / (1000 * 60 * 60 * 24)) : 0;
  
  return {
    total_questions: totalQuestions.count,
    unanswered_questions: unansweredQuestions.count,
    packets_sent: packetsSent.count,
    packets_received: packetsReceived.count,
    last_curiosity_tick: lastTick.last_tick || 0,
    representative_age_days: ageDays
  };
}

/**
 * Update outbox packet status
 */
export function updateOutboxStatus(
  packetId: string, 
  status: "pending" | "sent" | "acknowledged"
): boolean {
  const stmt = db.prepare(`
    UPDATE civic_outbox 
    SET status = ?, 
        sent_at = CASE WHEN ? = 'sent' THEN ? ELSE sent_at END,
        acknowledged_at = CASE WHEN ? = 'acknowledged' THEN ? ELSE acknowledged_at END
    WHERE id = ?
  `);
  
  const now = Date.now();
  const result = stmt.run(status, status, now, status, now, packetId);
  return result.changes > 0;
}

/**
 * Update inbox packet status
 */
export function updateInboxStatus(
  packetId: string, 
  status: "new" | "reviewed" | "archived"
): boolean {
  const stmt = db.prepare(`
    UPDATE civic_inbox 
    SET status = ?, 
        reviewed_at = CASE WHEN ? = 'reviewed' THEN ? ELSE reviewed_at END,
        archived_at = CASE WHEN ? = 'archived' THEN ? ELSE archived_at END
    WHERE id = ?
  `);
  
  const now = Date.now();
  const result = stmt.run(status, status, now, status, now, packetId);
  return result.changes > 0;
}

/**
 * Get packets by status
 */
export function getPacketsByStatus(
  type: "outbox" | "inbox",
  status: string,
  limit = 20
): CivicPacket[] {
  const table = type === "outbox" ? "civic_outbox" : "civic_inbox";
  const orderBy = type === "outbox" ? "created_at" : "received_at";
  
  const rows = db.prepare(`
    SELECT packet_json FROM ${table} 
    WHERE status = ? 
    ORDER BY ${orderBy} DESC LIMIT ?
  `).all(status, limit);
  
  return rows.map((row: any) => JSON.parse(row.packet_json));
}

/**
 * Clean up old records
 */
export function cleanupOldRecords(daysToKeep = 90): {
  outbox_cleaned: number;
  inbox_cleaned: number;
  questions_cleaned: number;
  mood_cleaned: number;
} {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  const outboxResult = db.prepare(`
    DELETE FROM civic_outbox 
    WHERE created_at < ? AND status = 'acknowledged'
  `).run(cutoffTime);
  
  const inboxResult = db.prepare(`
    DELETE FROM civic_inbox 
    WHERE received_at < ? AND status = 'archived'
  `).run(cutoffTime);
  
  const questionsResult = db.prepare(`
    DELETE FROM civic_questions 
    WHERE created_at < ? AND status = 'archived'
  `).run(cutoffTime);
  
  const moodResult = db.prepare(`
    DELETE FROM civic_mood 
    WHERE timestamp < ?
  `).run(cutoffTime);
  
  return {
    outbox_cleaned: outboxResult.changes,
    inbox_cleaned: inboxResult.changes,
    questions_cleaned: questionsResult.changes,
    mood_cleaned: moodResult.changes
  };
}

/**
 * Export civic data
 */
export function exportCivicData(): {
  profile: RepresentativeProfile | null;
  questions: CivicQuestion[];
  outbox: CivicPacket[];
  inbox: CivicPacket[];
  mood: CivicMood[];
  stats: CivicStats;
} {
  return {
    profile: loadRepresentativeProfile(),
    questions: getUnansweredQuestions(),
    outbox: getPacketsByStatus("outbox", "sent", 100),
    inbox: getPacketsByStatus("inbox", "reviewed", 100),
    mood: getRecentCivicMood(50),
    stats: getCivicStats()
  };
}

/**
 * Initialize civic tables (migration helper)
 */
export function initializeCivicTables(): void {
  console.log("[CIVIC] Initializing civic tables...");
  
  // Tables are created by the db.exec() call above
  // This function can be used for additional initialization
  
  console.log("[CIVIC] Civic tables initialized successfully");
}

/**
 * Get database health status
 */
export function getDatabaseHealth(): {
  healthy: boolean;
  tables: string[];
  record_counts: Record<string, number>;
  last_activity: number;
} {
  const tables = [
    "representative_profile",
    "civic_outbox", 
    "civic_inbox",
    "civic_questions",
    "civic_mood",
    "civic_reflections"
  ];
  
  const recordCounts: Record<string, number> = {};
  let lastActivity = 0;
  
  for (const table of tables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
      recordCounts[table] = count.count;
      
      // Get last activity timestamp
      const lastRow = db.prepare(`
        SELECT MAX(created_at) as last_activity FROM ${table}
      `).get() as any;
      
      if (lastRow.last_activity && lastRow.last_activity > lastActivity) {
        lastActivity = lastRow.last_activity;
      }
    } catch (error) {
      console.error(`[CIVIC] Error checking table ${table}:`, error);
      recordCounts[table] = -1;
    }
  }
  
  return {
    healthy: Object.values(recordCounts).every(count => count >= 0),
    tables,
    record_counts: recordCounts,
    last_activity: lastActivity
  };
}
