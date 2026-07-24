"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SubStatus {
  subscribed: boolean;
  status: string;
  plan: string;
  period_end: number;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const wpToken = document.cookie
      .split("; ")
      .find((r) => r.startsWith("wp_token="))
      ?.split("=")[1];

    if (!wpToken) {
      setIsLoading(false);
      return;
    }

    fetch("/api/artist/subscription/status", {
      headers: { Authorization: `Bearer ${wpToken}` },
    })
      .then((r) => r.json())
      .then((res) => setStatus(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container max-w-2xl mx-auto p-6 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-heading">Abbonamento attivato!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Il tuo abbonamento è stato attivato con successo. Puoi ora accedere a tutte le funzionalità della piattaforma.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : status?.subscribed ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3">
                <p className="font-semibold text-sm">Dettagli abbonamento</p>
              </div>
              <div className="divide-y">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Piano</span>
                  <span className="font-medium capitalize">{status.plan === "monthly" ? "Mensile" : "Annuale"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Stato</span>
                  <span className="font-medium text-green-600 capitalize">{status.status}</span>
                </div>
                {status.period_end && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Prossimo rinnovo</span>
                    <span className="font-medium">{formatDate(status.period_end)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/account/subscription">
                Gestisci abbonamento
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.artpay.art/login"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Vai al Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}