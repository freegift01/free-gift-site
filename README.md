# Free Gift Site

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## 🚀 Manual Deployment Guide

If you make changes to the local files and want to deploy them to Vercel manually (without relying on GitHub's automatic deployment), follow these comprehensive steps:

### Prerequisites

Ensure you have the Vercel CLI installed globally. If not, you can run it via `npx`. You'll also need the existing `.env.local` file with the correct configuration present in your project's root folder.

### Method A: Deploy via Vercel CLI (Manual)

If you wish to deploy directly from your local terminal without committing to Git:

1. **Open the Project Directory**:
   Ensure you are in the root directory of the project in your terminal:
   ```bash
   cd c:\Antigravity_Project\freee_gift_site
   ```

2. **Run the Deployment Command**:
   Copy and paste the following command into your terminal. It authenticates securely using your token and builds the production site automatically:
   ```bash
   npx vercel --prod --token <YOUR_VERCEL_TOKEN> --yes
   ```

3. **Verify the Live Site**:
   Once finished, Vercel will output a "Production" URL (e.g., `https://freeegiftsite.vercel.app`). Navigate there to verify your changes are live!

### Method B: Deploy via GitHub (Automatic)

If your Vercel project is connected to your GitHub repository, you can trigger a deployment simply by pushing your code. Run the following commands one by one:

```bash
git add .
git commit -m "Deploying latest changes"
git push
```

Vercel will automatically detect the push to the `master` branch and build/deploy it for you.

---

### 🔑 Environment Variables & Connection Strings

Below is a comprehensive list of all API keys, connection strings, and secrets utilized by this project. 

#### 1. How to configure them Locally
Create a `.env.local` file in the root of your project directory (`c:\Antigravity_Project\freee_gift_site\.env.local`) and paste the keys into it. The Next.js development server and Vercel CLI will automatically read from this file during local development and manual deployments.

#### 2. How to configure them in Vercel (Production)
For the live site to function, these exact same variables must be added to your Vercel Project Settings:
1. Go to your Vercel Dashboard and select the `freee_gift_site` project.
2. Navigate to **Settings** > **Environment Variables**.
3. Copy each Key and its corresponding Value from the table below and add them to the Production environment.
4. After saving, you will need to redeploy the project (using the manual steps above) for the new variables to take effect.

#### The Variables List

| Key Name | Value / Connection String |
|---|---|
| `RESEND_API_KEY` | `<your_resend_api_key>` |
| `VERCEL_TOKEN` | `<your_vercel_token>` |
| `SENDER_EMAIL` | `freegift@notification.electedbooks.com` |
| `DIRECT_URL` | `postgresql://postgres.qpybgwotctvhaihiudkt:akdie%4034ADR@aws-0-eu-north-1.pooler.supabase.com:5432/postgres` |
| `DATABASE_URL` | `postgresql://postgres.qpybgwotctvhaihiudkt:akdie%4034ADR@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `ADMIN_USERNAME` | `Akingift` |
| `ADMIN_PASSWORD` | `Akingift*#` |
| `JWT_SECRET` | `drip-funnel-jwt-s3cr3t-k3y-2024-xQ9mP2vL` |
| `CRON_SECRET` | `cron-drip-s3cr3t-7Kp4mNwXjR2bY8fL` |

#### How the Code Uses Them
- **Database (`DATABASE_URL` & `DIRECT_URL`)**: Used by Prisma ORM (`prisma/schema.prisma` and `prisma.config.ts`) to connect to your Supabase PostgreSQL database. `DIRECT_URL` is used strictly during build time (`prisma db push`) to apply schema migrations, while `DATABASE_URL` handles everyday user traffic with connection pooling.
- **Email (`RESEND_API_KEY` & `SENDER_EMAIL`)**: Used by the Resend SDK in your Next.js API routes (e.g., the daily drip cron job and the initial subscribe webhook) to authenticate and dispatch emails.
- **Admin Authentication (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`)**: Used in `app/api/auth/login/route.ts` to verify your credentials when you try to access the `/admin` dashboard. Upon success, `JWT_SECRET` is used to sign a secure session cookie.
- **Cron Jobs (`CRON_SECRET`)**: Used by your daily email drip route to ensure only authorized schedulers (like Vercel Cron) can trigger the daily email blast. The request must include this secret.
- **Deployment (`VERCEL_TOKEN`)**: Used only locally in your terminal to authenticate the `npx vercel --prod` command without needing a browser login. *(Note: There is also an auto-generated `VERCEL_OIDC_TOKEN` created locally by the Vercel CLI during operations, but it does not need to be manually configured anywhere.)*

---

## 🛠️ Complete Project Setup Guide (From Scratch)

If you are setting up this exact project completely from scratch on a new machine or for a new environment, follow these steps in order. They have been formatted so you can easily copy and paste them into your terminal.

### Step 1: Clone the Repository & Install Dependencies
Open your terminal and run:
```bash
git clone https://github.com/freegift01/free-gift-site.git
cd free-gift-site
npm install
```

### Step 2: Set Up the Database (Supabase / PostgreSQL)
1. Go to [Supabase.com](https://supabase.com/) and create a new project.
2. Navigate to **Project Settings** > **Database** to find your connection strings.
3. Run the following commands, replacing the placeholders with your actual Supabase connection strings, to generate your local environment file:
```bash
echo "DATABASE_URL=\"<your_pooler_connection_string>\"" >> .env.local
echo "DIRECT_URL=\"<your_direct_connection_string>\"" >> .env.local
```

### Step 3: Set Up Resend (Email Service)
1. Go to [Resend.com](https://resend.com/) and create a new API Key.
2. Verify your domain (e.g., `notification.electedbooks.com`) in the Resend Dashboard under **Domains**.
3. Run the following commands to add your Resend credentials to the environment file:
```bash
echo "RESEND_API_KEY=\"<your_resend_api_key>\"" >> .env.local
echo "SENDER_EMAIL=\"freegift@notification.electedbooks.com\"" >> .env.local
```

### Step 4: Add Authentication & Security Secrets
Run the following commands to append your Admin credentials and secure JWT/Cron secrets:
```bash
echo "ADMIN_USERNAME=\"Akingift\"" >> .env.local
echo "ADMIN_PASSWORD=\"Akingift*#\"" >> .env.local
echo "JWT_SECRET=\"drip-funnel-jwt-s3cr3t-k3y-2024-xQ9mP2vL\"" >> .env.local
echo "CRON_SECRET=\"cron-drip-s3cr3t-7Kp4mNwXjR2bY8fL\"" >> .env.local
```

### Step 5: Push Database Schema (Prisma)
Now that your database environment variables are set, push the Prisma schema to build the tables in your Supabase database:
```bash
npx prisma generate
npx prisma db push
```

### Step 6: Link & Deploy to Vercel
Finally, link your project to Vercel, upload your newly created `.env.local` variables directly to your Vercel project, and deploy the application to production:
```bash
# Log in to Vercel (if not already authenticated)
npx vercel login

# Link the local directory to a Vercel project
npx vercel link --yes

# Push your local .env.local variables to Vercel's production environment
npx vercel env push .env.local --yes

# Deploy the project to production
npx vercel --prod --yes
```
