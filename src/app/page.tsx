import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="font-heading text-5xl font-medium">
          Benvenuto su artpay
        </h1>
        <p className="text-muted-foreground text-lg">
          Unisciti al nostro marketplace e inizia a vendere le tue opere oggi stesso
        </p>
        <div className="pt-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Inizia la registrazione
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
