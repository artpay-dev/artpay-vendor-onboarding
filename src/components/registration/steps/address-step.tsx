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

interface AddressStepProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function AddressStep({ form }: AddressStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="address.address_1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Indirizzo</FormLabel>
            <FormControl>
              <Input placeholder="Via Roma, 123" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address.address_2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Indirizzo (riga 2)</FormLabel>
            <FormControl>
              <Input placeholder="Interno, scala, piano (opzionale)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="address.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Città</FormLabel>
              <FormControl>
                <Input placeholder="Milano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia</FormLabel>
              <FormControl>
                <Input placeholder="MI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="address.country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paese</FormLabel>
              <FormControl>
                <Input placeholder="Italia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CAP</FormLabel>
              <FormControl>
                <Input placeholder="20121" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="address.phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numero di telefono</FormLabel>
            <FormControl>
              <Input type="tel" placeholder="+39 02 1234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}