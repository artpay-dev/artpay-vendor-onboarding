"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";

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
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold">Cosa succede ora?</h3>
            <p>
              Prima di procedere con l'onboarding, è necessario firmare il contratto vendor che stabilisce i termini e
              le condizioni della collaborazione con ArtPay.
            </p>

            <h4 className="text-base font-semibold mt-4">Il contratto include:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Termini e condizioni di vendita</li>
              <li>Commissioni e metodi di pagamento</li>
              <li>Politiche di reso e rimborso</li>
              <li>Diritti e responsabilità delle parti</li>
            </ul>

            <h4 className="text-base font-semibold mt-4">Come funziona?</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Cliccando sul pulsante qui sotto, riceverai un'email con il link al contratto</li>
              <li>Potrai revisionare il contratto su DocuSign</li>
              <li>Firma elettronicamente il documento</li>
              <li>Tornerai automaticamente qui per procedere con l'approvazione</li>
            </ol>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> La firma elettronica via DocuSign ha lo stesso valore legale di una firma
              autografa secondo la normativa vigente.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
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
