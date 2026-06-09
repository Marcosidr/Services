import nodemailer from "nodemailer";
import { getMailConfig } from "../config/mail";

export type ContactMailInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const BRAND_COLOR = "#2563eb";
const ACCENT_COLOR = "#10b981";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildContactEmailHtml(input: ContactMailInput) {
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");
  const sentAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date());

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Novo contato Zentry</title>
      </head>
      <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 18px 45px rgba(15,23,42,0.10);">
                <tr>
                  <td style="background:linear-gradient(135deg,${BRAND_COLOR},${ACCENT_COLOR});padding:32px;">
                    <p style="margin:0 0 10px 0;color:#dbeafe;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Formulario de contato</p>
                    <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2;">Nova mensagem recebida</h1>
                    <p style="margin:12px 0 0 0;color:#ecfeff;font-size:15px;line-height:1.6;">Um visitante entrou em contato pela pagina da Zentry.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 8px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:0 0 14px 0;">
                          <p style="margin:0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Nome</p>
                          <p style="margin:6px 0 0 0;color:#0f172a;font-size:18px;font-weight:700;">${safeName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 14px 0;">
                          <p style="margin:0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">E-mail para resposta</p>
                          <p style="margin:6px 0 0 0;color:${BRAND_COLOR};font-size:16px;font-weight:700;">${safeEmail}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 14px 0;">
                          <p style="margin:0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Assunto</p>
                          <p style="margin:6px 0 0 0;color:#0f172a;font-size:16px;font-weight:700;">${safeSubject}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 28px 32px;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:22px;">
                      <p style="margin:0 0 12px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Mensagem</p>
                      <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.75;">${safeMessage}</p>
                    </div>
                    <p style="margin:18px 0 0 0;color:#64748b;font-size:12px;">Recebido em ${sentAt}. Para responder, use o botao Responder do Gmail.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildContactEmailText(input: ContactMailInput) {
  return [
    "Nova mensagem recebida pela pagina de contato da Zentry.",
    "",
    `Nome: ${input.name}`,
    `Email: ${input.email}`,
    `Assunto: ${input.subject}`,
    "",
    "Mensagem:",
    input.message
  ].join("\n");
}

export async function sendContactMail(input: ContactMailInput) {
  const config = getMailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  await transporter.sendMail({
    from: config.from,
    to: config.contactTo,
    replyTo: `"${sanitizeHeader(input.name)}" <${sanitizeHeader(input.email)}>`,
    subject: `[Zentry] ${sanitizeHeader(input.subject)}`,
    text: buildContactEmailText(input),
    html: buildContactEmailHtml(input)
  });
}
