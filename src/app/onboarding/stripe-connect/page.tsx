"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";

export default function StripeConnectPage() {
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
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold">Perché connettere Stripe?</h3>
            <p>
              ArtPay utilizza Stripe Connect per gestire i pagamenti in modo sicuro. Connettendo il tuo account Stripe,
              potrai ricevere i pagamenti direttamente sul tuo conto bancario.
            </p>

            <h4 className="text-base font-semibold mt-4">Cosa otterrai:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pagamenti automatici settimanali sul tuo conto</li>
              <li>Dashboard completa per monitorare le vendite</li>
              <li>Protezione contro le frodi e i chargeback</li>
              <li>Supporto per carte di credito e altre modalità di pagamento</li>
            </ul>

            <h4 className="text-base font-semibold mt-4">Come funziona?</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Cliccando sul pulsante qui sotto, sarai reindirizzato su Stripe</li>
              <li>Crea o connetti un account Stripe esistente</li>
              <li>Completa le informazioni richieste (dati fiscali, conto bancario, ecc.)</li>
              <li>Tornerai automaticamente qui per completare l'onboarding</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Importante:</strong> Stripe richiederà informazioni fiscali e bancarie per conformità con le
                normative sui pagamenti. Tutti i dati sono gestiti in modo sicuro da Stripe.
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Se non hai ancora un account Stripe, ne verrà creato uno automaticamente durante
              il processo. Non è necessaria alcuna registrazione preliminare.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
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
