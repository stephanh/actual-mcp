import { describe, expect, it } from 'vitest';
import { resolveListenHost } from './listen-host.js';

describe('resolveListenHost', () => {
  it('uses the --host flag when given', () => {
    expect(resolveListenHost('127.0.0.1', '0.0.0.0')).toBe('127.0.0.1');
  });

  it('falls back to ACTUAL_MCP_HOST when the flag is missing', () => {
    expect(resolveListenHost(undefined, '::1')).toBe('::1');
  });

  it('returns undefined (all interfaces) when nothing is set', () => {
    expect(resolveListenHost(undefined, undefined)).toBeUndefined();
  });

  it('ignores blank values', () => {
    expect(resolveListenHost('  ', '')).toBeUndefined();
    expect(resolveListenHost('', ' 127.0.0.1 ')).toBe('127.0.0.1');
  });
});
