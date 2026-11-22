# Sign-in: real identity providers as a drop-in for the sandbox

Written 2026-11-22 for mentor feedback item 1. Status: research and contract design. Nothing here is built yet.
Contract changes: `docs/api/openapi.yaml`, version `1.1.0-draft.3` (Auth tag).

## 1. What the mentor asked

The sign-in module must accept mObywatel and Profil Zaufany (trusted profile), including the mobile-phone steps, without a rewrite.
Today the only working provider is `sandbox_id`. The contract already names `login_gov_pl` as "coming", but it has no flow for it.

## 2. How the Polish options fit together

mObywatel and Profil Zaufany are not separate services that we integrate one by one.
They are **means of identification** behind one broker: the **Węzeł Krajowy** (National Node, `login.gov.pl`), run by the Ministry of Digital Affairs and COI.
The user picks the method on the login.gov.pl page. Our service sees one SAML response, whatever the method was.

| Method on login.gov.pl | What the user does on the phone | Notes |
|---|---|---|
| Profil Zaufany | Types a one-time code that arrives by SMS on the phone number in the profile | The phone number stays with Profil Zaufany. We never see it |
| mObywatel app | Confirms the login in the app (QR code or push) | Listed by secondary sources as connected to the node. **Confirm on the integration environment** |
| e-dowód (ID card with chip) | Reads the card with NFC on the phone, plus the PIN | High assurance |
| Online banking | Signs in to the bank | Bank identities reach the node through the banks and KIR |

So the "mobile numbers and stuff" part is handled by Profil Zaufany and mObywatel, not by us.
This is a privacy gain: we do not store phone numbers.

## 3. Comparison

| | Węzeł Krajowy (login.gov.pl) | mojeID (KIR, bank identity) | Own SMS one-time code | Sandbox (today) |
|---|---|---|---|---|
| Covers mObywatel and Profil Zaufany | **Yes** (all methods in §2) | No (banks only) | No | No |
| Protocol | SAML 2.0, eIDAS profile. AuthnRequest by HTTP-POST, response by HTTP-Artifact, then `ArtifactResolve` over SOAP | OpenID Connect or SAML 2.0 through a broker (for example Signicat) | Our own REST | Our own REST |
| Crypto | Elliptic-curve keys. Signed requests. Encrypted assertion. **Separate keys** for signing and decryption | Broker handles it | None beyond TLS | None |
| Private companies allowed | **Yes.** Set `SPType=private`. Private services use `podmiotyzewnetrzne.login.gov.pl` | Yes, after KIR screening (about 2 weeks) and a contract | Yes | n/a |
| Onboarding | (1) Letter signed with Profil Zaufany or e-dowód signature: access to the integration environment `int.login.gov.pl`. (2) Tests. (3) Application to the Minister of Digital Affairs, signed with a **qualified** signature: production access | Contract with KIR, broker account, sandbox first | SMS gateway contract | None |
| Attributes returned | `PersonIdentifier` (PESEL), `CurrentGivenName`, `CurrentFamilyName`, `DateOfBirth`. Optional: `BirthName`, `CurrentAddress`, `Gender`, `PlaceOfBirth` | Depends on the KIR contract (name, national ID number, address) | A verified phone number only | Demo identity |
| Assurance (eIDAS LoA) | `low`, `substantial`, `high` (we ask for `substantial`) | `substantial` | Below `low` (phone only) | None |
| Cost | No fee found in the documentation we read. **To confirm** | Paid per authentication (broker and KIR) | Paid per SMS | Free |
| Fits the licence rule | Yes, with `pysaml2` (Apache-2.0) and `xmlsec` (MIT), which support HTTP-Artifact | Yes (standard OIDC client) | Yes | Yes |
| Time to production | Weeks (signed letters, tests, qualified signature) | Weeks | Days | Live |

**Recommendation.** Build one provider interface now. Make the Węzeł Krajowy the first real provider, because it covers mObywatel, Profil Zaufany, e-dowód and banks through one integration.
Keep the sandbox for the demo and for tests. Add mojeID later only if a partner needs it. Do not build our own SMS codes: they verify a phone, not a person, and they add personal data.

## 4. Data protection rules for real identities

1. **Never store the PESEL.** The backend turns `PersonIdentifier` into a pairwise subject: `HMAC-SHA256(IDENTITY_PEPPER, provider + ":" + PersonIdentifier)`. Only this value goes into `users.provider_subject`.
2. Ask only for the four mandatory attributes. Drop `DateOfBirth` right after the check, unless a later task needs an age check.
3. Show the name to the user for confirmation. Store `displayName` only when the user keeps it on the registration form.
4. `identityVerified` is true only for a real provider. `assuranceLevel` says how strong the check was.
5. Registration still asks for role, affiliation, interests and the terms. The identity provider replaces only the `providerSubject` field.

## 5. Contract design (draft 3)

The sandbox keeps its direct calls, so nothing breaks. Real providers use a redirect flow. The browser goes to the provider and back to the **backend**, never to the frontend with identity data.

