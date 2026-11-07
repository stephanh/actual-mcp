/**
 * HTTP status and JSON-RPC body for a Streamable HTTP request that has no usable session.
 */
export interface MissingSessionResponse {
  status: number;
  body: {
    jsonrpc: '2.0';
    error: { code: number; message: string };
    id: null;
  };
}

/**
 * Builds the response for a non-initialize request that has no matching session.
 *
 * The MCP Streamable HTTP spec says a server MUST answer a request carrying an
 * unknown `Mcp-Session-Id` with 404, and the client MUST then start a new session.
 * Sessions live in memory, so every server restart makes the IDs clients hold unknown;
 * answering 400 instead leaves clients such as claude.ai stuck until they reconnect.
 * A request without any session ID is still a 400 Bad Request.
 *
 * @param sessionHeader - The parsed `Mcp-Session-Id` header, if the request had one
 * @returns The status code and JSON-RPC error body to send
 */
export function missingSessionResponse(sessionHeader: string | undefined): MissingSessionResponse {
  if (sessionHeader) {
    return {
      status: 404,
      body: { jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null },
    };
  }

  return {
    status: 400,
    body: { jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request: No valid session ID provided' }, id: null },
  };
}
