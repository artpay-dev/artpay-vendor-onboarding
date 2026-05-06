"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.artpay.art/login";

function CompletedPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    const onboardingIdFromUrl = searchParams.get("onboarding_id");
    const onboardingIdFromStorage = sessionStorage.getItem("onboarding_id");
    const onboardingId = onboardingIdFromUrl || onboardingIdFromStorage;

    if (onboardingIdFromUrl && !onboardingIdFromStorage) {
      sessionStorage.setItem("onboarding_id", onboardingIdFromUrl);
    }

    if (!onboardingId) {
      console.error("Missing onboarding ID");
      router.push("/");
      return;
    }

    if (!sessionToken && !onboardingIdFromUrl) {
      console.error("Missing session token and no ID in URL");
      router.push("/");
      return;
    }

    if (sessionToken) {
      fetch(`/api/onboarding/${onboardingId}/status`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.data) {
            setBusinessName(result.data.data.business_name || "");
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
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