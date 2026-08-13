# Database Schema (Prisma)

- **Book**: Represents an uploaded PDF/EPUB. Fields: `id`, `title`, `blobUrl`, `filename`, `sizeBytes`, `createdAt`.
- **ScheduleSlot**: Maps a specific day (1-30) to a Book and Email configuration. Fields: `dayNumber`, `isEnabled`, `bookId`, `emailSubject`, `emailBody`.
- **Subscriber**: User enrolled in the drip. Fields: `id`, `email`, `status` (ACTIVE, COMPLETED, UNSUBSCRIBED), `currentDay`, `startDate`, `lastSentAt`.
- **DeliveryLog**: Logs email delivery success/failure for each subscriber and day. Fields: `id`, `subscriberId`, `dayNumber`, `bookId`, `sentAt`, `status`, `errorMsg`.
- **LoginAttempts**: Tracks brute-force protection. Fields: `id`, `ipAddress`, `attemptCount`, `lockedUntil`, `updatedAt`.
- **BroadcastMessage**: Scheduled manual email blasts. Fields: `id`, `scheduledDate`, `bookId`, `emailSubject`, `emailBody`, `targetSubscriberIds`, `status` (SCHEDULED, COMPLETED, FAILED), `createdAt`.
