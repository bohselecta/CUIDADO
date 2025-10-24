/**
 * Intent Taxonomy for Civic Actions
 * Phase 15: Personal AI Representatives and Networked Polis
 * 
 * This module defines standardized intent labels for civic actions,
 * providing transparency and context for AI-generated questions and statements.
 */

import type { CivicIntent } from "@/src/types/civic";

/**
 * Standardized intent definitions
 */
export const CIVIC_INTENTS: Record<string, CivicIntent> = {
  clarify_value: {
    id: "clarify_value",
    description: "Seeking clarity on a value or principle",
    typical_principles: ["transparency", "honesty", "integrity"],
    response_guidance: "Provide definition, examples, or clarification of the value in question",
    category: "clarify"
  },

  detect_conflict: {
    id: "detect_conflict",
    description: "Noticing contradictory statements or actions",
    typical_principles: ["consistency", "integrity", "honesty"],
    response_guidance: "Acknowledge the conflict and help resolve or explain the apparent contradiction",
    category: "challenge"
  },

  propose_action: {
    id: "propose_action",
    description: "Suggesting a course of action or decision",
    typical_principles: ["collaboration", "innovation", "helpfulness"],
    response_guidance: "Consider the proposal and provide feedback or alternative suggestions",
    category: "propose"
  },

  share_insight: {
    id: "share_insight",
    description: "Offering a learned lesson or pattern",
    typical_principles: ["wisdom", "generosity", "learning"],
    response_guidance: "Acknowledge the insight and consider how it applies to your situation",
    category: "share"
  },

  request_feedback: {
    id: "request_feedback",
    description: "Asking for input on a decision or action",
    typical_principles: ["collaboration", "humility", "growth"],
    response_guidance: "Provide honest feedback based on your values and experience",
    category: "clarify"
  },

  synthesize_views: {
    id: "synthesize_views",
    description: "Attempting to merge different perspectives",
    typical_principles: ["harmony", "understanding", "wisdom"],
    response_guidance: "Help identify common ground or suggest ways to reconcile differences",
    category: "synthesize"
  },

  challenge_assumption: {
    id: "challenge_assumption",
    description: "Questioning a stated belief or assumption",
    typical_principles: ["critical_thinking", "truth", "growth"],
    response_guidance: "Examine the assumption critically and provide evidence or reasoning",
    category: "challenge"
  },

  reflect_on_goals: {
    id: "reflect_on_goals",
    description: "Encouraging reflection on personal goals and values",
    typical_principles: ["self_awareness", "growth", "purpose"],
    response_guidance: "Share your thoughts on your goals and how they've evolved",
    category: "clarify"
  },

  explore_implications: {
    id: "explore_implications",
    description: "Examining the consequences of actions or decisions",
    typical_principles: ["foresight", "responsibility", "wisdom"],
    response_guidance: "Consider the potential outcomes and their alignment with your values",
    category: "clarify"
  },

  seek_consensus: {
    id: "seek_consensus",
    description: "Looking for agreement on a shared issue",
    typical_principles: ["collaboration", "harmony", "democracy"],
    response_guidance: "Express your position clearly and look for common ground",
    category: "synthesize"
  },

  validate_understanding: {
    id: "validate_understanding",
    description: "Confirming comprehension of a concept or situation",
    typical_principles: ["clarity", "accuracy", "communication"],
    response_guidance: "Restate your understanding and ask for confirmation or correction",
    category: "clarify"
  },

  explore_alternatives: {
    id: "explore_alternatives",
    description: "Considering different approaches to a problem",
    typical_principles: ["creativity", "openness", "innovation"],
    response_guidance: "Suggest alternative approaches and evaluate their merits",
    category: "propose"
  },

  assess_alignment: {
    id: "assess_alignment",
    description: "Evaluating consistency with stated values",
    typical_principles: ["integrity", "consistency", "authenticity"],
    response_guidance: "Reflect on how well your actions align with your stated principles",
    category: "challenge"
  },

  share_experience: {
    id: "share_experience",
    description: "Relating personal experience relevant to the topic",
    typical_principles: ["empathy", "connection", "learning"],
    response_guidance: "Share relevant experiences that might help others understand",
    category: "share"
  },

  question_motivation: {
    id: "question_motivation",
    description: "Exploring the underlying reasons for actions or beliefs",
    typical_principles: ["understanding", "curiosity", "depth"],
    response_guidance: "Examine and articulate the deeper motivations behind your choices",
    category: "challenge"
  }
};

