export type SieveEvent =
  | { type: "prime"; n: number }
  | { type: "strike"; n: number; by: number }
  | { type: "complete" };

export type CellStatus = "idle" | "prime" | "composite";

/** Build the ordered animation script for the Sieve of Eratosthenes up to `limit`. */
export function buildSieveEvents(limit: number): SieveEvent[] {
  const events: SieveEvent[] = [];
  if (limit < 2) {
    events.push({ type: "complete" });
    return events;
  }

  const marked = new Uint8Array(limit + 1);
  for (let p = 2; p <= limit; p++) {
    if (marked[p]) continue;
    events.push({ type: "prime", n: p });
    const start = p * p;
    if (start > limit) continue;
    for (let m = start; m <= limit; m += p) {
      if (!marked[m]) {
        marked[m] = 1;
        events.push({ type: "strike", n: m, by: p });
      }
    }
  }
  events.push({ type: "complete" });
  return events;
}

export function factorize(n: number): number[] {
  if (!Number.isInteger(n) || n < 2) return [];
  const factors: number[] = [];
  let x = n;
  while (x % 2 === 0) {
    factors.push(2);
    x /= 2;
  }
  for (let d = 3; d * d <= x; d += 2) {
    while (x % d === 0) {
      factors.push(d);
      x /= d;
    }
  }
  if (x > 1) factors.push(x);
  return factors;
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  const factors = factorize(n);
  return factors.length === 1 && factors[0] === n;
}

export function divisorsOf(n: number): number[] {
  if (!Number.isInteger(n) || n < 1) return [];
  const small: number[] = [];
  const large: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      small.push(i);
      const pair = n / i;
      if (pair !== i) large.push(pair);
    }
  }
  return small.concat(large.reverse());
}

export function groupedFactors(factors: number[]): [number, number][] {
  const groups: [number, number][] = [];
  for (const f of factors) {
    const last = groups[groups.length - 1];
    if (last && last[0] === f) last[1] += 1;
    else groups.push([f, 1]);
  }
  return groups;
}

const SUPER: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

export function superscript(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => SUPER[d] ?? d);
}

export function formatExponential(factors: number[]): string {
  return groupedFactors(factors)
    .map(([p, k]) => (k === 1 ? String(p) : `${p}${superscript(k)}`))
    .join(" × ");
}

/** Repeatedly split off the smallest prime factor — a walkable factor ladder. */
export function factorSteps(n: number): { value: number; factor: number; rest: number }[] {
  const factors = factorize(n);
  const steps: { value: number; factor: number; rest: number }[] = [];
  let x = n;
  for (const f of factors) {
    if (x === f) break;
    steps.push({ value: x, factor: f, rest: x / f });
    x /= f;
  }
  return steps;
}

export function narrate(event: SieveEvent, limit: number, primeCount: number): string {
  if (event.type === "prime") {
    if (event.n * event.n > limit) {
      return `${event.n} was never crossed out. No smaller prime divides it, so it is prime.`;
    }
    if (event.n === 2) {
      return `2 is the first unmarked number, so it is prime — the only even prime. Next, every even number above 2 is crossed out.`;
    }
    return `${event.n} is unmarked, so it is prime. Crossing out multiples of ${event.n}, starting at ${event.n}² = ${event.n * event.n}.`;
  }
  if (event.type === "strike") {
    const k = event.n / event.by;
    if (event.n === event.by * event.by) {
      return `${event.n} = ${event.by}². Smaller multiples of ${event.by} were already crossed out by earlier primes, so the sieve starts here.`;
    }
    return `${event.n} = ${event.by} × ${k}, so it is composite and can be ignored.`;
  }
  return `Sieve complete. Every unmarked integer up to ${limit} is prime — ${primeCount} in all.`;
}

export const INTRO_NARRATION =
  "Every integer starts unmarked. Run the sieve: the first unmarked number is prime, and its multiples are crossed out. Repeat until nothing unmarked remains.";
