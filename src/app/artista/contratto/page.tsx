"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";

function ArtistaContrattoContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("monthly");
  const [planAmount, setPlanAmount] = useState<number | null>(null);
  const [planCurrency, setPlanCurrency] = useState<string>("EUR");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    const storedId = sessionStorage.getItem("onboarding_id");
    const storedPlan = sessionStorage.getItem("artist_plan") || "monthly";
    const storedAmount = sessionStorage.getItem("artist_plan_amount");
    const storedCurrency = sessionStorage.getItem("artist_plan_currency") || "EUR";

    if (!sessionToken || !storedId) {
      toast.error("Sessione non valida", { description: "Torna alla registrazione" });
      router.push("/artista");
      return;
    }

    setOnboardingId(storedId);
    setPlan(storedPlan);
    if (storedAmount) setPlanAmount(Number(storedAmount));
    setPlanCurrency(storedCurrency);

    // Conferma abbonamento se arrivati da Stripe Checkout
    const stripeSessionId = searchParams.get("session_id");
    if (stripeSessionId) {
      fetch("/api/artist/subscription/confirm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: stripeSessionId }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res.success) {
            console.warn("Subscription confirm failed:", res.error?.message);
          }
        })
        .catch((err) => console.error("Subscription confirm error:", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [router, searchParams]);

  const handleSaveForLater = async () => {
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
  };

  const handleStartContract = async () => {
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

      const response = await fetch(`/api/onboarding/${onboardingId}/contract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Errore durante la generazione del contratto");
      }

      const result = await response.json();
      window.location.href = result.data.docusign_url;
    } catch (error) {
      toast.error("Errore durante l'apertura del contratto", {
        description: error instanceof Error ? error.message : "Riprova più tardi",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formattedAmount = planAmount
    ? (planAmount / 100).toLocaleString("it-IT", { style: "currency", currency: planCurrency })
    : null;
  const planLabel = plan === "annual"
    ? `Annuale${formattedAmount ? ` (${formattedAmount}/anno + IVA)` : ""}`
    : `Mensile${formattedAmount ? ` (${formattedAmount}/mese + IVA)` : ""}`;

  return (
    <div className="container max-w-3xl mx-auto p-6 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">Firma del Contratto</CardTitle>
              <CardDescription>Step 3 di 5 — Revisiona e firma il tuo accordo artista</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Prima di procedere, leggi e firma l&apos;accordo di collaborazione con artpay. Ecco i punti principali.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3">
              <p className="font-semibold text-sm">Il tuo piano</p>
            </div>
            <div className="divide-y">
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Piano selezionato</span>
                <span className="font-semibold text-primary">{planLabel}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm flex-1">Commissione primi 12 mesi</span>
                <span className="font-semibold text-green-600">15%</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Commissione dal 13° mese</span>
                <span className="font-semibold">18%</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3">
              <p className="font-semibold text-sm">Altri termini</p>
            </div>
            <div className="divide-y">
              <div className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm shrink-0 font-medium">Durata</span>
                <span className="text-sm text-right text-muted-foreground ml-auto">
                  Annuale con rinnovo automatico. Disdetta almeno 30 giorni prima della scadenza
                </span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm shrink-0 font-medium">Abbonamento</span>
                <span className="text-sm text-right text-primary ml-auto">
                  Gestibile in qualsiasi momento. Cancellazione automatica a fine periodo
                </span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm shrink-0 font-medium">Titolarità opere</span>
                <span className="text-sm text-right text-muted-foreground ml-auto">
                  Mantieni la piena proprietà e titolarità delle tue opere
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Come funziona la firma</p>
            <ol className="space-y-2">
              {[
                'Clicca "Firma il Contratto" per aprire DocuSign',
                "Leggi il documento completo e firma elettronicamente",
                "Torni qui automaticamente per proseguire",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs text-muted-foreground">
            La firma elettronica via DocuSign ha lo stesso valore legale di una firma autografa.
          </p>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveForLater} variant="outline" className="flex-1">
              Salva per dopo
            </Button>
            <Button onClick={handleStartContract} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Firma il Contratto
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ArtistaContrattoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ArtistaContrattoContent />
    </Suspense>
  );
}