"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";

export default function RiprendiPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/onboarding/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Registrazione non trovata", {
          description: "Non abbiamo trovato nessuna registrazione in corso per questa email.",
        });
        return;
      }

      const { onboarding_id, session_token, resume_url } = result.data;

      // Ripristina sessione
      document.cookie = `session_token=${session_token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`;
      sessionStorage.setItem("onboarding_id", onboarding_id);

      toast.success("Registrazione trovata!", {
        description: "Ti stiamo portando dove avevi lasciato...",
      });

      setTimeout(() => {
        router.push(resume_url || "/onboarding/contract");
      }, 800);
    } catch {
      toast.error("Errore di connessione", {
        description: "Riprova tra qualche secondo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <RotateCcw className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-medium mb-2">Riprendi la registrazione</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hai già iniziato il processo di onboarding? Inserisci la tua email e ti riportiamo esattamente dove avevi lasciato.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Inserisci la tua email</CardTitle>
            <CardDescription>
              Quella con cui hai avviato la registrazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ricerca in corso...
                  </>
                ) : (
                  <>
                    Riprendi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Non hai ancora iniziato?{" "}
          <a href="/register" className="text-primary hover:underline font-medium">
            Inizia la registrazione
          </a>
        </p>
      </div>
    </div>
  );
}