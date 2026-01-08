# Vercel Deployment Guide

This project is a Next.js app deployed on Vercel (Node.js runtime). It uses:
- Stytch B2B (Discovery Magic Links) for authentication
- Infisical for write-only secret storage
- Client-side encryption (RSA public key in browser, RSA private key on server)

## Prerequisites

1. Vercel account (https://vercel.com)
2. Vercel CLI installed (`npm i -g vercel`)
3. Stytch and Infisical configured (see other guides)
4. Generated RSA key pair

## Step 1: Generate RSA Keys

Generate an RSA key pair for data encryption:

```bash
# Generate private key (2048-bit, PKCS#8)
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem

# Generate public key
openssl pkey -in private.pem -pubout -out public.pem

# Display private key (for copying)
cat private.pem

# Display public key (for copying)
cat public.pem
```

**IMPORTANT:** Store the private key securely! Never commit it to the repository. This repo already ignores `*.pem` via `.gitignore`.

## Step 2: Connect Repository to Vercel

### Option A: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import repository from GitHub/GitLab/Bitbucket
3. Select project and click "Import"

### Option B: Via CLI

```bash
# Log in to Vercel
vercel login

# Link project
vercel link
```

## Step 3: Vercel Project Settings

In Vercel Dashboard → Project → Settings:

- **Framework Preset**: Next.js
- **Node.js Version**: 20.x (recommended)
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm build`
- **Output Directory**: (leave default; Next.js uses `.next`)

## Step 4: Configure Environment Variables

### Via Vercel Dashboard

1. Go to project in Vercel
2. Settings → Environment Variables
3. Add the following variables:

#### Stytch Variables

| Name | Value | Environment |
|------|-------|-------------|
| `STYTCH_PROJECT_ID` | `project-xxx-xxx` | Production, Preview, Development |
| `STYTCH_SECRET` | `secret-xxx-xxx` | Production, Preview, Development |
| `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` | `public-token-xxx` | Production, Preview, Development |
| `STYTCH_WEBHOOK_SECRET` | `whsec_xxx` | (Optional) Production, Preview, Development |

#### Infisical Variables

| Name | Value | Environment |
|------|-------|-------------|
| `INFISICAL_CLIENT_ID` | `xxx-xxx` | Production, Preview, Development |
| `INFISICAL_CLIENT_SECRET` | `xxx-xxx` | Production, Preview, Development |
| `INFISICAL_PROJECT_ID` | `xxx-xxx` | Production, Preview, Development |
| `INFISICAL_SITE_URL` | `https://app.infisical.com` | (Optional) Production, Preview, Development |
| `INFISICAL_ENVIRONMENT` | `prod` | (Optional, default: `prod`) Production |
| `INFISICAL_ENVIRONMENT` | `dev` | (Optional) Preview, Development |

#### Encryption Variables

| Name | Value | Environment |
|------|-------|-------------|
| `SERVER_PRIVATE_KEY` | Contents of `private.pem` | Production, Preview, Development |
| `NEXT_PUBLIC_SERVER_PUBLIC_KEY` | Contents of `public.pem` | Production, Preview, Development |

#### Application Variables

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-xxx.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

`NEXT_PUBLIC_APP_URL` is used to build the Stytch Discovery redirect URL:
- `${NEXT_PUBLIC_APP_URL}/authenticate`

If you omit it, the app falls back to `http://localhost:3000`, which will break production magic links.

#### Footer Configuration (optional)

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_FOOTER_LOGO_PATH` | `/logo.svg` | (Optional, default: `/logo.svg`. Set empty to hide) All environments |
| `NEXT_PUBLIC_FOOTER_LOGO_URL` | `https://your-company.com` | (Optional, defaults to `NEXT_PUBLIC_APP_URL` or `/`) All environments |
| `NEXT_PUBLIC_FOOTER_PRIVACY_URL` | `https://your-company.com/privacy` | (Optional, defaults to `NEXT_PUBLIC_APP_URL` or `/`) All environments |
| `NEXT_PUBLIC_FOOTER_COMPANY_NAME` | `Secret Zero by Grzegorz Zawłodzki` | (Optional, default provided) All environments |

Notes:
- These variables control the footer displayed on all pages
- `NEXT_PUBLIC_FOOTER_LOGO_PATH` supports either a path to an asset in `public/` (e.g. `public/your-logo.png` → set `NEXT_PUBLIC_FOOTER_LOGO_PATH=/your-logo.png`) or an `https://...` URL to a remote logo
- If you set it to empty/blank, the footer logo is hidden (this project conditionally renders the logo in `components/footer.tsx`, `Footer`)
- `NEXT_PUBLIC_FOOTER_LOGO_URL` is the URL to navigate to when the logo is clicked (set to empty to disable the link)
- `NEXT_PUBLIC_FOOTER_PRIVACY_URL` is the URL for the privacy policy link (set to empty to disable the link)
- `NEXT_PUBLIC_FOOTER_COMPANY_NAME` is the company name displayed in the footer

#### Webhooks (optional)

| Name | Value | Environment |
|------|-------|-------------|
| `ADMIN_WEBHOOK_URL` | `https://hooks.slack.com/...` | Production |
| `WEBHOOK_SECRET` | `your-secret` | Production |

Notes:
- `ADMIN_WEBHOOK_URL` receives metadata-only notifications (no secret values). If `WEBHOOK_SECRET` is set, requests include `X-Webhook-Signature` (HMAC SHA-256 hex).
- Stytch webhook endpoint (optional): `POST https://your-domain.com/api/webhooks/stytch` (signature checked when `STYTCH_WEBHOOK_SECRET` is set).

### Via CLI

```bash
# Add a variable (interactive)
vercel env add STYTCH_PROJECT_ID production

# Or from file
vercel env add SERVER_PRIVATE_KEY production < private.pem
vercel env add NEXT_PUBLIC_SERVER_PUBLIC_KEY production < public.pem
```

## Step 5: Deploy

### Automatic deploy (recommended)

After connecting to GitHub, each push to `main` automatically deploys to production.

```bash
git push origin main
```

### Manual deploy

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Step 6: Configure Domain

### Add Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `secrets.yourcompany.com`
3. Configure DNS according to Vercel instructions

### Update Stytch

After configuring the domain, update in Stytch Dashboard:

1. **Redirect URLs:**
   - `https://secrets.yourcompany.com/authenticate`

2. **Authorized Origins:**
   - `https://secrets.yourcompany.com`

## Step 7: Verify Deployment

### Post-deployment Checklist

- [ ] `/login` page works and displays form
- [ ] Magic link is sent to email
- [ ] Magic link authentication works
- [ ] `/dashboard` loads after login
- [ ] Deposit form is accessible after login
- [ ] Secrets are saved in Infisical
- [ ] Vercel logs do not contain sensitive data

### Testing

1. **Login test:**
   ```
   https://your-domain.com/login
   ```

2. **Authentication test:**
   - Click the link from email
   - Check if it redirects to `/authenticate?...` and then to `/deposit/{orgSlug}`

3. **Deposit test:**
   - Fill in the form
   - Check in Infisical if secret was saved

4. **Stytch webhook (optional):**
   - `GET https://your-domain.com/api/webhooks/stytch` should return `{ "status": "ok" }`

## Monitoring

### Vercel Analytics

1. Enable Analytics in Vercel Dashboard
2. Monitor:
   - Error rate
   - Response times
   - Traffic patterns

### Logs

```bash
# View logs
vercel logs

# Real-time logs
vercel logs --follow
```

### Alerts

Configure alerts in Vercel Dashboard:
- Error rate > 1%
- Response time > 3s

## Troubleshooting

### Problem: build/runtime fails with "Invalid environment variables configuration"

This app validates env vars at startup (`env.ts`). Fix missing/invalid variables in Vercel and redeploy.

### Problem: "Environment variable not found"

1. Check if variable is added for the correct environment
2. Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

### Problem: magic link redirects to `http://localhost:3000`

Set `NEXT_PUBLIC_APP_URL` to your deployed domain for the target environment (Production/Preview). The redirect URL is built as `${NEXT_PUBLIC_APP_URL}/authenticate`.

### Problem: Stytch error "Invalid redirect URL" / "unauthorized origin"

1. Add the exact deployment domain in Stytch **Redirect URLs**:
   - `https://your-domain.com/authenticate`
2. Add the domain in Stytch **Authorized Origins**:
   - `https://your-domain.com`
3. If you rely on Vercel Preview URLs, you may need a stable staging domain because Preview URLs change per deployment.

### Problem: "Invalid RSA key"

1. Check key format (PEM)
2. Make sure the entire key is copied (including `-----BEGIN...-----`)
3. Check for extra whitespace characters

### Problem: "CORS error"

1. Check `Authorized Origins` in Stytch
2. Add Vercel domain to the list

### Problem: "Session expired" right after login

1. Check `Redirect URLs` in Stytch
2. Make sure the domain is correct
3. Check if `stytch_session_jwt` cookie is being set

## Rollback

In case of problems:

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

Or via Dashboard: Deployments → select deployment → Promote to Production

## Updates

### Update dependencies

```bash
pnpm update
git add pnpm-lock.yaml
git commit -m "chore: update dependencies"
git push
```

### Rotate RSA keys

1. Generate new key pair
2. Update variables in Vercel
3. Redeploy
4. Remove old keys
