/**
 * DocuSign Integration
 * Gestisce la creazione e invio di contratti tramite DocuSign
 *
 * NOTA: Usa dynamic import per evitare problemi con Next.js bundler
 */

import fs from 'fs';
import path from 'path';

// Dynamic import per DocuSign (caricato solo quando serve)
async function getDocuSignSDK() {
  const docusign = await import('docusign-esign');
  return docusign.default as any;
}

// Check env vars
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY;
const DOCUSIGN_BASE_PATH = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';

export interface DocuSignEnvelopeResult {
  envelopeId: string;
  apiClient?: any;
  accountId?: string;
}

export interface CreateEnvelopeParams {
  signerEmail: string;
  signerName: string;
  businessName: string;
  ragioneSociale: string;
  partitaIva: string;
  indirizzo: string;
  iban: string;
  onboardingId: string;
  returnUrl: string;
}

export interface CreateArtistEnvelopeParams {
  signerEmail: string;
  signerName: string;
  businessName: string;
  indirizzo: string;
  subscriptionPlan: 'monthly' | 'annual';
  subscriptionPlanAmount?: number; // centesimi
  onboardingId: string;
  returnUrl: string;
}

export interface GetSigningUrlParams {
  envelopeId: string;
  signerEmail: string;
  signerName: string;
  onboardingId: string;
  returnUrl: string;
}

/**
 * Crea un client DocuSign autenticato
 */
async function getDocuSignClient() {
  const DocuSign = await getDocuSignSDK();
  const apiClient = new DocuSign.ApiClient();
  apiClient.setBasePath(DOCUSIGN_BASE_PATH);
  return { apiClient, DocuSign };
}

/**
 * Autentica tramite JWT
 */
async function authenticateWithJWT() {
  if (!DOCUSIGN_INTEGRATION_KEY || !DOCUSIGN_USER_ID || !DOCUSIGN_PRIVATE_KEY) {
    throw new Error(
      'Missing DocuSign configuration. Please set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, and DOCUSIGN_PRIVATE_KEY'
    );
  }

  const { apiClient, DocuSign } = await getDocuSignClient();

  // Decodifica la private key da base64
  const privateKey = Buffer.from(DOCUSIGN_PRIVATE_KEY, 'base64').toString('utf-8');

  console.log('DocuSign JWT Auth - Integration Key:', DOCUSIGN_INTEGRATION_KEY);
  console.log('DocuSign JWT Auth - User ID:', DOCUSIGN_USER_ID);
  console.log('DocuSign JWT Auth - Private key length:', privateKey.length);
  console.log('DocuSign JWT Auth - Private key starts with:', privateKey.substring(0, 50));
  console.log('DocuSign JWT Auth - Private key ends with:', privateKey.substring(privateKey.length - 50));

  const scopes = ['signature', 'impersonation'];

  try {
    const results = await apiClient.requestJWTUserToken(
      DOCUSIGN_INTEGRATION_KEY,
      DOCUSIGN_USER_ID,
      scopes,
      privateKey,
      3600 // 1 ora
    );

    apiClient.addDefaultHeader('Authorization', `Bearer ${results.body.access_token}`);

    return {
      apiClient,
      DocuSign,
      accessToken: results.body.access_token,
    };
  } catch (error: any) {
    console.error('DocuSign JWT authentication failed - Full error:', JSON.stringify(error, null, 2));
    console.error('Error response body:', JSON.stringify(error?.response?.body, null, 2));
    console.error('Error response data:', JSON.stringify(error?.response?.data, null, 2));
    console.error('Error status:', error?.response?.status);
    console.error('Error message:', error?.message);
    throw new Error(`Failed to authenticate with DocuSign: ${error?.response?.data?.error || error?.message || error}. Check server logs for details.`);
  }
}

