Role: Senior Security Engineer and Lead Full-Stack Autonomous Systems Architect

Objective: Audit, repair, secure, and update the existing Next.js (App Router) project mapped to "notification.electedbooks.com". You must fix the broken email dispatch engine and admin login, relocate the admin portal to a hidden permalink (/akin), implement enterprise-grade security controls, and architect the backend to handle massive impulse traffic spikes without timing out.

CRITICAL DIRECTIVE: Prioritize system stability. Do not destroy existing working features (such as Vercel Blob ebook attachments, subscriber management with dynamic pagination, CSV export, or the 30-day drip sequence logic).

================================================================
1. REPAIR & RECOVERY (DIAGNOSTICS & FIXES)
================================================================
A. EMAIL DISPATCH ENGINE REPAIR:
   - Inspect `api/cron/daily-drip` and the Resend API integration.
   - Verify that the sending address is strictly configured as `freegift@notification.electedbooks.com`.
   - Resolve any broken async execution paths or missing environment variables causing failed dispatches.

B. ADMIN AUTHENTICATION REPAIR:
   - Audit the authentication API routes and middleware.
   - Ensure admin credentials validate directly against `process.env.ADMIN_USERNAME` and `process.env.ADMIN_PASSWORD`.
   - Repair session management using HTTP-Only, Secure, SameSite=Strict JWT cookies.

================================================================
2. ROUTE RELOCATION & ROUTE OBFUSCATION
================================================================
- RELOCATE ADMIN ROUTE: Move the entire admin panel from `/admin` to `/akin` (i.e., access via `notification.electedbooks.com/akin`).
- REDIRECT / BLOCK LEAF ROUTES: Any request to `/admin` must explicitly return a 404 Not Found page to prevent route enumeration.
- SECURE MIDDLEWARE: Update Next.js middleware so that all routes under `/akin` strictly require valid, signed session cookies. Unauthenticated attempts redirect to `/akin/login`.

================================================================
3. ADVANCED SECURITY & HARDENING
================================================================
A. INPUT SANITIZATION & STRICT EMAIL VALIDATION:
   - Implement strict server-side schema validation (e.g., using Zod) for the subscriber submission endpoint.
   - Enforce rigorous regex check: Only legitimate, RFC-compliant email formats are accepted.
   - Escape and sanitize all string inputs against HTML/script injection and XSS attacks.

B. IP-BASED BRUTE-FORCE LOCKOUT SYSTEM:
   - Database Table Creation: Create a `LoginAttempts` model/table:
     * id (UUID), ipAddress (String), attemptCount (Int, Default: 1), lockedUntil (Timestamp, Nullable), updatedAt (Timestamp)
   - Lockout Enforcement Logic on `/akin/login`:
     1. Extract caller's real client IP address (from headers `x-forwarded-for` or `x-real-ip`).
     2. If `lockedUntil` is in the future, immediately reject with HTTP 429.
     3. On failed login: Increment `attemptCount`. If >= 3, set `lockedUntil` to NOW() + 10 hours.
     4. On success: Reset `attemptCount` to 0 and clear `lockedUntil` for that IP.

C. SECURITY HEADERS & CONTENT SECURITY POLICY (CSP):
   - Configure `next.config.js` to inject strict HTTP response headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

D. GENERIC ERROR MASKING:
   - Replace verbose database or API stack traces with standard, generic error responses. Never leak backend structural details.

================================================================
4. UI REFINEMENTS & COPY FIXES
================================================================
- LANDING PAGE COPY: Remove all references to "Brain teasers" and "sudoku". Focus exclusively on "crossword puzzles".
- FEEDBACK NOTIFICATION: Retain the immediate success message on form submit: "Your book has been sent to your email! Please check your inbox."
- UNSUBSCRIBE FOOTER: Ensure every daily email attaches a dynamic unsubscribe link pointing to `notification.electedbooks.com/api/unsubscribe?email=...`.

================================================================
5. SCALABILITY & BATCH PROCESSING FOR IMPULSE TRAFFIC
================================================================
A. DATABASE CONNECTION POOLING:
   - Update the database connection string and Prisma/Drizzle configuration to utilize a connection pooler (e.g., PgBouncer or Supabase connection pooling URL). This ensures sudden spikes in form submissions (e.g., 5,000 concurrent hits) do not exhaust database connections and crash the API.

B. BATCH PROCESSING FOR DAILY DRIP (10-SECOND TIMEOUT BYPASS):
   - Refactor `/api/cron/daily-drip` to prevent Vercel 504 Gateway Timeouts.
   - Do NOT loop and send emails sequentially.
   - Logic Update:
     1. Query the database for all users due for an email today.
     2. Chunk the recipients into batches (e.g., arrays of 50).
     3. Use Resend's Batch API (`resend.batch.send()`) to dispatch the chunks asynchronously rather than calling the standard `send()` method individually.
     4. Utilize `Promise.all()` with a concurrency limiter (like `p-limit`) when updating the `DeliveryLog` and `Subscriber` tables post-dispatch to ensure the entire serverless function executes in under 9 seconds.

================================================================
6. AGENT EXECUTION & AUTOMATED TESTING
================================================================
1. Read and analyze current codebase files before modifying.
2. Execute migration script to create `LoginAttempts` table.
3. Apply code fixes to repair Resend email delivery, authentication, security middlewares, and implement batching.
4. Launch internal browser subagent:
   - Attempt to access `/admin` and confirm it yields 404.
   - Navigate to `/akin/login`. Intentionally enter wrong credentials 3 consecutive times to trigger and verify the 10-hour IP lockout.
   - Clear test IP block or test from valid session to verify successful login at `/akin`.
   - Submit a test email on the home page and verify database insertion and successful feedback rendering.
5. Deploy changes to Vercel and confirm domain mappings for `notification.electedbooks.com`.