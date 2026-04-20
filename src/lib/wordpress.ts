/**
 * WordPress/MultivendorX Integration
 * Gestisce la creazione di vendor su WordPress
 */

export interface CreateVendorParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
}

export interface CreateVendorResponse {
  wpUserId: number;
  mvxVendorId: number;
  wpUsername: string;
  consumerKey: string;
  consumerSecret: string;
}

/**
 * Crea un nuovo vendor su WordPress/MultivendorX
 */
export async function createWordPressVendor(
  params: CreateVendorParams
): Promise<CreateVendorResponse> {
  const wpApiUrl = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

  if (!wpApiUrl) {
    throw new Error('Missing NEXT_PUBLIC_ARTPAY_SERVER_URL');
  }

  // Genera username dal business name
  const username = params.businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .substring(0, 60);

  // Dati per WordPress API
  const vendorData = {
    login: username,
    email: params.email,
    password: params.password,
    first_name: params.firstName,
    last_name: params.lastName,
    nice_name: username,
    display_name: params.businessName,
    // Indirizzo vuoto per ora (potrà aggiornare dopo)
    address: {
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      country: '',
      postcode: '',
      phone: '',
    },
    // Payment mode - verrà configurato dopo con Stripe
    payment: {
      payment_mode: 'stripe',
      bank_account_type: '',
      bank_name: '',
      bank_account_number: '',
      bank_address: '',
      account_holder_name: '',
      aba_routing_number: '',
      destination_currency: 'EUR',
      iban: '',
      paypal_email: '',
    },
  };

  console.log('Creating WordPress vendor:', { username, email: params.email });

  try {
    const response = await fetch(`${wpApiUrl}/wp-json/mvx/v1/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vendorData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('WordPress API error:', errorData);
      throw new Error(
        errorData?.message || `WordPress API failed with status ${response.status}`
      );
    }

    const result = await response.json();

    console.log('WordPress vendor created successfully:', {
      userId: result.id,
      username: result.login,
      email: result.email,
    });

    // In MultivendorX, il vendor ID è lo stesso dell'user ID
    const userId = result.id;

    // Estrai le credenziali dalla risposta
    return {
      wpUserId: userId,
      mvxVendorId: userId, // In MVX vendor ID = user ID
      wpUsername: result.login || username,
      consumerKey: result.consumer_key || result.consumerKey || '',
      consumerSecret: result.consumer_secret || result.consumerSecret || '',
    };
  } catch (error) {
    console.error('Failed to create WordPress vendor:', error);
    throw error;
  }
}

/**
 * Aggiorna il payment mode del vendor su WordPress a stripe_masspay
 */
export async function updateVendorStripeAccount(
  wpUserId: number,
  stripeAccountId: string
): Promise<void> {
  const wpApiUrl = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

  if (!wpApiUrl) {
    throw new Error('Missing NEXT_PUBLIC_ARTPAY_SERVER_URL');
  }

  console.log('Updating payment mode to stripe_masspay for WordPress user:', wpUserId);

  try {
    // Aggiorna il vendor con payment_mode = stripe_masspay
    const response = await fetch(
      `${wpApiUrl}/wp-json/mvx/v1/vendors/${wpUserId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            payment_mode: 'stripe_masspay',
            bank_account_type: 'current',
            bank_name: '',
            bank_account_number: '',
            bank_address: '',
            account_holder_name: '',
            aba_routing_number: '',
            destination_currency: '',
            iban: '',
            paypal_email: '',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('Failed to update payment mode on WordPress:', response.status, errorData);
      // Non fallire se questo update non riesce - Stripe è già configurato su Supabase
      return;
    }

    const result = await response.json();
    console.log('Payment mode updated to stripe_masspay on WordPress:', result.id);
  } catch (error) {
    console.error('Error updating payment mode on WordPress:', error);
    // Non fallire - non è critico
  }
}
