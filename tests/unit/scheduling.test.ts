import { describe, test, expect } from 'bun:test';
import { calculateNextReview, julianToMs } from '../../src/card';
import { Score } from '../../src/database';

describe('Scheduling', () => {
  test('julianToMs converts Julian day to milliseconds correctly', () => {
    // Julian day for 2024-01-01 00:00:00 UTC is approximately 2460310.5
    const julianDay = 2460310.5;
    const expectedMs = new Date('2024-01-01T00:00:00Z').getTime();
    const actualMs = julianToMs(julianDay);

    // Allow small floating point difference
    expect(Math.abs(actualMs - expectedMs)).toBeLessThan(1000);
  });

  test('calculateNextReview returns current date for no reviews', () => {
    const nextReview = calculateNextReview([]);
    const now = new Date();

    // Should be within a second of now
    expect(Math.abs(nextReview.getTime() - now.getTime())).toBeLessThan(1000);
  });

  test('calculateNextReview calculates correct interval for first review', () => {
    const julianNow = 2460310.5; // Arbitrary Julian day
    const msNow = julianToMs(julianNow);

    const reviews = [
      {
        card_name: 'test',
        created_at: julianNow,
        score: Score.MEDIUM,
      },
    ];

    const nextReview = calculateNextReview(reviews);
    const expectedNext = new Date(msNow + 24 * 60 * 60 * 1000); // 1 day later

    expect(nextReview.getTime()).toBe(expectedNext.getTime());
  });

  test('calculateNextReview scales interval based on previous reviews', () => {
    const julianDay1 = 2460310.5;
    const julianDay2 = julianDay1 + 1; // 1 day later

    const reviews = [
      {
        card_name: 'test',
        created_at: julianDay2,
        score: Score.EASY,
      },
      {
        card_name: 'test',
        created_at: julianDay1,
        score: Score.MEDIUM,
      },
    ];

    const nextReview = calculateNextReview(reviews);
    const msDay2 = julianToMs(julianDay2);
    // Previous interval was 1 day, EASY multiplies by 3.5
    const expectedNext = new Date(msDay2 + 1 * 24 * 60 * 60 * 1000 * 3.5);

    expect(nextReview.getTime()).toBe(expectedNext.getTime());
  });

  test('calculateNextReview resets interval on AGAIN', () => {
    const julianDay1 = 2460310.5;
    const julianDay2 = julianDay1 + 10; // 10 days later

    const reviews = [
      {
        card_name: 'test',
        created_at: julianDay2,
        score: Score.AGAIN,
      },
      {
        card_name: 'test',
        created_at: julianDay1,
        score: Score.EASY,
      },
    ];

    const nextReview = calculateNextReview(reviews);
    const msDay2 = julianToMs(julianDay2);
    // AGAIN resets to 1 minute regardless of previous interval
    const expectedNext = new Date(msDay2 + 1 * 60 * 1000);

    expect(nextReview.getTime()).toBe(expectedNext.getTime());
  });
});
