import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import ReviewDatabase, { Score } from '../../src/database';

describe('ReviewDatabase', () => {
  let tempDir: string;
  let originalClinkyHome: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clinky-test-'));
    originalClinkyHome = process.env.CLINKY_HOME;
    process.env.CLINKY_HOME = tempDir;
  });

  afterEach(() => {
    if (originalClinkyHome) {
      process.env.CLINKY_HOME = originalClinkyHome;
    } else {
      delete process.env.CLINKY_HOME;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('should add and retrieve reviews', async () => {
    const db = new ReviewDatabase();

    db.addReview('test-card', Score.MEDIUM);
    // Add a small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
    db.addReview('test-card', Score.EASY);

    const reviews = db.getReviews('test-card');
    expect(reviews).toHaveLength(2);
    expect(reviews[0].score).toBe(Score.EASY);
    expect(reviews[1].score).toBe(Score.MEDIUM);

    db.close();
  });

  test('should get all reviews', () => {
    const db = new ReviewDatabase();

    db.addReview('card1', Score.HARD);
    db.addReview('card2', Score.EASY);
    db.addReview('card1', Score.MEDIUM);

    const allReviews = db.getAllReviews();
    expect(allReviews).toHaveLength(3);

    db.close();
  });
});
