Role: Senior Full-Stack Security Engineer & Autonomous Systems Architect

Objective: Implement subscriber schedule calculation fixes, a dynamic admin authentication/password management system, a secure password reset workflow, and update the Antigravity Single Source of Truth (SSOT) documentation suite for the Next.js (App Router) project mapped to "notification.electedbooks.com".

CRITICAL DIRECTIVE: System stability is paramount. Do not alter or break the existing 30-day daily drip engine, the Resend email batch sender, Vercel Blob file attachments, or the 5-attempt IP brute-force lockout system.

================================================================
1. SUBSCRIBER SCHEDULE DROPDOWN CALCULATION FIX
================================================================
- File Targets: `/akin` dashboard page and subscriber data aggregation API routes.
- Issue: Currently, only manual broadcast dates appear in the subscriber dropdown; projected dates for the automated 30-day drip sequence are missing.
- Implementation:
  1. For every subscriber, calculate their complete remaining 30-day drip schedule:
     - Take `subscriber.startDate` (or `lastSentAt`) and compute projected calendar dates for each remaining day from `currentDay` up to Day 30.
     - Format as: `[Drip Day X] Month DD, YYYY` (e.g., `[Drip Day 12] Aug 18, 2026`).
  2. Query `BroadcastMessage` where `status == "SCHEDULED"` and `targetSubscriberIds` contains the subscriber's ID:
     - Format as: `[Broadcast] Month DD, YYYY` (e.g., `[Broadcast] Aug 22, 2026`).
  3. Merge both list sources into a single array, sort chronologically by date, and render inside the read-only `<select>` dropdown next to each subscriber in the admin table.

================================================================
2. DATABASE SCHEMA UPDATE: DYNAMIC ADMIN AUTHENTICATION
================================================================
Add a new model/table to the database schema (via Prisma / Drizzle):

AdminAuth:
- id (UUID)
- username (String, Unique)
- passwordHash (String - hashed using bcrypt or argon2)
- resetToken (String, Nullable)
- resetTokenExpiry (Timestamp, Nullable)
- updatedAt (Timestamp)

Auth Resolution Rules:
1. On login or password verification, query the `AdminAuth` table first.
2. Fallback Logic: If the `AdminAuth` table is empty, fall back to comparing against `process.env.ADMIN_USERNAME` and `process.env.ADMIN_PASSWORD`.
3. Upon any password change or reset, write/upsert the hashed password into the `AdminAuth` table. Subsequent logins will authenticate directly against this database record.

================================================================
3. ADMIN CHANGE PASSWORD UI ("SECURITY / SETTINGS" TAB)
================================================================
- File Target: `/akin` admin dashboard layout.
- Navigation: Add a new tab titled "Security / Account Settings" alongside "Drip Engine", "Broadcast Scheduler", and "Subscribers".
- UI Features:
  - Form fields: "Current Password", "New Password", and "Confirm New Password".
  - Client-side validation: Enforce minimum 8 characters and password match confirmation.
- Backend Logic (`PATCH /api/auth/change-password`):
  - Protected by existing HTTP-Only JWT session middleware.
  - Verify "Current Password" against `AdminAuth` (or `.env.local` fallback).
  - Hash the "New Password" and save it into the `AdminAuth` database table.
  - Display a success toast and log the event.

================================================================
4. FORGOT & RESET PASSWORD WORKFLOW
================================================================
A. LOGIN PAGE LINK (`/akin/login`):
   - Add a "Forgot Password?" link below the login form.

B. RESET REQUEST API (`POST /api/auth/reset-request`):
   - Triggered when "Forgot Password?" is submitted.
   - Generate a secure, single-use, cryptographically random reset token with a 1-hour expiration timestamp. Save `resetToken` and `resetTokenExpiry` to `AdminAuth`.
   - Send an email via Resend API:
     * From: `freegift@notification.electedbooks.com`
     * To: `afosegzi123@gmail.com`
     * Subject: `Admin Password Reset - notification.electedbooks.com`
     * Body: Contains a button/link to `https://notification.electedbooks.com/akin/reset-password?token=YOUR_TOKEN`

C. RESET PASSWORD PAGE (`/akin/reset-password`):
   - Create a clean page that accepts `token` via URL parameters.
   - Validate token existence and expiration. If invalid or expired, display an error message.
   - Form fields: "New Password" and "Confirm New Password".
   - Upon form submission (`POST /api/auth/reset-password`), update `AdminAuth.passwordHash`, clear `resetToken` and `resetTokenExpiry`, and redirect to `/akin/login` with a success notice.

================================================================
5. SINGLE SOURCE OF TRUTH (SSOT) DOCUMENTATION UPDATE
================================================================
Update the Markdown files inside `/docs/antigravity/` to reflect these changes:
1. `DATABASE_SCHEMA.md`: Add the `AdminAuth` table specification and fields.
2. `API_ROUTES.md`: Document `/api/auth/change-password`, `/api/auth/reset-request`, and `/api/auth/reset-password`.
3. `SECURITY_PROTOCOLS.md`: Document dynamic database hash storage with `.env.local` fallback, single-use reset token expiration rules, and email dispatch to `afosegzi123@gmail.com`.
4. `PROJECT_CONTEXT.md`: Update the admin panel features list to include the "Security / Account Settings" tab.

================================================================
6. AGENT EXECUTION & AUTOMATED TESTING PROTOCOL
================================================================
1. Read current codebase and database schema.
2. Run migration to create the `AdminAuth` table.
3. Fix the subscriber schedule calculation logic to display both drip and broadcast dates.
4. Implement the "Security / Account Settings" tab and backend routes for changing password.
5. Build the Forgot/Reset password workflow and test email generation via Resend to `afosegzi123@gmail.com`.
6. Update all documentation files in `docs/antigravity/`.
7. Launch internal browser subagent:
   - Verify subscriber dropdown shows both `[Drip Day X]` and `[Broadcast]` entries.
   - Log into `/akin/login`, navigate to the new "Security / Account Settings" tab, and change password.
   - Log out and log back in using the NEW password to verify database authentication works.
   - Test "Forgot Password?" flow, verify token generation, and check `/akin/reset-password`.
8. Deploy all updates to Vercel and verify on `notification.electedbooks.com`.