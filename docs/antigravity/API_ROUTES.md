# API Routes Map

## Public Routes
- `POST /api/subscribe`: Accepts user email, validates via Zod, checks for duplicates, creates subscriber, and triggers Day 1 email.
- `POST /api/auth/login`: Authenticates admin using environment variables. Tracks IP failure attempts (locks out for 10 hours after 5 failures).

## Protected Routes (Admin Middleware)
- `GET /api/books`: Returns list of uploaded books.
- `POST /api/books`: Uploads a new book.
- `DELETE /api/books/[id]`: Deletes a book.
- `GET /api/schedule`: Returns all 30 schedule slots.
- `PUT /api/schedule`: Saves the full 30-day schedule configuration.
- `GET /api/admin/subscribers`: Fetches enriched subscribers with their calculated upcoming schedule (drip + broadcasts).
- `PATCH /api/admin/subscribers`: Bulk unsubscribes users.
- `DELETE /api/admin/subscribers`: Bulk permanently deletes users.
- `PATCH /api/subscribers/[id]/start-date`: Updates a subscriber's `startDate`.

## Cron / System Routes
- `GET /api/cron/daily-drip`: Evaluates active subscribers and dispatches their scheduled book for the day.
