"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, CheckCircle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { GetOnboardingStatusResponse } from "@/types/supabase";

// Messaggi per intrattenere l'utente durante l'attesa
function StatusMessage({ seconds }: { seconds: number }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let newMessage = "";
    // Messaggi brevi e friendly che cambiano ogni 8 secondi
    if (seconds < 8) newMessage = "Ci vorrà solo un minuto, promesso!";
    else if (seconds < 16) newMessage = "Stiamo parlando con i nostri server...";
    else if (seconds < 24) newMessage = "Tutto procede bene, ancora un attimo...";
    else if (seconds < 32) newMessage = "Quasi fatto! Ultimi ritocchi...";
    else newMessage = "Ci siamo quasi, grazie per la pazienza!";

    console.log("StatusMessage useEffect - seconds:", seconds, "message:", newMessage);
    setMessage(newMessage);
  }, [seconds]);

  return <>{message}</>;
}

// Checklist tecnica degli step reali
function ChecklistItems({ seconds }: { seconds: number }) {
  const [items, setItems] = useState<Array<{ completed: boolean; text: string; isActive: boolean }>>([]);

  useEffect(() => {
    const newItems = [
      {
        completed: true, // Sempre completato (contratto già firmato)
        text: "Contratto firmato e archiviato",
        isActive: false,
      },
      {
        completed: seconds >= 12,
        text: "Creazione del tuo spazio personale",
        isActive: seconds < 12,
      },
      {
        completed: seconds >= 24,
        text: "Configurazione della tua galleria",
        isActive: seconds >= 12 && seconds < 24,
      },
      {
        completed: seconds >= 36,
        text: "Preparazione delle tue credenziali di accesso",
        isActive: seconds >= 24 && seconds < 36,
      },
    ];

    console.log("ChecklistItems useEffect - seconds:", seconds, "items:", newItems);
    setItems(newItems);
  }, [seconds]);

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

export default function PendingApprovalPage() {
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

    // Prova a prendere onboarding_id da sessionStorage O da query param
    const onboardingIdFromStorage = sessionStorage.getItem("onboarding_id");
    const onboardingIdFromUrl = searchParams.get("onboarding_id");
    const onboardingId = onboardingIdFromStorage || onboardingIdFromUrl;

    // Se c'è nei query params ma non in storage, salvalo
    if (onboardingIdFromUrl && !onboardingIdFromStorage) {
      sessionStorage.setItem("onboarding_id", onboardingIdFromUrl);
    }

    if (!sessionToken || !onboardingId) {
      console.error("Missing session or onboarding ID", {
        hasToken: !!sessionToken,
        hasIdStorage: !!onboardingIdFromStorage,
        hasIdUrl: !!onboardingIdFromUrl,
      });
      toast.error("Sessione non valida");
      router.push("/");
      return;
    }

    try {
      const response = await fetch(`/api/onboarding/${onboardingId}/status`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Errore nel recupero dello status");
      }

      const result = await response.json();
      const data = result.data as GetOnboardingStatusResponse;

      setOnboardingStatus(data);

      // Se lo status è cambiato e può procedere, redirect
      if (data.status === "vendor_created" && data.can_proceed) {
        toast.success("Vendor creato!", {
          description: "Il tuo account è stato creato. Procediamo con Stripe Connect...",
        });

        setTimeout(() => {
          router.push(data.next_url || "/onboarding/stripe-connect");
        }, 1500);
      } else if (data.status === "rejected") {
        toast.error("Richiesta rifiutata", {
          description: "La tua richiesta di onboarding è stata rifiutata",
        });
      } else if (showToast) {
        toast.info("Ancora in attesa", {
          description: "La tua richiesta è ancora in fase di revisione",
        });
      }
    } catch (error) {
      console.error("Status check error:", error);
      if (showToast) {
        toast.error("Errore durante il controllo dello status");
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;
    const maxFastPolls = 15; // 15 polls * 2s = 30 secondi

    // Timer per contare i secondi trascorsi
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const poll = async () => {
      if (!isMounted) return;

      await fetchStatus();
      pollCount++;

      if (!isMounted) return;

      // Poll aggressivo per i primi 30 secondi (ogni 2 secondi)
      // Poi rallenta a ogni 10 secondi
      const delay = pollCount < maxFastPolls ? 2000 : 10000;
      setTimeout(poll, delay);
    };

    // Initial fetch
    fetchStatus().finally(() => {
      setIsLoading(false);
      // Start polling after initial fetch
      setTimeout(poll, 2000);
    });

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    await fetchStatus(true);
    setIsChecking(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calcola progress bar (0-90% nei primi 60 secondi, poi resta a 90%)
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
              <CardTitle className="font-heading text-2xl">Stiamo Preparando la Tua Galleria</CardTitle>
              <CardDescription>Step 3 di 5 - Configurazione automatica del tuo spazio vendita</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading Spinner Grande e Visibile */}
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
                Tempo trascorso: {elapsedSeconds < 60 ? `${elapsedSeconds} secondi` : `${Math.floor(elapsedSeconds / 60)} min ${elapsedSeconds % 60} sec`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold">Cosa sta succedendo?</h3>
            <p>
              Ottimo! Hai firmato il contratto con successo. <br />
              Ora stiamo preparando tutto il necessario per la tua galleria online su ArtPay.
            </p>

            <h4 className="text-base font-semibold mt-4">Stiamo lavorando a:</h4>
            <ChecklistItems seconds={elapsedSeconds} />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Richiede circa 1 minuto</strong> - Il processo è completamente automatico.
                <br />
                Puoi rilassarti, ci pensiamo a tutto noi! Una volta pronto, passeremo automaticamente
                al passo successivo.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push("/")} variant="outline" className="flex-1" disabled>
              Completamento automatico in corso...
            </Button>
            <Button onClick={handleCheckStatus} disabled={isChecking} variant="secondary" className="flex-1">
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
