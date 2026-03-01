import type { TaskType } from "@/types/inference";
import { TASK_CONFIGS } from "@/types/task-config";

/**
 * Estimate USDC cost for a task based on predicted execution time.
 */
export function estimateCostUsdc(
  task: TaskType,
  ratePerSec: number,
  overrideSeconds?: number,
): number {
  const seconds = overrideSeconds ?? TASK_CONFIGS[task].estimatedSeconds;
  return roundUsdc(seconds * ratePerSec);
}

/**
 * Compute exact USDC cost from actual predict time.
 */
export function actualCostUsdc(
  predictTimeMs: number,
  ratePerSec: number,
): number {
  return roundUsdc((predictTimeMs / 1000) * ratePerSec);
}

/**
 * Convert human-readable USDC amount to on-chain 6-decimal bigint.
 */
export function usdcToOnChainAmount(usdc: number): bigint {
  return BigInt(Math.round(usdc * 1_000_000));
}

/**
 * Convert on-chain 6-decimal bigint to human-readable USDC amount.
 */
export function onChainAmountToUsdc(amount: bigint): number {
  return Number(amount) / 1_000_000;
}

/**
 * Format USDC amount for display (e.g. "$0.0100").
 */
export function formatUsdc(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

function roundUsdc(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
