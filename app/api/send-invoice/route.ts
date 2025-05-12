import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { recipient, email, paymentCollection, dueDate, currency, lineItems, merchantEmail } = data;

    // Debug log (do not log sensitive data in production)
    console.log('[SEND-INVOICE] Request:', { recipient, email, paymentCollection, dueDate, currency, lineItems, merchantEmail });

    // Configure nodemailer transporter for Hotmail (Outlook)
    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: 'nedalabs@hotmail.com',
        pass: 'lppeikrigzxfjxgi',
      },
    });

    // Construct invoice HTML
    const itemsHtml = lineItems.map((item: any) => `<li>${item.description}: <b>${item.amount} ${currency}</b></li>`).join('');
    const html = `
      <h2>Invoice from NEDA Pay Merchant</h2>
      <p><b>To:</b> ${recipient} (${email})</p>
      <p><b>Payment Collection:</b> ${paymentCollection}</p>
      <p><b>Due Date:</b> ${dueDate}</p>
      <ul>${itemsHtml}</ul>
      <p>Sent via NEDA Pay Merchant Portal</p>
    `;

    // Send email
    await transporter.sendMail({
      from: 'nedalabs@hotmail.com',
      to: email,
      subject: `Invoice from ${merchantEmail || 'NEDA Pay Merchant'}`,
      html,
      replyTo: merchantEmail || 'nedalabs@hotmail.com',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Log error stack if available
    if (error && error.stack) {
      console.error('Send invoice error stack:', error.stack);
    }
    console.error('Send invoice error:', error);
    // Always return a JSON error message
    return NextResponse.json({ success: false, error: error?.message || String(error) || 'Unknown error' }, { status: 500 });
  }
}

