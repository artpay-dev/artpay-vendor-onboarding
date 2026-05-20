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
      background: #3E4EEC;
      color: white;
      padding: 32px 20px 28px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 16px 0 0;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.3px;
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
      border-left: 4px solid #3E4EEC;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box strong {
      color: #3E4EEC;
    }
    .button {
      display: inline-block;
      background: #3E4EEC;
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
    <svg width="120" height="35" viewBox="0 0 83 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M0 14.4573C0 11.7908 1.50262 10.2154 4.33347 9.82052L10.0533 9.00287V8.09453C10.0533 6.79126 9.21044 6.00433 7.37358 6.00433C5.65734 6.00433 4.57325 6.67132 4.42357 8.00384H0.449041C0.690274 4.67034 3.42957 2.79224 7.46368 2.79224C11.4978 2.79224 14.1165 4.88244 14.1165 8.15596V18.822H10.2335L10.0824 16.4275C9.1494 18.1243 7.34306 19.2154 5.05426 19.2154C1.92405 19.214 0 17.2145 0 14.4573ZM10.0533 13.094V11.8522L5.83899 12.4285C4.54418 12.6099 3.88152 13.1555 3.88152 14.2466C3.88152 15.3378 4.78396 16.0341 6.32 16.0341C8.36757 16.0341 10.0533 14.8215 10.0533 13.0955V13.094Z" fill="white"/>
        <path d="M15.8809 18.8206V3.18429H19.9455L20.0356 6.21501C20.7883 4.3369 22.5961 2.91223 24.8849 2.91223V6.68893C22.0846 6.68893 20.0966 8.51876 20.0966 11.276V18.8206H15.8823H15.8809Z" fill="white"/>
        <path d="M52.6567 14.4573C52.6567 11.7908 54.3424 10.2154 57.1733 9.82052L62.8931 9.00287V8.09453C62.8931 6.79126 62.0503 6.00433 60.2134 6.00433C58.4972 6.00433 57.4131 6.67132 57.2634 8.00384H53.2889C53.5301 4.67034 56.2694 2.79224 60.3035 2.79224C64.3376 2.79224 66.9563 4.88244 66.9563 8.15596V18.822H63.0733L62.9222 16.4275C61.9892 18.1243 60.1829 19.2154 57.8941 19.2154C54.7624 19.2154 52.6553 17.2159 52.6553 14.4573H52.6567ZM62.8931 13.094V11.8522L58.6788 12.4285C57.384 12.6099 56.7228 13.1555 56.7228 14.2466C56.7228 15.3378 57.6252 16.0341 59.1613 16.0341C61.2089 16.0341 62.8946 14.8215 62.8946 13.0955L62.8931 13.094Z" fill="white"/>
        <path d="M30.4741 13.9425V6.68893H34.5082V3.18576H30.4741V0H26.2598V14.3052C26.2598 17.5173 28.0356 19.214 31.7689 19.214C32.6713 19.214 33.8455 19.0619 34.5692 18.8206V15.5778C34.1478 15.6992 33.4546 15.8805 32.7033 15.8805C31.0772 15.8805 30.4755 15.3042 30.4755 13.941L30.4741 13.9425Z" fill="white"/>
        <path d="M40.2438 23.9721V16.6089C41.0867 18.0628 42.7724 19.2154 44.9711 19.2154C49.1564 19.2154 51.714 15.822 51.714 11.1852V10.7917C51.714 6.1857 49.216 2.79224 45.0612 2.79224C42.5326 2.79224 40.7859 4.18619 40.0636 5.58014L39.943 3.1857H35.999V23.9736H40.2438V23.9721ZM40.0927 10.7903C40.0927 7.73031 41.3875 6.03212 43.765 6.03212C46.1424 6.03212 47.4372 7.72885 47.4372 10.7903V11.1838C47.4372 14.2437 46.1729 15.9405 43.765 15.9405C41.357 15.9405 40.0927 14.2437 40.0927 11.1838V10.7903Z" fill="white"/>
        <path d="M70.9979 24L72.9147 18.6729L67.0146 3.18872H71.4702L75.1424 14.0975L78.6955 3.18872H82.9999L76.4692 20.6665C75.7252 22.6587 73.836 23.9839 71.7201 23.9956L70.9979 24Z" fill="white"/>
      </g>
    </svg>
    <h1>Onboarding Completato!</h1>
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
      I pagamenti delle vendite verranno accreditati automaticamente sul tuo conto Stripe,
      al netto delle commissioni concordate:
    </p>
    <ul>
      <li><strong>Primi 12 mesi:</strong> 6% di commissione</li>
      <li><strong>Dal 13° mese:</strong> 9% di commissione</li>
      <li><strong>Canone mensile:</strong> €29,00 + IVA (dal 4° mese, solo con conferma esplicita)</li>
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
I pagamenti delle vendite verranno accreditati automaticamente sul tuo conto Stripe,
al netto delle commissioni concordate:
- Primi 12 mesi: 6% di commissione
- Dal 13° mese: 9% di commissione
- Canone mensile: €29,00 + IVA (dal 4° mese, solo con conferma esplicita)

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
      background: #3E4EEC;
      color: white;
      padding: 32px 20px 28px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 { margin: 16px 0 0; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #3E4EEC;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .button {
      display: inline-block;
      background: white;
      color: #3E4EEC !important;
      border: 2px solid #3E4EEC;
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
    <svg width="120" height="35" viewBox="0 0 83 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M0 14.4573C0 11.7908 1.50262 10.2154 4.33347 9.82052L10.0533 9.00287V8.09453C10.0533 6.79126 9.21044 6.00433 7.37358 6.00433C5.65734 6.00433 4.57325 6.67132 4.42357 8.00384H0.449041C0.690274 4.67034 3.42957 2.79224 7.46368 2.79224C11.4978 2.79224 14.1165 4.88244 14.1165 8.15596V18.822H10.2335L10.0824 16.4275C9.1494 18.1243 7.34306 19.2154 5.05426 19.2154C1.92405 19.214 0 17.2145 0 14.4573ZM10.0533 13.094V11.8522L5.83899 12.4285C4.54418 12.6099 3.88152 13.1555 3.88152 14.2466C3.88152 15.3378 4.78396 16.0341 6.32 16.0341C8.36757 16.0341 10.0533 14.8215 10.0533 13.0955V13.094Z" fill="white"/>
        <path d="M15.8809 18.8206V3.18429H19.9455L20.0356 6.21501C20.7883 4.3369 22.5961 2.91223 24.8849 2.91223V6.68893C22.0846 6.68893 20.0966 8.51876 20.0966 11.276V18.8206H15.8823H15.8809Z" fill="white"/>
        <path d="M52.6567 14.4573C52.6567 11.7908 54.3424 10.2154 57.1733 9.82052L62.8931 9.00287V8.09453C62.8931 6.79126 62.0503 6.00433 60.2134 6.00433C58.4972 6.00433 57.4131 6.67132 57.2634 8.00384H53.2889C53.5301 4.67034 56.2694 2.79224 60.3035 2.79224C64.3376 2.79224 66.9563 4.88244 66.9563 8.15596V18.822H63.0733L62.9222 16.4275C61.9892 18.1243 60.1829 19.2154 57.8941 19.2154C54.7624 19.2154 52.6553 17.2159 52.6553 14.4573H52.6567ZM62.8931 13.094V11.8522L58.6788 12.4285C57.384 12.6099 56.7228 13.1555 56.7228 14.2466C56.7228 15.3378 57.6252 16.0341 59.1613 16.0341C61.2089 16.0341 62.8946 14.8215 62.8946 13.0955L62.8931 13.094Z" fill="white"/>
        <path d="M30.4741 13.9425V6.68893H34.5082V3.18576H30.4741V0H26.2598V14.3052C26.2598 17.5173 28.0356 19.214 31.7689 19.214C32.6713 19.214 33.8455 19.0619 34.5692 18.8206V15.5778C34.1478 15.6992 33.4546 15.8805 32.7033 15.8805C31.0772 15.8805 30.4755 15.3042 30.4755 13.941L30.4741 13.9425Z" fill="white"/>
        <path d="M40.2438 23.9721V16.6089C41.0867 18.0628 42.7724 19.2154 44.9711 19.2154C49.1564 19.2154 51.714 15.822 51.714 11.1852V10.7917C51.714 6.1857 49.216 2.79224 45.0612 2.79224C42.5326 2.79224 40.7859 4.18619 40.0636 5.58014L39.943 3.1857H35.999V23.9736H40.2438V23.9721ZM40.0927 10.7903C40.0927 7.73031 41.3875 6.03212 43.765 6.03212C46.1424 6.03212 47.4372 7.72885 47.4372 10.7903V11.1838C47.4372 14.2437 46.1729 15.9405 43.765 15.9405C41.357 15.9405 40.0927 14.2437 40.0927 11.1838V10.7903Z" fill="white"/>
        <path d="M70.9979 24L72.9147 18.6729L67.0146 3.18872H71.4702L75.1424 14.0975L78.6955 3.18872H82.9999L76.4692 20.6665C75.7252 22.6587 73.836 23.9839 71.7201 23.9956L70.9979 24Z" fill="white"/>
      </g>
    </svg>
    <h1>Hai salvato la tua registrazione</h1>
  </div>

  <div class="content">
    <p>Ciao <strong>${params.firstName}</strong>,</p>

    <p>
      Hai messo in pausa la registrazione di <strong>${params.businessName}</strong> su artpay.
      Nessun problema — il tuo progresso è stato salvato e puoi riprendere quando vuoi.
    </p>

    <p>Clicca il pulsante qui sotto per riprendere esattamente da dove hai lasciato, inserendo l'email con cui ti sei registrato.</p>

    <div style="text-align: center;">
      <a href="${params.resumeUrl}" class="button">Riprendi la registrazione →</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Oppure vai su <a href="${params.resumeUrl}">${params.resumeUrl}</a> e inserisci la tua email.
    </p>

    <div class="info-box" style="border-left-color: #f59e0b; background: #fffbeb;">
      <strong style="color: #92400e;">Hai bisogno di aiuto?</strong><br/>
      Scrivici a <a href="mailto:${process.env.ADMIN_EMAIL || 'hello@artpay.art'}">${process.env.ADMIN_EMAIL || 'hello@artpay.art'}</a>
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
