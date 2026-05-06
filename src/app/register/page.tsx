import { BasicOnboardingForm } from "@/components/registration/basic-onboarding-form";
import { Clock } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="text-center mb-6">
          <h1 className="font-heading text-4xl font-medium mb-2">Registrazione Vendor</h1>
          <p className="text-muted-foreground text-balance max-w-lg mx-auto leading-6">
            Inizia il processo di onboarding inserendo i tuoi dati. Potrai completare la registrazione in più step.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-6 px-6">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100 text-sm">Completabile in circa 15 minuti</p>
              <p className="text-sm text-green-800 dark:text-green-200 mt-0.5">
                La procedura è completamente guidata: registrazione, firma del contratto e configurazione dei pagamenti. Tieni a portata di mano un documento d&apos;identità e le coordinate bancarie (IBAN).
              </p>
            </div>
          </div>
        </div>

        <BasicOnboardingForm />
      </div>
    </div>
  );
}