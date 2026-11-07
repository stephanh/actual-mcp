import { describe, expect, it, vi } from 'vitest';
import { createAccessHeadersFetch, type AccessHeadersEnv } from './access-headers.js';

const env: AccessHeadersEnv = {
  ACTUAL_SERVER_URL: 'https://budget.example.com',
  CF_ACCESS_CLIENT_ID: 'id.access',
  CF_ACCESS_CLIENT_SECRET: 'secret',
};

function sentHeaders(baseFetch: ReturnType<typeof vi.fn>): Headers | undefined {
  const init = baseFetch.mock.calls[0][1] as RequestInit | undefined;
  return init?.headers ? new Headers(init.headers) : undefined;
}

describe('createAccessHeadersFetch', () => {
  it('adds the service-token headers to requests to the Actual server', async () => {
    const baseFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = createAccessHeadersFetch(baseFetch, () => env);

    await wrapped('https://budget.example.com/sync/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/actual-sync' },
    });

    const headers = sentHeaders(baseFetch);
    expect(headers?.get('CF-Access-Client-Id')).toBe('id.access');
    expect(headers?.get('CF-Access-Client-Secret')).toBe('secret');
    expect(headers?.get('Content-Type')).toBe('application/actual-sync');
    expect((baseFetch.mock.calls[0][1] as RequestInit).method).toBe('POST');
  });

  it('leaves requests to other origins untouched', async () => {
    const baseFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = createAccessHeadersFetch(baseFetch, () => env);

    await wrapped(new URL('https://bank.example.org/api'), { headers: { Accept: 'application/json' } });

    expect(sentHeaders(baseFetch)?.has('CF-Access-Client-Id')).toBe(false);
  });

  it('adds nothing when the token is not configured', async () => {
    const baseFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = createAccessHeadersFetch(baseFetch, () => ({ ACTUAL_SERVER_URL: env.ACTUAL_SERVER_URL }));

    await wrapped('https://budget.example.com/info');

    expect(baseFetch).toHaveBeenCalledWith('https://budget.example.com/info', undefined);
  });

  it('keeps headers of a Request object', async () => {
    const baseFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = createAccessHeadersFetch(baseFetch, () => env);

    await wrapped(new Request('https://budget.example.com/info', { headers: { 'X-Actual-Token': 't' } }));

    const headers = sentHeaders(baseFetch);
    expect(headers?.get('X-Actual-Token')).toBe('t');
    expect(headers?.get('CF-Access-Client-Secret')).toBe('secret');
  });

  it('passes through when ACTUAL_SERVER_URL is not a valid URL', async () => {
    const baseFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const wrapped = createAccessHeadersFetch(baseFetch, () => ({ ...env, ACTUAL_SERVER_URL: 'not a url' }));

    await wrapped('https://budget.example.com/info');

    expect(baseFetch).toHaveBeenCalledWith('https://budget.example.com/info', undefined);
  });
});
