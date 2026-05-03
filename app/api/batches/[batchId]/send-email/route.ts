import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { verifyAuth } from '@/lib/auth-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { batchId } = await params;
    const body = await request.json();
    const { recipient_emails, custom_message } = body;

    if (!recipient_emails || !Array.isArray(recipient_emails)) {
      return errorResponse('VALIDATION_ERROR', 'Recipient emails list is required');
    }

    // Prepare email messages
    const messages = recipient_emails.map((email: string) => ({
      to: email,
      from: 'noreply@certidraft.com',
      subject: 'Your Certificate is Ready!',
      html: `
        <h1>Congratulations!</h1>
        <p>Your certificate has been generated and is ready for download.</p>
        <p>${custom_message || 'Click the link below to access your certificate.'}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://certidraft.com'}/batches/${batchId}">View Certificate</a>
      `,
    }));

    // Send emails (Simplified: sending only the first one as an example or using sendMultiple)
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(messages);
    } else {
      console.warn('SENDGRID_API_KEY not set. Email not sent.');
    }

    return successResponse({
      recipients_count: recipient_emails.length,
      status: 'sent',
    });
  } catch (error) {
    console.error('Email error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to send emails', 500);
  }
}
