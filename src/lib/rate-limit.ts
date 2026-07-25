/**
 * Utility di Rate Limiting in-memory con Sliding Window per API Route Next.js.
 * Impedisce attacchi brute force e credential stuffing su login e azioni sensibili.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Pulizia periodica dei record scaduti ogni 5 minuti per prevenire memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  intervalMs?: number; // Finestra di tempo in millisecondi (default 60000 = 1 minuto)
  maxRequests?: number; // Numero massimo di tentativi nella finestra (default 5)
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { isRateLimited: boolean; remaining: number; resetTimeMs: number } {
  const intervalMs = options.intervalMs ?? 60 * 1000;
  const maxRequests = options.maxRequests ?? 5;
  const now = Date.now();

  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    memoryStore.set(identifier, {
      count: 1,
      resetTime: now + intervalMs,
    });
    return {
      isRateLimited: false,
      remaining: maxRequests - 1,
      resetTimeMs: now + intervalMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      isRateLimited: true,
      remaining: 0,
      resetTimeMs: record.resetTime,
    };
  }

  record.count += 1;
  return {
    isRateLimited: false,
    remaining: maxRequests - record.count,
    resetTimeMs: record.resetTime,
  };
}
