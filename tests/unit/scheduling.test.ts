import { describe, expect, it } from "bun:test";
// Reuse internal functions by duplicating minimal scheduling here for test purposes
// This validates monotonicity of intervals increasing with correct answers.

function computeState(historyScores: number[]): { ef: number; interval: number; repetitions: number } {
  let ef = 2.5;
  let interval = 0;
  let repetitions = 0;
  for (let i = 0; i < historyScores.length; i++) {
    const q = historyScores[i];
    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ef);
      repetitions++;
    }
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef &lt; 1.3) ef = 1.3;
  }
  return { ef, interval, repetitions };
}

describe("SM-2 progression", () => {
  it("increases interval on consecutive good recalls", () => {
    const s1 = computeState([5]);
    const s2 = computeState([5, 5]);
    const s3 = computeState([5, 5, 5]);
    expect(s1.interval).toBeGreaterThanOrEqual(1);
    expect(s2.interval).toBeGreaterThan(s1.interval);
    expect(s3.interval).toBeGreaterThanOrEqual(s2.interval);
  });
});
