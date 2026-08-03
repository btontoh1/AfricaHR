/**
 * Reads a fetch() Response body as JSON, converting a non-JSON body (a
 * proxy block page, a WAF/load-balancer error page, an HTML 502 - anything
 * an intermediary might return instead of the API's own JSON) into a clean,
 * informative Error instead of letting response.json()'s SyntaxError bubble
 * up as an opaque, unhandled failure.
 */
export async function parseJsonResponse<T>(response: Response, context: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`${context}: received a non-JSON response (status ${response.status} ${response.statusText})`);
  }
}
