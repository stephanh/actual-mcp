import { describe, expect, it } from 'vitest';
import { missingSessionResponse } from './session-errors.js';

describe('missingSessionResponse', () => {
  it('returns 404 Session not found for an unknown session ID', () => {
    const response = missingSessionResponse('3f0c9d1e-0000-4000-8000-000000000000');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Session not found' },
      id: null,
    });
  });

  it('returns 400 when the request has no session ID', () => {
    const response = missingSessionResponse(undefined);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Bad Request: No valid session ID provided');
  });

  it('treats an empty session ID like a missing one', () => {
    expect(missingSessionResponse('').status).toBe(400);
  });
});
