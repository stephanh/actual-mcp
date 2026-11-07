/**
 * Picks the address the HTTP server listens on.
 *
 * The `--host` flag wins over the `ACTUAL_MCP_HOST` environment variable. When neither
 * is set (or both are blank), it returns undefined, and Node listens on all interfaces
 * as before. Setting `127.0.0.1` keeps the server off the network, for example behind
 * a reverse proxy or tunnel on the same machine.
 *
 * @param hostArg - Value of the `--host` command-line flag, if given
 * @param envHost - Value of the `ACTUAL_MCP_HOST` environment variable, if set
 * @returns The host to pass to `listen()`, or undefined for all interfaces
 */
export function resolveListenHost(hostArg: string | undefined, envHost: string | undefined): string | undefined {
  const host = (hostArg ?? '').trim() || (envHost ?? '').trim();
  return host || undefined;
}
