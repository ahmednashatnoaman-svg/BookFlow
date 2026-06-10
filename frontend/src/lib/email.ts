import { Resend } from 'resend';

// Lazy — never constructed at module load time (would throw at Next.js build)
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://book-flow-umber.vercel.app';

function wrap(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; background:#0f0f1a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .container { max-width:560px; margin:40px auto; background:#1a1a2e; border:1px solid rgba(124,58,237,.25); border-radius:16px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#7c3aed 0%,#2dd4bf 100%); padding:28px 32px; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-.3px; }
    .header p { margin:4px 0 0; color:rgba(255,255,255,.75); font-size:13px; }
    .body { padding:28px 32px; color:#e5e7eb; }
    .body p { font-size:15px; line-height:1.6; margin:0 0 16px; }
    .highlight { background:rgba(124,58,237,.12); border:1px solid rgba(124,58,237,.25); border-radius:10px; padding:14px 18px; margin:16px 0; }
    .highlight .book-title { font-size:16px; font-weight:600; color:#a78bfa; margin:0 0 4px; }
    .highlight .book-meta { font-size:13px; color:#9ca3af; margin:0; }
    .msg-box { background:rgba(255,255,255,.04); border-left:3px solid #7c3aed; border-radius:0 8px 8px 0; padding:12px 16px; margin:16px 0; font-size:14px; color:#d1d5db; line-height:1.5; }
    .cta { display:inline-block; margin:8px 0 0; padding:12px 28px; background:#7c3aed; color:#fff !important; text-decoration:none; border-radius:10px; font-weight:600; font-size:14px; }
    .footer { padding:20px 32px; border-top:1px solid rgba(255,255,255,.06); text-align:center; }
    .footer p { margin:0; font-size:12px; color:#6b7280; }
    .footer a { color:#7c3aed; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 BookFlow</h1>
      <p>Egypt's AI-powered book marketplace</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>BookFlow · <a href="${APP_URL}">book-flow-umber.vercel.app</a></p>
      <p style="margin-top:6px">You're receiving this because you have an account on BookFlow.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Email: new request received by seller ─────────────────────────────────
export async function sendRequestReceivedEmail(opts: {
  to: string;
  ownerName: string;
  requesterName: string;
  bookTitle: string;
  bookId: string;
  message?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const dashboardUrl = `${APP_URL}/dashboard/requests`;

  const body = `
    <p>Hi ${opts.ownerName || 'there'},</p>
    <p><strong>${opts.requesterName || 'Someone'}</strong> has sent a request for your book:</p>
    <div class="highlight">
      <p class="book-title">${opts.bookTitle}</p>
    </div>
    ${opts.message ? `<p>They left a message:</p><div class="msg-box">"${opts.message}"</div>` : ''}
    <p>Log in to your dashboard to review the request and decide whether to accept or decline.</p>
    <a href="${dashboardUrl}" class="cta">View Request →</a>
  `;

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `New request for your book "${opts.bookTitle}"`,
    html: wrap(body),
  }).catch(err => console.error('[email] sendRequestReceived failed:', err));
}

// ── Email: request accepted — sent to buyer ───────────────────────────────
export async function sendRequestAcceptedEmail(opts: {
  to: string;
  requesterName: string;
  ownerName: string;
  bookTitle: string;
  bookId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const bookUrl = `${APP_URL}/books/${opts.bookId}`;

  const body = `
    <p>Hi ${opts.requesterName || 'there'},</p>
    <p>Great news! <strong>${opts.ownerName || 'The seller'}</strong> has <strong style="color:#4ade80">accepted</strong> your request for:</p>
    <div class="highlight">
      <p class="book-title">${opts.bookTitle}</p>
    </div>
    <p>Get in touch with the seller to arrange the handover. You can view the listing or visit your dashboard to coordinate the next steps.</p>
    <a href="${bookUrl}" class="cta">View Listing →</a>
  `;

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `✅ Your request for "${opts.bookTitle}" was accepted!`,
    html: wrap(body),
  }).catch(err => console.error('[email] sendRequestAccepted failed:', err));
}

// ── Email: request rejected — sent to buyer ───────────────────────────────
export async function sendRequestRejectedEmail(opts: {
  to: string;
  requesterName: string;
  bookTitle: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const browseUrl = `${APP_URL}/books`;

  const body = `
    <p>Hi ${opts.requesterName || 'there'},</p>
    <p>Unfortunately, the seller was unable to accept your request for:</p>
    <div class="highlight">
      <p class="book-title">${opts.bookTitle}</p>
    </div>
    <p>Don't worry — there are plenty of other great books on BookFlow. Browse similar listings or set up a wishlist alert for this title.</p>
    <a href="${browseUrl}" class="cta">Browse Books →</a>
  `;

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Update on your request for "${opts.bookTitle}"`,
    html: wrap(body),
  }).catch(err => console.error('[email] sendRequestRejected failed:', err));
}
