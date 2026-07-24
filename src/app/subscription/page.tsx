"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, CalendarDays, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  interval: "monthly" | "annual";
  amount: number;
  currency: string;
  product_name: string;
  description: string;
}

function getWpToken(): string | null {
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("wp_token="))
      ?.split("=")[1] ?? null
  );
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<"monthly" | "annual" | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/artist/subscription/plans")
      .then((r) => r.json())
      .then((res) => setPlans(res.data?.plans ?? []))
      .catch(() => setPlans([]))
      .finally(() => setIsLoading(false));
  }, []);

  const monthly = plans.find((p) => p.interval === "monthly");
  const annual = plans.find((p) => p.interval === "annual");

  const monthlyCents = monthly?.amount ?? 990;
  const annualCents = annual?.amount ?? 9900;
  const annualSavingCents = monthlyCents * 12 - annualCents;

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });

  const handleCheckout = async () => {
    if (!selected) return;

    const wpToken = getWpToken();
    if (!wpToken) {
      toast.error("Devi essere autenticato per abbonarti.");
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      const res = await fetch("/api/artist/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${wpToken}`,
        },
        body: JSON.stringify({ plan: selected }),
      });

      if (res.status === 409) {
        toast.error("Hai già un abbonamento attivo.", {
          description: "Vai su /account/subscription per gestirlo.",
        });
        return;
      }

      if (!res.ok) throw new Error("Errore durante il checkout");

      const data = await res.json();
      window.location.href = data.data.checkout_url;
    } catch (err) {
      setError("Errore durante il checkout. Riprova.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-6 min-h-screen">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold font-heading">Scegli il tuo piano</h1>
          <p className="text-muted-foreground">
            Accesso completo alla piattaforma artpay per vendere le tue opere.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              I piani non sono ancora disponibili. Riprova tra poco.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => setSelected("monthly")}
              className={`text-left rounded-xl border-2 p-6 transition-all focus:outline-none ${
                selected === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold">Mensile</span>
                {selected === "monthly" && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold">{fmt(monthlyCents)}</span>
                <span className="text-muted-foreground text-sm">/mese</span>
              </div>
              <p className="text-sm text-muted-foreground">{monthly?.description ?? "Accesso completo"}</p>
            </button>

            <button
              onClick={() => setSelected("annual")}
              className={`relative text-left rounded-xl border-2 p-6 transition-all focus:outline-none ${
                selected === "annual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Badge className="absolute -top-3 left-4 bg-green-600 hover:bg-green-600">
                Risparmia {fmt(annualSavingCents)}
              </Badge>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold">Annuale</span>
                {selected === "annual" && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold">{fmt(annualCents)}</span>
                <span className="text-muted-foreground text-sm">/anno</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Equivale a <strong>{fmt(annualCents / 12)}/mese</strong>
              </p>
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!selected || isCheckingOut}
          onClick={handleCheckout}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reindirizzamento...
            </>
          ) : (
            `Abbonati — piano ${selected === "monthly" ? "mensile" : selected === "annual" ? "annuale" : "..."}`
          )}
        </Button>
      </div>
    </div>
  );
}