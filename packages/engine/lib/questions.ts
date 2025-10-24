/**
 * Curiosity Engine Implementation
 * Phase 15: Personal AI Representatives and Networked Polis
 * 
 * This module implements the curiosity engine that generates questions for humans
 * based on semantic shifts, value conflicts, and external triggers.
 */

import crypto from "node:crypto";
import type { CivicQuestion, SemanticShift, ValueConflict, UserModel } from "@/src/types/civic";
import { getUserModel } from "./user_model";
import { readConstitution } from "./policy";
import { latestOutcomeCards, latestLessons, saveCivicQuestion } from "./memory";

// Configuration
const CURIOSITY_ENABLED = process.env.CIVIC_CURIOSITY_ENABLED === "true";
const CURIOSITY_INTERVAL_HOURS = Number(process.env.CIVIC_CURIOSITY_INTERVAL_HOURS || 24);

// Question generation thresholds
const SEMANTIC_SHIFT_THRESHOLD = 0.6;
const VALUE_CONFLICT_THRESHOLD = 0.7;
const REFLECTION_INTERVAL_DAYS = 7;

/**
 * Main curiosity tick function - analyzes user's state and generates questions
 */
export async function curiosityTick(): Promise<CivicQuestion[]> {
  if (!CIVIC_CURIOSITY_ENABLED) {
    return [];
  }

  const userModel = getUserModel();
  const recentMemory = latestOutcomeCards(20);
  const recentLessons = latestLessons(10);
  
  const questions: CivicQuestion[] = [];

  // 1. Analyze semantic shifts
  const semanticShifts = analyzeSemanticShift(userModel, recentMemory);
  for (const shift of semanticShifts) {
    if (shift.significance >= SEMANTIC_SHIFT_THRESHOLD) {
      const question = generateSemanticShiftQuestion(shift);
      questions.push(question);
    }
  }

  // 2. Detect value conflicts
  const valueConflicts = detectValueConflicts(userModel, recentMemory);
  for (const conflict of valueConflicts) {
    if (conflict.severity === "high" || conflict.severity === "medium") {
      const question = generateValueConflictQuestion(conflict);
      questions.push(question);
    }
  }

  // 3. Generate reflection prompts
  const reflectionQuestions = generateReflectionPrompts(userModel, recentMemory);
  questions.push(...reflectionQuestions);

  // 4. External trigger questions (placeholder for future RSS/news integration)
  const externalQuestions = await generateExternalTriggerQuestions(userModel);
  questions.push(...externalQuestions);

  // Store questions in database
  for (const question of questions) {
    await storeQuestion(question);
  }

  return questions;
}

/**
 * Analyze semantic shifts in user's language and concepts
 */
function analyzeSemanticShift(userModel: UserModel, recentMemory: any[]): SemanticShift[] {
  const shifts: SemanticShift[] = [];
  
  // Extract concepts from recent memory
  const recentConcepts = extractConcepts(recentMemory);
  const historicalConcepts = extractConceptsFromSummary(userModel.lastSummary || "");
  
  // Find concepts that appear with different usage patterns
  for (const [concept, recentUsage] of recentConcepts) {
    const historicalUsage = historicalConcepts.get(concept) || [];
    
    if (historicalUsage.length > 0 && recentUsage.length > 0) {
      const significance = calculateSemanticSignificance(recentUsage, historicalUsage);
      
      if (significance > 0.3) { // Lower threshold for detection
        shifts.push({
          concept,
          old_usage: historicalUsage,
          new_usage: recentUsage,
          significance,
          detected_at: Date.now()
        });
      }
    }
  }

  return shifts;
}

/**
 * Extract concepts and their usage from memory items
 */
