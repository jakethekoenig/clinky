import { expect, test, describe } from 'bun:test';
import path from 'path';
import { getSrsData } from '../src/srs';

describe('SRS defaults', () => {
  test('new cards are due immediately by default', () => {
    const fakePath = path.join('/tmp', 'some_card.txt');
    const data = getSrsData(fakePath);
    // Default due date should be in the past so it's always due
    expect(data.due_date.getTime()).toBeLessThan(Date.now());
    expect(data.interval).toBeGreaterThan(0);
    expect(data.easiness_factor).toBeGreaterThan(0);
  });
});
