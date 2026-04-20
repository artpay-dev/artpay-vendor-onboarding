/**
 * Add temporary password field for WordPress vendor creation
 * This field stores the plaintext password temporarily during onboarding,
 * is used for WordPress account creation, then immediately cleared.
 */

-- Add temp_password column (nullable, will be cleared after use)
ALTER TABLE vendor_onboardings
ADD COLUMN temp_password TEXT;

-- Add comment explaining the purpose
COMMENT ON COLUMN vendor_onboardings.temp_password IS
'Temporary plaintext password storage for WordPress vendor creation. Cleared immediately after use.';
