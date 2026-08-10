import { describe, it, expect } from 'vitest';
import {
  parseFinancialValue,
  parseTimelineToMonths,
  calculateFinancialMetrics
} from '../lib/calculations';

describe('calculations utility', () => {
  describe('parseFinancialValue', () => {
    it('should parse standard number strings', () => {
      expect(parseFinancialValue('50000', 0)).toBe(50000);
      expect(parseFinancialValue('  25000  ', 0)).toBe(25000);
    });

    it('should handle currency symbols and commas', () => {
      expect(parseFinancialValue('$50,000', 0)).toBe(50000);
      expect(parseFinancialValue('₹1,50,000', 0)).toBe(150000);
    });

    it('should parse "k" and "m" suffixes case-insensitively', () => {
      expect(parseFinancialValue('50k', 0)).toBe(50000);
      expect(parseFinancialValue('1.5M', 0)).toBe(1500000);
      expect(parseFinancialValue('2.5m', 0)).toBe(2500000);
    });

    it('should calculate the average of a range', () => {
      expect(parseFinancialValue('50k-70k', 0)).toBe(60000);
      expect(parseFinancialValue('2000-4000', 0)).toBe(3000);
    });

    it('should fallback on skipped, empty, or secret fields', () => {
      expect(parseFinancialValue('secret', 10000)).toBe(10000);
      expect(parseFinancialValue('skip', 20000)).toBe(20000);
      expect(parseFinancialValue('none', 5000)).toBe(5000);
      expect(parseFinancialValue('', 500)).toBe(500);
      expect(parseFinancialValue(null, 300)).toBe(300);
    });
  });

  describe('parseTimelineToMonths', () => {
    it('should parse month timelines', () => {
      expect(parseTimelineToMonths('6 months')).toBe(6);
      expect(parseTimelineToMonths('3 mo')).toBe(3);
    });

    it('should parse year timelines and convert to months', () => {
      expect(parseTimelineToMonths('1 year')).toBe(12);
      expect(parseTimelineToMonths('2 yrs')).toBe(24);
    });

    it('should parse week timelines and convert to months', () => {
      expect(parseTimelineToMonths('4 weeks')).toBe(1);
    });

    it('should return fallback if timeline cannot be parsed', () => {
      expect(parseTimelineToMonths('asap', 6)).toBe(6);
      expect(parseTimelineToMonths(null, 12)).toBe(12);
    });
  });

  describe('calculateFinancialMetrics', () => {
    it('should correctly classify safe/low-risk safety net (> 6 months)', () => {
      const metrics = calculateFinancialMetrics('300000', '1200000', '50000', '6 months');
      expect(metrics.runwayMonths).toBe(6.0);
      expect(metrics.safetyNetStatus).toBe('safe');
      expect(metrics.riskLevel).toBe('low');
      expect(metrics.shortfallAmount).toBe(0);
    });

    it('should correctly classify moderate/medium-risk safety net (3 to 6 months)', () => {
      const metrics = calculateFinancialMetrics('150000', '600000', '50000', '6 months');
      expect(metrics.runwayMonths).toBe(3.0);
      expect(metrics.safetyNetStatus).toBe('moderate');
      expect(metrics.riskLevel).toBe('medium');
      expect(metrics.shortfallAmount).toBe(150000); // 300k required - 150k savings
    });

    it('should correctly classify underfunded/high-risk safety net (< 3 months)', () => {
      const metrics = calculateFinancialMetrics('50000', '0', '50000', '6 months');
      expect(metrics.runwayMonths).toBe(1.0);
      expect(metrics.safetyNetStatus).toBe('underfunded');
      expect(metrics.riskLevel).toBe('high');
      expect(metrics.runwayDeficitMonths).toBe(5); // 6 target - 1 runway
    });

    it('should flag when custom fallback formula is used due to skipping', () => {
      const metricsSkip = calculateFinancialMetrics('300000', '0', 'skip', '6 months');
      expect(metricsSkip.isCustomFormulaUsed).toBe(true);
      expect(metricsSkip.monthlyExpenses).toBe(25000); // default fallback
    });
  });
});
