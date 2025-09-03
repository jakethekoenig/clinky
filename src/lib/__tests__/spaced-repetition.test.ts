import { describe, it, expect } from 'bun:test';
import { calculateNextReview, parseReviewScore } from '../spaced-repetition.js';
import { ReviewScore, type CardSchedule } from '../../types.js';

describe('spaced-repetition', () => {
  describe('parseReviewScore', () => {
    it('should parse valid score inputs', () => {
      expect(parseReviewScore('again')).toBe(ReviewScore.Again);
      expect(parseReviewScore('a')).toBe(ReviewScore.Again);
      expect(parseReviewScore('1')).toBe(ReviewScore.Again);
      
      expect(parseReviewScore('hard')).toBe(ReviewScore.Hard);
      expect(parseReviewScore('h')).toBe(ReviewScore.Hard);
      expect(parseReviewScore('2')).toBe(ReviewScore.Hard);
      
      expect(parseReviewScore('medium')).toBe(ReviewScore.Medium);
      expect(parseReviewScore('m')).toBe(ReviewScore.Medium);
      expect(parseReviewScore('3')).toBe(ReviewScore.Medium);
      
      expect(parseReviewScore('easy')).toBe(ReviewScore.Easy);
      expect(parseReviewScore('e')).toBe(ReviewScore.Easy);
      expect(parseReviewScore('4')).toBe(ReviewScore.Easy);
    });
    
    it('should handle case insensitive input', () => {
      expect(parseReviewScore('AGAIN')).toBe(ReviewScore.Again);
      expect(parseReviewScore('Hard')).toBe(ReviewScore.Hard);
      expect(parseReviewScore('MEDIUM')).toBe(ReviewScore.Medium);
      expect(parseReviewScore('Easy')).toBe(ReviewScore.Easy);
    });
    
    it('should return null for invalid input', () => {
      expect(parseReviewScore('invalid')).toBe(null);
      expect(parseReviewScore('5')).toBe(null);
      expect(parseReviewScore('')).toBe(null);
    });
  });
  
  describe('calculateNextReview', () => {
    it('should handle new cards correctly', () => {
      const result = calculateNextReview(null, ReviewScore.Medium);
      
      expect(result.interval).toBe(1);
      // For Medium (3), ease factor = 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02)) = 2.5 + (0.1 - 2 * 0.12) = 2.36
      expect(result.easeFactor).toBe(2.36);
      expect(result.repetitions).toBe(1);
      expect(result.nextReview.getTime()).toBeGreaterThan(Date.now());
    });
    
    it('should reset repetitions for Again score', () => {
      const currentSchedule: CardSchedule = {
        cardName: 'test',
        nextReview: new Date(),
        interval: 10,
        easeFactor: 2.5,
        repetitions: 3,
      };
      
      const result = calculateNextReview(currentSchedule, ReviewScore.Again);
      
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
    
    it('should increase interval for successful reviews', () => {
      const currentSchedule: CardSchedule = {
        cardName: 'test',
        nextReview: new Date(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
      };
      
      const result = calculateNextReview(currentSchedule, ReviewScore.Medium);
      
      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });
    
    it('should apply ease factor for repetitions > 2', () => {
      const currentSchedule: CardSchedule = {
        cardName: 'test',
        nextReview: new Date(),
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
      };
      
      const result = calculateNextReview(currentSchedule, ReviewScore.Medium);
      
      expect(result.repetitions).toBe(3);
      // Ease factor is modified first: 2.5 + (0.1 - 2 * 0.12) = 2.36, then interval = round(6 * 2.36) = 14
      expect(result.interval).toBe(14);
    });
    
    it('should modify ease factor based on score', () => {
      const currentSchedule: CardSchedule = {
        cardName: 'test',
        nextReview: new Date(),
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
      };
      
      const easyResult = calculateNextReview(currentSchedule, ReviewScore.Easy);
      const hardResult = calculateNextReview(currentSchedule, ReviewScore.Hard);
      
      // For Easy (4): 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02)) = 2.5 + (0.1 - 1 * 0.1) = 2.5
      expect(easyResult.easeFactor).toBe(2.5);
      // For Hard (2): score < Medium, so ease factor is not modified in this case, stays 2.5
      expect(hardResult.easeFactor).toBe(2.5);
    });
    
    it('should not let ease factor go below 1.3', () => {
      const currentSchedule: CardSchedule = {
        cardName: 'test',
        nextReview: new Date(),
        interval: 6,
        easeFactor: 1.3,
        repetitions: 2,
      };
      
      const result = calculateNextReview(currentSchedule, ReviewScore.Again);
      
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });
});
