import { BasicOnboardingForm } from "@/components/registration/basic-onboarding-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-medium mb-2">Registrazione Vendor</h1>
          <p className="text-muted-foreground text-balance max-w-lg mx-auto leading-6">
              Inizia il processo di onboarding inserendo i tuoi dati. <br /> Potrai completare la registrazione in più step.
          </p>
        </div>
        <BasicOnboardingForm />
      </div>
    </div>
  );
}