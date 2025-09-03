import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseCard, createCardTemplate, resolveCardArgument, getCardByPath } from '../cards';

const testDir = join(process.cwd(), 'test-cards');

describe('cards', () => {
  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
  });
  
  afterEach(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });
  
  describe('parseCard', () => {
    it('should parse a valid card', () => {
      const cardContent = `Front of the card
Multiple lines front
<!---split--->
Back of the card
% This is a comment
Multiple lines back`;
      
      const cardPath = join(testDir, 'test.txt');
      writeFileSync(cardPath, cardContent);
      
      const card = parseCard(cardPath);
      
      expect(card).not.toBe(null);
      expect(card!.name).toBe('test');
      expect(card!.front).toBe('Front of the card\nMultiple lines front');
      expect(card!.back).toBe('Back of the card\nMultiple lines back');
      expect(card!.filePath).toBe(cardPath);
    });
    
    it('should filter out comment lines', () => {
      const cardContent = `Front
<!---split--->
Back line 1
% This is a comment
Back line 2
% Another comment`;
      
      const cardPath = join(testDir, 'test.txt');
      writeFileSync(cardPath, cardContent);
      
      const card = parseCard(cardPath);
      
      expect(card!.back).toBe('Back line 1\nBack line 2');
    });
    
    it('should return null for invalid card format', () => {
      const cardContent = 'No split marker here';
      
      const cardPath = join(testDir, 'invalid.txt');
      writeFileSync(cardPath, cardContent);
      
      const card = parseCard(cardPath);
      
      expect(card).toBe(null);
    });
  });
  
  describe('createCardTemplate', () => {
    it('should create a valid template', () => {
      const template = createCardTemplate();
      
      expect(template).toContain('<!---split--->');
      expect(template).toContain('Front of the card');
      expect(template).toContain('Back of the card');
      expect(template).toContain('% Lines starting with %');
    });
  });
  
  describe('resolveCardArgument', () => {
    it('should resolve card names', () => {
      const cardContent = `Test front
<!---split--->
Test back`;
      
      // Create cards subdirectory
      const cardsDir = join(testDir, 'cards');
      mkdirSync(cardsDir, { recursive: true });
      const cardPath = join(cardsDir, 'test.txt');
      writeFileSync(cardPath, cardContent);
      
      // Mock getClinkyHome to return testDir
      const originalEnv = process.env.CLINKY_HOME;
      process.env.CLINKY_HOME = testDir;
      
      const result = resolveCardArgument('test');
      expect(result.name).toBe('test');
      expect(result.card).not.toBe(null);
      
      process.env.CLINKY_HOME = originalEnv;
    });
    
    it('should resolve card paths', () => {
      const cardContent = `Test front
<!---split--->
Test back`;
      
      const cardPath = join(testDir, 'test.txt');
      writeFileSync(cardPath, cardContent);
      
      // Mock getClinkyHome to return testDir
      const originalEnv = process.env.CLINKY_HOME;
      process.env.CLINKY_HOME = testDir;
      
      const result = resolveCardArgument('test.txt');
      expect(result.name).toBe('test');
      expect(result.card).not.toBe(null);
      
      process.env.CLINKY_HOME = originalEnv;
    });
    
    it('should handle absolute paths on Windows', () => {
      const cardContent = `Test front
<!---split--->
Test back`;
      
      const cardPath = join(testDir, 'test.txt');
      writeFileSync(cardPath, cardContent);
      
      // Test with Windows-style absolute path
      const result = getCardByPath(cardPath);
      expect(result).not.toBe(null);
      expect(result!.name).toBe('test');
    });
  });
});
