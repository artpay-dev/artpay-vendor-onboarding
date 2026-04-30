"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";

function CompletedPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verifica che l'onboarding sia effettivamente completato
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    // Prova a prendere onboarding_id da query param o da sessionStorage
    const onboardingIdFromUrl = searchParams.get("onboarding_id");
    const onboardingIdFromStorage = sessionStorage.getItem("onboarding_id");
    const onboardingId = onboardingIdFromUrl || onboardingIdFromStorage;

    // Se manca onboarding_id, salva quello dall'URL
    if (onboardingIdFromUrl && !onboardingIdFromStorage) {
      sessionStorage.setItem("onboarding_id", onboardingIdFromUrl);
    }

    // Se manca l'ID, redirect a home
    if (!onboardingId) {
      console.error("Missing onboarding ID");
      router.push("/");
      return;
    }

    // Se manca il token MA abbiamo l'ID dall'URL, permetti di continuare
    // (scenario: torniamo da Stripe via ngrok ma i cookie sono su localhost)
    if (!sessionToken && !onboardingIdFromUrl) {
      console.error("Missing session token and no ID in URL");
      router.push("/");
      return;
    }

    // Fetch status per conferma (se abbiamo il token)
    if (sessionToken) {
      fetch(`/api/onboarding/${onboardingId}/status`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.data) {
            setBusinessName(result.data.data.business_name || "");
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      // Nessun token, ma abbiamo l'ID dall'URL - mostra pagina generica
      setBusinessName("Vendor");
      setIsLoading(false);
    }
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <CardDescription>Il tuo account Gallerista è pronto all'uso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              Benvenuto su ArtPay, {businessName}!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Hai completato con successo tutti gli step dell'onboarding. Il tuo account è ora attivo e puoi iniziare
              a vendere le tue opere d'arte sulla piattaforma.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Cosa puoi fare ora:</h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Accedi al tuo dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Gestisci il tuo catalogo, ordini e statistiche di vendita
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Carica le tue opere</p>
                  <p className="text-sm text-muted-foreground">
                    Inizia ad aggiungere i tuoi prodotti al marketplace
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Configura il tuo profilo</p>
                  <p className="text-sm text-muted-foreground">Personalizza la tua pagina vendor</p>
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
            <Button asChild className="flex-1">
              <a href={`${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-login.php` || ""}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Vai al Dashboard
              </a>
            </Button>
            <Button variant="outline" asChild className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <a href={`${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-admin/admin.php?page=vendor-profile`}>
                Modifica Profilo
              </a>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Riceverai un'email di conferma con tutte le informazioni del tuo account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompletedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CompletedPageContent />
    </Suspense>
  );
}
