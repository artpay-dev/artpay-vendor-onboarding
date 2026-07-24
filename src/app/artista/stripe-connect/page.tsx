"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2, AlertCircle, Clock, BadgeCheck } from "lucide-react";

function ArtistaStripeConnectContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        invalid_request: "Richiesta non valida",
        onboarding_not_found: "Onboarding non trovato",
        no_account: "Account Stripe non trovato",
        internal_error: "Errore interno del server",
      };
      toast.error("Errore Stripe Connect", {
        description: errorMessages[error] || decodeURIComponent(error),
      });
    }

    if (searchParams.get("status") === "incomplete") {
      toast.warning("Onboarding incompleto", {
        description: "Devi completare tutti i passaggi richiesti da Stripe.",
      });
    }

    if (searchParams.get("refresh") === "true") {
      toast.info("Link scaduto", { description: "Clicca nuovamente per generarne uno nuovo." });
    }

    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    const storedId = sessionStorage.getItem("onboarding_id");

    if (!sessionToken || !storedId) {
      toast.error("Sessione non valida");
      router.push("/artista");
      return;
    }

    setOnboardingId(storedId);
  }, [router, searchParams]);

  const handleConnectStripe = async () => {
    if (!onboardingId) return;
    setIsLoading(true);

    try {
      const sessionToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("session_token="))
        ?.split("=")[1];

      if (!sessionToken) {
        toast.error("Sessione non valida");
        router.push("/artista");
        return;
      }

      const response = await fetch("/api/stripe/connect/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ onboarding_id: onboardingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Errore nella generazione del link Stripe");
      }

      const result = await response.json();
      window.location.href = result.data.stripe_url;
    } catch (error) {
      toast.error("Errore durante la connessione a Stripe", {
        description: error instanceof Error ? error.message : "Riprova più tardi",
      });
      setIsLoading(false);
    }
  };

  if (!onboardingId) {
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
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">Configura i Pagamenti</CardTitle>
              <CardDescription>Step 5 di 5 — Collega Stripe per ricevere i pagamenti dalle vendite</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Questo passaggio richiede circa 10 minuti
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Tieni a portata di mano i tuoi documenti d&apos;identità e coordinate bancarie.
              </p>
              <div className="text-sm text-amber-800 dark:text-amber-200 pt-1 border-t border-amber-200 dark:border-amber-700">
                <p>
                  <strong>Stripe Connect</strong> ti permette di ricevere direttamente i pagamenti degli acquirenti
                  sul tuo conto bancario, in modo sicuro e automatico.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3">
              <p className="font-semibold text-sm">Dati che ti verranno richiesti</p>
            </div>
            <div className="divide-y">
              <div className="flex items-start gap-3 px-4 py-3">
                <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Documento d&apos;identità</p>
                  <p className="text-xs text-muted-foreground">Carta d&apos;identità o passaporto</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Coordinate bancarie (IBAN)</p>
                  <p className="text-xs text-muted-foreground">Il conto su cui riceverai i pagamenti</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Numero di telefono</p>
                  <p className="text-xs text-muted-foreground">Per la verifica tramite SMS</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Non hai un account Stripe?</strong> Verrà creato automaticamente durante il processo.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                const sessionToken = document.cookie
                  .split("; ")
                  .find((row) => row.startsWith("session_token="))
                  ?.split("=")[1];
                if (sessionToken && onboardingId) {
                  fetch(`/api/onboarding/${onboardingId}/save-for-later`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${sessionToken}` },
                  }).catch(() => {});
                }
                router.push("/riprendi");
              }}
              variant="outline"
              className="flex-1"
            >
              Salva per dopo
            </Button>
            <Button onClick={handleConnectStripe} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reindirizzamento...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Connetti con Stripe
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ArtistaStripeConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ArtistaStripeConnectContent />
    </Suspense>
  );
}