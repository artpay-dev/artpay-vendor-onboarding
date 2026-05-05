"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { basicOnboardingSchema, type BasicOnboardingData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { StartOnboardingResponse } from "@/types/supabase";

export function BasicOnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<BasicOnboardingData>({
    resolver: zodResolver(basicOnboardingSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      business_name: "",
      ragione_sociale: "",
      partita_iva: "",
      indirizzo: "",
      iban: "",
    },
  });

  const onSubmit = async (data: BasicOnboardingData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Gestisci errori specifici
        if (response.status === 409) {
          // Email già esistente o onboarding incompleto
          if (result.error?.can_resume) {
            toast.error("Onboarding già iniziato", {
              description: "Hai già un onboarding in corso. Vuoi riprenderlo?",
              action: {
                label: "Riprendi",
                onClick: () => {
                  // Salva il session token se presente
                  if (result.error?.onboarding_id) {
                    router.push(result.error.resume_url || "/onboarding/contract");
                  }
                },
              },
            });
            return;
          }
        }

        throw new Error(result.error?.message || "Errore durante la registrazione");
      }

      const { data: onboardingData } = result as { data: StartOnboardingResponse };

      // Salva session token in cookie o localStorage
      document.cookie = `session_token=${onboardingData.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`;

      // Salva anche onboarding_id per comodità
      sessionStorage.setItem("onboarding_id", onboardingData.onboarding_id);

      toast.success("Registrazione completata!", {
        description: "Procediamo con la firma del contratto...",
      });

      // Redirect al prossimo step
      setTimeout(() => {
        router.push(onboardingData.next_url);
      }, 1000);
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Errore durante la registrazione", {
        description: error instanceof Error ? error.message : "Si è verificato un errore. Riprova.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="nome@esempio.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Useremo questa email per comunicazioni importanti
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimo 6 caratteri"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name */}
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

              {/* Last Name */}
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

              {/* Business Name */}
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Galleria/Attività *</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Galleria d'Arte Moderna" {...field} />
                    </FormControl>
                    <FormDescription>
                      Il nome commerciale della tua galleria o attività artistica
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ragione Sociale */}
              <FormField
                control={form.control}
                name="ragione_sociale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ragione Sociale *</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Galleria Arte Moderna S.r.l." {...field} />
                    </FormControl>
                    <FormDescription>
                      La ragione sociale dell'ente o azienda (come da registro delle imprese)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Partita IVA */}
              <FormField
                control={form.control}
                name="partita_iva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita IVA *</FormLabel>
                    <FormControl>
                      <Input placeholder="es. 01234567890" maxLength={11} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Indirizzo Sede */}
              <FormField
                control={form.control}
                name="indirizzo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo Sede *</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Via Roma 1, 10121 Torino (TO)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Indirizzo completo della sede legale (via, CAP, città, provincia)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* IBAN */}
              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="es. IT60X0542811101000000123456"
                        maxLength={34}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\s/g, "").toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Il conto bancario su cui riceverai i pagamenti
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registrazione in corso..." : "Inizia Onboarding"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