```
web server                      api                                   login.gov.pl
    | POST /auth/login_gov_pl/start  |                                      |
    | {intent, returnTo}             |                                      |
    |------------------------------->| builds signed AuthnRequest           |
    |<-------------------------------| {redirectUrl, expiresAt}             |
 browser -> redirectUrl (api page that auto-posts SAMLRequest + RelayState) |
    |                                |------------------------------------->|
    |                                |       user picks PZ / mObywatel ...  |
    |                                |<---- POST /auth/login_gov_pl/acs ----|  (SAMLart)
    |                                | ArtifactResolve (SOAP), decrypt,     |
    |                                | pairwise subject, one-time code      |
 browser <- 303 to returnTo?code=... |                                      |
    | POST /auth/exchange {code}     |                                      |
    |------------------------------->|                                      |
    |<-------------------------------| Session (known user)                 |
    |                                | or RegistrationTicket (new user)     |
    | POST /auth/register {registrationTicket, role, ...}                   |
```

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/auth/providers` | Adds `flow` (`direct`, `redirect`), `assuranceLevel`, `methods` (`profil_zaufany`, `mobywatel`, `e_dowod`, `bank`, `eidas`) and `kind: oidc` for later providers. New fields are optional |
| `POST /api/v1/auth/{provider}/start` | Starts a redirect sign-in. Body `{intent: login \| register, returnTo}`. `returnTo` must be an allowed web origin. Returns `{redirectUrl, expiresAt}` |
| `GET /api/v1/auth/{provider}/redirect` | Backend page that auto-posts the signed `SAMLRequest`. The frontend only sends the browser here |
| `POST /api/v1/auth/{provider}/acs` | Assertion consumer service for SAML (form field `SAMLart`). Not called by our frontend |
| `GET /api/v1/auth/{provider}/callback` | Same role for OIDC providers (`code`, `state`) |
| `POST /api/v1/auth/exchange` | Swaps the one-time code (60 s, single use) for a `Session`, or for a `RegistrationTicket` with a name to confirm |
| `POST /api/v1/auth/register` | Accepts `registrationTicket` in place of `provider` + `providerSubject` |
| `POST /api/v1/auth/logout` | Can now return `200 {redirectUrl}` when the provider needs single logout (SLO). The sandbox still returns `204` |

New error codes: `auth_cancelled`, `auth_failed`, `state_invalid`, `assurance_too_low`, `provider_unavailable`.

## 6. Configuration (no secrets in git)

| Variable | Use |
|---|---|
| `AUTH_PROVIDERS` | Enabled providers, for example `sandbox_id,login_gov_pl` |
| `IDENTITY_PEPPER` | Secret for the pairwise subject. Long and random. Never rotate without a migration |
| `WK_ENV` | `int` or `prod` |
| `WK_ISSUER`, `WK_PROVIDER_NAME` | Values that COI gives after the first letter |
| `WK_ACS_URL` | `https://demo.delta43.net/api/v1/auth/login_gov_pl/acs` |
| `WK_SIGN_KEY_FILE`, `WK_SIGN_CERT_FILE` | Signing key pair (mounted file, not in the image) |
| `WK_ENC_KEY_FILE`, `WK_ENC_CERT_FILE` | Decryption key pair. Must differ from the signing pair |
| `WK_TRUST_CA_FILE` | login.gov.pl certificates (production certificates changed on 2026-07-03) |

## 7. Open points

- Confirm on `int.login.gov.pl` that the mObywatel app is offered to `SPType=private` services.
- Confirm that integration is free of charge for private entities.
- Decide who signs the applications: PCI as the operator is the natural owner after the hackathon.
- Re-read the integrator manual (version 2.3, in the documentation set version 8.0 of 2026-08-10) before coding. It changed binding twice (Artifact, then POST, then back to Artifact).

## Sources

- Ministry of Digital Affairs, [Węzeł Krajowy: integration documentation](https://www.gov.pl/web/cyfryzacja/wezel-krajowy---dokumentacja-dotyczaca-integracji-z-wezlem-krajowym), documentation set version 8.0 (2026-08-10), with the DU integrator manual (attachment 2) and the connection conditions (attachment 1).
- Certum, [Krajowy Węzeł Tożsamości a sektor prywatny](https://www.certum.pl/pl/aktualnosci/krajowy-wezel-tozsamosci-a-sektor-prywatny-jak-firmy-moga-z-niego-korzystac/) (vendor article, 2025-07-22).
- Bankier.pl, [Logowanie do KSeF przez mObywatela](https://www.bankier.pl/wiadomosc/Logowanie-do-KSeF-przez-mObywatela-Minister-cyfryzacji-zabral-glos-9081704.html).
- Signicat, [mojeID OIDC integration](https://developer.signicat.com/identity-methods/mojeid/integration/oidc/) and [prerequisites](https://developer.signicat.com/identity-methods/mojeid/integration/prerequisites/).
- KIR, [mojeID](https://www.kir.pl/en/our-products/companies/identity-and-e-signature/mojeid).
