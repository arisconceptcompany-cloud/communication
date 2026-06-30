const DEV_FALLBACK = "dev-valueit-intranet-secret-change-me-prod";

export function getAuthSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET doit être défini en production (min. 16 caractères)."
    );
  }

  return new TextEncoder().encode(secret || DEV_FALLBACK);
}
