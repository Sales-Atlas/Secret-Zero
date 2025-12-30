# Vercel Deployment Guide

## Prerequisites

1. Vercel account (https://vercel.com)
2. Vercel CLI installed (`npm i -g vercel`)
3. Stytch and Infisical configured (see other guides)
4. Generated RSA key pair

## Step 1: Generate RSA Keys

Generate an RSA key pair for data encryption:

```bash
# Generate private key (2048-bit)
openssl genrsa -out private.pem 2048

# Generate public key
openssl rsa -in private.pem -pubout -out public.pem

# Display private key (for copying)
cat private.pem

# Display public key (for copying)
cat public.pem
```

**IMPORTANT:** Store the private key securely! Never commit it to the repository.

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

## Step 3: Configure Environment Variables

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

#### Infisical Variables

| Name | Value | Environment |
|------|-------|-------------|
| `INFISICAL_CLIENT_ID` | `xxx-xxx` | Production, Preview, Development |
| `INFISICAL_CLIENT_SECRET` | `xxx-xxx` | Production, Preview, Development |
| `INFISICAL_PROJECT_ID` | `xxx-xxx` | Production, Preview, Development |
| `INFISICAL_SITE_URL` | `https://app.infisical.com` | Production, Preview, Development |
| `INFISICAL_ENVIRONMENT` | `prod` | Production |
| `INFISICAL_ENVIRONMENT` | `dev` | Preview, Development |

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

#### Webhooks (optional)

| Name | Value | Environment |
|------|-------|-------------|
| `ADMIN_WEBHOOK_URL` | `https://hooks.slack.com/...` | Production |
| `WEBHOOK_SECRET` | `your-secret` | Production |
| `STYTCH_WEBHOOK_SECRET` | `whsec_xxx` | Production |

### Via CLI

```bash
# Add variable
vercel env add STYTCH_PROJECT_ID

# Or from file
vercel env add SERVER_PRIVATE_KEY < private.pem
```

## Step 4: Deploy

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

## Step 5: Configure Domain

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

## Step 6: Verify Deployment

### Post-deployment Checklist

- [ ] `/login` page works and displays form
- [ ] Magic link is sent to email
- [ ] Magic link authentication works
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
   - Check if it redirects to `/deposit/{org}`

3. **Deposit test:**
   - Fill in the form
   - Check in Infisical if secret was saved

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

### Problem: "Environment variable not found"

1. Check if variable is added for the correct environment
2. Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

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
