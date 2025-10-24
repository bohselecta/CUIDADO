/**
 * Civic Virtual Community Architecture Types
 * Phase 15: Personal AI Representatives and Networked Polis
 */

export interface RepresentativeProfile {
  id: string;
  display_name: string;
  constitution_path: string;
  memory_summary: string;
  public_key: string;
  created_at: number;
  last_active: number;
  communication_prefs?: {
    tone: string;
    formality: "casual" | "formal" | "mixed";
    verbosity: "concise" | "detailed" | "balanced";
  };
}

export interface CivicPacket {
  id: string;
  from: string;
  to?: string;  // optional, omit for broadcast
  type: "question" | "response" | "proposal" | "insight";
  intent: string;
  principles: string[];
  content: string;
  context_summary?: string;
  signature: string;
  timestamp: string;
  reply_to?: string; // for threaded conversations
}

export interface CivicQuestion {
  id: string;
  content: string;
  intent: string;
  principles: string[];
  triggered_by: "curiosity" | "user" | "peer";
  status: "pending" | "answered" | "archived";
  created_at: number;
  answered_at?: number;
  answer?: string;
  priority?: "low" | "medium" | "high";
}

export interface CivicMood {
  uncertainty: number;
  novelty: number;
  stability: number;
  engagement: number;
  source: "local" | "network";
  timestamp: number;
  node_count?: number; // for network mood
}

export interface CivicIntent {
  id: string;
  description: string;
  typical_principles: string[];
  response_guidance: string;
  category: "clarify" | "challenge" | "propose" | "share" | "synthesize";
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: "ed25519";
}

export interface CivicExchangeConfig {
  federation_enabled: boolean;
  relay_url?: string;
  auto_respond: boolean;
  require_user_review: boolean;
  max_packet_size: number;
  signature_required: boolean;
}

export interface SemanticShift {
  concept: string;
  old_usage: string[];
  new_usage: string[];
  significance: number; // 0-1
  detected_at: number;
}

export interface ValueConflict {
  principle: string;
  recent_actions: string[];
  contradiction: string;
  severity: "low" | "medium" | "high";
  detected_at: number;
}

export interface CivicReflection {
  id: string;
  period_start: number;
  period_end: number;
  alignment_score: number; // 0-1
  drift_detected: SemanticShift[];
  conflicts_detected: ValueConflict[];
  questions_generated: number;
  packets_sent: number;
  packets_received: number;
  summary: string;
}

export interface NetworkNode {
  id: string;
  display_name: string;
  public_key: string;
  last_seen: number;
  reputation?: number; // 0-1, optional
  capabilities?: string[]; // what this node can do
  constitution_summary?: string[];
}

export interface CivicDialogue {
  id: string;
  participants: string[]; // node IDs
  topic: string;
  started_at: number;
  last_activity: number;
  status: "active" | "paused" | "concluded";
  packets: CivicPacket[];
  synthesis?: string; // AI-generated summary
}

export interface CivicInsight {
  id: string;
  content: string;
  source_nodes: string[];
  confidence: number; // 0-1
  generated_at: number;
  tags: string[];
  principles_involved: string[];
}

// Utility types for API responses
export interface CivicAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CivicStats {
  total_questions: number;
  unanswered_questions: number;
  packets_sent: number;
  packets_received: number;
  active_dialogues: number;
  last_curiosity_tick: number;
  representative_age_days: number;
}

// Constants for civic system
export const CIVIC_INTENTS = {
  CLARIFY_VALUE: "clarify_value",
  DETECT_CONFLICT: "detect_conflict", 
  PROPOSE_ACTION: "propose_action",
  SHARE_INSIGHT: "share_insight",
  REQUEST_FEEDBACK: "request_feedback",
  SYNTHESIZE_VIEWS: "synthesize_views",
  CHALLENGE_ASSUMPTION: "challenge_assumption",
  REFLECT_ON_GOALS: "reflect_on_goals",
  EXPLORE_IMPLICATIONS: "explore_implications"
} as const;

export const CIVIC_PACKET_TYPES = {
  QUESTION: "question",
  RESPONSE: "response", 
  PROPOSAL: "proposal",
  INSIGHT: "insight"
} as const;

export const CIVIC_QUESTION_STATUS = {
  PENDING: "pending",
  ANSWERED: "answered",
  ARCHIVED: "archived"
} as const;

export const CIVIC_TRIGGERS = {
  CURIOSITY: "curiosity",
  USER: "user", 
  PEER: "peer"
} as const;
