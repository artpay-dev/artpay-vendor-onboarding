import { MultiStepForm } from "@/components/registration/multi-step-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-medium mb-2">Registrazione Gallerista</h1>
          <p className="text-muted-foreground">
            Unisciti ad artpay come gallerista e inizia a vendere le tue opere
          </p>
        </div>
        <MultiStepForm />
      </div>
    </div>
  );
}