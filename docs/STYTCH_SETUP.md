# Stytch B2B Configuration Guide

## Prerequisites

- Stytch account (https://stytch.com)
- Access to Stytch Dashboard

## Step 1: Create B2B Project

1. Log in to [Stytch Dashboard](https://stytch.com/dashboard)
2. Click **"Create new project"**
3. Select project type: **B2B SaaS**
4. Name your project (e.g., `ISCP-Production`)
5. Save the credentials:
   - `STYTCH_PROJECT_ID` - found in API Keys
   - `STYTCH_SECRET` - found in API Keys

## Step 2: Configure Authentication Methods

### Email Magic Links (required)

1. Go to **Authentication** → **Email Magic Links**
2. Enable **Email Magic Links**
3. Configure:
   - **Login expiration**: 30 minutes (recommended)
   - **Signup expiration**: 60 minutes

### OAuth (optional)

1. Go to **Authentication** → **OAuth**
2. Enable **Google OAuth** or **Microsoft OAuth** as needed
3. Configure OAuth credentials

### SMS OTP - DISABLE!

**IMPORTANT:** SMS OTP must be disabled due to Toll Fraud risk.

1. Go to **Authentication** → **SMS OTP**
2. Make sure it is **disabled**

## Step 3: Configure Opaque Errors (CRITICAL)

Opaque Errors prevent account enumeration attacks.

1. Go to **Project Settings** → **Security**
2. Find the **"Error handling"** section
3. Enable **"Opaque Error Mode"**

After enabling:
- API always returns code 200 on login attempts
- Attackers cannot verify if an email exists in the system

## Step 4: Configure Discovery Flow

Discovery Flow allows users to log in without knowing their organization.

1. Go to **Authentication** → **Discovery**
2. Enable **Discovery Flow**
3. Configure **Discovery Redirect URL**:
   - Development: `http://localhost:3000/authenticate`
   - Production: `https://your-domain.com/authenticate`

## Step 5: Configure JIT Provisioning

Just-in-Time Provisioning automatically creates accounts for new users.

1. Go to **Organizations** → **Settings**
2. In the **"JIT Provisioning"** section:
   - Set `email_jit_provisioning` to **RESTRICTED**
   - Add allowed domains in `email_allowed_domains`

### Example allowed domains:
```
client1.com
client2.com
partner-company.eu
```

**WARNING:** Do NOT add public domains like `gmail.com` or `outlook.com`!

## Step 6: Custom Email Templates

1. Go to **Emails** → **Templates**
2. Create a new template or edit an existing one
3. Change the content to be appropriate for secret deposit:

### Example template:
```
Subject: Secure Credential Transfer

Body:
Hello,

You are receiving this link to securely transfer credentials 
to [Consulting Company Name].

Click the link below to continue:
{{magic_link}}

This link expires in {{expiration_minutes}} minutes.

If you did not request this link, please ignore this message.
```

## Step 7: Configure Redirect URLs

1. Go to **Project Settings** → **Redirect URLs**
2. Add authorized URLs:

### Development:
- `http://localhost:3000/authenticate`
- `http://localhost:3000/dashboard`

### Production:
- `https://your-domain.com/authenticate`
- `https://your-domain.com/dashboard`

## Step 8: Configure Authorized Origins

1. Go to **Project Settings** → **SDK Configuration**
2. Add **Authorized Origins**:

### Development:
- `http://localhost:3000`

### Production:
- `https://your-domain.com`

## Configuration Verification

### Checklist:
- [ ] B2B SaaS project type
- [ ] Email Magic Links enabled
- [ ] SMS OTP disabled
- [ ] Opaque Errors enabled
- [ ] Discovery Flow configured
- [ ] JIT Provisioning set to RESTRICTED
- [ ] Email templates customized
- [ ] Redirect URLs configured
- [ ] Authorized Origins added

## Environment Variables to Save

```env
STYTCH_PROJECT_ID=project-xxx-xxx
STYTCH_SECRET=secret-xxx-xxx
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-xxx
```

## Troubleshooting

### Problem: "Organization not found"
- Check if Discovery Flow is enabled
- Make sure the user has an assigned organization

### Problem: Magic Link not working
- Check Redirect URLs
- Check if email template is active
- Check logs in Stytch Dashboard

### Problem: User cannot register
- Check JIT Provisioning settings
- Check if domain is in `email_allowed_domains`
