Role: Lead Full-Stack Architect and Autonomous Systems Engineer

Objective: Extend the existing Next.js (App Router) project mapped to "notification.electedbooks.com" by building a new, protected admin broadcast page at `/akin/broadcast`. This page allows the admin to compose and schedule one-off email broadcasts with book attachments for specific calendar dates, targeted at selected subscribers.

CRITICAL DIRECTIVE: Do not alter or break the existing 30-day daily drip engine, the subscriber management table, or the main admin panel at `/akin`. The new broadcast system must operate in parallel alongside the drip system.

================================================================
1. ROUTE & AUTHENTICATION SPECIFICATION
================================================================
- Route Path: `/akin/broadcast`
- Access Control: Must be strictly protected by the same Next.js middleware and HTTP-Only JWT session cookies used for `/akin`. 
- Unauthenticated Access: Redirect immediately to `/akin/login`.
- Navigation: Add clear tab/link navigation at the top of `/akin` to switch seamlessly between "Drip Sequence Engine" (`/akin`) and "Broadcast Scheduler" (`/akin/broadcast`).

================================================================
2. DATABASE SCHEMA ADDITIONS
================================================================
Add a new model/table to the database schema (e.g., via Prisma or Drizzle):

BroadcastMessage:
- id (UUID)
- scheduledDate (Date / String - YYYY-MM-DD format)
- bookId (UUID, Foreign Key referencing Book, Nullable)
- emailSubject (String)
- emailBody (Text)
- targetSubscriberIds (JSON Array of Strings - list of checked Subscriber UUIDs)
- status ("SCHEDULED", "COMPLETED", "FAILED", Default: "SCHEDULED")
- createdAt (Timestamp)
- updatedAt (Timestamp)

================================================================
3. UI DESIGN & COMPONENT SPECIFICATIONS (/akin/broadcast)
================================================================
Construct a clean, responsive admin dashboard at `/akin/broadcast` containing:

A. SCHEDULING & CONTENT COMPOSER:
   1. Date Picker: Interactive dropdown calendar allowing the admin to pick a specific future date (YYYY-MM-DD) for dispatch.
   2. Book Attachment Selector: Dropdown (combo box) listing all uploaded books in Vercel Blob storage, plus an option for "No Attachment".
   3. Subject Line Input: Text input for the broadcast email subject.
   4. Message Body Textarea: Rich or plaintext textarea for the broadcast message content.

B. SUBSCRIBER TARGETING TABLE:
   1. Pagination Control: Dropdown allowing the admin to select row display density (25, 50, 100, 200, or "All" records per page).
   2. Master Checkbox: Located in the table header. Clicking toggles selection for ALL subscribers visible in the current view.
   3. Individual Checkboxes: Located on each row next to the subscriber email, allowing manual check/uncheck selection.
   4. Save / Schedule Button: Prominent button ("Schedule Broadcast") that validates all inputs and saves the record to the `BroadcastMessage` table.

================================================================
4. CRON ENGINE INTEGRATION (`api/cron/daily-drip`)
================================================================
Update the once-a-day Vercel Cron Job logic to handle broadcast dispatches:

1. DATE SWEEP:
   - When the daily cron executes, query `BroadcastMessage` for entries where `scheduledDate == CURRENT_DATE` and `status == "SCHEDULED"`.

2. BATCH DISPATCH:
   - For each matching broadcast, parse `targetSubscriberIds`.
   - Retrieve subscriber email addresses matching those IDs (excluding those with status "UNSUBSCRIBED").
   - Chunk recipients into batches and send via Resend's Batch API (`resend.batch.send()`), including the assigned Vercel Blob book binary attachment (if selected).
   - Ensure every broadcast email contains the standard one-click unsubscribe footer pointing to `notification.electedbooks.com/api/unsubscribe?email=...`.

3. STATUS UPDATE:
   - Upon successful dispatch, update `BroadcastMessage.status` to "COMPLETED" and record execution timestamp.

================================================================
5. AGENT EXECUTION & AUTOMATED TESTING PROTOCOL
================================================================
1. Analyze existing codebase, schema, and middleware.
2. Run database migration to add the `BroadcastMessage` table.
3. Build the `/akin/broadcast` page, API endpoints, and cron sweep integration.
4. Launch internal browser subagent:
   - Log in at `/akin/login` and navigate to `/akin/broadcast`.
   - Test calendar date picker, book selector, and subscriber selection (verify master checkbox selects/unselects all rows).
   - Schedule a test broadcast and confirm the record saves correctly in the database.
   - Verify unauthenticated visits to `/akin/broadcast` redirect to `/akin/login`.
5. Deploy to Vercel and verify on `notification.electedbooks.com`.