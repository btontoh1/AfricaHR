// No 'server-only' guard here deliberately — these are just string
// constants, safe to import from Edge middleware, Route Handlers, and
// Server Components alike.
export const ACCESS_TOKEN_COOKIE = 'africahr_access_token';
export const REFRESH_TOKEN_COOKIE = 'africahr_refresh_token';
