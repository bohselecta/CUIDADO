/**
 * Civic Exchange Protocol
 * Phase 15: Personal AI Representatives and Networked Polis
 * 
 * This module implements the P2P communication layer for inter-node dialogue
 * with cryptographic signatures and packet management.
 */

import crypto from "node:crypto";
import type { CivicPacket, KeyPair, CivicExchangeConfig } from "@/src/types/civic";
import { loadKeypair } from "./representative";

// Configuration
const FEDERATION_ENABLED = process.env.CIVIC_FEDERATION_ENABLED === "true";
const RELAY_URL = process.env.CIVIC_RELAY_URL || "";
const AUTO_RESPOND = process.env.CIVIC_AUTO_RESPOND === "true";
const REQUIRE_USER_REVIEW = process.env.CIVIC_REQUIRE_USER_REVIEW !== "false";
const MAX_PACKET_SIZE = Number(process.env.CIVIC_MAX_PACKET_SIZE || 10000);
const SIGNATURE_REQUIRED = process.env.CIVIC_SIGNATURE_REQUIRED !== "false";

/**
 * Generate ed25519 keypair for civic exchange
 */
export function generateKeypair(): KeyPair {
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
 * Load keypair from environment or representative
 */
export function loadKeypair(): KeyPair {
  const publicKey = process.env.CIVIC_PUBLIC_KEY;
  const privateKey = process.env.CIVIC_PRIVATE_KEY;

  if (publicKey && privateKey) {
    return {
      publicKey,
      privateKey,
      algorithm: "ed25519"
    };
  }

  // Fall back to representative keypair
  return loadKeypair();
}

/**
 * Create a civic packet
 */
export function createPacket(
  type: CivicPacket["type"],
  content: string,
  intent: string,
  principles: string[],
  to?: string,
  replyTo?: string
): CivicPacket {
  const packet: CivicPacket = {
    id: crypto.randomUUID(),
    from: "", // Will be set by signAndQueue
    type,
    intent,
    principles,
    content,
    signature: "", // Will be set by signAndQueue
    timestamp: new Date().toISOString(),
    reply_to: replyTo
  };

  if (to) {
    packet.to = to;
  }

  return packet;
}

/**
 * Sign a civic packet with ed25519
 */
export function signPacket(packet: CivicPacket, privateKey: string): string {
  // Create signature payload (exclude signature field)
  const { signature, ...payload } = packet;
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  
  // Sign with ed25519
  const sign = crypto.createSign('ed25519');
  sign.update(payloadString);
  
  // Convert private key to proper format
  const formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  
  const signature = sign.sign(formattedPrivateKey, 'base64');
  return signature;
}

/**
 * Verify a civic packet signature
 */
export function verifyPacket(packet: CivicPacket, publicKey: string): boolean {
  try {
    // Create signature payload (exclude signature field)
    const { signature, ...payload } = packet;
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    
    // Verify with ed25519
    const verify = crypto.createVerify('ed25519');
    verify.update(payloadString);
    
    // Convert public key to proper format
    const formattedPublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    
    return verify.verify(formattedPublicKey, signature, 'base64');
  } catch (error) {
    console.error("[EXCHANGE] Signature verification failed:", error);
    return false;
  }
}

/**
 * Sign and queue a packet for sending
 */
export async function signAndQueue(packet: CivicPacket): Promise<CivicPacket> {
  // Validate packet size
  if (JSON.stringify(packet).length > MAX_PACKET_SIZE) {
    throw new Error(`Packet too large: ${JSON.stringify(packet).length} > ${MAX_PACKET_SIZE}`);
  }

  // Load keypair
  const keypair = loadKeypair();
  
  // Set sender ID (placeholder - will be from representative profile)
  packet.from = process.env.CIVIC_REPRESENTATIVE_ID || "local-node";
  
  // Sign packet
  packet.signature = signPacket(packet, keypair.privateKey);
  
  // Queue for sending (placeholder - will be implemented in ledger.ts)
  await queuePacketForSending(packet);
  
  return packet;
}

/**
 * Send packet to outbox
 */
export async function sendToOutbox(packet: CivicPacket): Promise<void> {
  // This will be implemented when we create ledger.ts
  console.log(`[EXCHANGE] Queuing packet for outbox: ${packet.id}`);
}

/**
 * Receive packets from inbox
 */
export async function receiveFromInbox(): Promise<CivicPacket[]> {
  // This will be implemented when we create ledger.ts
  return [];
}

/**
 * Process incoming packet
 */
export async function processIncomingPacket(packet: CivicPacket): Promise<{
  processed: boolean;
  requiresReview: boolean;
  error?: string;
}> {
  try {
    // Verify signature if required
    if (SIGNATURE_REQUIRED) {
      // In a real implementation, we'd look up the sender's public key
      // For now, we'll assume it's valid if present
      if (!packet.signature) {
        return {
          processed: false,
          requiresReview: false,
          error: "Missing signature"
        };
      }
    }

    // Check if packet requires user review
    const requiresReview = REQUIRE_USER_REVIEW || 
                          packet.type === "proposal" || 
                          packet.intent === "challenge_assumption";

    // Auto-respond if enabled and appropriate
    if (AUTO_RESPOND && !requiresReview && packet.type === "question") {
      await generateAutoResponse(packet);
    }

    // Store in inbox
    await storeInInbox(packet);

    return {
      processed: true,
      requiresReview
    };

  } catch (error) {
    return {
      processed: false,
      requiresReview: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Generate automatic response to a question
 */
async function generateAutoResponse(packet: CivicPacket): Promise<void> {
  // This would integrate with the AI model to generate a response
  // For now, just log the intent
  console.log(`[EXCHANGE] Would generate auto-response to: ${packet.content.slice(0, 50)}...`);
}

/**
 * Send packet to relay server (if federation enabled)
 */
export async function sendToRelay(packet: CivicPacket): Promise<boolean> {
  if (!FEDERATION_ENABLED || !RELAY_URL) {
    return false;
  }

  try {
    const response = await fetch(`${RELAY_URL}/api/civic/relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packet)
    });

    return response.ok;
  } catch (error) {
    console.error("[EXCHANGE] Failed to send to relay:", error);
    return false;
  }
}

/**
 * Receive packets from relay server
 */
export async function receiveFromRelay(): Promise<CivicPacket[]> {
  if (!FEDERATION_ENABLED || !RELAY_URL) {
    return [];
  }

  try {
    const response = await fetch(`${RELAY_URL}/api/civic/relay/poll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.packets || [];
  } catch (error) {
    console.error("[EXCHANGE] Failed to receive from relay:", error);
    return [];
  }
}

/**
 * Get exchange configuration
 */
export function getExchangeConfig(): CivicExchangeConfig {
  return {
    federation_enabled: FEDERATION_ENABLED,
    relay_url: RELAY_URL || undefined,
    auto_respond: AUTO_RESPOND,
    require_user_review: REQUIRE_USER_REVIEW,
    max_packet_size: MAX_PACKET_SIZE,
    signature_required: SIGNATURE_REQUIRED
  };
}

/**
 * Update exchange configuration
 */
export function updateExchangeConfig(config: Partial<CivicExchangeConfig>): void {
  // This would update environment variables or config file
  // For now, just log the changes
  console.log("[EXCHANGE] Configuration update:", config);
}

/**
 * Validate packet before sending
 */
export function validatePacket(packet: CivicPacket): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!packet.id) errors.push("Missing packet ID");
  if (!packet.from) errors.push("Missing sender");
  if (!packet.type) errors.push("Missing packet type");
  if (!packet.intent) errors.push("Missing intent");
  if (!packet.content) errors.push("Missing content");
  if (!packet.principles || packet.principles.length === 0) errors.push("Missing principles");
  if (!packet.timestamp) errors.push("Missing timestamp");

  // Validate packet size
  const packetSize = JSON.stringify(packet).length;
  if (packetSize > MAX_PACKET_SIZE) {
    errors.push(`Packet too large: ${packetSize} > ${MAX_PACKET_SIZE}`);
  }

  // Validate content length
  if (packet.content.length > 5000) {
    errors.push("Content too long");
  }

  // Validate principles
  if (packet.principles.some(p => p.length > 100)) {
    errors.push("Principle names too long");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create packet from template
 */
export function createPacketFromTemplate(
  template: "question" | "response" | "proposal" | "insight",
  content: string,
  context?: {
    intent?: string;
    principles?: string[];
    replyTo?: string;
    to?: string;
  }
): CivicPacket {
  const templates = {
    question: {
      type: "question" as const,
      intent: context?.intent || "clarify_value",
      principles: context?.principles || ["transparency", "curiosity"]
    },
    response: {
      type: "response" as const,
      intent: context?.intent || "provide_clarity",
      principles: context?.principles || ["helpfulness", "honesty"]
    },
    proposal: {
      type: "proposal" as const,
      intent: context?.intent || "propose_action",
      principles: context?.principles || ["collaboration", "innovation"]
    },
    insight: {
      type: "insight" as const,
      intent: context?.intent || "share_insight",
      principles: context?.principles || ["wisdom", "generosity"]
    }
  };

  const templateConfig = templates[template];
  
  return createPacket(
    templateConfig.type,
    content,
    templateConfig.intent,
    templateConfig.principles,
    context?.to,
    context?.replyTo
  );
}

/**
 * Extract packet metadata for display
 */
export function extractPacketMetadata(packet: CivicPacket): {
  id: string;
  type: string;
  intent: string;
  principles: string[];
  contentPreview: string;
  timestamp: string;
  from: string;
  to?: string;
} {
  return {
    id: packet.id,
    type: packet.type,
    intent: packet.intent,
    principles: packet.principles,
    contentPreview: packet.content.slice(0, 100) + (packet.content.length > 100 ? "..." : ""),
    timestamp: packet.timestamp,
    from: packet.from,
    to: packet.to
  };
}

/**
 * Queue packet for sending (placeholder)
 */
async function queuePacketForSending(packet: CivicPacket): Promise<void> {
  // This will be implemented when we create ledger.ts
  console.log(`[EXCHANGE] Queueing packet: ${packet.id}`);
}

/**
 * Store packet in inbox (placeholder)
 */
async function storeInInbox(packet: CivicPacket): Promise<void> {
  // This will be implemented when we create ledger.ts
  console.log(`[EXCHANGE] Storing in inbox: ${packet.id}`);
}

/**
 * Get exchange statistics
 */
export function getExchangeStats(): {
  packets_sent: number;
  packets_received: number;
  packets_pending: number;
  federation_enabled: boolean;
  last_sync: number;
} {
  // This will be implemented when we create ledger.ts
  return {
    packets_sent: 0,
    packets_received: 0,
    packets_pending: 0,
    federation_enabled: FEDERATION_ENABLED,
    last_sync: Date.now()
  };
}
