/**
 * Optional Cloudflare Access service-token headers for requests to the Actual server.
 *
 * When the Actual server sits behind Cloudflare Access, a non-browser client has to send
 * `CF-Access-Client-Id` and `CF-Access-Client-Secret` on every request. `@actual-app/api`
 * offers no way to add headers, but it uses `globalThis.fetch`, captured when the module
 * loads. `installAccessHeaders()` therefore has to run before `@actual-app/api` is imported.
 */

type FetchFn = typeof fetch;

/** The environment values this feature reads. */
export interface AccessHeadersEnv {
  ACTUAL_SERVER_URL?: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
}

function requestUrl(input: Parameters<FetchFn>[0]): URL | undefined {
  try {
    if (typeof input === 'string' || input instanceof URL) {
      return new URL(input);
    }
    return new URL(input.url);
  } catch {
    return undefined;
  }
}

/**
 * Wraps a fetch function so requests to the Actual server's origin carry the
 * Cloudflare Access service-token headers. Other requests pass through unchanged.
 *
 * The environment is read on every call, so values loaded later (e.g. by dotenv)
 * still apply. Nothing is added unless the URL, client ID and secret are all set.
 *
 * @param baseFetch - The fetch implementation to wrap
 * @param getEnv - Returns the current environment values
 * @returns A fetch function with the same signature
 */
export function createAccessHeadersFetch(baseFetch: FetchFn, getEnv: () => AccessHeadersEnv): FetchFn {
  return (input, init) => {
    const { ACTUAL_SERVER_URL, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET } = getEnv();
    if (!ACTUAL_SERVER_URL || !CF_ACCESS_CLIENT_ID || !CF_ACCESS_CLIENT_SECRET) {
      return baseFetch(input, init);
    }

    let serverOrigin: string;
    try {
      serverOrigin = new URL(ACTUAL_SERVER_URL).origin;
    } catch {
      return baseFetch(input, init);
    }

    const url = requestUrl(input);
    if (!url || url.origin !== serverOrigin) {
      return baseFetch(input, init);
    }

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set('CF-Access-Client-Id', CF_ACCESS_CLIENT_ID);
    headers.set('CF-Access-Client-Secret', CF_ACCESS_CLIENT_SECRET);
    return baseFetch(input, { ...init, headers });
  };
}

/**
 * Replaces `globalThis.fetch` with the Access-header wrapper. Safe to call more than once.
 */
export function installAccessHeaders(): void {
  const marker = Symbol.for('actual-mcp.accessHeaders');
  const current = globalThis.fetch as FetchFn & { [key: symbol]: boolean };
  if (typeof current !== 'function' || current[marker]) {
    return;
  }
  const wrapped = createAccessHeadersFetch(current, () => process.env) as FetchFn & { [key: symbol]: boolean };
  wrapped[marker] = true;
  globalThis.fetch = wrapped;
}
