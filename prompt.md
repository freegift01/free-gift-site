Role: Lead Full-Stack Architect and Autonomous Systems Engineer

Objective: Build, test, validate, and deploy an automated 30-day daily ebook drip funnel on Next.js (App Router). The application will be hosted on Vercel and mapped to the subdomain "notification.electedbooks.com". The system consists of a public senior-friendly landing page, a secure administrative portal, a serverless email delivery engine via Resend, and automated cron scheduling.

================================================================
1. TECH STACK & INFRASTRUCTURE
================================================================
- Framework: Next.js (App Router) + TypeScript + Tailwind CSS
- Cloud Storage: Vercel Blob (@vercel/blob) for storing >30 PDF/EPUB ebook files (<10MB each)
- Database: Vercel Postgres or Supabase (PostgreSQL via Prisma ORM or Drizzle ORM)
- Email Provider: Resend SDK (resend)
- Sender Identity: freegift@notification.electedbooks.com
- Cron Scheduler: Vercel Cron Jobs (/api/cron/daily-drip)
- Authentication: HTTP-Only JWT Cookie for admin sessions, validated via environment variables.
- Hosting & Domain: Vercel mapped to "notification.electedbooks.com"

================================================================
2. DATABASE SCHEMA DESIGN
================================================================
Define the following models (exclude admin users, as auth is env-based):

1. Book:
   - id (UUID), title (String), blobUrl (String), filename (String), sizeBytes (Int), createdAt (Timestamp)

2. ScheduleSlot:
   - dayNumber (Int 1-30, Unique Primary Key)
   - isEnabled (Boolean, Default: false)
   - bookId (UUID, Foreign Key referencing Book, Nullable)
   - emailSubject (String, Customizable)
   - emailBody (Text, Customizable)
   - updatedAt (Timestamp)

3. Subscriber:
   - id (UUID), email (String, Unique), status ("ACTIVE", "COMPLETED", "UNSUBSCRIBED")
   - currentDay (Int, Default: 1)
   - startDate (Timestamp), lastSentAt (Timestamp, Nullable)

4. DeliveryLog:
   - id (UUID), subscriberId (FK), dayNumber (Int), bookId (FK), sentAt (Timestamp), status ("SUCCESS", "FAILED"), errorMsg (Text, Nullable)

================================================================
3. SECURITY & ENVIRONMENT CONFIGURATION
================================================================
- Admin login MUST NOT query the database. The backend authentication route must strictly validate the submitted login credentials against the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables.
- Ensure all environment variables (including `CRON_SECRET`, `RESEND_API_KEY`, and `BLOB_READ_WRITE_TOKEN`) are securely accessed via `process.env`.
- Ensure the .env.local file is properly added to .gitignore.
- Protect all `/admin` routes with middleware that verifies the HTTP-Only auth cookie. Unauthenticated visitors must be redirected to `/admin/login`.

================================================================
4. CORE FUNCTIONALITY & BUSINESS LOGIC
================================================================

A. PUBLIC LANDING PAGE (notification.electedbooks.com /):
- Senior-friendly UX: Large typography (minimum 18px body font), high-contrast elements, simple single-field email form.
- Action Button: "Send me free puzzle"
- Submission Workflow:
  1. Validate email format.
  2. Create/register subscriber in DB with status "ACTIVE", currentDay = 1, startDate = NOW().
  3. Immediately queue or trigger the Day 1 email sequence.
  4. Display prominent success alert/toast: "Your first free ebook has been sent! You will continue to receive a new free ebook daily for the next 30 days."

B. SECURE ADMIN PORTAL (notification.electedbooks.com/admin):
- File Upload Interface:
  * Admin can upload PDF/EPUB files (<10MB) directly from local storage to Vercel Blob.
  * System must support storing more than 30 books at a time.
  * List all uploaded books on screen with title, size, upload date, and a delete option.
- 30-Day Drip Schedule Matrix:
  * Render exactly 30 distinct day slots (Day 1 through Day 30).
  * Each slot contains:
    1. Checkbox: Enable/Disable sending for this day.
    2. Dropdown (Combo Box): Displays all uploaded books to select which book to send.
    3. Input Field: Custom Email Subject Line for that day.
    4. Textarea: Custom Email Message/Body for that day.
  * CRITICAL VALIDATION RULE: Enforce strict client-side AND server-side validation to prevent selecting the same book in multiple enabled slots. Each book must be assigned at most once across the 30 days.

C. CRON SCHEDULER & RESEND ENGINE (/api/cron/daily-drip):
- Security: Protected by CRON_SECRET header verification to block unauthorized triggers.
- Timing: Scheduled via vercel.json to run daily.
- Execution Logic:
  1. Fetch all subscribers where status == "ACTIVE" AND currentDay <= 30.
  2. For each subscriber, check if 24 hours have elapsed since their startDate or lastSentAt.
  3. Retrieve the ScheduleSlot matching subscriber.currentDay.
  4. IF slot isEnabled is TRUE and bookId is present:
     a. Fetch the assigned book file binary from the Vercel Blob URL.
     b. Send email via Resend API:
        - From: freegift@notification.electedbooks.com
        - To: subscriber.email
        - Subject: slot.emailSubject
        - Html/Text: slot.emailBody
        - Attachments: [{ filename: book.filename, content: fileBuffer }]
     c. Record entry in DeliveryLog.
     d. Update subscriber.lastSentAt to NOW() and increment subscriber.currentDay by 1.
     e. If currentDay > 30, update subscriber.status to "COMPLETED".

================================================================
5. AGENT EXECUTION & TESTING PROTOCOL
================================================================
You MUST execute the following steps autonomously:

1. SCAFFOLD & CONFIGURE:
   - Initialize Next.js project with App Router and Tailwind CSS.
   - Install required packages (@vercel/blob, @vercel/postgres or prisma, resend, jsonwebtoken).
   - Generate database migration files.

2. BUILD UI & API ROUTES:
   - Create landing page (/), admin login (/admin/login), and admin dashboard (/admin).
   - Build API routes for file upload, schedule saving, auth, and cron execution.
   - Implement scalable API logic to handle concurrent email dispatches securely.

3. AUTOMATED BROWSER TESTING:
   - Launch your internal browser agent.
   - Navigate to local server (http://localhost:3000/admin/login) and log in.
   - Test book upload functionality.
   - Attempt to assign the same book to two different day checkboxes and verify that the validation error successfully blocks saving.
   - Navigate to http://localhost:3000, enter a test email, submit "Send me free puzzle", and verify the success notification displays.

4. DEPLOYMENT & VERIFICATION:
   - Generate vercel.json with cron configuration.
   - Execute vercel CLI deployment commands to deploy the project to Vercel.
   - Ensure the application is set to accept connections for "notification.electedbooks.com".
   - Report back only when all systems are functional, verified, and error-free.