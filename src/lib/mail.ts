import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendIdeaBoxEmail(data: {
  title: string;
  category: string;
  body: string;
}) {
  const recipients = (process.env.IDEA_BOX_RECIPIENTS || "rh@value-it.mg")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const transport = getTransport();
  const from = process.env.SMTP_FROM || "intranet@value-it.mg";
  const subject = `[Boîte à idées] ${data.title}`;
  const html = `
    <h2>Nouvelle idée — Portail Intranet Value-IT</h2>
    <p><strong>Catégorie :</strong> ${data.category}</p>
    <p><strong>Titre :</strong> ${data.title}</p>
    <hr />
    <pre style="font-family:sans-serif;white-space:pre-wrap">${data.body}</pre>
    <p><em>Envoi anonyme — ${new Date().toLocaleString("fr-FR")}</em></p>
  `;

  if (!transport) {
    console.log("[Boîte à idées — SMTP non configuré]", { recipients, subject, data });
    return { ok: true, simulated: true };
  }

  await transport.sendMail({ from, to: recipients.join(", "), subject, html });
  return { ok: true, simulated: false };
}
