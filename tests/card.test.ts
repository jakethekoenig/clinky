import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { parseCard } from '../src/card';

const TEST_CARDS_DIR = './test_cards';

describe('parseCard', () => {
  beforeEach(() => {
    if (!fs.existsSync(TEST_CARDS_DIR)) {
      fs.mkdirSync(TEST_CARDS_DIR);
    }
  });

  afterEach(() => {
    fs.rmSync(TEST_CARDS_DIR, { recursive: true, force: true });
  });

  test('should parse a valid card', () => {
    const cardPath = path.join(TEST_CARDS_DIR, 'valid.txt');
    const content = 'Front\n<!---split--->\nBack\n% comment';
    fs.writeFileSync(cardPath, content);

    const card = parseCard(cardPath);
    expect(card).not.toBeNull();
    expect(card?.front).toBe('Front');
    expect(card?.back).toBe('Back');
  });

  test('should return null for a card with no split separator', () => {
    const cardPath = path.join(TEST_CARDS_DIR, 'invalid.txt');
    const content = 'Front only';
    fs.writeFileSync(cardPath, content);

    const card = parseCard(cardPath);
    expect(card).toBeNull();
  });

  test('should handle multiline front and back', () => {
    const cardPath = path.join(TEST_CARDS_DIR, 'multiline.txt');
    const content = 'Line 1\nLine 2\n<!---split--->\nBack line 1\nBack line 2';
    fs.writeFileSync(cardPath, content);

    const card = parseCard(cardPath);
    expect(card?.front).toBe('Line 1\nLine 2');
    expect(card?.back).toBe('Back line 1\nBack line 2');
  });

  test('should ignore comments in the back', () => {
    const cardPath = path.join(TEST_CARDS_DIR, 'with_comment.txt');
    const content = 'Front\n<!---split--->\nReal back\n% this is a comment';
    fs.writeFileSync(cardPath, content);

    const card = parseCard(cardPath);
    expect(card?.back).toBe('Real back');
  });
});
