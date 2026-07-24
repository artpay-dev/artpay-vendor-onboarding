"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2, AlertCircle, CheckCircle2, CalendarDays, Zap } from "lucide-react";

function AbbonamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [planAmount, setPlanAmount] = useState<number | null>(null);
  const [planCurrency, setPlanCurrency] = useState<string>("EUR");
  const cancelled = searchParams.get("cancelled") === "true";

  useEffect(() => {
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    const storedId = sessionStorage.getItem("onboarding_id");

    if (!sessionToken || !storedId) {
      toast.error("Sessione non valida", { description: "Torna alla registrazione" });
      router.push("/artista");
      return;
    }

    const storedPlan = (sessionStorage.getItem("artist_plan") as "monthly" | "annual") || "monthly";
    const storedAmount = sessionStorage.getItem("artist_plan_amount");
    const storedCurrency = sessionStorage.getItem("artist_plan_currency") || "EUR";

    setPlan(storedPlan);
    if (storedAmount) setPlanAmount(Number(storedAmount));
    setPlanCurrency(storedCurrency);
    setIsLoading(false);
  }, [router]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
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

      const response = await fetch("/api/artist/subscription/direct-checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (response.status === 409) {
        // Already paid — go to contract
        router.push("/artista/contratto");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Errore durante il checkout");
      }

      const result = await response.json();
      window.location.href = result.data.checkout_url;
    } catch (error) {
      toast.error("Errore durante l'attivazione", {
        description: error instanceof Error ? error.message : "Riprova più tardi",
      });
      setIsCheckingOut(false);
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

  const annualMonthly = plan === "annual" && planAmount
    ? (planAmount / 100 / 12).toLocaleString("it-IT", { style: "currency", currency: planCurrency })
    : null;

  return (
    <div className="container max-w-2xl mx-auto p-6 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">Attiva il tuo abbonamento</CardTitle>
              <CardDescription>Step 2 di 5 — Completa il pagamento per proseguire</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {cancelled && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Hai annullato il pagamento. Puoi riprovare quando vuoi.
              </p>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 flex items-center gap-2">
              {plan === "annual" ? (
                <CalendarDays className="h-4 w-4 text-primary" />
              ) : (
                <Zap className="h-4 w-4 text-primary" />
              )}
              <p className="font-semibold text-sm">
                Piano {plan === "annual" ? "Annuale" : "Mensile"}
              </p>
            </div>
            <div className="divide-y">
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Importo</span>
                <div className="text-right">
                  <span className="font-semibold text-primary">
                    {formattedAmount ?? "—"}{plan === "annual" ? "/anno" : "/mese"}
                  </span>
                  {annualMonthly && (
                    <p className="text-xs text-muted-foreground">{annualMonthly}/mese</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Commissione primi 12 mesi</span>
                <span className="font-semibold text-green-600">15%</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Commissione dal 13° mese</span>
                <span className="font-semibold">18%</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Rinnovo automatico</span>
                <span className="text-sm text-muted-foreground">Cancellabile in qualsiasi momento</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Verrai reindirizzato su Stripe per completare il pagamento in modo sicuro.
            Dopo il pagamento potrai firmare il contratto e configurare i pagamenti.
          </p>

          <Button onClick={handleCheckout} disabled={isCheckingOut} className="w-full" size="lg">
            {isCheckingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reindirizzamento a Stripe...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {cancelled ? "Riprova pagamento" : "Attiva abbonamento"}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pagamento sicuro gestito da Stripe. Puoi disdire in qualsiasi momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ArtistaAbbonamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AbbonamentoContent />
    </Suspense>
  );
}