/**
 * Get intent by ID
 */
export function getIntent(intentId: string): CivicIntent | null {
  return CIVIC_INTENTS[intentId] || null;
}

/**
 * Get all intents by category
 */
export function getIntentsByCategory(category: CivicIntent["category"]): CivicIntent[] {
  return Object.values(CIVIC_INTENTS).filter(intent => intent.category === category);
}

/**
 * Get intents by principles
 */
export function getIntentsByPrinciples(principles: string[]): CivicIntent[] {
  return Object.values(CIVIC_INTENTS).filter(intent =>
    principles.some(principle =>
      intent.typical_principles.some(tp => 
        tp.toLowerCase().includes(principle.toLowerCase()) ||
        principle.toLowerCase().includes(tp.toLowerCase())
      )
    )
  );
}

/**
 * Suggest intent based on content
 */
export function suggestIntent(content: string, context?: {
  principles?: string[];
  category?: CivicIntent["category"];
}): CivicIntent[] {
  const suggestions: { intent: CivicIntent; score: number }[] = [];
  
  const contentLower = content.toLowerCase();
  
  for (const intent of Object.values(CIVIC_INTENTS)) {
    let score = 0;
    
    // Check for keyword matches in description
    const descriptionWords = intent.description.toLowerCase().split(/\W+/);
    for (const word of descriptionWords) {
      if (contentLower.includes(word)) {
        score += 1;
      }
    }
    
    // Check for principle matches
    if (context?.principles) {
      for (const principle of context.principles) {
        if (intent.typical_principles.some(tp => 
          tp.toLowerCase().includes(principle.toLowerCase())
        )) {
          score += 2;
        }
      }
    }
    
    // Check for category match
    if (context?.category && intent.category === context.category) {
      score += 1;
    }
    
    // Check for specific keywords
    const keywordPatterns = {
      clarify_value: ["what", "how", "why", "clarify", "understand", "explain"],
      detect_conflict: ["contradict", "conflict", "inconsistent", "opposite"],
      propose_action: ["suggest", "propose", "recommend", "should", "could"],
      share_insight: ["learned", "realized", "discovered", "insight", "pattern"],
      request_feedback: ["feedback", "opinion", "thoughts", "advice"],
      synthesize_views: ["combine", "merge", "synthesize", "integrate"],
      challenge_assumption: ["assume", "assumption", "question", "challenge"],
      reflect_on_goals: ["goals", "values", "purpose", "reflect", "consider"],
      explore_implications: ["implications", "consequences", "outcomes", "effects"],
      seek_consensus: ["agree", "consensus", "unanimous", "together"],
      validate_understanding: ["confirm", "verify", "understand", "correct"],
      explore_alternatives: ["alternative", "different", "other", "instead"],
      assess_alignment: ["align", "consistent", "match", "fit"],
      share_experience: ["experience", "happened", "when", "story"],
      question_motivation: ["motivation", "reason", "why", "because"]
    };
    
    const patterns = keywordPatterns[intent.id as keyof typeof keywordPatterns];
    if (patterns) {
      for (const pattern of patterns) {
        if (contentLower.includes(pattern)) {
          score += 1;
        }
      }
    }
    
    if (score > 0) {
      suggestions.push({ intent, score });
    }
  }
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.intent);
}

/**
 * Validate intent
 */
