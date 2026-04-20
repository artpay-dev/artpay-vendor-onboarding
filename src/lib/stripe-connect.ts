/**
 * Stripe Connect Integration
 * Gestisce la creazione di Connected Accounts e Account Links per vendor onboarding
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/**
 * Inizializza Stripe SDK
 */
async function getStripeClient() {
  const Stripe = (await import('stripe')).default;
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

export interface CreateConnectedAccountParams {
  email: string;
  businessName: string;
  country?: string;
}

export interface CreateAccountLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

/**
 * Crea un nuovo Connected Account su Stripe (Express type)
 */
export async function createConnectedAccount(
  params: CreateConnectedAccountParams
): Promise<string> {
  const stripe = await getStripeClient();

  console.log('Creating Stripe Connected Account for:', params.email);

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: params.country || 'IT',
      email: params.email,
      business_type: 'company',
      company: {
        name: params.businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('Stripe Connected Account created:', account.id);
    return account.id;
  } catch (error: any) {
    console.error('Failed to create Stripe Connected Account:', error);
    throw new Error(
      `Failed to create Stripe account: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Crea un Account Link per l'onboarding del vendor
 */
export async function createAccountLink(
  params: CreateAccountLinkParams
): Promise<string> {
  const stripe = await getStripeClient();

  console.log('Creating Account Link for account:', params.accountId);

  try {
    const accountLink = await stripe.accountLinks.create({
      account: params.accountId,
      refresh_url: params.refreshUrl,
      return_url: params.returnUrl,
      type: 'account_onboarding',
    });

    console.log('Account Link created:', accountLink.url);
    return accountLink.url;
  } catch (error: any) {
    console.error('Failed to create Account Link:', error);
    throw new Error(
      `Failed to create account link: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Verifica lo stato di un Connected Account
 */
export async function getAccountStatus(accountId: string) {
  const stripe = await getStripeClient();

  console.log('Getting status for account:', accountId);

  try {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        errors: account.requirements?.errors || [],
        pendingVerification: account.requirements?.pending_verification || [],
      },
    };
  } catch (error: any) {
    console.error('Failed to get account status:', error);
    throw new Error(
      `Failed to get account status: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Crea un Login Link per accedere alla Stripe Express Dashboard
 */
export async function createLoginLink(accountId: string): Promise<string> {
  const stripe = await getStripeClient();

  console.log('Creating login link for account:', accountId);

  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    console.log('Login link created');
    return loginLink.url;
  } catch (error: any) {
    console.error('Failed to create login link:', error);
    throw new Error(
      `Failed to create login link: ${error.message || 'Unknown error'}`
    );
  }
}
