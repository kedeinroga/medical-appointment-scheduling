/**
 * Utility functions for masking Personally Identifiable Information (PII)
 * in logs and responses to protect sensitive medical data.
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
