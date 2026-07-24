"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, CalendarDays, CheckCircle2, ArrowRight } from "lucide-react";

interface Plan {
  id: string;
  interval: "monthly" | "annual";
  amount: number;
  currency: string;
  product_name: string;
  description: string;
}

export default function ArtistaLandingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<"monthly" | "annual" | null>(null);

  useEffect(() => {
    fetch("/api/artist/subscription/plans")
      .then((r) => r.json())
      .then((res) => {
        setPlans(res.data?.plans ?? []);
      })
      .catch(() => setPlans([]))
      .finally(() => setIsLoading(false));
  }, []);

  const monthly = plans.find((p) => p.interval === "monthly");
  const annual = plans.find((p) => p.interval === "annual");

  const monthlyCost = monthly ? monthly.amount / 100 : 9.9;
  const annualCost = annual ? annual.amount / 100 : 99;
  const annualSaving = Math.round((monthlyCost * 12 - annualCost) * 100) / 100;

  const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });

  const handleContinue = () => {
    if (!selected) return;
    const planData = plans.find((p) => p.interval === selected);
    sessionStorage.setItem("artist_plan", selected);
    if (planData) {
      sessionStorage.setItem("artist_plan_amount", String(planData.amount));
      sessionStorage.setItem("artist_plan_currency", planData.currency);
    }
    router.push("/artista/registrazione");
  };

  return (
    <div className="container max-w-3xl mx-auto p-6 min-h-screen flex items-center">
      <div className="w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold font-heading">Unisciti ad artpay come Artista</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Vendi le tue opere direttamente ai collezionisti. Scegli il piano che preferisci — puoi cambiarlo in qualsiasi momento.
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
            {/* Piano mensile */}
            <button
              onClick={() => setSelected("monthly")}
              className={`text-left rounded-xl border-2 p-6 transition-all focus:outline-none ${
                selected === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold">Mensile</span>
                {selected === "monthly" && (
                  <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                )}
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold">{formatPrice(monthly?.amount ?? 990)}</span>
                <span className="text-muted-foreground text-sm">/mese</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {monthly?.description ?? "Accesso completo alla piattaforma"}
              </p>
            </button>

            {/* Piano annuale */}
            <button
              onClick={() => setSelected("annual")}
              className={`relative text-left rounded-xl border-2 p-6 transition-all focus:outline-none ${
                selected === "annual"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Badge className="absolute -top-3 left-4 bg-green-600 hover:bg-green-600">
                Risparmia {formatPrice(annualSaving * 100)}
              </Badge>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold">Annuale</span>
                {selected === "annual" && (
                  <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                )}
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold">{formatPrice(annual?.amount ?? 9900)}</span>
                <span className="text-muted-foreground text-sm">/anno</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Equivale a{" "}
                <strong>{formatPrice((annual?.amount ?? 9900) / 12)}/mese</strong> — risparmio
                rispetto al piano mensile incluso.
              </p>
            </button>
          </div>
        )}

        {/* Cosa è incluso */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3">
            <p className="font-semibold text-sm">Incluso in tutti i piani</p>
          </div>
          <div className="divide-y">
            {[
              "Profilo artista personalizzato",
              "Vendita con pagamento rateale BNPL per i tuoi clienti",
              "Dashboard per monitorare ordini e pagamenti",
              "Commissione 15% per i primi 12 mesi (poi 18%)",
              "Supporto via email dedicato",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!selected}
          onClick={handleContinue}
        >
          Continua con piano {selected === "monthly" ? "Mensile" : selected === "annual" ? "Annuale" : "..."}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          L&apos;abbonamento si attiva subito dopo la registrazione, prima della firma del contratto.
        </p>
      </div>
    </div>
  );
}