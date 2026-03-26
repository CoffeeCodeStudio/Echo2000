/**
 * Sanitize an avatar URL by converting any signed storage URL
 * (/object/sign/...) to a public URL (/object/public/...) and
 * stripping the ?token=... query string.
 *
 * Returns the cleaned URL, or the original value if no fix is needed.
 */
export function sanitizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let cleaned = url.replace('/object/sign/', '/object/public/');
  cleaned = cleaned.replace(/\?token=.*$/, '');
  return cleaned;
}
