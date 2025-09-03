import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadCard } from '../../src/card';

describe('Review Path Handling', () => {
  let tempDir: string;
  let originalClinkyHome: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clinky-path-test-'));
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

  test('should load card with path relative to cards directory', () => {
    const cardsDir = join(tempDir, 'cards');
    mkdirSync(cardsDir, { recursive: true });
    writeFileSync(join(cardsDir, 'test.txt'), 'Question\n<!---split--->\nAnswer');

    const card = loadCard('test.txt');
    expect(card.front).toBe('Question');
    expect(card.back).toBe('Answer');
    expect(card.path).toBe('test.txt');
  });

  test('should load card with path including cards/ prefix', () => {
    const cardsDir = join(tempDir, 'cards');
    mkdirSync(cardsDir, { recursive: true });
    writeFileSync(join(cardsDir, 'test.txt'), 'Question\n<!---split--->\nAnswer');

    const card = loadCard('cards/test.txt');
    expect(card.front).toBe('Question');
    expect(card.back).toBe('Answer');
    expect(card.path).toBe('test.txt');
  });

  test('should load card in nested directory', () => {
    const deckDir = join(tempDir, 'cards', 'deck1', 'deck2');
    mkdirSync(deckDir, { recursive: true });
    writeFileSync(join(deckDir, 'nested.txt'), 'Nested Question\n<!---split--->\nNested Answer');

    // Test without cards/ prefix
    const card1 = loadCard('deck1/deck2/nested.txt');
    expect(card1.front).toBe('Nested Question');
    expect(card1.back).toBe('Nested Answer');
    expect(card1.path).toBe('deck1/deck2/nested.txt');

    // Test with cards/ prefix
    const card2 = loadCard('cards/deck1/deck2/nested.txt');
    expect(card2.front).toBe('Nested Question');
    expect(card2.back).toBe('Nested Answer');
    expect(card2.path).toBe('deck1/deck2/nested.txt');
  });
});
