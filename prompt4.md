Role: Lead Full-Stack Architect and Autonomous Systems Engineer

Objective: You are tasked with adding a specific "Delete/Cancel" feature to an already built and functioning Next.js (App Router) admin dashboard. 

CRITICAL DIRECTIVE: The codebase for the broadcast scheduling system is already written and working. Do NOT refactor the database schema, cron job logic, or the broadcast composition UI. Your ONLY task is to implement the ability to delete/cancel an already scheduled broadcast from the pending queue.

================================================================
1. UI IMPLEMENTATION (File Target: `/akin/broadcast` page)
================================================================
- Locate the section of the page displaying the queue/list of currently "SCHEDULED" broadcasts.
- Inject an "Action" column (if not present) and add a red "Delete" or "Cancel" button to each row.
- Add a confirmation dialog (e.g., standard browser `confirm()` or a custom modal) that triggers when the button is clicked to prevent accidental deletions.
- On successful deletion, update the UI state to remove the cancelled broadcast from the visible list without requiring a manual page refresh.

================================================================
2. BACKEND API LOGIC (File Target: New or existing Broadcast API route)
================================================================
- Create or update an API route (e.g., `DELETE /api/broadcast/[id]` or a Next.js Server Action) to handle the cancellation request.
- Ensure the route is protected by the existing admin authentication middleware.
- Database Action: When triggered, the route must find the target broadcast by its ID and either hard-delete the row from the database OR update its status from "SCHEDULED" to "CANCELLED". 
- Return standard success/error HTTP status codes.

================================================================
3. AGENT EXECUTION PROTOCOL
================================================================
1. Read the existing `/akin/broadcast` page and the related API routes to understand the current state management and data fetching logic.
2. Implement the frontend delete button and confirmation dialog.
3. Build the backend deletion API/Server Action.
4. Launch your internal browser subagent:
   - Log into `/akin/login` and navigate to `/akin/broadcast`.
   - Locate a scheduled broadcast in the queue (create a dummy one if necessary).
   - Click the "Delete" button, confirm the dialog, and verify that the API successfully updates the database and the UI removes the item.
5. Deploy the exact file updates to Vercel.