import { MultiStepForm } from "@/components/registration/multi-step-form";

/**
 * Legacy registration page - Full multi-step form
 * Mantiene il flusso originale per retrocompatibilità
 */
export default function RegisterLegacyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-medium mb-2">Registrazione Gallerista (Legacy)</h1>
          <p className="text-muted-foreground">
            Unisciti ad artpay come gallerista e inizia a vendere le tue opere
          </p>
        </div>
        <MultiStepForm />
      </div>
    </div>
  );
}
