/**
 * Utility functions for masking Personally Identifiable Information (PII)
 * in logs and responses to protect sensitive medical data.
 * 
 * This is a shared utility that can be used across all layers of the application
 * to ensure consistent PII protection policies.
 */

/**
 * Masks an insured ID for logging purposes.
 * Shows only the first 2 digits and masks the rest with asterisks.
 * 
 * @param insuredId - The insured ID to mask (expected to be 5 digits)
 * @returns Masked insured ID (e.g., "12345" becomes "12***")
 * 
 * @example
 * ```typescript
 * maskInsuredId('12345') // Returns '12***'
 * maskInsuredId('123')   // Returns '***' (invalid length)
 * maskInsuredId('')      // Returns '***' (empty)
 * ```
 */
export function maskInsuredId(insuredId: string): string {
  if (!insuredId || insuredId.length !== 5) return '***';
  return `${insuredId.substring(0, 2)}***`;
}

/**
 * Masks a phone number for logging purposes.
 * Shows only the first 2 and last 2 digits.
 * 
 * @param phoneNumber - The phone number to mask
 * @returns Masked phone number
 * 
 * @example
 * ```typescript
 * maskPhoneNumber('987654321') // Returns '98*****21'
 * ```
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length < 4) return '***';
  if (phoneNumber.length <= 4) return '*'.repeat(phoneNumber.length);
  
  const start = phoneNumber.substring(0, 2);
  const end = phoneNumber.substring(phoneNumber.length - 2);
  const middle = '*'.repeat(phoneNumber.length - 4);
  return `${start}${middle}${end}`;
}

/**
 * Masks an email address for logging purposes.
 * Shows first 2 characters of username and domain.
 * 
 * @param email - The email to mask
 * @returns Masked email
 * 
 * @example
 * ```typescript
 * maskEmail('john.doe@example.com') // Returns 'jo***@ex***'
 * ```
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return '***@***';
  
  const maskedUsername = username.length > 2 ? `${username.substring(0, 2)}***` : '***';
  const maskedDomain = domain.length > 2 ? `${domain.substring(0, 2)}***` : '***';
  
  return `${maskedUsername}@${maskedDomain}`;
}
