"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.artpay.art/login";

function ArtistaCompletatoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [artistName, setArtistName] = useState("");

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
      router.push("/artista");
      return;
    }

    if (sessionToken) {
      fetch(`/api/onboarding/${onboardingId}/status`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.data?.data?.business_name) {
            setArtistName(result.data.data.business_name);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
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
              <CardTitle className="font-heading text-2xl">Tutto completato!</CardTitle>
              <CardDescription>Il tuo account artista è attivo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              Benvenuto su artpay{artistName ? `, ${artistName}` : ""}!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Hai completato tutti gli step. Il tuo account artista è ora attivo e puoi iniziare a vendere le tue opere.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Cosa puoi fare ora:</h4>
            {[
              { title: "Carica le tue opere", desc: "Aggiungi le tue opere con foto, descrizione e prezzo" },
              { title: "Ricevi pagamenti", desc: "I clienti possono pagare subito o a rate tramite BNPL" },
              { title: "Gestisci il tuo profilo", desc: "Personalizza la tua pagina artista con bio e portfolio" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Riepilogo configurazione:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {[
                "Account creato",
                "Abbonamento attivato",
                "Contratto firmato",
                "Stripe Connect configurato",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <Button className="w-full" asChild>
            <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Vai al Dashboard
            </a>
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Riceverai un&apos;email di conferma con tutte le informazioni del tuo account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ArtistaCompletatoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ArtistaCompletatoContent />
    </Suspense>
  );
}