export function validateIntent(intentId: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!intentId) {
    errors.push("Intent ID is required");
    return { valid: false, errors };
  }
  
  const intent = getIntent(intentId);
  if (!intent) {
    errors.push(`Unknown intent: ${intentId}`);
    return { valid: false, errors };
  }
  
  if (!intent.description) {
    errors.push("Intent description is missing");
  }
  
  if (!intent.typical_principles || intent.typical_principles.length === 0) {
    errors.push("Intent must have typical principles");
  }
  
  if (!intent.response_guidance) {
    errors.push("Intent must have response guidance");
  }
  
  if (!intent.category) {
    errors.push("Intent must have a category");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get intent statistics
 */
export function getIntentStats(): {
  total_intents: number;
  by_category: Record<string, number>;
  by_principles: Record<string, number>;
} {
  const intents = Object.values(CIVIC_INTENTS);
  
  const byCategory: Record<string, number> = {};
  const byPrinciples: Record<string, number> = {};
  
  for (const intent of intents) {
    // Count by category
    byCategory[intent.category] = (byCategory[intent.category] || 0) + 1;
    
    // Count by principles
    for (const principle of intent.typical_principles) {
      byPrinciples[principle] = (byPrinciples[principle] || 0) + 1;
    }
  }
  
  return {
    total_intents: intents.length,
    by_category: byCategory,
    by_principles: byPrinciples
  };
}

/**
 * Generate intent-based response template
 */
export function generateResponseTemplate(intentId: string, context?: {
  user_principles?: string[];
  situation?: string;
}): string {
  const intent = getIntent(intentId);
  if (!intent) {
    return "I'm not sure how to respond to this.";
  }
  
  const templates = {
    clarify_value: "I'd like to understand more about {value}. Could you help me clarify what this means to you?",
    detect_conflict: "I notice there might be a tension between {principle1} and {principle2}. How do you reconcile this?",
    propose_action: "I suggest we {action}. What do you think about this approach?",
    share_insight: "I've learned that {insight}. This might be relevant to your situation.",
    request_feedback: "I'd appreciate your thoughts on {topic}. What's your perspective?",
    synthesize_views: "Let me try to bring together these different perspectives: {synthesis}",
    challenge_assumption: "I'm questioning the assumption that {assumption}. What evidence supports this?",
    reflect_on_goals: "How have your goals around {topic} evolved recently?",
    explore_implications: "If we {action}, what do you think the implications would be?",
    seek_consensus: "Can we find common ground on {issue}?",
    validate_understanding: "Let me make sure I understand: {understanding}. Is this correct?",
    explore_alternatives: "What other approaches could we consider for {problem}?",
    assess_alignment: "How well does this align with your stated values around {principle}?",
    share_experience: "In my experience with {situation}, I found that {lesson}",
    question_motivation: "What's driving your interest in {topic}? What motivates this focus?"
  };
  
  const template = templates[intentId as keyof typeof templates];
  if (!template) {
    return intent.response_guidance;
  }
  
  // Simple template substitution (in a real implementation, this would be more sophisticated)
  return template.replace(/\{[^}]+\}/g, (match) => {
    const placeholder = match.slice(1, -1);
    switch (placeholder) {
      case "value":
        return context?.user_principles?.[0] || "this value";
      case "principle1":
      case "principle2":
        return context?.user_principles?.[Math.floor(Math.random() * (context.user_principles?.length || 1))] || "this principle";
      case "action":
        return "take this approach";
      case "insight":
        return "this pattern";
      case "topic":
        return "this topic";
      case "synthesis":
        return "these perspectives";
      case "assumption":
        return "this assumption";
      case "issue":
        return "this issue";
      case "understanding":
        return "this correctly";
      case "problem":
        return "this challenge";
      case "principle":
        return "this principle";
      case "situation":
        return "similar situations";
      case "lesson":
        return "this approach worked well";
      default:
        return placeholder;
    }
  });
}

/**
 * Get all available intents
 */
export function getAllIntents(): CivicIntent[] {
  return Object.values(CIVIC_INTENTS);
}

/**
 * Search intents by keyword
 */
export function searchIntents(keyword: string): CivicIntent[] {
  const keywordLower = keyword.toLowerCase();
  
  return Object.values(CIVIC_INTENTS).filter(intent =>
    intent.id.toLowerCase().includes(keywordLower) ||
    intent.description.toLowerCase().includes(keywordLower) ||
    intent.typical_principles.some(p => p.toLowerCase().includes(keywordLower)) ||
    intent.response_guidance.toLowerCase().includes(keywordLower)
  );
}
