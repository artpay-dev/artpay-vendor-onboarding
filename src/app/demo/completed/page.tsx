import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";

const DASHBOARD_URL = "https://dashboard.artpay.art/login";
const businessName = "Galleria Esempio";

export default function DemoCompletedPage() {
  return (
    <div className="container max-w-3xl mx-auto p-6 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">Onboarding Completato!</CardTitle>
              <CardDescription>Il tuo account Gallerista è pronto all&apos;uso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              Benvenuto su artpay, {businessName}!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Hai completato con successo tutti gli step dell&apos;onboarding. Il tuo account è ora attivo e puoi iniziare
              a vendere le tue opere d&apos;arte sulla piattaforma.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Cosa puoi fare ora:</h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Usa artpay FAST per inviare preventivi</p>
                  <p className="text-sm text-muted-foreground">
                    Invia preventivi ai tuoi clienti con opzioni di pagamento rateale integrate
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Accedi alla dashboard per vedere lo stato degli ordini</p>
                  <p className="text-sm text-muted-foreground">
                    Monitora vendite, pagamenti e lo stato di ogni transazione in tempo reale
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Modifica il tuo profilo</p>
                  <p className="text-sm text-muted-foreground">
                    Personalizza la tua pagina galleria con descrizione, immagini e informazioni di contatto
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Riepilogo configurazione:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>Account creato e verificato</li>
              <li>Contratto firmato</li>
              <li>Stripe Connect configurato</li>
              <li>Pagamenti abilitati</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" asChild>
              <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Vai al Dashboard
              </a>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Riceverai un&apos;email di conferma con tutte le informazioni del tuo account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}