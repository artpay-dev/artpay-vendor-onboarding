# 📝 Setup DocuSign - Guida Completa

Questa guida ti aiuterà a configurare l'integrazione DocuSign per la firma dei contratti vendor.

---

## 1️⃣ Crea Account DocuSign Developer

1. Vai su [https://developers.docusign.com/](https://developers.docusign.com/)
2. Clicca su **"Get Started"** o **"Sign Up"**
3. Completa la registrazione (riceverai un account **Sandbox** gratuito)
4. Verifica la tua email e fai login

---

## 2️⃣ Crea una Applicazione

### Opzione A: Dashboard DocuSign

1. Vai su **Apps and Keys** nella dashboard: [https://admindemo.docusign.com/apps-and-keys](https://admindemo.docusign.com/apps-and-keys)
2. Clicca su **"Add App and Integration Key"**
3. Compila i dettagli:
   - **App Name**: "ArtPay Vendor Onboarding"
   - **Redirect URI**: `http://localhost:3000/onboarding/pending-approval` (per sviluppo)
4. Clicca **"Create App"**

### Otterrai:
- ✅ **Integration Key** (Client ID)
- ✅ **Secret Key** (se usi OAuth code grant)

📍 **Salva l'Integration Key** - ti servirà per `.env.local`

---

## 3️⃣ Configura JWT Authentication (Consigliato)

JWT è più semplice per applicazioni server-side.

### Genera una Coppia di Chiavi RSA

#### Su Mac/Linux:
```bash
# Genera private key
openssl genrsa -out private.key 2048

# Genera public key
openssl rsa -in private.key -pubout -out public.key

# Converti private key in base64 (per env var)
base64 -i private.key -o private.key.base64
```

#### Su Windows:
Usa [Git Bash](https://gitforwindows.org/) o [WSL](https://docs.microsoft.com/en-us/windows/wsl/install) e segui i comandi Mac/Linux.

### Carica la Public Key su DocuSign

1. Vai su **Apps and Keys**
2. Trova la tua app e clicca **"Actions" → "Edit"**
3. Scroll fino a **"Authentication"**
4. Seleziona **"Service Integration"**
5. Clicca **"+ Add RSA Keypair"**
6. Copia il contenuto di `public.key` e incollalo
7. Clicca **"Save"**

---

## 4️⃣ Ottieni User ID e Account ID

### User ID (GUID)
1. Nella dashboard DocuSign, clicca sul tuo nome in alto a destra
2. Vai su **"My Account Settings"**
3. Troverai il tuo **User ID** (un GUID tipo `abc123-def456-...`)

### Account ID
1. Sempre in **"My Account Settings"**
2. Vai su **"API and Keys"**
3. Troverai l'**Account ID** (tipo `12345678`)

---

## 5️⃣ Consenti JWT Grant

Prima di poter usare JWT, devi autorizzare l'app:

1. Apri questo URL nel browser (sostituisci `YOUR_INTEGRATION_KEY`):
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATION_KEY&redirect_uri=https://www.docusign.com
```

2. Fai login con il tuo account DocuSign
3. Clicca **"Allow Access"**
4. Vedrai un errore 404 - **È NORMALE!** L'autorizzazione è andata a buon fine

---

## 6️⃣ Configura Environment Variables

Copia il contenuto di `private.key.base64` e aggiorna `.env.local`:

```bash
# DocuSign
DOCUSIGN_INTEGRATION_KEY=abc123-your-integration-key
DOCUSIGN_USER_ID=def456-your-user-guid
DOCUSIGN_ACCOUNT_ID=12345678
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_PRIVATE_KEY=LS0tLS1CRUdJTi...your-base64-encoded-key...

# App URL (per webhook)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7️⃣ Crea un Template di Contratto (Opzionale)

### Opzione A: Usa Template DocuSign (Consigliato per Produzione)

1. Vai su **"Templates"** nella dashboard DocuSign
2. Clicca **"New" → "Create Template"**
3. Carica il PDF del contratto vendor
4. Aggiungi i campi firma:
   - **Signature** tab
   - **Date Signed** tab
   - **Name** field (opzionale)
5. Salva il template e copia il **Template ID**
6. Aggiungi a `.env.local`:
```bash
DOCUSIGN_CONTRACT_TEMPLATE_ID=your-template-id
```

### Opzione B: Usa Documento Generato (Attuale)

Il codice attuale genera un HTML semplice. Per produzione:
- Usa un template DocuSign
- Oppure genera PDF veri con [PDFKit](https://pdfkit.org/) o [Puppeteer](https://pptr.dev/)

---

## 8️⃣ Configura Webhook (per Eventi di Firma)

### Locale (Sviluppo)

Per testare webhook in locale, usa [ngrok](https://ngrok.com/):

```bash
# Installa ngrok
brew install ngrok  # Mac
# oppure scarica da https://ngrok.com/download

# Avvia tunnel
ngrok http 3000

# Ngrok ti darà un URL tipo: https://abc123.ngrok.io
```

Aggiorna `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### Produzione

Quando deploy su Vercel/Netlify, usa il tuo dominio:
```bash
NEXT_PUBLIC_APP_URL=https://onboarding.artpay.art
```

Il webhook sarà automaticamente: `https://onboarding.artpay.art/api/webhooks/docusign`

---

## 9️⃣ Testa l'Integrazione

### Test Completo

1. Avvia il server:
```bash
npm run dev
```

2. Vai su: `http://localhost:3000/register`

3. Compila il form di registrazione

4. Dovresti essere reindirizzato a `/onboarding/contract`

5. Clicca **"Inizia Firma Contratto"**

6. Dovresti essere reindirizzato a DocuSign per firmare

7. Dopo la firma, DocuSign chiamerà il webhook e aggiornerà lo status

### Test API Diretta

```bash
# Test generazione contratto
curl -X POST http://localhost:3000/api/onboarding/YOUR_ONBOARDING_ID/contract \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Risposta attesa:
{
  "success": true,
  "data": {
    "docusign_url": "https://demo.docusign.net/...",
    "envelope_id": "abc-123-def"
  }
}
```

---

## 🔟 Troubleshooting

### Errore: "Failed to authenticate with DocuSign"
- ✅ Verifica che `DOCUSIGN_INTEGRATION_KEY` sia corretto
- ✅ Verifica che `DOCUSIGN_USER_ID` sia corretto
- ✅ Verifica che `DOCUSIGN_PRIVATE_KEY` sia in base64
- ✅ Hai fatto il consent JWT (step 5)?

### Errore: "Missing DOCUSIGN_INTEGRATION_KEY"
- ✅ Riavvia il dev server: `npm run dev`
- ✅ Verifica che `.env.local` esista e contenga le variabili

### Webhook non riceve eventi
- ✅ Stai usando ngrok per sviluppo locale?
- ✅ L'URL del webhook è corretto in `NEXT_PUBLIC_APP_URL`?
- ✅ Controlla i log di ngrok: `ngrok http 3000 --log=stdout`

### "Envelope not found, ignored" nel webhook
- È normale se testi il webhook manualmente
- DocuSign invia solo eventi per envelope che esistono nel database

---

## 🎯 Prossimi Step

Dopo aver configurato DocuSign:

1. ✅ Testa il flusso completo di registrazione
2. ✅ Crea un template di contratto vero su DocuSign
3. ✅ Configura il webhook per produzione
4. ✅ (Opzionale) Aggiungi upload contratto firmato su S3/Cloud Storage

---

## 📚 Risorse Utili

- [DocuSign Developer Center](https://developers.docusign.com/)
- [DocuSign JWT Auth Guide](https://developers.docusign.com/platform/auth/jwt/)
- [DocuSign API Reference](https://developers.docusign.com/docs/esign-rest-api/)
- [DocuSign Node.js SDK](https://github.com/docusign/docusign-esign-node-client)

---

## ✅ Checklist Completa

Prima di andare in produzione, verifica:

- [ ] Account DocuSign creato
- [ ] App DocuSign configurata con Integration Key
- [ ] Coppia chiavi RSA generate e caricate
- [ ] User ID e Account ID ottenuti
- [ ] JWT consent completato
- [ ] `.env.local` configurato con tutte le variabili
- [ ] Template contratto creato (opzionale ma consigliato)
- [ ] Webhook testato con ngrok
- [ ] Flusso end-to-end testato in sviluppo
- [ ] Variabili di produzione configurate su Vercel/Netlify

Se tutti i check sono ✅ sei pronto! 🎉
