/**
 * Add stripe_details_submitted field to track Stripe onboarding completion
 */

ALTER TABLE vendor_onboardings
ADD COLUMN stripe_details_submitted BOOLEAN DEFAULT false;

COMMENT ON COLUMN vendor_onboardings.stripe_details_submitted IS
'Whether the vendor has submitted all required details to Stripe (details_submitted from Stripe API)';
