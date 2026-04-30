"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationFormData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { PersonalInfoStep } from "./steps/personal-info-step";
import { AddressStep } from "./steps/address-step";
import { PaymentStep } from "./steps/payment-step";
import { SuccessCard } from "./success-card";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Informazioni personali", description: "Inserisci i dettagli del tuo account" },
  { id: 2, title: "Indirizzo", description: "Inserisci il tuo indirizzo" },
  { id: 3, title: "Pagamento", description: "Configura il metodo di pagamento" },
];

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      login: "",
      first_name: "",
      last_name: "",
      nice_name: "",
      display_name: "",
      email: "",
      password: "",
      address: {
        address_1: "",
        address_2: "",
        city: "",
        state: "",
        country: "",
        postcode: "",
        phone: "",
      },
      payment: {
        payment_mode: "",
        bank_account_type: "",
        bank_name: "",
        bank_account_number: "",
        bank_address: "",
        account_holder_name: "",
        aba_routing_number: "",
        destination_currency: "",
        iban: "",
        paypal_email: "",
      },
    },
  });

  const handleFinalSubmit = async () => {
    // Valida tutti i campi prima di procedere
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    const data = form.getValues();

    // Trasforma login in formato corretto
    data.login = data.login
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Imposta nice_name uguale a login automaticamente
    data.nice_name = data.login;

    console.log("Sending registration with login:", data.login);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-json/mvx/v1/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Registrazione fallita");
      }

      const result = await response.json();
      console.log("Registration successful:", result);

      // Se ha scelto Stripe, salva username/password e redirect
      if (data.payment.payment_mode === "stripe") {
        // Salva username e password in sessionStorage per il login
        // Nota: utilizzeremo username:password per Basic Auth, non consumer_key/secret
        sessionStorage.setItem("vendor_auth", btoa(`${data.login}:${data.password}`));

        // Toast unico per Stripe
        toast.success("Registrazione completata!", {
          description: "Reindirizzamento a Stripe Connect per configurare i pagamenti...",
        });

        // Redirect a stripe-connect dopo un breve delay
        setTimeout(() => {
          window.location.href = "/stripe-connect";
        }, 1500);

        return;
      }

      // Toast per altri metodi di pagamento
      toast.success("Registrazione inviata!", {
        description: "La tua richiesta è stata elaborata con successo.",
      });

      // Mostra la card di successo per gli altri metodi di pagamento
      setIsSuccess(true);
    } catch (error) {
      console.error("Registration error:", error);

      // Mostra toast di errore
      toast.error("Errore durante la registrazione", {
        description: error instanceof Error ? error.message : "Si è verificato un errore. Riprova.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegistrationFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["login", "first_name", "last_name", "display_name", "email", "password"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["address"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleReset = () => {
    form.reset();
    setCurrentStep(1);
    setIsSuccess(false);
  };

  // Mostra la success card se la registrazione è andata a buon fine
  if (isSuccess) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <SuccessCard onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-medium ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id}
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium">{step.title}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {currentStep === 1 && <PersonalInfoStep form={form} />}
              {currentStep === 2 && <AddressStep form={form} />}
              {currentStep === 3 && <PaymentStep form={form} />}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Indietro
                </Button>

                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={nextStep}>
                    Avanti
                  </Button>
                ) : (
                  <Button type="button" onClick={handleFinalSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Invio in corso..." : "Completa registrazione"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}