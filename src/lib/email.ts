/**
 * Email Service
 * Gestisce l'invio di email tramite provider configurato (Resend, SendGrid, etc.)
 */

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@artpay.art';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Invia un'email usando Resend
 */
async function sendEmailWithResend(params: SendEmailParams): Promise<void> {
  if (!EMAIL_API_KEY) {
    throw new Error('Missing EMAIL_API_KEY for Resend');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${EMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    console.error('Resend API error:', error);
    throw new Error(`Failed to send email: ${error?.message || response.statusText}`);
  }

  const result = await response.json();
  console.log('Email sent successfully via Resend:', result.id);
}

/**
 * Invia un'email usando il provider configurato
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  console.log(`Sending email to ${params.to} via ${EMAIL_PROVIDER}`);

  try {
    if (EMAIL_PROVIDER === 'resend') {
      await sendEmailWithResend(params);
    } else {
      throw new Error(`Unsupported email provider: ${EMAIL_PROVIDER}`);
    }
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
  wpUsername: string;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Benvenuto su ArtPay, ${params.businessName}!`;

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
      Fantastico! Il tuo onboarding su ArtPay è stato completato con successo.
      Ora puoi iniziare a vendere le tue opere d'arte sulla nostra piattaforma!
    </p>

    <div class="info-box">
      <strong>📋 Riepilogo Account</strong><br/>
      Business Name: <strong>${params.businessName}</strong><br/>
      Username WordPress: <strong>${params.wpUsername}</strong><br/>
      Pagamenti: <strong>Stripe Connect ✓</strong>
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
      Grazie per aver scelto ArtPay come piattaforma per vendere le tue opere.<br/>
      Siamo entusiasti di averti con noi!
    </p>

    <p>
      Un caro saluto,<br/>
      <strong>Il Team ArtPay</strong>
    </p>
  </div>

  <div class="footer">
    <p>
      Questa è un'email automatica. Se hai domande, contattaci a
      <a href="mailto:${process.env.ADMIN_EMAIL || 'support@artpay.art'}">${process.env.ADMIN_EMAIL || 'support@artpay.art'}</a>
    </p>
    <p>&copy; ${new Date().getFullYear()} ArtPay. Tutti i diritti riservati.</p>
  </div>
</body>
</html>
  `;

  const text = `
Benvenuto su ArtPay, ${params.businessName}!

Ciao ${params.firstName} ${params.lastName},

Fantastico! Il tuo onboarding su ArtPay è stato completato con successo.
Ora puoi iniziare a vendere le tue opere d'arte sulla nostra piattaforma!

RIEPILOGO ACCOUNT:
- Business Name: ${params.businessName}
- Username WordPress: ${params.wpUsername}
- Pagamenti: Stripe Connect ✓

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

Grazie per aver scelto ArtPay come piattaforma per vendere le tue opere.
Siamo entusiasti di averti con noi!

Un caro saluto,
Il Team ArtPay

---
Questa è un'email automatica.
© ${new Date().getFullYear()} ArtPay. Tutti i diritti riservati.
  `;

  return { subject, html, text };
}

/**
 * Invia email di conferma completamento onboarding
 */
export async function sendOnboardingCompletionEmail(params: {
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  wpUsername: string;
}): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-admin`;

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
