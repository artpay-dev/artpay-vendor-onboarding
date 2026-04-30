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

interface PersonalInfoStepProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="login"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome utente</FormLabel>
            <FormControl>
              <Input
                placeholder="es. galleria-arte"
                {...field}
                onBlur={(e) => {
                  const transformed = e.target.value
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/--+/g, "-")
                    .replace(/^-+|-+$/g, "");
                  field.onChange(transformed);
                  field.onBlur();
                }}
              />
            </FormControl>
            <p className="text-sm text-muted-foreground">
              Sarà usato nell&apos;URL della tua galleria. Spazi e caratteri speciali verranno convertiti automaticamente.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Mario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cognome</FormLabel>
              <FormControl>
                <Input placeholder="Rossi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="display_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome della galleria</FormLabel>
            <FormControl>
              <Input placeholder="Galleria d'Arte Moderna" {...field} />
            </FormControl>
            <p className="text-sm text-muted-foreground">
              Il nome pubblico che vedranno i visitatori
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="mario.rossi@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Inserisci una password sicura" {...field} />
            </FormControl>
            <p className="text-sm text-muted-foreground">
              Minimo 6 caratteri
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}