function extractConcepts(memory: any[]): Map<string, string[]> {
  const concepts = new Map<string, string[]>();
  
  for (const item of memory) {
    const text = item.task || item.lesson || "";
    const words = text.toLowerCase().match(/\b[\w'-]{3,}\b/g) || [];
    
    for (const word of words) {
      if (!concepts.has(word)) {
        concepts.set(word, []);
      }
      concepts.get(word)!.push(text.slice(0, 100)); // Store context snippets
    }
  }
  
  return concepts;
}

/**
 * Extract concepts from user summary
 */
function extractConceptsFromSummary(summary: string): Map<string, string[]> {
  const concepts = new Map<string, string[]>();
  const words = summary.toLowerCase().match(/\b[\w'-]{3,}\b/g) || [];
  
  for (const word of words) {
    if (!concepts.has(word)) {
      concepts.set(word, []);
    }
    concepts.get(word)!.push(summary.slice(0, 100));
  }
  
  return concepts;
}

/**
 * Calculate semantic significance between old and new usage
 */
function calculateSemanticSignificance(recentUsage: string[], historicalUsage: string[]): number {
  // Simple heuristic: compare word co-occurrence patterns
  const recentWords = new Set(recentUsage.join(" ").toLowerCase().split(/\W+/));
  const historicalWords = new Set(historicalUsage.join(" ").toLowerCase().split(/\W+/));
  
  const intersection = new Set([...recentWords].filter(x => historicalWords.has(x)));
  const union = new Set([...recentWords, ...historicalWords]);
  
  // Jaccard similarity - lower similarity = higher significance
  const similarity = intersection.size / union.size;
  return 1 - similarity;
}

/**
 * Detect value conflicts in recent actions
 */
function detectValueConflicts(userModel: UserModel, recentMemory: any[]): ValueConflict[] {
  const conflicts: ValueConflict[] = [];
  const constitution = readConstitution();
  const principles = constitution?.principles || [];
  
  // Analyze recent actions for principle violations
  for (const memory of recentMemory) {
    const action = memory.task || "";
    const lesson = memory.lesson || "";
    
    // Check for obvious contradictions (very basic heuristic)
    for (const principle of principles) {
      const principleWords = principle.toLowerCase().split(/\W+/);
      const actionWords = (action + " " + lesson).toLowerCase().split(/\W+/);
      
      // Look for contradictory words
      const contradictions = findContradictions(principleWords, actionWords);
      
      if (contradictions.length > 0) {
        conflicts.push({
          principle,
          recent_actions: [action.slice(0, 100)],
          contradiction: contradictions.join(", "),
          severity: contradictions.length > 2 ? "high" : "medium",
          detected_at: Date.now()
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Find contradictions between principle words and action words
 */
function findContradictions(principleWords: string[], actionWords: string[]): string[] {
  const contradictions: string[] = [];
  
  const contradictionPairs = [
    ["honest", "deceive", "lie", "mislead"],
    ["respect", "disrespect", "harm", "hurt"],
    ["transparent", "hide", "conceal", "secret"],
    ["fair", "unfair", "bias", "discriminate"],
    ["helpful", "harmful", "hurt", "damage"]
  ];
  
  for (const [positive, ...negatives] of contradictionPairs) {
    const hasPositive = principleWords.includes(positive) || 
                       principleWords.some(p => p.includes(positive));
    const hasNegative = negatives.some(neg => 
      actionWords.includes(neg) || 
      actionWords.some(a => a.includes(neg))
    );
    
    if (hasPositive && hasNegative) {
      contradictions.push(`${positive} vs ${negatives.join("/")}`);
    }
  }
  
  return contradictions;
}

/**
 * Generate questions based on semantic shifts
 */
function generateSemanticShiftQuestion(shift: SemanticShift): CivicQuestion {
  const templates = [
    `I've noticed you've been using "${shift.concept}" differently recently. How has your understanding of this concept evolved?`,
    `Your recent discussions about "${shift.concept}" seem to have shifted focus. What's driving this change?`,
    `I see "${shift.concept}" appearing in new contexts in your recent conversations. Would you like to explore what this means for your values?`
  ];
  
  const content = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    id: crypto.randomUUID(),
    content,
    intent: "clarify_value",
    principles: ["transparency", "clarity"],
    triggered_by: "curiosity",
    status: "pending",
    created_at: Date.now(),
    priority: shift.significance > 0.8 ? "high" : "medium"
  };
}

/**
 * Generate questions based on value conflicts
 */
function generateValueConflictQuestion(conflict: ValueConflict): CivicQuestion {
  const templates = [
    `I noticed a potential tension between your principle of "${conflict.principle}" and recent actions. How would you like to resolve this?`,
    `There seems to be a conflict between "${conflict.principle}" and what happened recently. What's your perspective on this?`,
    `I'm seeing some inconsistency around "${conflict.principle}". Would you like to clarify your current stance?`
  ];
  
  const content = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    id: crypto.randomUUID(),
    content,
    intent: "detect_conflict",
    principles: [conflict.principle.toLowerCase(), "integrity"],
    triggered_by: "curiosity",
    status: "pending",
    created_at: Date.now(),
    priority: conflict.severity === "high" ? "high" : "medium"
  };
}

/**
 * Generate periodic reflection prompts
 */
function generateReflectionPrompts(userModel: UserModel, recentMemory: any[]): CivicQuestion[] {
  const questions: CivicQuestion[] = [];
  const now = Date.now();
  const lastReflection = userModel.lastSummary ? 
    new Date(userModel.lastSummary).getTime() : 0;
  
  const daysSinceReflection = (now - lastReflection) / (1000 * 60 * 60 * 24);
  
  if (daysSinceReflection >= REFLECTION_INTERVAL_DAYS) {
    const templates = [
      "How have your goals and priorities evolved over the past week?",
      "What patterns do you notice in your recent decisions and actions?",
      "Are there any values or principles you'd like to refine or update?",
      "What's been most important to you lately, and why?",
      "How do you feel about the direction you're heading?"
    ];
    
    const content = templates[Math.floor(Math.random() * templates.length)];
    
    questions.push({
      id: crypto.randomUUID(),
      content,
      intent: "reflect_on_goals",
      principles: ["self-awareness", "growth"],
      triggered_by: "curiosity",
      status: "pending",
      created_at: Date.now(),
      priority: "medium"
    });
  }
  
  return questions;
}

/**
 * Generate questions from external triggers (placeholder for future RSS/news integration)
 */
async function generateExternalTriggerQuestions(userModel: UserModel): Promise<CivicQuestion[]> {
  // Placeholder for future RSS/news integration
  // For now, return empty array
  return [];
}

/**
 * Store question in database
 */
async function storeQuestion(question: CivicQuestion): Promise<void> {
  saveCivicQuestion(question);
  console.log(`[CURIOSITY] Generated question: ${question.content.slice(0, 50)}...`);
}

/**
 * Get unanswered questions for user
 */
export async function getUnansweredQuestions(): Promise<CivicQuestion[]> {
  // This will be implemented when we create ledger.ts
  return [];
}

/**
 * Answer a question and update user model
 */
export async function answerQuestion(
  questionId: string, 
  answer: string
): Promise<{ success: boolean; updatedModel?: UserModel }> {
  // This will be implemented when we create ledger.ts
  console.log(`[CURIOSITY] Answering question ${questionId}: ${answer.slice(0, 50)}...`);
  
  // Update user model with new information
  const userModel = getUserModel();
  // This would update the user model based on the answer
  
  return { success: true, updatedModel: userModel };
}

/**
 * Archive a question
 */
export async function archiveQuestion(questionId: string): Promise<boolean> {
  // This will be implemented when we create ledger.ts
  console.log(`[CURIOSITY] Archiving question ${questionId}`);
  return true;
}

/**
 * Get curiosity statistics
 */
export function getCuriosityStats(): {
  questions_generated_today: number;
  questions_answered: number;
  questions_pending: number;
  last_tick: number;
} {
  // This will be implemented when we create ledger.ts
  return {
    questions_generated_today: 0,
    questions_answered: 0,
    questions_pending: 0,
    last_tick: Date.now()
  };
}

/**
 * Manual curiosity tick (for testing/debugging)
 */
export async function manualCuriosityTick(): Promise<CivicQuestion[]> {
  console.log("[CURIOSITY] Manual tick triggered");
  return await curiosityTick();
}

/**
 * Check if curiosity engine should run
 */
export function shouldRunCuriosityTick(): boolean {
  if (!CIVIC_CURIOSITY_ENABLED) return false;
  
  // Check if enough time has passed since last tick
  const lastTick = getLastTickTime();
  const now = Date.now();
  const hoursSinceLastTick = (now - lastTick) / (1000 * 60 * 60);
  
  return hoursSinceLastTick >= CURIOSITY_INTERVAL_HOURS;
}

/**
 * Get last tick time (placeholder)
 */
function getLastTickTime(): number {
  // This will be implemented when we create ledger.ts
  return Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago (force tick)
}
