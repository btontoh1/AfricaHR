// No 'server-only' guard here deliberately — these are just string
// constants, safe to import from Edge middleware, Route Handlers, and
// Server Components alike.
export const ACCESS_TOKEN_COOKIE = 'africahr_access_token';
export const REFRESH_TOKEN_COOKIE = 'africahr_refresh_token';
// Deliberately separate from the two above: it's never cleared on logout
// (forgetting a device and logging out are different things), and it's
// never sent anywhere except the login/mfa-verify BFF routes.
export const DEVICE_TOKEN_COOKIE = 'africahr_device_token';
