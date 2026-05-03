import nodemailer from "nodemailer"

const host = process.env.SMTP_HOST || "mail89.lwspanel.com"
const port = parseInt(process.env.SMTP_PORT || "465", 10)
const user = process.env.SMTP_USER || process.env.SMTP_EMAIL
const pass = process.env.SMTP_PASS

const transporter =
  user && pass
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      })
    : null

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
}) {
  if (!transporter) {
    console.warn("SMTP non configuré (SMTP_USER/SMTP_PASS manquants). Email non envoyé.")
    return { ok: false, error: "Email non configuré" }
  }

  // LWS/cPanel exigent souvent que l'expéditeur = utilisateur SMTP authentifié
  const fromEmail = (user || process.env.SMTP_FROM || "contact@carolinelogistics.fr")
    .trim()
    .toLowerCase()
  if (!fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    console.warn("Adresse expéditeur invalide:", JSON.stringify(fromEmail))
    return { ok: false, error: "Configuration email invalide" }
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]*>/g, "") : undefined),
      replyTo,
    })
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur envoi email"
    console.error("Erreur envoi email:", err)
    return { ok: false, error: message }
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** E-mail envoyé au nouvel utilisateur avec l’URL de connexion et le mot de passe temporaire. */
export async function sendNewUserAccessEmail(params: {
  to: string
  recipientName: string | null
  loginEmail: string
  plainPassword: string
  loginUrl: string
}) {
  const { to, recipientName, loginEmail, plainPassword, loginUrl } = params
  const greeting = recipientName ? `Bonjour ${escapeHtml(recipientName)},` : "Bonjour,"
  const subject = "Vos accès à l’administration Caroline Logistics"
  const html = `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333;">
  <p>${greeting}</p>
  <p>Un compte a été créé pour vous sur l’espace d’administration.</p>
  <p><strong>Page de connexion :</strong><br /><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr>
      <td style="padding: 10px 14px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>E-mail</strong></td>
      <td style="padding: 10px 14px; border: 1px solid #e5e7eb;">${escapeHtml(loginEmail)}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; border: 1px solid #e5e7eb; background: #f9fafb;"><strong>Mot de passe temporaire</strong></td>
      <td style="padding: 10px 14px; border: 1px solid #e5e7eb; font-family: ui-monospace, monospace; font-size: 14px;">${escapeHtml(plainPassword)}</td>
    </tr>
  </table>
  <p>Connectez-vous avec ces identifiants, puis <strong>changez votre mot de passe</strong> dès que possible (contactez un administrateur si besoin).</p>
  <p style="color:#6b7280;font-size:13px;">Si vous n’attendiez pas ce message, vous pouvez l’ignorer ou prévenir l’administrateur du site.</p>
</body>
</html>`

  return sendEmail({ to, subject, html })
}
