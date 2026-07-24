import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function SubscriptionCancelPage() {
  return (
    <div className="container max-w-2xl mx-auto p-6 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-full">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-heading">Checkout annullato</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Hai annullato il processo di pagamento. Puoi abbonarti in qualsiasi momento.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/subscription">Torna ai piani</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}