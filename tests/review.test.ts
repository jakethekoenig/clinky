import { expect, test, describe, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'fs';
import path from 'path';

process.env.CLINKY_HOME = './test_clinky_home_unit';

import * as srs from '../src/srs';
import { getDueCards } from '../src/commands/review';
import * as config from '../src/config';

describe('getDueCards', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let readdirSyncSpy: ReturnType<typeof spyOn>;
  let getSrsDataSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    existsSyncSpy.mockRestore();
    readdirSyncSpy.mockRestore();
    getSrsDataSpy.mockRestore();
  });

  test('should return due cards', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000);
    const future = new Date(now.getTime() + 1000);

    existsSyncSpy = spyOn(fs, 'existsSync').mockReturnValue(true);
    readdirSyncSpy = spyOn(fs, 'readdirSync').mockReturnValue([
      { name: 'new.txt', isDirectory: () => false },
      { name: 'due.txt', isDirectory: () => false },
      { name: 'not_due.txt', isDirectory: () => false },
    ] as any);
    
    getSrsDataSpy = spyOn(srs, 'getSrsData').mockImplementation((cardPath) => {
      const baseName = path.basename(cardPath);
      if (baseName === 'new.txt') {
        return { due_date: now } as srs.SrsData;
      }
      if (baseName === 'due.txt') {
        return { due_date: past } as srs.SrsData;
      }
      // This will be not_due.txt
      return { due_date: future } as srs.SrsData;
    });

    const dueCards = getDueCards();
    expect(dueCards.length).toBe(2);
    expect(dueCards.some(c => c.endsWith('new.txt'))).toBe(true);
    expect(dueCards.some(c => c.endsWith('due.txt'))).toBe(true);
    expect(getSrsDataSpy).toHaveBeenCalledTimes(3);
  });
});
