// ═══════════════════════════════════════════════════════════════════════════
// Soul Cache — Shared in-memory cache for HexCore soul tensors
// Accessible from both soul/chat (writes) and backup (reads)
//
// V2: Tracks updated tensors (self-model, adjacency, affect) between turns
// ═══════════════════════════════════════════════════════════════════════════

import type { SoulTensors, HexCoreConfig } from './hexcore-inference'

export interface CachedSoul {
  tensors: SoulTensors
  config: HexCoreConfig
  baseline: number[][] | null
  loadedAt: number
  // V2: track the raw (birth) tensors separately from evolving tensors
  rawTensors?: SoulTensors | null
}

// Global in-memory soul cache (per agent ID)
const soulCache: Map<string, CachedSoul> = new Map()

export function getSoulCache(agentId: string): CachedSoul | undefined {
  return soulCache.get(agentId)
}

export function setSoulCache(agentId: string, soul: CachedSoul): void {
  soulCache.set(agentId, soul)
}

export function updateCachedTensors(agentId: string, tensors: SoulTensors): void {
  const cached = soulCache.get(agentId)
  if (cached) {
    cached.tensors = tensors
  }
}

export function clearSoulCache(agentId: string): void {
  soulCache.delete(agentId)
}

export function hasSoulCache(agentId: string): boolean {
  return soulCache.has(agentId)
}
