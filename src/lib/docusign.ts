/**
 * DocuSign Integration
 * Gestisce la creazione e invio di contratti tramite DocuSign
 *
 * NOTA: Usa dynamic import per evitare problemi con Next.js bundler
 */

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

/**
 * Genera un PDF semplice del contratto
 * Nota: In produzione usa un template DocuSign o un PDF vero
 */
function generateContractHTML(params: {
  signerName: string;
  businessName: string;
  signerEmail: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; color: #333; }
    h2 { color: #555; margin-top: 30px; }
    .section { margin: 20px 0; line-height: 1.6; }
    .highlight { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; }
    .signature-area { margin-top: 80px; }
    .signature-line { border-top: 2px solid #000; width: 300px; margin-top: 100px; }
  </style>
</head>
<body>
  <h1>CONTRATTO VENDOR ARTPAY</h1>

  <div class="section">
    <strong>Data:</strong> ${new Date().toLocaleDateString('it-IT')}
  </div>

  <div class="section">
    <h2>PARTI</h2>
    <p><strong>Tra:</strong></p>
    <ul>
      <li><strong>ArtPay</strong> - Piattaforma di e-commerce per opere d'arte</li>
      <li><strong>${params.businessName}</strong> - ${params.signerName} (${params.signerEmail})</li>
    </ul>
  </div>

  <div class="section">
    <h2>OGGETTO</h2>
    <p>
      Il presente contratto disciplina i termini e le condizioni per la vendita di opere d'arte
      sulla piattaforma ArtPay da parte del Vendor.
    </p>
  </div>

  <div class="section">
    <h2>COMMISSIONI</h2>
    <div class="highlight">
      <ul>
        <li><strong>Primi 6 mesi:</strong> 6% su ogni vendita</li>
        <li><strong>Dopo 6 mesi:</strong> 12% su ogni vendita</li>
      </ul>
    </div>
    <p>
      Le commissioni saranno trattenute automaticamente al momento del pagamento del cliente.
    </p>
  </div>

  <div class="section">
    <h2>PAGAMENTI</h2>
    <p>
      I pagamenti verranno elaborati tramite Stripe Connect con cadenza settimanale,
      direttamente sul conto bancario del Vendor.
    </p>
  </div>

  <div class="section">
    <h2>RESPONSABILITÀ DEL VENDOR</h2>
    <ul>
      <li>Fornire descrizioni accurate e foto di qualità delle opere</li>
      <li>Gestire le spedizioni in modo professionale e tempestivo</li>
      <li>Rispondere alle richieste dei clienti entro 24 ore</li>
      <li>Garantire l'autenticità delle opere vendute</li>
    </ul>
  </div>

  <div class="section">
    <h2>DURATA E RECESSO</h2>
    <p>
      Il contratto ha durata indeterminata e può essere rescisso da entrambe le parti
      con preavviso scritto di 30 giorni.
    </p>
  </div>

  <div class="section">
    <h2>LEGGE APPLICABILE</h2>
    <p>
      Il presente contratto è regolato dalla legge italiana e qualsiasi controversia
      sarà soggetta alla giurisdizione esclusiva dei tribunali italiani.
    </p>
  </div>

  <div class="signature-area">
    <p><strong>Il Vendor accetta i termini e le condizioni sopra riportati:</strong></p>
    <div class="signature-line">
      <p style="margin-top: 10px; text-align: center;">
        <strong>Firma del Vendor</strong><br/>
        Data: _________________
      </p>
    </div>
  </div>
</body>
</html>
  `;
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
    signerEmail: params.signerEmail,
  });

  // Converti HTML in base64
  const documentBase64 = Buffer.from(contractHTML).toString('base64');

  console.log('Document created, base64 length:', documentBase64.length);

  // Crea il documento
  const document = DocuSign.Document.constructFromObject({
    documentBase64,
    name: 'Contratto Vendor ArtPay',
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

  // Aggiungi i tab di firma
  signer.tabs = DocuSign.Tabs.constructFromObject({
    signHereTabs: [
      DocuSign.SignHere.constructFromObject({
        documentId: '1',
        pageNumber: '1',
        recipientId: '1',
        tabLabel: 'SignHereTab',
        xPosition: '100',
        yPosition: '700',
      }),
    ],
    dateSignedTabs: [
      DocuSign.DateSigned.constructFromObject({
        documentId: '1',
        pageNumber: '1',
        recipientId: '1',
        tabLabel: 'DateSignedTab',
        xPosition: '300',
        yPosition: '700',
      }),
    ],
  });

  // Crea l'envelope
  const envelopeConfig: any = {
    emailSubject: `Contratto Vendor ArtPay - ${params.businessName}`,
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
