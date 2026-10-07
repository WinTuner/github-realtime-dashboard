import { describe, expect, it } from 'vitest';
import {
  formatEventTime,
  formatRepoSizeKB,
  formatSizeKB,
  getContributionColor,
  normalizeBlogUrl,
  stripRepoPrefix,
} from '@/lib/format';

describe('formatSizeKB', () => {
  it('formats megabytes', () => {
    expect(formatSizeKB(1024)).toBe('1.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatSizeKB(1024 * 1024 + 512 * 1024)).toBe('1.50 GB');
  });
});

describe('formatRepoSizeKB', () => {
  it('keeps kilobytes small', () => {
    expect(formatRepoSizeKB(512)).toBe('512KB');
  });

  it('converts to megabytes', () => {
    expect(formatRepoSizeKB(2048)).toBe('2.0MB');
  });
});

describe('stripRepoPrefix', () => {
  it('strips owner prefix case-insensitively', () => {
    expect(stripRepoPrefix('WinTuner/dotfiles', 'wintuner')).toBe('dotfiles');
  });

  it('leaves foreign names untouched', () => {
    expect(stripRepoPrefix('other/repo', 'WinTuner')).toBe('other/repo');
  });
});

describe('formatEventTime', () => {
  it('returns a time string', () => {
    expect(formatEventTime('2026-01-01T10:20:30Z')).toMatch(/\d/);
  });
});

describe('getContributionColor', () => {
  it('maps zero to empty cell', () => {
    expect(getContributionColor(0)).toBe('rgba(255, 255, 255, 0.06)');
  });

  it('maps buckets without overlap', () => {
    expect(getContributionColor(2)).toBe('var(--contrib-1)');
    expect(getContributionColor(5)).toBe('var(--contrib-2)');
    expect(getContributionColor(8)).toBe('var(--contrib-3)');
    expect(getContributionColor(12)).toBe('var(--contrib-4)');
  });
});

describe('normalizeBlogUrl', () => {
  it('adds https when missing', () => {
    expect(normalizeBlogUrl('example.com')).toBe('https://example.com');
  });

  it('keeps absolute urls', () => {
    expect(normalizeBlogUrl('https://example.com')).toBe('https://example.com');
  });
});
