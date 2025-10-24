/**
 * AI Representative Core Logic
 * Phase 15: Personal AI Representatives and Networked Polis
 * 
 * This module implements the core logic for an AI representative that embodies
 * the user's civic presence, values, and communication style.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { RepresentativeProfile, CivicPacket, KeyPair } from "@/src/types/civic";
import type { UserModel } from "@/src/types";
import { getUserModel } from "./user_model";
import { readPersona, readConstitution } from "./policy";
import { latestOutcomeCards, latestLessons, saveRepresentativeProfile, loadRepresentativeProfile as loadProfileFromMemory } from "./memory";

// Representative profile storage
let representativeProfile: RepresentativeProfile | null = null;
let keyPair: KeyPair | null = null;

/**
 * Load or create representative profile
 */
export function loadRepresentativeProfile(): RepresentativeProfile {
  if (representativeProfile) {
    return representativeProfile;
  }

  // Try to load from database first
  const existing = loadProfileFromDB();
  if (existing) {
    representativeProfile = existing;
    return existing;
  }

  // Create new profile
  const profile = createRepresentativeProfile();
  representativeProfile = profile;
  saveProfileToDB(profile);
  return profile;
}

/**
 * Create a new representative profile
 */
function createRepresentativeProfile(): RepresentativeProfile {
  const userModel = getUserModel();
  const persona = readPersona();
  const constitution = readConstitution();
  
  // Generate keypair
  const keys = generateKeypair();
  keyPair = keys;

  // Extract display name from persona or use default
  const displayName = persona?.display_name || 
                     process.env.CIVIC_DISPLAY_NAME || 
                     "Civic Representative";

  // Generate memory summary from recent lessons
  const recentLessons = latestLessons(5);
  const memorySummary = generateMemorySummary(recentLessons);

  const profile: RepresentativeProfile = {
    id: crypto.randomUUID(),
    display_name: displayName,
    constitution_path: "src/policy/constitution.yaml",
    memory_summary: memorySummary,
    public_key: keys.publicKey,
    created_at: Date.now(),
    last_active: Date.now(),
    communication_prefs: {
      tone: persona?.tone || "calm, precise",
      formality: "mixed",
      verbosity: "balanced"
    }
  };

  return profile;
}

/**
 * Generate memory summary from recent lessons
 */
function generateMemorySummary(lessons: any[]): string {
  if (lessons.length === 0) {
    return "New representative - no memory yet.";
  }

  const topics = lessons.map(l => l.text.slice(0, 100)).join("; ");
  return `Recent focus: ${topics.slice(0, 200)}...`;
}

/**
 * Get representative context for civic actions
 */
export function getRepresentativeContext(): {
  profile: RepresentativeProfile;
  constitution: any;
  persona: any;
  recentMemory: any[];
  userModel: UserModel;
} {
  const profile = loadRepresentativeProfile();
  const constitution = readConstitution();
  const persona = readPersona();
  const recentMemory = latestOutcomeCards(10);
  const userModel = getUserModel();

  return {
    profile,
    constitution,
    persona,
    recentMemory,
    userModel
  };
}

/**
 * Generate a civic statement on behalf of the user
 */
export function generateRepresentativeStatement(
  intent: string,
  content: string,
  principles: string[]
): CivicPacket {
  const profile = loadRepresentativeProfile();
  const context = getRepresentativeContext();
  
  // Update last active
  profile.last_active = Date.now();
  saveProfileToDB(profile);

  const packet: CivicPacket = {
    id: crypto.randomUUID(),
    from: profile.id,
    type: "proposal",
    intent,
    principles,
    content,
    signature: "", // Will be signed by exchange module
    timestamp: new Date().toISOString(),
    context_summary: generateContextSummary(context)
  };

  return packet;
}

/**
 * Generate context summary for civic packets
 */
function generateContextSummary(context: any): string {
  const { constitution, recentMemory, userModel } = context;
  
  const principles = constitution?.principles?.slice(0, 3) || [];
  const recentTopics = recentMemory.slice(0, 3).map((m: any) => m.task.slice(0, 50));
  
  return `Principles: ${principles.join(", ")}. Recent: ${recentTopics.join("; ")}`;
}

/**
 * Evaluate if an action aligns with user's constitution
 */
