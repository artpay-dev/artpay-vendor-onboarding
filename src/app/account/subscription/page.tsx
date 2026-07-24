"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SubStatus {
  subscribed: boolean;
  status: "active" | "trialing" | "past_due" | "canceled";
  plan: string;
  period_end: number;
  cancel_at_period_end: boolean;
  subscription_id: string;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getWpToken(): string | null {
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("wp_token="))
      ?.split("=")[1] ?? null
  );
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  if (status === "active" && !cancelAtPeriodEnd) return <Badge className="bg-green-600 hover:bg-green-600">Attivo</Badge>;
  if (status === "active" && cancelAtPeriodEnd) return <Badge className="bg-orange-500 hover:bg-orange-500">Attivo fino a scadenza</Badge>;
  if (status === "trialing") return <Badge className="bg-blue-600 hover:bg-blue-600">In prova</Badge>;
  if (status === "past_due") return <Badge variant="destructive">Pagamento fallito</Badge>;
  if (status === "canceled") return <Badge variant="secondary">Cancellato</Badge>;
  return null;
}

export default function AccountSubscriptionPage() {
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isPortaling, setIsPortaling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    const wpToken = getWpToken();
    if (!wpToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/artist/subscription/status", {
        headers: { Authorization: `Bearer ${wpToken}` },
      });
      if (!res.ok) throw new Error("Errore nel recupero dello stato");
      const data = await res.json();
      setStatus(data.data);
    } catch (err) {
      setError("Impossibile caricare lo stato dell'abbonamento.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCancel = async () => {
    const wpToken = getWpToken();
    if (!wpToken) return;

    setIsCanceling(true);
    try {
      const res = await fetch("/api/artist/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${wpToken}`,
        },
        body: JSON.stringify({ immediately: false }),
      });

      if (!res.ok) throw new Error("Errore durante la cancellazione");

      const data = await res.json();
      toast.success("Abbonamento cancellato", {
        description: "Non verrà rinnovato alla scadenza del periodo corrente.",
      });
      setShowCancelConfirm(false);
      await fetchStatus();
    } catch (err) {
      toast.error("Errore durante la cancellazione. Riprova.");
    } finally {
      setIsCanceling(false);
    }
  };

  const handlePortal = async () => {
    const wpToken = getWpToken();
    if (!wpToken) return;

    setIsPortaling(true);
    try {
      const res = await fetch("/api/artist/subscription/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${wpToken}` },
      });

      if (!res.ok) throw new Error("Errore nell'accesso al portale");

      const data = await res.json();
      window.open(data.data.portal_url, "_blank");
    } catch (err) {
      toast.error("Errore nell'accesso al portale di gestione.");
    } finally {
      setIsPortaling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wpToken = getWpToken();

  if (!wpToken) {
    return (
      <div className="container max-w-2xl mx-auto p-6 min-h-screen flex items-center">
        <Card className="w-full">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Devi essere autenticato per gestire il tuo abbonamento.</p>
            <Button asChild>
              <a href="/login">Accedi</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 min-h-screen">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Il mio abbonamento</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestisci piano, pagamenti e cancellazione</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {!status?.subscribed || status.status === "canceled" ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-muted-foreground">
                {status?.status === "canceled"
                  ? "Il tuo abbonamento è scaduto."
                  : "Non hai un abbonamento attivo."}
              </p>
              <Button asChild>
                <Link href="/subscription">Scegli un piano</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Piano {status.plan === "monthly" ? "Mensile" : "Annuale"}
                </CardTitle>
                <StatusBadge status={status.status} cancelAtPeriodEnd={status.cancel_at_period_end} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dettagli */}
              <div className="border rounded-lg overflow-hidden">
                <div className="divide-y">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Stato</span>
                    <StatusBadge status={status.status} cancelAtPeriodEnd={status.cancel_at_period_end} />
                  </div>
                  {status.period_end && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        {status.cancel_at_period_end ? "Attivo fino al" : "Prossimo rinnovo"}
                      </span>
                      <span className="font-medium">{formatDate(status.period_end)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messaggi contestuali */}
              {status.status === "active" && status.cancel_at_period_end && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-sm text-orange-900 dark:text-orange-100">
                  Il tuo abbonamento non verrà rinnovato. Puoi riattivarlo tramite il portale di gestione.
                </div>
              )}

              {status.status === "trialing" && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-100">
                  Sei nel periodo di prova. Potrai aggiungere un metodo di pagamento prima della scadenza.
                </div>
              )}

              {status.status === "past_due" && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 text-sm text-red-900 dark:text-red-100">
                  Il pagamento non è andato a buon fine. Aggiorna il metodo di pagamento per mantenere l&apos;accesso.
                </div>
              )}

              {/* Azioni */}
              <div className="flex flex-col gap-3">
                {(status.status === "active" || status.status === "trialing" || status.status === "past_due") && (
                  <Button onClick={handlePortal} disabled={isPortaling} variant="outline">
                    {isPortaling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    {status.cancel_at_period_end
                      ? "Riattiva abbonamento"
                      : status.status === "past_due"
                      ? "Aggiorna pagamento"
                      : "Gestisci pagamento"}
                  </Button>
                )}

                {status.status === "active" && !status.cancel_at_period_end && (
                  <>
                    {!showCancelConfirm ? (
                      <Button
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        Cancella abbonamento
                      </Button>
                    ) : (
                      <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium">Confermi la cancellazione?</p>
                        <p className="text-xs text-muted-foreground">
                          L&apos;abbonamento resterà attivo fino al {formatDate(status.period_end)}, poi non si rinnoverà.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={isCanceling}
                          >
                            Annulla
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isCanceling}
                          >
                            {isCanceling ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : null}
                            Sì, cancella
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}