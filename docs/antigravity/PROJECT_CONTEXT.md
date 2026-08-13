# Antigravity Single Source of Truth

## Project Overview
- **Domain Mapping**: notification.electedbooks.com
- **Business Logic**: This project implements a free "30-Day Ebook Drip Funnel" offering a crossword puzzle book daily.
- **Tech Stack**: Next.js (App Router), Prisma, PostgreSQL (Supabase), Vercel (Hosting), Resend (Email Delivery), Tailwind CSS.

## 30-Day Drip Sequence Rules
1. A user subscribes via the frontend form using their email address.
2. The user is saved to the database with a status of `ACTIVE` and `currentDay: 1`.
3. Day 1 email with the first book is dispatched immediately.
4. A daily cron job (`/api/cron/daily-drip`) evaluates all active subscribers, increments their `currentDay`, and sends the book mapped to that schedule slot from the `ScheduleSlot` table.
5. Once a subscriber reaches past day 30, their status may update to `COMPLETED`.

## Manual Broadcast Rules
- Admins can schedule broadcasts using the `BroadcastMessage` table.
- A broadcast specifies an `emailSubject`, `emailBody`, and an array of `targetSubscriberIds` (if empty, targeting everyone depending on implementation).
- The scheduled jobs check for pending broadcasts matching the current date and dispatches them to the targeted users.
