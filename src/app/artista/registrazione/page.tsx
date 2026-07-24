"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";

const artistSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Minimo 6 caratteri"),
  first_name: z.string().min(2, "Minimo 2 caratteri"),
  last_name: z.string().min(2, "Minimo 2 caratteri"),
  business_name: z.string().min(2, "Minimo 2 caratteri"),
  indirizzo: z.string().min(5, "Inserisci un indirizzo valido"),
});

type ArtistFormData = z.infer<typeof artistSchema>;

export default function ArtistaRegistrazionePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("artist_plan");
    if (!stored) {
      router.push("/artista");
      return;
    }
    setPlan(stored);
  }, [router]);

  const form = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      business_name: "",
      indirizzo: "",
    },
  });

  const onSubmit = async (data: ArtistFormData) => {
    setIsSubmitting(true);
    try {
      const planAmount = sessionStorage.getItem("artist_plan_amount");

      const response = await fetch("/api/onboarding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          flow_type: "artist",
          subscription_plan: plan,
          subscription_plan_amount: planAmount ? Number(planAmount) : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && result.error?.can_resume) {
          toast.error("Registrazione già esistente", {
            description: "Hai già un account. Vai su /artista per riprendere.",
          });
          return;
        }
        throw new Error(result.error?.message || "Errore durante la registrazione");
      }

      const { data: onboardingData } = result;

      document.cookie = `session_token=${onboardingData.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`;
      sessionStorage.setItem("onboarding_id", onboardingData.onboarding_id);

      toast.success("Registrazione completata!", {
        description: "Procediamo con l'attivazione dell'abbonamento...",
      });

      setTimeout(() => router.push(onboardingData.next_url), 1000);
    } catch (error) {
      toast.error("Errore durante la registrazione", {
        description: error instanceof Error ? error.message : "Riprova.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 min-h-screen flex items-center">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <UserCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Crea il tuo account</h1>
            <p className="text-sm text-muted-foreground">
              Step 1 di 5 — Piano selezionato:{" "}
              <strong>{plan === "annual" ? "Annuale" : "Mensile"}</strong>
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Mario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rossi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome d&apos;arte / Nome professionale *</FormLabel>
                      <FormControl>
                        <Input placeholder="es. Mario Rossi Arte Contemporanea" {...field} />
                      </FormControl>
                      <FormDescription>
                        Il nome con cui apparirà il tuo profilo artista sulla piattaforma
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="mario@esempio.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimo 6 caratteri" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="indirizzo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indirizzo *</FormLabel>
                      <FormControl>
                        <Input placeholder="es. Via Roma 1, 10121 Torino (TO)" {...field} />
                      </FormControl>
                      <FormDescription>
                        Indirizzo completo (via, CAP, città, provincia)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    "Crea account e prosegui"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}