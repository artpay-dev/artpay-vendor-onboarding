import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessCardProps {
  onReset: () => void;
}

export function SuccessCard({ onReset }: SuccessCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-success" />
        </div>
        <CardTitle className="font-heading text-3xl">
          Registrazione completata!
        </CardTitle>
        <CardDescription className="text-base">
          La tua richiesta è stata inviata con successo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-6 rounded-lg space-y-3">
          <h3 className="font-heading font-medium text-lg">
            Cosa succede ora?
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Il nostro team amministrativo riceverà la tua richiesta di registrazione
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Verificheremo i tuoi dati e ti contatteremo via email entro 2-3 giorni lavorativi
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Una volta approvato il tuo account, potrai accedere alla piattaforma e iniziare a vendere le tue opere
              </span>
            </li>
          </ul>
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Riceverai una email di conferma all&apos;indirizzo che hai fornito.
            <br />
            Controlla anche la cartella spam se non la ricevi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReset}
          >
            Nuova registrazione
          </Button>
          <Button
            className="flex-1"
            onClick={() => window.open(process.env.NEXT_PUBLIC_ARTPAY_URL || "https://artpay.art", "_blank")}
          >
            Visita artpay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}