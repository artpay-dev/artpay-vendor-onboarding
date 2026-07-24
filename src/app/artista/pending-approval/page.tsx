"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, CheckCircle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { GetOnboardingStatusResponse } from "@/types/supabase";

function StatusMessage({ seconds }: { seconds: number }) {
  const messages = [
    "Ci vorrà solo un minuto, promesso!",
    "Stiamo preparando il tuo profilo artista...",
    "Tutto procede bene, ancora un attimo...",
    "Quasi fatto! Ultimi ritocchi...",
    "Ci siamo quasi, grazie per la pazienza!",
  ];
  return <>{messages[Math.min(Math.floor(seconds / 8), messages.length - 1)]}</>;
}

function ChecklistItems({ seconds }: { seconds: number }) {
  const items = [
    { completed: true, text: "Contratto firmato e archiviato", isActive: false },
    { completed: seconds >= 12, text: "Creazione del tuo profilo artista", isActive: seconds < 12 },
    { completed: seconds >= 24, text: "Configurazione del tuo spazio personale", isActive: seconds >= 12 && seconds < 24 },
    { completed: seconds >= 36, text: "Preparazione delle credenziali di accesso", isActive: seconds >= 24 && seconds < 36 },
  ];

  return (
    <ul className="list-none pl-0 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          {item.completed ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : item.isActive ? (
            <Loader2 className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 animate-spin" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <span className={item.completed ? "text-green-900 dark:text-green-100" : ""}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ArtistaPendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<GetOnboardingStatusResponse | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchStatus = async (showToast = false) => {
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];

    const onboardingIdFromUrl = searchParams.get("onboarding_id");
    const onboardingIdFromStorage = sessionStorage.getItem("onboarding_id");
    const onboardingId = onboardingIdFromUrl || onboardingIdFromStorage;

    if (onboardingIdFromUrl) sessionStorage.setItem("onboarding_id", onboardingIdFromUrl);

    if (!sessionToken || !onboardingId) {
      toast.error("Sessione non valida");
      router.push("/artista");
      return;
    }

    try {
      const response = await fetch(`/api/onboarding/${onboardingId}/status`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!response.ok) throw new Error("Errore nel recupero dello status");

      const result = await response.json();
      const data = result.data as GetOnboardingStatusResponse;
      setOnboardingStatus(data);

      if (data.status === "vendor_created" && data.can_proceed) {
        toast.success("Profilo artista creato!", {
          description: "Procediamo con la configurazione dei pagamenti...",
        });
        setTimeout(() => router.push("/artista/stripe-connect"), 5000);
      } else if (data.status === "rejected") {
        toast.error("Richiesta rifiutata");
      } else if (showToast) {
        toast.info("Ancora in attesa", { description: "Il profilo è ancora in fase di creazione" });
      }
    } catch (error) {
      console.error("Status check error:", error);
      if (showToast) toast.error("Errore durante il controllo dello status");
    }
  };

  const syncContractStatus = async () => {
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session_token="))
      ?.split("=")[1];
    const onboardingId =
      searchParams.get("onboarding_id") || sessionStorage.getItem("onboarding_id");

    if (!sessionToken || !onboardingId) return;

    try {
      const res = await fetch(`/api/onboarding/${onboardingId}/contract/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error(`Contract sync failed (${res.status}):`, body);
      }
    } catch (error) {
      console.error("Contract sync error:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;
    const maxFastPolls = 15;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const poll = async () => {
      if (!isMounted) return;
      await fetchStatus();
      pollCount++;
      if (!isMounted) return;
      const delay = pollCount < maxFastPolls ? 2000 : 10000;
      setTimeout(poll, delay);
    };

    const fromDocusign = searchParams.get("from") === "docusign";

    const init = async () => {
      if (fromDocusign) await syncContractStatus();
      await fetchStatus();
      setIsLoading(false);
      setTimeout(poll, 2000);
    };

    init();
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = Math.min((elapsedSeconds / 60) * 90, 90);

  return (
    <div className="container max-w-3xl mx-auto p-6 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-full animate-pulse">
              <Sparkles className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl">Stiamo Creando il Tuo Profilo Artista</CardTitle>
              <CardDescription>Step 4 di 5 — Configurazione automatica del tuo spazio</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 bg-primary/10 rounded-full animate-ping" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                <StatusMessage seconds={elapsedSeconds} />
              </p>
              <p className="text-sm text-muted-foreground">
                Tempo trascorso:{" "}
                {elapsedSeconds < 60
                  ? `${elapsedSeconds} secondi`
                  : `${Math.floor(elapsedSeconds / 60)} min ${elapsedSeconds % 60} sec`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold">Cosa sta succedendo?</h3>
            <p>Hai firmato il contratto con successo. Stiamo preparando il tuo profilo artista su artpay.</p>
            <h4 className="text-base font-semibold mt-4">Stiamo lavorando a:</h4>
            <ChecklistItems seconds={elapsedSeconds} />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Richiede circa 1 minuto</strong> — Il processo è completamente automatico. Una volta pronto,
                passeremo automaticamente al passo successivo.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" disabled>
              Completamento automatico in corso...
            </Button>
            <Button
              onClick={async () => {
                setIsChecking(true);
                await fetchStatus(true);
                setIsChecking(false);
              }}
              disabled={isChecking}
              variant="secondary"
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifica...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verifica Stato
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Verifica automatica in corso • Non chiudere questa pagina
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ArtistaPendingApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ArtistaPendingApprovalContent />
    </Suspense>
  );
}