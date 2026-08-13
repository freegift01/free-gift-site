Role: Lead Full-Stack Architect, UX/UI Expert, and Autonomous Systems Engineer

Objective: You are tasked with executing a major front-end aesthetic overhaul, an admin dashboard enhancement, a security threshold update, and the generation of a Single Source of Truth (SSOT) documentation suite for the Next.js (App Router) project mapped to "notification.electedbooks.com". 

CRITICAL DIRECTIVE: The core email drip engine, cron jobs, broadcast system, and database are working perfectly. Modify ONLY what is necessary to achieve the updates below. Do not refactor core backend state management or deployment configurations.

================================================================
1. FRONTEND OVERHAUL: AESTHETICS & LAYOUT (File: app/page.tsx)
================================================================
- Theme & Vibe: Redesign the landing page to feature a "clean, corporate minimalist" aesthetic. Use crisp white backgrounds, deep blue or sophisticated neutral accents, soft drop shadows, and highly professional, accessible typography (sans-serif, minimum 18px body font).
- Above the Fold Placement: Condense and shorten the introductory text. Keep the layout centrally aligned, but ensure the email capture form is immediately visible upon page load without scrolling on standard desktop and mobile screens.
- Rectangular Form Design: Redesign the subscription form to eliminate the "boxlike" shape. On desktop, utilize a horizontal flex layout (an elongated rectangular email input side-by-side with a rectangular submit button) to create a sleek, streamlined profile.

================================================================
2. SUCCESS FEEDBACK MODAL (File: app/page.tsx)
================================================================
- Remove the inline, hidden success message that requires scrolling.
- Implement a prominent Modal/Dialog component that pops up overlaying the screen upon successful form submission.
- The modal must display the message: "Your book has been sent to your email! Please check your inbox."
- The modal MUST NOT auto-close. It must require the user to explicitly click a visible "OK" or "Close" button to dismiss it.

================================================================
3. ADMIN SUBSCRIBER TABLE ENHANCEMENTS (File: app/akin/page.tsx)
================================================================
A. EDITABLE SUBSCRIPTION DATE:
   - Replace the read-only subscription date column with an editable HTML date input (`<input type="date" />`).
   - Populate it with the subscriber's current `startDate`.
   - Create a secure `PATCH /api/subscribers/[id]/start-date` endpoint (protected by admin middleware) to save edits to the database. Show a small success toast upon saving.
B. SCHEDULED DATES DROPDOWN:
   - Add a "Upcoming Schedule" column.
   - For each subscriber, calculate and aggregate: 
     1. Projected dates for their remaining 30-Day Drip sequence based on their `startDate` and `currentDay`.
     2. Any scheduled manual Broadcasts they are targeted for from the `BroadcastMessage` table.
   - Render these sorted, chronological dates inside a read-only `<select>` dropdown next to their name for complete visibility.

================================================================
4. SECURITY ENFORCEMENT & LOCKOUT UPDATE
================================================================
- Lockout Threshold Update: In the `/akin/login` authentication route, increase the brute-force IP lockout threshold from 3 to 5 failed attempts. After 5 failed attempts, the IP remains locked for 10 hours.
- Hackproof Verification: 
  * Ensure strict server-side schema validation (Zod) on the email input.
  * Ensure inputs are escaped against XSS and SQL injection.
  * Verify `next.config.js` contains strict Content Security Policy (CSP) headers, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
  * Verify generic error masking is active (no stack traces leaked to the client).

================================================================
5. SINGLE SOURCE OF TRUTH (SSOT) DOCUMENTATION
================================================================
Before finalizing deployment, you must generate a comprehensive set of Markdown files to serve as the Antigravity Source of Truth for all future modifications.
- Create a directory at the root level named `docs/antigravity/`.
- Generate the following files accurately reflecting the CURRENT state of the codebase:
  1. `PROJECT_CONTEXT.md`: Detail the business logic, domain mapping (`notification.electedbooks.com`), the 30-day drip sequence rules, the manual broadcast rules, and the exact Vercel/Resend free-tier tech stack.
  2. `DATABASE_SCHEMA.md`: Document the exact models (Book, ScheduleSlot, Subscriber, DeliveryLog, BroadcastMessage, LoginAttempts), their relationships, and constraints.
  3. `API_ROUTES.md`: Map all public and protected API routes, cron job endpoints (`/api/cron/daily-drip`), server actions, and the Next.js middleware protection applying to `/akin`.
  4. `SECURITY_PROTOCOLS.md`: Detail the IP lockout system, the environment-variable-only authentication bypass, and the active CSP headers.

================================================================
6. AGENT EXECUTION PROTOCOL
================================================================
1. Read the existing `/akin` dashboard, landing page, and login logic.
2. Apply the UI/UX redesign to the landing page, including the modal.
3. Inject the Editable Date field and Schedule Dropdown into the admin table, and build the `PATCH` route.
4. Update the IP lockout threshold to 5 attempts.
5. Generate the `/docs/antigravity/` markdown files based on the newly updated system.
6. Launch your internal browser subagent:
   - View the landing page to verify the corporate minimalist design is above the fold and the form is rectangular.
   - Submit a test email and verify the success modal pops up and requires a click to close.
   - Log into `/akin/login` (intentionally fail 5 times to verify the new lockout threshold, then clear the block).
   - Navigate to `/akin`, edit a subscription date, and open the new schedule dropdown for a test subscriber.
7. Deploy the exact file updates to Vercel.