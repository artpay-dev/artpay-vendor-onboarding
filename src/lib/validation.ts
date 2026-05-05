import { z } from "zod";

export const registrationSchema = z.object({
  // Step 1: Personal Information
  login: z
    .string()
    .min(3, "Il nome utente deve essere almeno di 3 caratteri")
    .max(60, "Il nome utente non può superare i 60 caratteri")
    .trim()
    .transform((val) =>
      val
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .refine((val) => val.length >= 3, {
      message: "Il nome utente deve essere almeno di 3 caratteri dopo la trasformazione",
    }),

  first_name: z
    .string()
    .min(2, "Il nome è obbligatorio")
    .max(50, "Il nome non può superare i 50 caratteri")
    .trim(),

  last_name: z
    .string()
    .min(2, "Il cognome è obbligatorio")
    .max(50, "Il cognome non può superare i 50 caratteri")
    .trim(),

  nice_name: z
    .string()
    .optional(),

  display_name: z
    .string()
    .min(2, "Il nome della galleria è obbligatorio")
    .max(100, "Il nome della galleria non può superare i 100 caratteri")
    .trim(),

  email: z
    .string()
    .email("Indirizzo email non valido")
    .trim()
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(6, "La password deve essere di almeno 6 caratteri")
    .max(100, "La password non può superare i 100 caratteri"),

  // Step 2: Address
  address: z.object({
    address_1: z.string().trim().optional(),
    address_2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    postcode: z
      .string()
      .regex(/^[0-9]{5}$/, "Il CAP deve essere di 5 cifre")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .regex(/^[+]?[0-9\s-()]+$/, "Numero di telefono non valido")
      .optional()
      .or(z.literal("")),
  }),

  // Step 3: Payment
  payment: z.object({
    payment_mode: z.string().optional(),
    bank_account_type: z.string().optional(),
    bank_name: z.string().trim().optional(),
    bank_account_number: z.string().trim().optional(),
    bank_address: z.string().trim().optional(),
    account_holder_name: z.string().trim().optional(),
    aba_routing_number: z
      .string()
      .regex(/^[0-9]{5,9}$/, "Codice ABI/CAB non valido")
      .optional()
      .or(z.literal("")),
    destination_currency: z.string().optional(),
    iban: z
      .string()
      .regex(
        /^[A-Z]{2}[0-9]{2}[A-Z0-9\s]{11,30}$/i,
        "Formato IBAN non valido"
      )
      .optional()
      .or(z.literal("")),
    paypal_email: z
      .string()
      .email("Email PayPal non valida")
      .trim()
      .transform((val) => val.toLowerCase())
      .optional()
      .or(z.literal("")),
  }),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// =====================================================
// NUOVO SCHEMA: Onboarding Step 1 (Basic Registration)
// =====================================================
export const basicOnboardingSchema = z.object({
  email: z
    .string()
    .email("Indirizzo email non valido")
    .trim()
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(6, "La password deve essere di almeno 6 caratteri")
    .max(100, "La password non può superare i 100 caratteri"),

  first_name: z
    .string()
    .min(2, "Il nome è obbligatorio")
    .max(50, "Il nome non può superare i 50 caratteri")
    .trim(),

  last_name: z
    .string()
    .min(2, "Il cognome è obbligatorio")
    .max(50, "Il cognome non può superare i 50 caratteri")
    .trim(),

  business_name: z
    .string()
    .min(2, "Il nome della galleria/attività è obbligatorio")
    .max(100, "Il nome non può superare i 100 caratteri")
    .trim(),

  ragione_sociale: z
    .string()
    .min(2, "La ragione sociale è obbligatoria")
    .max(150, "La ragione sociale non può superare i 150 caratteri")
    .trim(),

  partita_iva: z
    .string()
    .min(11, "La Partita IVA deve essere di 11 cifre")
    .max(16, "Partita IVA/Codice Fiscale non valido")
    .regex(/^[0-9]{11}$|^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i, "Formato Partita IVA non valido (11 cifre)")
    .trim(),

  indirizzo: z
    .string()
    .min(5, "L'indirizzo della sede è obbligatorio")
    .max(200, "L'indirizzo non può superare i 200 caratteri")
    .trim(),

  iban: z
    .string()
    .trim()
    .transform((val) => val.replace(/\s/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .min(15, "IBAN non valido")
        .max(34, "IBAN non valido")
        .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/, "Formato IBAN non valido (es. IT60X0542811101000000123456)")
    ),

});

export type BasicOnboardingData = z.infer<typeof basicOnboardingSchema>;