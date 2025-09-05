import { expect, test, describe } from 'bun:test';
import path from 'path';
import { getSrsData } from '../src/srs';
import { db } from '../src/db';

describe('SRS defaults', () => {
  test('new cards are due immediately by default', () => {
    const fakePath = path.join('/tmp', 'some_card.txt');
    const cardName = path.basename(fakePath);

    // Ensure no pre-existing row can affect the default behavior
    db.query('DELETE FROM cards WHERE card_name = ?').run(cardName);

    const data = getSrsData(fakePath);

    // Default due date should be epoch (always due)
    expect(data.due_date.getTime()).toBe(0);
    expect(data.interval).toBeGreaterThan(0);
    expect(data.easiness_factor).toBeGreaterThan(0);
  });
});
