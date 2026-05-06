"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2, AlertCircle, Clock, FileText, Building2, BadgeCheck } from "lucide-react";

function StripeConnectPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for errors from Stripe return
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

    // Check for incomplete status
    const status = searchParams.get("status");
    if (status === "incomplete") {
      toast.warning("Onboarding incompleto", {
        description:
          "Devi completare tutti i passaggi richiesti da Stripe. Clicca nuovamente per continuare.",
      });
    }

    // Check for refresh param (Account Link expired)
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      toast.info("Link scaduto", {
        description: "Il link è scaduto. Clicca nuovamente per generarne uno nuovo.",
      });
    }

    // Verify session token and onboarding status
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    const storedOnboardingId = sessionStorage.getItem("onboarding_id");

    if (!sessionToken || !storedOnboardingId) {
      toast.error("Sessione non valida", {
        description: "Devi prima completare la registrazione",
      });
      router.push("/");
      return;
    }

    setOnboardingId(storedOnboardingId);
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
        router.push("/");
        return;
      }

      // Get Stripe Connect URL from API
      const response = await fetch("/api/stripe/connect/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          onboarding_id: onboardingId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate Stripe Connect URL");
      }

      const result = await response.json();
      const { stripe_url } = result.data;

      console.log("Redirecting to Stripe Connect");

      // Redirect to Stripe Connect
      window.location.href = stripe_url;
    } catch (error) {
      console.error("Stripe Connect error:", error);
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
              <CardTitle className="font-heading text-2xl">Connetti Stripe</CardTitle>
              <CardDescription>Step 4 di 5 - Configura i pagamenti per il tuo account vendor</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Banner tempo stimato */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">Questo è il passaggio più lungo — ma ci vogliono al massimo 10 minuti</p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">Tieni a portata di mano i documenti elencati qui sotto e procederai senza intoppi.</p>
            </div>
          </div>

          {/* Documenti necessari */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-foreground" />
              <span className="font-semibold text-sm">Documenti e dati che ti verranno richiesti</span>
            </div>
            <div className="divide-y">
              <div className="flex items-start gap-3 px-4 py-3">
                <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Documento d&apos;identità</p>
                  <p className="text-xs text-muted-foreground">Carta d&apos;identità o passaporto del titolare/rappresentante legale</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <Building2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Dati aziendali</p>
                  <p className="text-xs text-muted-foreground">Ragione sociale, Partita IVA, indirizzo sede legale (già inseriti in fase di registrazione — Stripe potrebbe richiederli di nuovo)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Coordinate bancarie (IBAN)</p>
                  <p className="text-xs text-muted-foreground">Il conto su cui riceverai i pagamenti dalle vendite</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Documenti dei titolari effettivi</p>
                  <p className="text-xs text-muted-foreground">Documento d&apos;identità di ogni socio o titolare con quota superiore al 25% del capitale</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Numero REA</p>
                  <p className="text-xs text-muted-foreground">Repertorio Economico Amministrativo — lo trovi sulla visura camerale (es. TO-123456)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Numero di telefono</p>
                  <p className="text-xs text-muted-foreground">Per la verifica dell&apos;identità tramite SMS</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Non hai ancora un account Stripe?</strong> Verrà creato automaticamente durante il processo — non è necessaria alcuna registrazione preliminare.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push("/riprendi")} variant="outline" className="flex-1">
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

export default function StripeConnectPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StripeConnectPageContent />
    </Suspense>
  );
}