function generateContractHTML(params: {
  signerName: string;
  businessName: string;
  ragioneSociale: string;
  partitaIva: string;
  indirizzo: string;
  iban: string;
  signerEmail: string;
}) {
  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const firmaBase64 = fs.readFileSync(path.join(process.cwd(), 'public', 'firma-luca.png')).toString('base64');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.5; color: #111; }
    .header-logo { margin-bottom: 30px; }
    .recipient { margin-bottom: 20px; }
    .meta { margin-bottom: 30px; }
    .subject { font-weight: bold; margin-bottom: 20px; }
    p { margin: 10px 0; }
    ol { margin: 10px 0; padding-left: 20px; }
    ol li { margin-bottom: 8px; }
    ul { margin: 6px 0; padding-left: 20px; }
    ul li { margin-bottom: 4px; }
    .highlight-box { border: 1px solid #ccc; padding: 12px 16px; margin: 10px 0; background: #f9f9f9; }
    .signature-section { margin-top: 60px; }
    .signature-block { display: inline-block; width: 45%; vertical-align: top; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 4px; font-size: 9pt; }
    .footer { margin-top: 40px; font-size: 8pt; color: #555; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>

  <div class="header-logo">
    <svg width="83" height="24" viewBox="0 0 83 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 14.4573C0 11.7908 1.50262 10.2154 4.33347 9.82052L10.0533 9.00287V8.09453C10.0533 6.79126 9.21044 6.00433 7.37358 6.00433C5.65734 6.00433 4.57325 6.67132 4.42357 8.00384H0.449041C0.690274 4.67034 3.42957 2.79224 7.46368 2.79224C11.4978 2.79224 14.1165 4.88244 14.1165 8.15596V18.822H10.2335L10.0824 16.4275C9.1494 18.1243 7.34306 19.2154 5.05426 19.2154C1.92405 19.214 0 17.2145 0 14.4573ZM10.0533 13.094V11.8522L5.83899 12.4285C4.54418 12.6099 3.88152 13.1555 3.88152 14.2466C3.88152 15.3378 4.78396 16.0341 6.32 16.0341C8.36757 16.0341 10.0533 14.8215 10.0533 13.0955V13.094Z" fill="#3E4EEC"/>
      <path d="M15.8809 18.8206V3.18429H19.9455L20.0356 6.21501C20.7883 4.3369 22.5961 2.91223 24.8849 2.91223V6.68893C22.0846 6.68893 20.0966 8.51876 20.0966 11.276V18.8206H15.8823H15.8809Z" fill="#3E4EEC"/>
      <path d="M52.6567 14.4573C52.6567 11.7908 54.3424 10.2154 57.1733 9.82052L62.8931 9.00287V8.09453C62.8931 6.79126 62.0503 6.00433 60.2134 6.00433C58.4972 6.00433 57.4131 6.67132 57.2634 8.00384H53.2889C53.5301 4.67034 56.2694 2.79224 60.3035 2.79224C64.3376 2.79224 66.9563 4.88244 66.9563 8.15596V18.822H63.0733L62.9222 16.4275C61.9892 18.1243 60.1829 19.2154 57.8941 19.2154C54.7624 19.2154 52.6553 17.2159 52.6553 14.4573H52.6567ZM62.8931 13.094V11.8522L58.6788 12.4285C57.384 12.6099 56.7228 13.1555 56.7228 14.2466C56.7228 15.3378 57.6252 16.0341 59.1613 16.0341C61.2089 16.0341 62.8946 14.8215 62.8946 13.0955L62.8931 13.094Z" fill="#3E4EEC"/>
      <path d="M30.4741 13.9425V6.68893H34.5082V3.18576H30.4741V0H26.2598V14.3052C26.2598 17.5173 28.0356 19.214 31.7689 19.214C32.6713 19.214 33.8455 19.0619 34.5692 18.8206V15.5778C34.1478 15.6992 33.4546 15.8805 32.7033 15.8805C31.0772 15.8805 30.4755 15.3042 30.4755 13.941L30.4741 13.9425Z" fill="#3E4EEC"/>
      <path d="M40.2438 23.9721V16.6089C41.0867 18.0628 42.7724 19.2154 44.9711 19.2154C49.1564 19.2154 51.714 15.822 51.714 11.1852V10.7917C51.714 6.1857 49.216 2.79224 45.0612 2.79224C42.5326 2.79224 40.7859 4.18619 40.0636 5.58014L39.943 3.1857H35.999V23.9736H40.2438V23.9721ZM40.0927 10.7903C40.0927 7.73031 41.3875 6.03212 43.765 6.03212C46.1424 6.03212 47.4372 7.72885 47.4372 10.7903V11.1838C47.4372 14.2437 46.1729 15.9405 43.765 15.9405C41.357 15.9405 40.0927 14.2437 40.0927 11.1838V10.7903Z" fill="#3E4EEC"/>
      <path d="M70.9979 24L72.9147 18.6729L67.0146 3.18872H71.4702L75.1424 14.0975L78.6955 3.18872H82.9999L76.4692 20.6665C75.7252 22.6587 73.836 23.9839 71.7201 23.9956L70.9979 24Z" fill="#3E4EEC"/>
    </svg>
  </div>

  <div class="recipient">
    Spett.le<br/>
    <strong>${params.ragioneSociale}</strong><br/>
    ${params.indirizzo}
  </div>

  <div class="meta">
    A mezzo posta elettronica<br/>
    Cagliari, ${today}
  </div>

  <div class="subject">Oggetto: Accordo di Collaborazione Commerciale</div>

  <p>Egregi Signori, facendo seguito alle conversazioni intercorse e premesso che:</p>

  <p>(a) la scrivente <strong>artpay S.r.l.</strong>, con sede legale in Cagliari, Via Carloforte 60, C.F. e P.IVA 04065160923 (<strong>"artpay"</strong>) è titolare del sito internet www.artpay.art e www.gallerie.artpay.art (il <strong>"Sito"</strong>);</p>

  <p>(b) il Sito è dedicato a gallerie che vogliono facilitare la vendita diretta delle proprie opere d'arte, rivolgendosi a un vasto pubblico di collezionisti e consentendo a tutti gli interessati di avvalersi di soluzioni di pagamento rateale e dilazionato, ivi incluso il Buy Now Pay Later (BNPL), nonché di altre soluzioni di finanziamento offerte o reclamizzate sul Sito da istituzioni finanziarie e operatori di pagamento partner di artpay (i <strong>"Finanziatori"</strong>);</p>

  <p>(c) la Vostra galleria <strong>${params.businessName}</strong>, con sede in <strong>${params.indirizzo}</strong>, C.F. e P.IVA <strong>${params.partitaIva}</strong>, IBAN <strong>${params.iban}</strong> (la <strong>"Galleria"</strong>), ha manifestato interesse all'iniziativa;</p>

  <p>(d) la Galleria ha dichiarato che non sussistono condizioni di incompatibilità ai sensi di disposizioni di legge e contrattuali alla sottoscrizione del presente accordo di collaborazione commerciale (l'<strong>"Accordo Commerciale"</strong>);</p>

  <p>tutto ciò premesso, artpay e la Galleria (congiuntamente le <strong>"Parti"</strong> e ciascuna anche una <strong>"Parte"</strong>) convengono quanto segue.</p>

  <ol>
    <li>
      <strong>Oggetto:</strong> Con la sottoscrizione del presente Accordo Commerciale, artpay concede alla Galleria, che accetta, il diritto di utilizzare il Servizio per un massimo di 100 (cento) opere d'arte, intendendosi per <strong>"Servizio"</strong> la gestione, la promozione e la vendita delle medesime attraverso il Sito, ivi incluso il servizio artpay FAST (il <strong>"Servizio"</strong>). Ulteriori termini e condizioni del Servizio sono indicati nei termini e condizioni generali "Gallerie e clienti professionali" (le <strong>"GTC"</strong>) e negli altri correlati documenti presenti sul Sito che, insieme al presente Accordo Commerciale, rappresentano l'unica fonte contrattuale tra artpay e la Galleria e prevalgono su eventuali diversi termini e condizioni commerciali e contrattuali contenuti su documenti di provenienza della Galleria.
    </li>

    <li>
      <strong>Natura dell'Accordo Commerciale:</strong> Con riferimento agli scopi dell'Accordo Commerciale, nessuna delle Parti potrà essere considerata, per alcun motivo né ad alcun titolo, agente, socia, succursale o dipendenza dell'altra.
    </li>

    <li>
      <strong>Risultati economici:</strong> artpay informa la Galleria che il Sito è meramente un veicolo di accesso al Servizio per la promozione e vendita di opere d'arte e non può garantire che il Servizio apporti in ogni caso benefici economici alla Galleria.
    </li>

    <li>
      <strong>Modalità operative della collaborazione:</strong> Le opere d'arte della Galleria gestite tramite il Servizio potranno essere acquistate dagli utenti con le seguenti modalità:
      <ul>
        <li><strong>Acquisto immediato:</strong> cliccando sul box "Completa l'acquisto dell'opera", l'utente potrà pagare il prezzo dell'opera tramite bonifico bancario, carte di credito o debito autorizzate, wallet digitali (es. Apple Pay, Google Pay) o altri sistemi di pagamento digitale previsti sul Sito;</li>
        <li><strong>Acquisto rateale tramite Buy Now Pay Later (BNPL):</strong> cliccando sul box "Paga a rate" o equivalente, l'utente potrà accedere alle soluzioni di pagamento rateale offerte dai Finanziatori partner di artpay. Le condizioni economiche e contrattuali del piano rateale sono definite esclusivamente dal Finanziatore prescelto dall'utente e non coinvolgono artpay né la Galleria;</li>
        <li><strong>Prenotazione con accesso al credito:</strong> cliccando sul box "Prenota l'opera", l'utente potrà verificare le condizioni del prestito al consumo offerto dai Finanziatori e, contestualmente, bloccare l'opera garantendosi un'esclusiva di 7 (sette) giorni. La prenotazione implica il blocco della carta di credito dell'utente per il 5% (cinque per cento) del valore dell'opera a garanzia della serietà degli intenti.</li>
      </ul>
      Al fine di evitare sovrapposizioni tra potenziali acquirenti, la Galleria si impegna a non offrire in vendita, vendere e/o accettare prenotazioni o offerte da terzi — tramite qualsiasi canale — aventi ad oggetto le opere d'arte gestite tramite il Servizio e prenotate dagli utenti, per la durata di 7 (sette) giorni dalla data di prenotazione sul Sito.
    </li>

    <li>
      <strong>Garanzie:</strong> Le opere d'arte dovranno essere accompagnate dalla necessaria documentazione attestante l'autenticità o almeno la probabile attribuzione e la provenienza dell'opera. La Galleria si impegna a gestire tramite il Servizio esclusivamente opere d'arte autentiche, di provenienza legittima, delle quali abbia il diritto di disporre e/o l'autorizzazione alla vendita. La Galleria si impegna a manlevare e tenere indenne artpay da ogni perdita, danno o responsabilità derivante dalla violazione del presente articolo.
    </li>

    <li>
      <strong>Tariffe, piano di abbonamento e modalità di pagamento:</strong> Per l'utilizzo della piattaforma artpay e del servizio artpay FAST, esclusivamente per le Gallerie partecipanti all'edizione 2026 della fiera The Phair di Torino, si prevede il seguente piano tariffario:
      <div class="highlight-box">
        <ul>
          <li><strong>Periodo gratuito di prova:</strong> 3 (tre) mesi a partire dalla data di attivazione.</li>
          <li><strong>Comunicazione al secondo mese:</strong> artpay invierà alla Galleria una comunicazione riepilogativa via email con le condizioni del piano successivo.</li>
          <li><strong>Conferma esplicita per il piano a pagamento:</strong> il passaggio al piano a pagamento non avviene automaticamente. In assenza di conferma entro 30 giorni dalla ricezione della comunicazione, l'account rimarrà attivo in sola lettura per ulteriori 30 giorni, decorsi i quali artpay procederà alla disattivazione.</li>
          <li>In caso di conferma: <strong>Canone mensile €29,00 + IVA</strong> — <strong>Commissione 6%</strong> per i primi 12 mesi dalla data di attivazione.</li>
          <li>Al termine del periodo promozionale: commissione standard <strong>9%</strong>.</li>
        </ul>
      </div>
    </li>

    <li>
      <strong>Compenso percentuale sulle opere vendute:</strong> La Galleria riconoscerà ad artpay un importo percentuale sul prezzo finale (escluso il costo di spedizione) pari al <strong>9%</strong>, ridotto al <strong>6%</strong> per i primi 12 (dodici) mesi per le Gallerie partecipanti alla fiera The Phair di Torino 2026. Tale importo sarà prelevato direttamente da artpay sull'importo versato dall'utente nel wallet del sistema di pagamento digitale, decorso il termine di ripensamento concesso all'utente per esercitare il diritto di recesso.
    </li>

    <li>
      <strong>DAC7 – Obblighi di rendicontazione fiscale:</strong> Ove ricorrano i requisiti previsti dal D. Lgs. 32/2023, la Galleria si impegna a compilare in maniera veritiera, completa e corretta il formulario DAC7 e a restituirlo ad artpay entro i termini di legge.
    </li>

    <li>
      <strong>Rapporti con i Finanziatori:</strong> La Galleria si impegna a non effettuare transazioni con gli utenti per il tramite dei Finanziatori al di fuori del Sito, per tutta la durata del presente Accordo Commerciale.
    </li>

    <li>
      <strong>Durata dell'Accordo Commerciale:</strong> Il presente Accordo Commerciale ha durata annuale dalla sua sottoscrizione. Alla scadenza, si rinnoverà automaticamente per ulteriori periodi annuali, salvo disdetta a mezzo PEC almeno 60 (sessanta) giorni prima di ciascuna scadenza.
    </li>

    <li>
      <strong>Cessione dell'Accordo Commerciale:</strong> La Galleria non potrà cedere il presente Accordo Commerciale e/o i diritti e gli obblighi derivanti dallo stesso a terzi senza il preventivo consenso scritto di artpay. artpay potrà cedere il presente Accordo Commerciale ad altre società del proprio gruppo senza preavviso, oppure a terzi con comunicazione alla Galleria via email o PEC con preavviso di almeno 30 (trenta) giorni.
    </li>

    <li>
      <strong>Riservatezza:</strong> Ciascuna Parte si impegna a tenere strettamente confidenziale il presente Accordo Commerciale e tutte le informazioni riservate acquisite in esecuzione dello stesso, astenendosi dal divulgarle a terzi senza il previo consenso scritto dell'altra Parte.
    </li>

    <li>
      <strong>Privacy e protezione dei dati personali:</strong> Le Parti confermano che il trattamento dei rispettivi dati personali avverrà in conformità al Regolamento Europeo (UE) 2016/679 (GDPR) e alla normativa nazionale applicabile, secondo le informative presenti nel Sito.
    </li>

    <li>
      <strong>Informativa reciproca:</strong> Le Parti si impegnano a scambiarsi in buona fede e trasparenza tutte le informazioni necessarie ai fini della migliore riuscita della collaborazione.
    </li>

    <li>
      <strong>Foro competente e legge applicabile:</strong> Il presente Accordo Commerciale è regolato dalla legge italiana. Per ogni eventuale controversia, le Parti convengono che sarà esclusivamente competente il <strong>Foro di Torino</strong>.
    </li>
  </ol>

  <p>Qualora concordiate con quanto precede, Vi saremmo grati se poteste restituirci copia del presente Accordo Commerciale da Voi sottoscritta in segno di piena e integrale accettazione.</p>

  <p>Cordiali saluti.</p>

  <div class="signature-section">
    <table style="width: 100%; margin-top: 40px;">
      <tr>
        <td style="width: 48%; vertical-align: top;">
          <strong>artpay S.r.l.</strong>
          <div style="margin-top: 8px;">
            <img src="data:image/png;base64,${firmaBase64}" alt="Firma artpay S.r.l." style="height: 52px; width: auto;" />
          </div>
          <div class="signature-line" style="margin-top: 0;">Firma artpay S.r.l.</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top;">
          <strong>Per accettazione — ${params.ragioneSociale}</strong><br/>
          <em>${params.signerName}</em>
          <div class="signature-line">
            <span style="color: white; font-size: 1px;">/sn1/</span>
            <span style="color: white; font-size: 1px;">/ds1/</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">
    artpay S.r.l. – Sede legale: Via Carloforte 60, 09123 Cagliari – P.IVA 04065160923 – hello@artpay.art – www.gallerie.artpay.art
  </div>

</body>
</html>
  `;
}

function generateArtistContractHTML(params: {
  signerName: string;
  businessName: string;
  indirizzo: string;
  signerEmail: string;
  subscriptionPlan: 'monthly' | 'annual';
  subscriptionPlanAmount?: number;
}) {
  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const firmaBase64 = fs.readFileSync(path.join(process.cwd(), 'public', 'firma-luca.png')).toString('base64');

  const formattedAmount = params.subscriptionPlanAmount
    ? (params.subscriptionPlanAmount / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
    : null;

  const planLabel = params.subscriptionPlan === 'annual'
    ? `Annuale${formattedAmount ? ` — ${formattedAmount}/anno + IVA` : ''}`
    : `Mensile${formattedAmount ? ` — ${formattedAmount}/mese + IVA` : ''}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.5; color: #111; }
    .header-logo { margin-bottom: 30px; }
    .recipient { margin-bottom: 20px; }
    .meta { margin-bottom: 30px; }
    .subject { font-weight: bold; margin-bottom: 20px; }
    p { margin: 10px 0; }
    ol { margin: 10px 0; padding-left: 20px; }
    ol li { margin-bottom: 8px; }
    ul { margin: 6px 0; padding-left: 20px; }
    ul li { margin-bottom: 4px; }
    .highlight-box { border: 1px solid #ccc; padding: 12px 16px; margin: 10px 0; background: #f9f9f9; }
    .signature-section { margin-top: 60px; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 4px; font-size: 9pt; }
    .footer { margin-top: 40px; font-size: 8pt; color: #555; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>

  <div class="header-logo">
    <svg width="83" height="24" viewBox="0 0 83 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 14.4573C0 11.7908 1.50262 10.2154 4.33347 9.82052L10.0533 9.00287V8.09453C10.0533 6.79126 9.21044 6.00433 7.37358 6.00433C5.65734 6.00433 4.57325 6.67132 4.42357 8.00384H0.449041C0.690274 4.67034 3.42957 2.79224 7.46368 2.79224C11.4978 2.79224 14.1165 4.88244 14.1165 8.15596V18.822H10.2335L10.0824 16.4275C9.1494 18.1243 7.34306 19.2154 5.05426 19.2154C1.92405 19.214 0 17.2145 0 14.4573ZM10.0533 13.094V11.8522L5.83899 12.4285C4.54418 12.6099 3.88152 13.1555 3.88152 14.2466C3.88152 15.3378 4.78396 16.0341 6.32 16.0341C8.36757 16.0341 10.0533 14.8215 10.0533 13.0955V13.094Z" fill="#3E4EEC"/>
      <path d="M15.8809 18.8206V3.18429H19.9455L20.0356 6.21501C20.7883 4.3369 22.5961 2.91223 24.8849 2.91223V6.68893C22.0846 6.68893 20.0966 8.51876 20.0966 11.276V18.8206H15.8823H15.8809Z" fill="#3E4EEC"/>
      <path d="M52.6567 14.4573C52.6567 11.7908 54.3424 10.2154 57.1733 9.82052L62.8931 9.00287V8.09453C62.8931 6.79126 62.0503 6.00433 60.2134 6.00433C58.4972 6.00433 57.4131 6.67132 57.2634 8.00384H53.2889C53.5301 4.67034 56.2694 2.79224 60.3035 2.79224C64.3376 2.79224 66.9563 4.88244 66.9563 8.15596V18.822H63.0733L62.9222 16.4275C61.9892 18.1243 60.1829 19.2154 57.8941 19.2154C54.7624 19.2154 52.6553 17.2159 52.6553 14.4573H52.6567ZM62.8931 13.094V11.8522L58.6788 12.4285C57.384 12.6099 56.7228 13.1555 56.7228 14.2466C56.7228 15.3378 57.6252 16.0341 59.1613 16.0341C61.2089 16.0341 62.8946 14.8215 62.8946 13.0955L62.8931 13.094Z" fill="#3E4EEC"/>
      <path d="M30.4741 13.9425V6.68893H34.5082V3.18576H30.4741V0H26.2598V14.3052C26.2598 17.5173 28.0356 19.214 31.7689 19.214C32.6713 19.214 33.8455 19.0619 34.5692 18.8206V15.5778C34.1478 15.6992 33.4546 15.8805 32.7033 15.8805C31.0772 15.8805 30.4755 15.3042 30.4755 13.941L30.4741 13.9425Z" fill="#3E4EEC"/>
      <path d="M40.2438 23.9721V16.6089C41.0867 18.0628 42.7724 19.2154 44.9711 19.2154C49.1564 19.2154 51.714 15.822 51.714 11.1852V10.7917C51.714 6.1857 49.216 2.79224 45.0612 2.79224C42.5326 2.79224 40.7859 4.18619 40.0636 5.58014L39.943 3.1857H35.999V23.9736H40.2438V23.9721ZM40.0927 10.7903C40.0927 7.73031 41.3875 6.03212 43.765 6.03212C46.1424 6.03212 47.4372 7.72885 47.4372 10.7903V11.1838C47.4372 14.2437 46.1729 15.9405 43.765 15.9405C41.357 15.9405 40.0927 14.2437 40.0927 11.1838V10.7903Z" fill="#3E4EEC"/>
      <path d="M70.9979 24L72.9147 18.6729L67.0146 3.18872H71.4702L75.1424 14.0975L78.6955 3.18872H82.9999L76.4692 20.6665C75.7252 22.6587 73.836 23.9839 71.7201 23.9956L70.9979 24Z" fill="#3E4EEC"/>
    </svg>
  </div>

  <div class="recipient">
    Spett.le<br/>
    <strong>${params.signerName}</strong><br/>
    ${params.indirizzo}
  </div>

  <div class="meta">
    A mezzo posta elettronica<br/>
    Cagliari, ${today}
  </div>

  <div class="subject">Oggetto: Accordo di Collaborazione — Artista artpay</div>

  <p>Gentile ${params.signerName}, facendo seguito alle conversazioni intercorse e premesso che:</p>

  <p>(a) la scrivente <strong>artpay S.r.l.</strong>, con sede legale in Cagliari, Via Carloforte 60, C.F. e P.IVA 04065160923 (<strong>"artpay"</strong>) è titolare del sito internet www.artpay.art (il <strong>"Sito"</strong>);</p>

  <p>(b) il Sito è dedicato ad artisti che desiderano promuovere e vendere le proprie opere d'arte, rivolgendosi a un vasto pubblico di collezionisti e consentendo l'utilizzo di soluzioni di pagamento rateale, dilazionato e Buy Now Pay Later (BNPL) offerte da partner finanziari di artpay (i <strong>"Finanziatori"</strong>);</p>

  <p>(c) l'Artista <strong>${params.businessName || params.signerName}</strong>, residente/con sede in <strong>${params.indirizzo}</strong> (<strong>"l'Artista"</strong>), ha manifestato interesse all'iniziativa;</p>

  <p>(d) l'Artista ha dichiarato che non sussistono condizioni di incompatibilità alla sottoscrizione del presente accordo di collaborazione (l'<strong>"Accordo"</strong>);</p>

  <p>tutto ciò premesso, artpay e l'Artista (congiuntamente le <strong>"Parti"</strong>) convengono quanto segue.</p>

  <ol>
    <li>
      <strong>Oggetto:</strong> Con la sottoscrizione del presente Accordo, artpay concede all'Artista il diritto di utilizzare la piattaforma artpay per la gestione, promozione e vendita delle proprie opere d'arte attraverso il Sito (<strong>"Servizio"</strong>). Ulteriori termini e condizioni sono indicati nelle condizioni generali pubblicate sul Sito, che insieme al presente Accordo costituiscono l'unica fonte contrattuale tra le Parti.
    </li>

    <li>
      <strong>Piano di abbonamento selezionato:</strong>
      <div class="highlight-box">
        <ul>
          <li><strong>Piano:</strong> ${planLabel}</li>
          <li>Il piano è attivabile tramite Stripe nella fase successiva alla firma del presente Accordo.</li>
          <li>L'abbonamento si rinnova automaticamente salvo disdetta almeno 7 giorni prima della scadenza del periodo in corso.</li>
          <li>L'Artista può gestire, modificare o cancellare il proprio abbonamento in qualsiasi momento dall'area riservata.</li>
        </ul>
      </div>
    </li>

    <li>
      <strong>Commissione sulle vendite:</strong> Per ogni opera venduta tramite il Servizio, artpay trattiene una commissione del <strong>18%</strong> sul prezzo finale (IVA esclusa, spedizione esclusa), ridotta al <strong>15%</strong> per i primi 12 (dodici) mesi dalla data di attivazione dell'account. L'importo viene prelevato direttamente sull'importo versato dall'acquirente, decorso il termine di ripensamento concesso dal Codice del Consumo.
    </li>

    <li>
      <strong>Natura dell'Accordo:</strong> Nessuna delle Parti potrà essere considerata, per alcun motivo, agente, socia, succursale o dipendente dell'altra. L'Artista opera in piena autonomia e mantiene la titolarità esclusiva delle proprie opere.
    </li>

    <li>
      <strong>Modalità operative:</strong> Le opere dell'Artista pubblicate sul Sito potranno essere acquistate dagli utenti tramite:
      <ul>
        <li><strong>Acquisto immediato</strong> con carta di credito/debito, wallet digitali o bonifico bancario;</li>
        <li><strong>Acquisto rateale BNPL</strong> tramite i Finanziatori partner di artpay, le cui condizioni sono definite esclusivamente dai medesimi;</li>
        <li><strong>Prenotazione con acconto</strong>: blocco dell'opera per 7 giorni mediante addebito del 5% del valore sull'acquirente a garanzia della serietà dell'offerta.</li>
      </ul>
      Durante il periodo di prenotazione, l'Artista si impegna a non offrire, vendere o accettare offerte da terzi relativamente all'opera prenotata.
    </li>

    <li>
      <strong>Garanzie dell'Artista:</strong> L'Artista garantisce che le opere pubblicate sul Sito sono autentiche, originali, di sua esclusiva creazione e che egli ha piena disponibilità e titolarità per la loro vendita. L'Artista si impegna a manlevare e tenere indenne artpay da ogni perdita, danno o responsabilità derivante dalla violazione di questa garanzia.
    </li>

    <li>
      <strong>Durata:</strong> Il presente Accordo ha durata annuale dalla sua sottoscrizione e si rinnova automaticamente per ulteriori periodi annuali, salvo disdetta inviata a mezzo email a hello@artpay.art almeno 30 (trenta) giorni prima di ciascuna scadenza.
    </li>

    <li>
      <strong>DAC7 – Obblighi fiscali:</strong> Ove ricorrano i requisiti previsti dal D. Lgs. 32/2023, l'Artista si impegna a compilare in maniera veritiera e completa il formulario DAC7 e a restituirlo ad artpay entro i termini di legge.
    </li>

    <li>
      <strong>Riservatezza:</strong> Ciascuna Parte si impegna a mantenere strettamente riservate le informazioni acquisite in esecuzione del presente Accordo, astenendosi dal divulgarle a terzi senza il previo consenso scritto dell'altra Parte.
    </li>

    <li>
      <strong>Privacy e GDPR:</strong> Le Parti confermano che il trattamento dei dati personali avverrà in conformità al Regolamento (UE) 2016/679 (GDPR) e alla normativa nazionale applicabile, secondo le informative presenti nel Sito.
    </li>

    <li>
      <strong>Foro competente e legge applicabile:</strong> Il presente Accordo è regolato dalla legge italiana. Per ogni controversia, le Parti concordano la competenza esclusiva del <strong>Foro di Torino</strong>.
    </li>
  </ol>

  <p>Qualora concordiate con quanto precede, Vi chiediamo di restituirci copia del presente Accordo sottoscritta in segno di piena e integrale accettazione.</p>

  <p>Cordiali saluti.</p>

  <div class="signature-section">
    <table style="width: 100%; margin-top: 40px;">
      <tr>
        <td style="width: 48%; vertical-align: top;">
          <strong>artpay S.r.l.</strong>
          <div style="margin-top: 8px;">
            <img src="data:image/png;base64,${firmaBase64}" alt="Firma artpay S.r.l." style="height: 52px; width: auto;" />
          </div>
          <div class="signature-line" style="margin-top: 0;">Firma artpay S.r.l.</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top;">
          <strong>Per accettazione — ${params.signerName}</strong>
          <div class="signature-line">
            <span style="color: white; font-size: 1px;">/sn1/</span>
            <span style="color: white; font-size: 1px;">/ds1/</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">
    artpay S.r.l. – Sede legale: Via Carloforte 60, 09123 Cagliari – P.IVA 04065160923 – hello@artpay.art – www.artpay.art
  </div>

</body>
</html>
  `;
}

/**
 * Crea un envelope con il contratto artista
 */
export async function createArtistContractEnvelope(
  params: CreateArtistEnvelopeParams
): Promise<DocuSignEnvelopeResult> {
  if (!DOCUSIGN_ACCOUNT_ID) {
    throw new Error('Missing DOCUSIGN_ACCOUNT_ID');
  }

  const { apiClient, DocuSign } = await authenticateWithJWT();

  const contractHTML = generateArtistContractHTML({
    signerName: params.signerName,
    businessName: params.businessName,
    indirizzo: params.indirizzo,
    signerEmail: params.signerEmail,
    subscriptionPlan: params.subscriptionPlan,
    subscriptionPlanAmount: params.subscriptionPlanAmount,
  });

  const documentBase64 = Buffer.from(contractHTML).toString('base64');

  const document = DocuSign.Document.constructFromObject({
    documentBase64,
    name: 'Accordo Artista artpay',
    fileExtension: 'html',
    documentId: '1',
  });

  const signer = DocuSign.Signer.constructFromObject({
    email: params.signerEmail,
    name: params.signerName,
    recipientId: '1',
    routingOrder: '1',
    clientUserId: params.onboardingId,
  });

  signer.tabs = DocuSign.Tabs.constructFromObject({
    signHereTabs: [
      DocuSign.SignHere.constructFromObject({
        documentId: '1',
        recipientId: '1',
        tabLabel: 'SignHereTab',
        anchorString: '/sn1/',
        anchorUnits: 'pixels',
        anchorXOffset: '0',
        anchorYOffset: '0',
      }),
    ],
    dateSignedTabs: [
      DocuSign.DateSigned.constructFromObject({
        documentId: '1',
        recipientId: '1',
        tabLabel: 'DateSignedTab',
        anchorString: '/ds1/',
        anchorUnits: 'pixels',
        anchorXOffset: '0',
        anchorYOffset: '20',
      }),
    ],
  });

  const envelopeConfig: any = {
    emailSubject: `Accordo Artista artpay — ${params.signerName}`,
    documents: [document],
    recipients: DocuSign.Recipients.constructFromObject({ signers: [signer] }),
    status: 'sent',
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/docusign`;
  if (webhookUrl.startsWith('https://')) {
    envelopeConfig.eventNotification = {
      url: webhookUrl,
      requireAcknowledgment: true,
      loggingEnabled: true,
      includeDocuments: false,
      envelopeEvents: [
        { envelopeEventStatusCode: 'completed' },
        { envelopeEventStatusCode: 'declined' },
        { envelopeEventStatusCode: 'voided' },
      ],
      recipientEvents: [
        { recipientEventStatusCode: 'Completed' },
        { recipientEventStatusCode: 'Declined' },
      ],
    };
  }

  const envelopeDefinition = DocuSign.EnvelopeDefinition.constructFromObject(envelopeConfig);
  const envelopesApi = new DocuSign.EnvelopesApi(apiClient);

  const results = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, { envelopeDefinition });

  return {
    envelopeId: results.envelopeId!,
    apiClient,
    accountId: DOCUSIGN_ACCOUNT_ID,
  };
}

/**
 * Crea un envelope con il contratto vendor
 */
export async function createVendorContractEnvelope(
  params: CreateEnvelopeParams
): Promise<DocuSignEnvelopeResult> {
  if (!DOCUSIGN_ACCOUNT_ID) {
    throw new Error('Missing DOCUSIGN_ACCOUNT_ID');
  }

  console.log('Creating envelope for:', params);

  const { apiClient, DocuSign } = await authenticateWithJWT();

  console.log('JWT Auth successful, creating document...');

  // Genera HTML del contratto
  const contractHTML = generateContractHTML({
    signerName: params.signerName,
    businessName: params.businessName,
    ragioneSociale: params.ragioneSociale,
    partitaIva: params.partitaIva,
    indirizzo: params.indirizzo,
    iban: params.iban,
    signerEmail: params.signerEmail,
  });

  // Converti HTML in base64
  const documentBase64 = Buffer.from(contractHTML).toString('base64');

  console.log('Document created, base64 length:', documentBase64.length);

  // Crea il documento
  const document = DocuSign.Document.constructFromObject({
    documentBase64,
    name: 'Contratto Vendor artpay',
    fileExtension: 'html',
    documentId: '1',
  });

  // Definisci il firmatario
  const signer = DocuSign.Signer.constructFromObject({
    email: params.signerEmail,
    name: params.signerName,
    recipientId: '1',
    routingOrder: '1',
    clientUserId: params.onboardingId, // Per embedded signing
  });

  // Aggiungi i tab di firma tramite anchor string (posizione definita nell'HTML)
  signer.tabs = DocuSign.Tabs.constructFromObject({
    signHereTabs: [
      DocuSign.SignHere.constructFromObject({
        documentId: '1',
        recipientId: '1',
        tabLabel: 'SignHereTab',
        anchorString: '/sn1/',
        anchorUnits: 'pixels',
        anchorXOffset: '0',
        anchorYOffset: '0',
      }),
    ],
    dateSignedTabs: [
      DocuSign.DateSigned.constructFromObject({
        documentId: '1',
        recipientId: '1',
        tabLabel: 'DateSignedTab',
        anchorString: '/ds1/',
        anchorUnits: 'pixels',
        anchorXOffset: '0',
        anchorYOffset: '20',
      }),
    ],
  });

  // Crea l'envelope
  const envelopeConfig: any = {
    emailSubject: `Contratto Vendor artpay - ${params.businessName}`,
    documents: [document],
    recipients: DocuSign.Recipients.constructFromObject({
      signers: [signer],
    }),
    status: 'sent',
  };

  // Aggiungi webhook solo se l'URL è HTTPS (produzione)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/docusign`;
  if (webhookUrl.startsWith('https://')) {
    console.log('Adding webhook notification to envelope');
    envelopeConfig.eventNotification = {
      url: webhookUrl,
      requireAcknowledgment: true,
      loggingEnabled: true,
      includeDocuments: false,
      envelopeEvents: [
        { envelopeEventStatusCode: 'completed' },
        { envelopeEventStatusCode: 'declined' },
        { envelopeEventStatusCode: 'voided' },
      ],
      recipientEvents: [
        { recipientEventStatusCode: 'Completed' },
        { recipientEventStatusCode: 'Declined' },
      ],
    };
  } else {
    console.log('Skipping webhook (HTTPS required) - webhook URL:', webhookUrl);
  }

  const envelopeDefinition = DocuSign.EnvelopeDefinition.constructFromObject(envelopeConfig);

  const envelopesApi = new DocuSign.EnvelopesApi(apiClient);

  console.log('Calling DocuSign createEnvelope API...');
  console.log('Account ID:', DOCUSIGN_ACCOUNT_ID);

  try {
    const results = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, {
      envelopeDefinition,
    });

    console.log('Envelope created successfully! Envelope ID:', results.envelopeId);

    return {
      envelopeId: results.envelopeId!,
      apiClient,
      accountId: DOCUSIGN_ACCOUNT_ID,
    };
  } catch (error: any) {
    console.error('Failed to create envelope:', error);
    console.error('Error response:', JSON.stringify(error?.response?.body, null, 2));
    console.error('Error data:', JSON.stringify(error?.response?.data, null, 2));
    throw error;
  }
}

/**
 * Genera l'URL per embedded signing
 */
export async function getEmbeddedSigningUrl(
  params: GetSigningUrlParams
): Promise<string> {
  if (!DOCUSIGN_ACCOUNT_ID) {
    throw new Error('Missing DOCUSIGN_ACCOUNT_ID');
  }

  console.log('Getting embedded signing URL for envelope:', params.envelopeId);

  const { apiClient, DocuSign } = await authenticateWithJWT();

  const viewRequest = DocuSign.RecipientViewRequest.constructFromObject({
    returnUrl: params.returnUrl,
    authenticationMethod: 'none',
    email: params.signerEmail,
    userName: params.signerName,
    clientUserId: params.onboardingId,
  });

  console.log('View request:', viewRequest);

  const envelopesApi = new DocuSign.EnvelopesApi(apiClient);

  try {
    const results = await envelopesApi.createRecipientView(
      DOCUSIGN_ACCOUNT_ID,
      params.envelopeId,
      { recipientViewRequest: viewRequest }
    );

    console.log('Signing URL created successfully:', results.url);

    return results.url!;
  } catch (error: any) {
    console.error('Failed to create signing URL:', error);
    console.error('Error response:', JSON.stringify(error?.response?.body, null, 2));
    console.error('Error data:', JSON.stringify(error?.response?.data, null, 2));
    throw error;
  }
}

/**
 * Verifica lo stato di un envelope
 */
export async function getEnvelopeStatus(envelopeId: string) {
  if (!DOCUSIGN_ACCOUNT_ID) {
    throw new Error('Missing DOCUSIGN_ACCOUNT_ID');
  }

  const { apiClient, DocuSign } = await authenticateWithJWT();

  const envelopesApi = new DocuSign.EnvelopesApi(apiClient);
  const envelope = await envelopesApi.getEnvelope(DOCUSIGN_ACCOUNT_ID, envelopeId);

  return {
    status: envelope.status,
    completedDateTime: envelope.completedDateTime,
    declinedDateTime: envelope.declinedDateTime,
    voidedDateTime: envelope.voidedDateTime,
  };
}

/**
 * Scarica il contratto firmato
 */
export async function downloadSignedContract(envelopeId: string) {
  if (!DOCUSIGN_ACCOUNT_ID) {
    throw new Error('Missing DOCUSIGN_ACCOUNT_ID');
  }

  const { apiClient, DocuSign } = await authenticateWithJWT();

  const envelopesApi = new DocuSign.EnvelopesApi(apiClient);
  return await envelopesApi.getDocument(
    DOCUSIGN_ACCOUNT_ID,
    envelopeId,
    'combined'
  );
}
