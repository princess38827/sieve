import { create } from "zustand";
import {
  type CellStatus,
  type SieveEvent,
  buildSieveEvents,
  INTRO_NARRATION,
  narrate,
} from "@/lib/primes";

export type Speed = "slow" | "medium" | "fast";

export const SPEED_MS: Record<Speed, { prime: number; strike: number }> = {
  slow: { prime: 700, strike: 280 },
  medium: { prime: 340, strike: 120 },
  fast: { prime: 150, strike: 45 },
};

export const LIMIT_MIN = 20;
export const LIMIT_MAX = 200;
export const LIMIT_DEFAULT = 100;
export const LIMIT_PRESETS = [30, 50, 100, 150, 200] as const;

function clampLimit(n: number): number {
  const rounded = Math.round(n / 10) * 10;
  return Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, rounded));
}

function blank(limit: number) {
  return {
    limit,
    cells: Array.from({ length: limit + 1 }, () => "idle" as CellStatus),
    events: buildSieveEvents(limit),
    cursor: 0,
    playing: false,
    currentPrime: null as number | null,
    striking: null as number | null,
    primes: [] as number[],
    complete: false,
    narration: INTRO_NARRATION,
  };
}

interface SieveState {
  limit: number;
  cells: CellStatus[];
  events: SieveEvent[];
  cursor: number;
  playing: boolean;
  speed: Speed;
  currentPrime: number | null;
  striking: number | null;
  primes: number[];
  complete: boolean;
  narration: string;
  selected: number | null;
  setLimit: (n: number) => void;
  setSpeed: (s: Speed) => void;
  setSelected: (n: number | null) => void;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  finish: () => void;
}

export const useSieve = create<SieveState>((set, get) => ({
  ...blank(LIMIT_DEFAULT),
  speed: "medium",
  selected: null,

  setLimit: (n) => {
    const limit = clampLimit(n);
    const selected = get().selected;
    set({
      ...blank(limit),
      speed: get().speed,
      selected: selected !== null && selected <= limit ? selected : null,
    });
  },

  setSpeed: (speed) => set({ speed }),

  setSelected: (selected) => set({ selected }),

  play: () => {
    if (get().complete) get().reset();
    set({ playing: true });
  },

  pause: () => set({ playing: false }),

  step: () => {
    const { cursor, events, cells, primes, limit, complete } = get();
    if (complete) {
      set({ playing: false });
      return;
    }
    const event = events[cursor];
    if (!event) {
      set({ complete: true, playing: false, striking: null, currentPrime: null });
      return;
    }

    if (event.type === "prime") {
      const nextCells = cells.slice();
      nextCells[event.n] = "prime";
      const nextPrimes = [...primes, event.n];
      set({
        cells: nextCells,
        primes: nextPrimes,
        currentPrime: event.n,
        striking: null,
        cursor: cursor + 1,
        narration: narrate(event, limit, nextPrimes.length),
      });
      return;
    }

    if (event.type === "strike") {
      const nextCells = cells.slice();
      nextCells[event.n] = "composite";
      set({
        cells: nextCells,
        striking: event.n,
        cursor: cursor + 1,
        narration: narrate(event, limit, primes.length),
      });
      return;
    }

    set({
      complete: true,
      playing: false,
      striking: null,
      currentPrime: null,
      cursor: cursor + 1,
      narration: narrate(event, limit, primes.length),
    });
  },

  reset: () => {
    const { limit, speed, selected } = get();
    set({
      ...blank(limit),
      speed,
      selected: selected !== null && selected <= limit ? selected : null,
    });
  },

  finish: () => {
    const { events, limit, speed, selected } = get();
    const cells = Array.from({ length: limit + 1 }, () => "idle" as CellStatus);
    const primes: number[] = [];
    for (const event of events) {
      if (event.type === "prime") {
        cells[event.n] = "prime";
        primes.push(event.n);
      } else if (event.type === "strike") {
        cells[event.n] = "composite";
      }
    }
    set({
      limit,
      cells,
      events,
      primes,
      cursor: events.length,
      complete: true,
      playing: false,
      striking: null,
      currentPrime: null,
      speed,
      selected,
      narration: narrate({ type: "complete" }, limit, primes.length),
    });
  },
}));
