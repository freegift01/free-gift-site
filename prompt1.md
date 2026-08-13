Role: Lead Full-Stack Architect and Autonomous Systems Engineer

Objective: You are tasked with implementing 5 specific updates to an existing, fully functional Next.js (App Router) email drip funnel hosted on Vercel. 

CRITICAL DIRECTIVE: The current website and cron/email engine are working perfectly. You must read and analyze the existing codebase before making any changes. Modify ONLY the files necessary to implement the following updates. Do not refactor or break the existing core logic, database schema, or authentication flow.

================================================================
UPDATE 1: LANDING PAGE COPY REVISION
================================================================
- File Target: The main public landing page (likely `app/page.tsx`).
- Action: Scan the visible text content. Remove any mention of "Brain teasers" and "sudoku". 
- Requirement: The copy must explicitly focus ONLY on "crossword puzzles".

================================================================
UPDATE 2: USER SUCCESS FEEDBACK UI
================================================================
- File Target: The main public landing page client component.
- Action: Implement a clear, visible success state upon form submission.
- Requirement: When a user enters their email and clicks the submit button, they must receive immediate on-screen visual feedback (e.g., a toast notification or a success text block replacing the form) stating: "Your book has been sent to your email! Please check your inbox."

================================================================
UPDATE 3: ONE-CLICK UNSUBSCRIBE FUNCTIONALITY
================================================================
- File Targets: The Cron/Email sending logic (likely `api/cron/daily-drip/route.ts`) and a new unsubscribe API route.
- Action 1: Create a public route (e.g., `app/api/unsubscribe/route.ts` or a frontend page `app/unsubscribe/page.tsx`) that accepts a user's email or ID via URL parameters. When accessed, it must update that subscriber's status in the database to "UNSUBSCRIBED".
- Action 2: Update the Resend email payload so that *every* daily email includes a clear footer with an unsubscribe link pointing to this new route.

================================================================
UPDATE 4: ADMIN SUBSCRIBER MANAGEMENT DASHBOARD
================================================================
- File Target: The secure admin portal (likely under `app/admin/`).
- Action: Create a new tab or section for "Subscriber Management".
- Requirements:
  1. Pagination: Display the list of registered emails with a dynamic dropdown selector allowing the admin to choose the number of records displayed per page. The options must strictly be: 25, 50, 100, 200, and "All".
  2. Bulk Selection: Include a checkbox next to each email, plus a "Select All" checkbox for the current page.
  3. Deletion Options: Provide two distinct action buttons for selected rows:
     - "Unsubscribe Selected": Changes their database status to "UNSUBSCRIBED" so they remain in the records but stop receiving emails.
     - "Delete Permanently": Completely drops the row from the database.
  4. CSV Export: Add a "Download CSV" button that exports the entire subscriber list. DO NOT use heavy third-party libraries; generate a standard `.csv` file using native JavaScript array mapping and string concatenation, then trigger a browser download.

================================================================
UPDATE 5: VERCEL CUSTOM DOMAIN CONFIGURATION
================================================================
- File Target: Deployment configuration / instructions.
- Action: Ensure the application routes and internal absolute URLs (like the unsubscribe link) resolve accurately to the custom domain `notification.electedbooks.com`.

================================================================
EXECUTION PROTOCOL
================================================================
1. Read the existing layout, page, and API files.
2. Implement the UI updates to the frontend.
3. Build the backend logic for dynamic pagination, bulk deletion, CSV export, and the unsubscribe webhook.
4. Launch your internal browser subagent to log into the admin dashboard.
5. Test that the pagination selector successfully changes the displayed row counts to 25, 50, 100, 200, and All.
6. Verify the CSV download and test the unsubscribe/delete actions.
7. Do not stop until all tests pass and the existing features remain fully functional.