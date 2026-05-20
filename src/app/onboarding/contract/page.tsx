"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";

export default function ContractPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verifica session token e onboarding status
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
    setIsLoading(false);
  }, [router]);

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
        router.push("/");
        return;
      }

      // Chiama API per generare link DocuSign
      const response = await fetch(`/api/onboarding/${onboardingId}/contract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      console.log("response", response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Errore durante la generazione del contratto");
      }

      const result = await response.json();
      const { docusign_url } = result.data;

      // Apri DocuSign in una nuova finestra o redirect
      window.location.href = docusign_url;
    } catch (error) {
      console.error("Contract error:", error);
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
              <CardDescription>Step 2 di 5 - Revisiona e firma il contratto vendor</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">

          <p className="text-sm text-muted-foreground">
            Prima di procedere, leggi e firma il contratto di collaborazione con artpay.
            Riassumiamo qui i punti principali.
          </p>

          {/* Piano e costi */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3">
              <p className="font-semibold text-sm">Piano e costi</p>
            </div>
            <div className="divide-y">
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm flex-1">Periodo gratuito</span>
                <span className="font-semibold text-green-600">3 mesi gratis</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Canone mensile (dal 4° mese)</span>
                <span className="font-semibold">€29,00 + IVA</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Commissione primi 12 mesi</span>
                <span className="font-semibold text-primary">6%</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Commissione dal 13° mese</span>
                <span className="font-semibold text-primary">9%</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">Opere gestibili</span>
                <span className="font-semibold">Max 100</span>
              </div>
            </div>
          </div>

          {/* Altri termini chiave */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3">
              <p className="font-semibold text-sm">Altri termini</p>
            </div>
            <div className="divide-y">
              <div className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm shrink-0 font-medium">Durata</span>
                <span className="text-sm text-right text-muted-foreground ml-auto">Annuale con rinnovo automatico. Disdetta almeno 60 giorni prima della scadenza</span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm shrink-0 font-medium">Abbonamento mensile</span>
                <span className="text-sm text-right text-primary ml-auto">Non automatico. Richiede conferma esplicita al termine del 3° mese</span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm shrink-0 font-medium">Autenticità opere</span>
                <span className="text-sm text-right text-muted-foreground ml-auto">La galleria garantisce autenticità e legittima provenienza di ogni opera</span>
              </div>
            </div>
          </div>

          {/* Come funziona la firma */}
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
            La firma elettronica via DocuSign ha lo stesso valore legale di una firma autografa secondo la normativa vigente.
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
                  Inizia Firma Contratto
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
