// Welcome email only. Clerk sends all auth emails itself.
export async function sendWelcomeEmail(toEmail: string, toName?: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !toEmail) return; // not configured → skip silently

  const firstName = (toName ?? "").split(" ")[0] || "there";
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: process.env.BREVO_SENDER_NAME || "Core Confidence",
        },
        to: [{ email: toEmail, name: toName || undefined }],
        subject: "Welcome to Core Confidence",
        htmlContent: `
          <div style="font-family:Arial,Helvetica,sans-serif;background:#05070D;color:#ffffff;padding:32px;border-radius:12px;">
            <h1 style="margin:0 0 12px;font-size:22px;">Welcome, ${firstName}</h1>
            <p style="color:#94a3b8;line-height:1.6;margin:0 0 16px;">
              You're in. Confidence isn't given — it's built, one rep at a time.
              Jump into your first free workout whenever you're ready.
            </p>
            <a href="${process.env.APP_URL || "#"}"
               style="display:inline-block;background:#2196F3;color:#ffffff;text-decoration:none;
                      padding:12px 22px;border-radius:10px;font-weight:600;">Start training</a>
            <p style="color:#475569;font-size:12px;margin-top:24px;">— Donovan, Core Confidence</p>
          </div>`,
      }),
    });
  } catch (err) {
    console.error("Brevo welcome email failed:", err); // never block sign-up
  }
}
