"use client";

import { UseFormReturn } from "react-hook-form";
import { RegistrationFormData } from "@/lib/validation";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentStepProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function PaymentStep({ form }: PaymentStepProps) {
  const paymentMode = form.watch("payment.payment_mode");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="payment.payment_mode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Metodo di pagamento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un metodo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="bank_transfer">Bonifico bancario</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Campi per Bonifico Bancario */}
      {paymentMode === "bank_transfer" && (
        <>
          <FormField
            control={form.control}
            name="payment.bank_account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di conto bancario</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo di conto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checking">Conto corrente</SelectItem>
                    <SelectItem value="savings">Conto risparmio</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment.bank_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome della banca</FormLabel>
                <FormControl>
                  <Input placeholder="es. Intesa Sanpaolo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment.account_holder_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intestatario del conto</FormLabel>
                <FormControl>
                  <Input placeholder="Nome e cognome intestatario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment.iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input placeholder="IT60 X054 2811 1010 0000 0123 456" {...field} />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Codice IBAN per bonifici internazionali
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="payment.aba_routing_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice ABI/CAB</FormLabel>
                  <FormControl>
                    <Input placeholder="es. 03069" {...field} />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Codice di routing bancario
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment.destination_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valuta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona valuta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="payment.bank_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indirizzo della banca</FormLabel>
                <FormControl>
                  <Input placeholder="Via della banca, città" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment.bank_account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero di conto bancario</FormLabel>
                <FormControl>
                  <Input placeholder="Inserisci il numero di conto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {/* Campi per PayPal */}
      {paymentMode === "paypal" && (
        <FormField
          control={form.control}
          name="payment.paypal_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email PayPal</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tuoemail@paypal.com" {...field} />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                Inserisci l&apos;email associata al tuo account PayPal
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Campi per Stripe */}
      {paymentMode === "stripe" && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            La configurazione di Stripe verrà completata dopo l&apos;approvazione del tuo account.
            Riceverai le istruzioni via email.
          </p>
        </div>
      )}

      {/* Messaggio se non è stato selezionato nulla */}
      {!paymentMode && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Seleziona un metodo di pagamento per continuare
          </p>
        </div>
      )}
    </div>
  );
}