# Security Protocols

- **Brute-Force Protection**: The `/api/auth/login` route tracks failed attempts by IP. After 5 consecutive failures, the IP is locked out for 10 hours.
- **Authentication**: Admin auth is environment-variable-only (bypasses database queries entirely). Success grants an HTTP-only, secure JWT cookie.
- **Input Validation**: All public endpoints, notably `/api/subscribe`, utilize strict server-side schema validation (Zod) to prevent malformed data. Inputs are escaped against XSS and SQL injection natively via Prisma and Next.js.
- **Security Headers (CSP)**: `next.config.ts` enforces strict headers:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy`: Default and script sources are locked down to 'self' and necessary inline evaluations.
- **Error Handling**: Generic error masking is active across all endpoints to prevent stack traces from leaking to the client.
