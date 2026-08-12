import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const email = searchParams.get('email');

  if (!id && !email) {
    return new Response(
      generateHtmlPage('Missing Parameter', 'No subscriber identifier provided. Please use the unsubscribe link from your email.', false),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const subscriber = id
      ? await prisma.subscriber.findUnique({ where: { id } })
      : await prisma.subscriber.findUnique({ where: { email: email!.toLowerCase().trim() } });

    if (!subscriber) {
      return new Response(
        generateHtmlPage('Not Found', 'We could not find a subscriber with that identifier.', false),
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (subscriber.status === 'UNSUBSCRIBED') {
      return new Response(
        generateHtmlPage('Already Unsubscribed', 'You have already been unsubscribed and will not receive further emails.', true),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'UNSUBSCRIBED' },
    });

    return new Response(
      generateHtmlPage('Unsubscribed Successfully', 'You have been unsubscribed and will no longer receive daily emails from us. We\'re sorry to see you go!', true),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      generateHtmlPage('Error', 'Something went wrong. Please try again later or contact support.', false),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

function generateHtmlPage(title: string, message: string, success: boolean): string {
  const bgColor = success ? '#ecfdf5' : '#fef2f2';
  const textColor = success ? '#065f46' : '#991b1b';
  const icon = success ? '✅' : '⚠️';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ElectedBooks</title>
      <style>
        body {
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { color: ${textColor}; font-size: 24px; margin-bottom: 12px; }
        p { color: #4b5563; font-size: 16px; line-height: 1.6; }
        a {
          display: inline-block;
          margin-top: 24px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #4263eb 0%, #7c3aed 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="https://notification.electedbooks.com">← Back to Home</a>
      </div>
    </body>
    </html>
  `;
}
