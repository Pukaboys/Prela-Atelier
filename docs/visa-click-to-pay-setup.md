# Visa Click to Pay Sandbox Setup

This project is prepared for Visa Developer Center Click to Pay using Two-Way SSL.

## Files You Downloaded

- `cert.pem`: likely the Visa client certificate for this project.
- `SBX-2024-Prod-Root.pem`: Visa sandbox root CA certificate.
- `SBX-2024-Prod-Inter.pem`: Visa sandbox issuing/intermediate CA certificate.
- `DigiCertGlobalRootG2.crt.pem`: DigiCert root CA certificate.

You still need the matching private key for `cert.pem`. Visa Two-Way SSL requires both:

- client certificate
- matching private key

If `cert.pem` contains both the certificate and private key, you will see a block like `BEGIN PRIVATE KEY` or `BEGIN RSA PRIVATE KEY` inside it. Do not share that content.

## Recommended Local Layout

Create this folder locally, but do not commit it:

```text
secrets/
  visa/
    cert.pem
    private-key.pem
    visa-ca-bundle.pem
```

The repository already ignores `*.pem`, so these files should stay out of git.

## CA Bundle

`visa-ca-bundle.pem` should contain the CA certificates Visa requires for sandbox validation. Usually that means concatenating:

```text
SBX-2024-Prod-Root.pem
SBX-2024-Prod-Inter.pem
DigiCertGlobalRootG2.crt.pem
```

Keep the full PEM blocks intact.

## Environment Variables

Use these in `.env`:

```env
VISA_API_BASE_URL="https://sandbox.api.visa.com"
VISA_API_USERNAME="your-visa-project-username"
VISA_CLIENT_CERT_PATH="./secrets/visa/cert.pem"
VISA_CLIENT_KEY_PATH="./secrets/visa/private-key.pem"
VISA_CLIENT_KEY_PASSPHRASE=""
VISA_CA_BUNDLE_PATH="./secrets/visa/visa-ca-bundle.pem"
```

Never use `NEXT_PUBLIC_` for Visa credentials.

For Vercel, paste the PEM contents into environment variables instead of using file paths:

```env
VISA_CLIENT_CERT_PEM="-----BEGIN CERTIFICATE-----..."
VISA_CLIENT_KEY_PEM="-----BEGIN PRIVATE KEY-----..."
VISA_CA_BUNDLE_PEM="-----BEGIN CERTIFICATE-----..."
```

The app accepts either the local `*_PATH` variables or the Vercel-friendly `*_PEM` variables.

## Next Information Needed

To complete the integration, collect these from the Visa portal:

- the exact Click to Pay API endpoint path
- request payload example
- response payload example
- whether the API uses only Two-Way SSL or also requires X-Pay Token
- sandbox test card/user data
