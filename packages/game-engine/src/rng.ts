/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Enables reproducible games, replaying bugs, and unit test predictability.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public rollDice(): [number, number] {
    const d1 = this.nextInt(1, 6);
    const d2 = this.nextInt(1, 6);
    return [d1, d2];
  }

  public getSeed(): number {
    return this.state;
  }
}
