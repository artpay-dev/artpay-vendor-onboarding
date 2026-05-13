/**
 * Email Service
 * Gestisce l'invio di email tramite provider configurato (Resend, SendGrid, etc.)
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Team artpay';
const EMAIL_FROM = process.env.EMAIL_FROM || 'hello@artpay.art';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmailWithBrevo(params: SendEmailParams): Promise<void> {
  if (!BREVO_API_KEY) {
    throw new Error('Missing BREVO_API_KEY');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    console.error('Brevo API error:', error);
    throw new Error(`Failed to send email: ${error?.message || response.statusText}`);
  }

  const result = await response.json();
  console.log('Email sent successfully via Brevo:', result.messageId);
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  console.log(`Sending email to ${params.to} via Brevo`);

  try {
    await sendEmailWithBrevo(params);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Template per email di conferma onboarding completato
 */
export function getOnboardingCompletionEmailTemplate(params: {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  wpPassword: string;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Benvenuto su artpay, ${params.businessName}!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .success-icon {
      text-align: center;
      font-size: 48px;
      margin: 20px 0;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box strong {
      color: #667eea;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Onboarding Completato!</h1>
  </div>

  <div class="content">
    <div class="success-icon">✅</div>

    <p>Ciao <strong>${params.firstName} ${params.lastName}</strong>,</p>

    <p>
      Fantastico! Il tuo onboarding su artpay è stato completato con successo.
      Ora puoi iniziare a vendere le tue opere d'arte sulla nostra piattaforma!
    </p>

    <div class="info-box">
      <strong>📋 Riepilogo Account</strong><br/>
      Business Name: <strong>${params.businessName}</strong><br/>
      Pagamenti: <strong>Stripe Connect ✓</strong>
    </div>

    <div class="info-box" style="border-left-color: #10b981;">
      <strong style="color: #10b981;">🔑 Credenziali di accesso Dashboard</strong><br/>
      Email: <strong>${params.email}</strong><br/>
      Password: <strong>${params.wpPassword}</strong><br/>
      <small style="color: #6b7280;">Conserva queste credenziali in un luogo sicuro</small>
    </div>

    <h3>🚀 Prossimi Passi:</h3>
    <ul>
      <li><strong>Accedi alla Dashboard</strong> - Gestisci i tuoi prodotti e ordini</li>
      <li><strong>Aggiungi le tue opere</strong> - Carica foto professionali e descrizioni dettagliate</li>
      <li><strong>Configura la spedizione</strong> - Imposta le zone e i costi di spedizione</li>
      <li><strong>Inizia a vendere!</strong> - Le tue opere saranno visibili ai clienti</li>
    </ul>

    <div style="text-align: center;">
      <a href="${params.dashboardUrl}" class="button">
        Vai alla Dashboard →
      </a>
    </div>

    <h3>💰 Informazioni Pagamenti:</h3>
    <p>
      I pagamenti delle vendite verranno accreditati automaticamente sul tuo conto Stripe
      con cadenza settimanale, al netto delle commissioni concordate:
    </p>
    <ul>
      <li><strong>Primi 6 mesi:</strong> 6% di commissione</li>
      <li><strong>Dopo 6 mesi:</strong> 12% di commissione</li>
    </ul>

    <div class="info-box">
      <strong>💡 Hai bisogno di aiuto?</strong><br/>
      Il nostro team è a tua disposizione: <a href="mailto:${process.env.ADMIN_EMAIL || 'support@artpay.art'}">${process.env.ADMIN_EMAIL || 'support@artpay.art'}</a>
    </div>

    <p>
      Grazie per aver scelto artpay come piattaforma per vendere le tue opere.<br/>
      Siamo entusiasti di averti con noi!
    </p>

    <p>
      Un caro saluto,<br/>
      <strong>Il Team artpay</strong>
    </p>
  </div>

  <div class="footer">
    <p>
      Questa è un'email automatica. Se hai domande, contattaci a
      <a href="mailto:${process.env.ADMIN_EMAIL || 'support@artpay.art'}">${process.env.ADMIN_EMAIL || 'support@artpay.art'}</a>
    </p>
    <p>&copy; ${new Date().getFullYear()} artpay. Tutti i diritti riservati.</p>
  </div>
</body>
</html>
  `;

  const text = `
Benvenuto su artpay, ${params.businessName}!

Ciao ${params.firstName} ${params.lastName},

Fantastico! Il tuo onboarding su artpay è stato completato con successo.
Ora puoi iniziare a vendere le tue opere d'arte sulla nostra piattaforma!

RIEPILOGO ACCOUNT:
- Business Name: ${params.businessName}
- Pagamenti: Stripe Connect ✓

CREDENZIALI DI ACCESSO DASHBOARD:
- Email: ${params.email}
- Password: ${params.wpPassword}
(Conserva queste credenziali in un luogo sicuro)

PROSSIMI PASSI:
1. Accedi alla Dashboard - Gestisci i tuoi prodotti e ordini
2. Aggiungi le tue opere - Carica foto professionali e descrizioni dettagliate
3. Configura la spedizione - Imposta le zone e i costi di spedizione
4. Inizia a vendere! - Le tue opere saranno visibili ai clienti

Vai alla Dashboard: ${params.dashboardUrl}

INFORMAZIONI PAGAMENTI:
I pagamenti delle vendite verranno accreditati automaticamente sul tuo conto Stripe
con cadenza settimanale, al netto delle commissioni concordate:
- Primi 6 mesi: 6% di commissione
- Dopo 6 mesi: 12% di commissione

Hai bisogno di aiuto? Contattaci a ${process.env.ADMIN_EMAIL || 'support@artpay.art'}

Grazie per aver scelto artpay come piattaforma per vendere le tue opere.
Siamo entusiasti di averti con noi!

Un caro saluto,
Il Team artpay

---
Questa è un'email automatica.
© ${new Date().getFullYear()} artpay. Tutti i diritti riservati.
  `;

  return { subject, html, text };
}

/**
 * Template email "salva per dopo"
 */
export function getSaveForLaterEmailTemplate(params: {
  firstName: string;
  businessName: string;
  resumeUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Riprendi la tua registrazione su artpay`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 { margin: 0; font-size: 24px; }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 14px 36px;
      text-decoration: none;
      border-radius: 6px;
      margin: 24px 0;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Hai salvato la tua registrazione</h1>
  </div>

  <div class="content">
    <p>Ciao <strong>${params.firstName}</strong>,</p>

    <p>
      Hai messo in pausa la registrazione di <strong>${params.businessName}</strong> su artpay.
      Nessun problema — il tuo progresso è stato salvato e puoi riprendere quando vuoi.
    </p>

    <p>Clicca il pulsante qui sotto per riprendere esattamente da dove hai lasciato:</p>

    <div style="text-align: center;">
      <a href="${params.resumeUrl}" class="button">Riprendi la registrazione →</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Oppure vai su <a href="${params.resumeUrl}">${params.resumeUrl}</a> e inserisci la tua email.
    </p>

    <div class="info-box" style="border-left-color: #f59e0b; background: #fffbeb;">
      <strong style="color: #92400e;">Hai bisogno di aiuto?</strong><br/>
      Scrivici a <a href="mailto:${process.env.ADMIN_EMAIL || 'support@artpay.art'}">${process.env.ADMIN_EMAIL || 'support@artpay.art'}</a>
    </div>

    <p>
      A presto,<br/>
      <strong>Il Team artpay</strong>
    </p>
  </div>

  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} artpay. Tutti i diritti riservati.</p>
  </div>
</body>
</html>
  `;

  const text = `
Ciao ${params.firstName},

Hai messo in pausa la registrazione di ${params.businessName} su artpay.
Il tuo progresso è stato salvato — puoi riprendere quando vuoi.

Riprendi la registrazione: ${params.resumeUrl}

Hai bisogno di aiuto? Scrivici a ${process.env.ADMIN_EMAIL || 'support@artpay.art'}

A presto,
Il Team artpay
  `;

  return { subject, html, text };
}

/**
 * Invia email "salva per dopo"
 */
export async function sendSaveForLaterEmail(params: {
  email: string;
  firstName: string;
  businessName: string;
}): Promise<void> {
  const resumeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/riprendi`;

  const template = getSaveForLaterEmailTemplate({
    firstName: params.firstName,
    businessName: params.businessName,
    resumeUrl,
  });

  await sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Invia email di conferma completamento onboarding
 */
export async function sendOnboardingCompletionEmail(params: {
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  wpPassword: string;
}): Promise<void> {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.artpay.art/login';

  const emailTemplate = getOnboardingCompletionEmailTemplate({
    ...params,
    dashboardUrl,
  });

  await sendEmail({
    to: params.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });
}