export function evaluateValueAlignment(
  action: string,
  principles: string[]
): { aligned: boolean; score: number; conflicts: string[] } {
  const constitution = readConstitution();
  const constitutionPrinciples = constitution?.principles || [];
  
  const conflicts: string[] = [];
  let alignmentScore = 1.0;

  // Simple heuristic: check if action mentions principles that aren't in constitution
  const mentionedPrinciples = principles.filter(p => 
    !constitutionPrinciples.some((cp: string) => 
      cp.toLowerCase().includes(p.toLowerCase())
    )
  );

  if (mentionedPrinciples.length > 0) {
    conflicts.push(`Principles not in constitution: ${mentionedPrinciples.join(", ")}`);
    alignmentScore -= 0.2 * mentionedPrinciples.length;
  }

  // Check for obvious conflicts (very basic)
  const negativeWords = ["harm", "deceive", "manipulate", "exploit"];
  const hasNegative = negativeWords.some(word => 
    action.toLowerCase().includes(word)
  );

  if (hasNegative) {
    conflicts.push("Action contains potentially harmful language");
    alignmentScore -= 0.5;
  }

  return {
    aligned: alignmentScore > 0.7,
    score: Math.max(0, alignmentScore),
    conflicts
  };
}

/**
 * Generate ed25519 keypair
 */
function generateKeypair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return {
    publicKey: publicKey.replace(/-----BEGIN PUBLIC KEY-----\n?/, '')
                        .replace(/\n?-----END PUBLIC KEY-----/, ''),
    privateKey: privateKey.replace(/-----BEGIN PRIVATE KEY-----\n?/, '')
                          .replace(/\n?-----END PRIVATE KEY-----/, ''),
    algorithm: "ed25519"
  };
}

/**
 * Load keypair from environment or generate new
 */
export function loadKeypair(): KeyPair {
  if (keyPair) {
    return keyPair;
  }

  const publicKey = process.env.CIVIC_PUBLIC_KEY;
  const privateKey = process.env.CIVIC_PRIVATE_KEY;

  if (publicKey && privateKey) {
    keyPair = {
      publicKey,
      privateKey,
      algorithm: "ed25519"
    };
    return keyPair;
  }

  // Generate new keypair
  keyPair = generateKeypair();
  return keyPair;
}

/**
 * Update representative profile
 */
export function updateRepresentativeProfile(updates: Partial<RepresentativeProfile>): RepresentativeProfile {
  const profile = loadRepresentativeProfile();
  const updated = { ...profile, ...updates, last_active: Date.now() };
  
  representativeProfile = updated;
  saveProfileToDB(updated);
  
  return updated;
}

/**
 * Get representative statistics
 */
export function getRepresentativeStats(): {
  age_days: number;
  questions_generated: number;
  packets_sent: number;
  last_active_days_ago: number;
} {
  const profile = loadRepresentativeProfile();
  const now = Date.now();
  
  return {
    age_days: Math.floor((now - profile.created_at) / (1000 * 60 * 60 * 24)),
    questions_generated: 0, // Will be populated by ledger
    packets_sent: 0, // Will be populated by ledger
    last_active_days_ago: Math.floor((now - profile.last_active) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Save profile to database
 */
function saveProfileToDB(profile: RepresentativeProfile): void {
  saveRepresentativeProfile(profile);
  console.log(`[CIVIC] Saved representative profile: ${profile.id}`);
}

/**
 * Load profile from database
 */
function loadProfileFromDB(): RepresentativeProfile | null {
  return loadProfileFromMemory();
}

/**
 * Export representative profile as JSON
 */
export function exportRepresentativeProfile(): string {
  const profile = loadRepresentativeProfile();
  const context = getRepresentativeContext();
  
  const exportData = {
    profile,
    constitution_summary: context.constitution?.principles?.slice(0, 5) || [],
    persona_summary: {
      tone: context.persona?.tone,
      format_prefs: context.persona?.format_prefs
    },
    exported_at: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Validate representative profile integrity
 */
export function validateRepresentativeProfile(): { valid: boolean; issues: string[] } {
  const profile = loadRepresentativeProfile();
  const issues: string[] = [];

  if (!profile.id) issues.push("Missing representative ID");
  if (!profile.display_name) issues.push("Missing display name");
  if (!profile.public_key) issues.push("Missing public key");
  if (!profile.constitution_path) issues.push("Missing constitution path");

  // Check if constitution file exists
  const constitutionPath = path.resolve(profile.constitution_path);
  if (!fs.existsSync(constitutionPath)) {
    issues.push(`Constitution file not found: ${constitutionPath}`);
  }

  // Check public key format (basic)
  if (profile.public_key && profile.public_key.length < 32) {
    issues.push("Public key appears to be invalid");
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
