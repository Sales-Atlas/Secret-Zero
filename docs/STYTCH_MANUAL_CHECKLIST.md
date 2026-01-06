# Stytch Configuration Manual Verification Checklist

This checklist guides you through manually verifying Stytch Dashboard configuration according to [STYTCH_SETUP.md](./STYTCH_SETUP.md).

**Date of Verification:** _______________
**Verified By:** _______________
**Environment:** □ Development  □ Production

---

## 1. Project Configuration

### Project Type
- [ ] Log in to [Stytch Dashboard](https://stytch.com/dashboard)
- [ ] Navigate to **Project Settings** → **General**
- [ ] Verify project type is **B2B SaaS** (NOT Consumer)
- [ ] Project name matches expected value: _______________

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 2. API Credentials

### Credentials Verification
- [ ] Navigate to **API Keys** section
- [ ] Copy `STYTCH_PROJECT_ID` and verify it's in `.env.local`
- [ ] Copy `STYTCH_SECRET` and verify it's in `.env.local`
- [ ] Copy `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` and verify it's in `.env.local`
- [ ] Webhook secret (if webhooks enabled): _______________

**Format Check:**
- [ ] `STYTCH_PROJECT_ID` starts with `project-`
- [ ] `STYTCH_SECRET` starts with `secret-`
- [ ] `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` starts with `public-token-`

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 3. Authentication Methods

### Email Magic Links (REQUIRED)
- [ ] Navigate to **Authentication** → **Email Magic Links**
- [ ] Email Magic Links are **ENABLED**
- [ ] Login expiration: **30 minutes** (recommended)
- [ ] Signup expiration: **60 minutes** (recommended)

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

### SMS OTP (MUST BE DISABLED)
- [ ] Navigate to **Authentication** → **SMS OTP**
- [ ] SMS OTP is **DISABLED**
- [ ] ⚠️ **CRITICAL:** SMS OTP poses Toll Fraud risk - must remain disabled

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

### OAuth (OPTIONAL)
- [ ] Navigate to **Authentication** → **OAuth**
- [ ] Google OAuth status: □ Enabled  □ Disabled
- [ ] Microsoft OAuth status: □ Enabled  □ Disabled
- [ ] If enabled, OAuth credentials are configured: □ Yes  □ No

**Status:** □ Pass  □ Fail  □ N/A
**Notes:** _______________________________________________

---

## 4. Security Configuration

### Opaque Error Mode (CRITICAL)
- [ ] Navigate to **Project Settings** → **Security**
- [ ] Find **"Error handling"** section
- [ ] **"Opaque Error Mode"** is **ENABLED**
- [ ] Test: Login with non-existent email returns generic success message
- [ ] Test: No difference in response time between valid/invalid emails

**Why Important:** Prevents account enumeration attacks

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 5. Discovery Flow

### Discovery Configuration
- [ ] Navigate to **Authentication** → **Discovery**
- [ ] Discovery Flow is **ENABLED**
- [ ] Discovery Redirect URL configured:
  - Development: `http://localhost:3000/authenticate`
  - Production: `https://your-domain.com/authenticate`
- [ ] Current redirect URL: _______________

**Test Discovery Flow:**
- [ ] Send discovery magic link to test email
- [ ] Click link in email
- [ ] Verify redirect to correct URL
- [ ] Organization selection screen appears (if multi-org user)

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 6. JIT Provisioning

### Just-in-Time Provisioning Settings
- [ ] Navigate to **Organizations** → **Settings**
- [ ] Find **"JIT Provisioning"** section
- [ ] `email_jit_provisioning` is set to **RESTRICTED**
- [ ] `email_allowed_domains` is configured with approved domains

**Allowed Domains List:**
```
(List all allowed domains here)
1. _______________
2. _______________
3. _______________
```

**Domain Security Check:**
- [ ] NO public domains (gmail.com, outlook.com, yahoo.com, etc.)
- [ ] Only company/client-specific domains
- [ ] All domains verified with stakeholders

**Why Important:** Prevents unauthorized users from auto-provisioning accounts

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 7. Email Templates

### Template Customization
- [ ] Navigate to **Emails** → **Templates**
- [ ] Magic link template exists
- [ ] Template customized for secure credential transfer context
- [ ] Template includes `{{magic_link}}` variable
- [ ] Template includes `{{expiration_minutes}}` variable
- [ ] Branding applied (logo, colors, company name)

**Example Email Content Check:**
- [ ] Subject line is professional and appropriate
- [ ] Body clearly explains purpose (credential transfer)
- [ ] Security warnings included
- [ ] "If you didn't request this" message included

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 8. Redirect URLs

### Authorized Redirect URLs
- [ ] Navigate to **Project Settings** → **Redirect URLs**
- [ ] All necessary redirect URLs are configured

**Development URLs:**
- [ ] `http://localhost:3000/authenticate`
- [ ] `http://localhost:3000/dashboard`

**Production URLs:**
- [ ] `https://your-domain.com/authenticate`
- [ ] `https://your-domain.com/dashboard`
- [ ] All production URLs use HTTPS (no HTTP)
- [ ] No localhost URLs in production list

**Current Redirect URLs:**
```
1. _______________
2. _______________
3. _______________
4. _______________
```

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 9. Authorized Origins

### SDK Configuration - Authorized Origins
- [ ] Navigate to **Project Settings** → **SDK Configuration**
- [ ] Find **"Authorized Origins"** section

**Development:**
- [ ] `http://localhost:3000` is listed

**Production:**
- [ ] Production domain is listed (e.g., `https://your-domain.com`)
- [ ] All subdomains needed are listed
- [ ] All origins use HTTPS (except localhost)

**Current Authorized Origins:**
```
1. _______________
2. _______________
3. _______________
```

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 10. Session Configuration

### Session Settings
- [ ] Navigate to **Project Settings** → **Sessions**
- [ ] Session duration: _______________ (recommended: 24 hours)
- [ ] Session token type: **JWT**
- [ ] Session renewal: □ Enabled  □ Disabled

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 11. Webhook Configuration (Optional)

### Stytch Webhooks
- [ ] Navigate to **Webhooks** section
- [ ] If webhooks needed, endpoint configured: _______________
- [ ] Webhook secret stored in environment variables
- [ ] Webhook signature verification implemented in code

**Webhook Events Configured:**
- [ ] Member created
- [ ] Member deleted
- [ ] Organization created
- [ ] Session created
- [ ] Other: _______________

**Status:** □ Pass  □ Fail  □ N/A
**Notes:** _______________________________________________

---

## 12. Testing & Validation

### Functional Testing
- [ ] Run automated tests: `pnpm test:stytch`
- [ ] All automated tests pass
- [ ] Test user can log in successfully
- [ ] Discovery flow completes without errors
- [ ] Session persists across page refreshes
- [ ] Logout clears session correctly

**Manual Flow Test:**
1. [ ] Navigate to login page
2. [ ] Enter test email address
3. [ ] Receive magic link email (check spam if needed)
4. [ ] Click magic link
5. [ ] Redirected to authenticate page
6. [ ] Organization selection appears (if multi-org)
7. [ ] Select organization
8. [ ] Redirected to dashboard
9. [ ] Session active and valid
10. [ ] Logout works correctly

**Test Email Used:** _______________

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 13. Security Audit

### Security Best Practices Review
- [ ] All secrets stored in environment variables (not in code)
- [ ] Environment variables loaded correctly in all environments
- [ ] No credentials committed to version control
- [ ] `.env.local` is in `.gitignore`
- [ ] Production and development use separate Stytch projects
- [ ] Access to Stytch Dashboard limited to authorized personnel

**Access Control:**
- [ ] Team members with dashboard access documented
- [ ] Two-factor authentication enabled for dashboard access
- [ ] API keys rotated regularly (last rotation: _______________)

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## 14. Documentation & Compliance

### Documentation Check
- [ ] Setup documentation is up to date (STYTCH_SETUP.md)
- [ ] Test documentation exists (STYTCH_TESTS.md)
- [ ] Environment variables documented
- [ ] Runbook exists for common issues
- [ ] Security incident response plan documented

**Compliance & Audit Trail:**
- [ ] Configuration screenshots saved
- [ ] This checklist completed and filed
- [ ] Changes logged in development_log.md
- [ ] Security review completed

**Status:** □ Pass  □ Fail
**Notes:** _______________________________________________

---

## Summary

**Total Checks:** _____
**Passed:** _____
**Failed:** _____
**N/A:** _____

**Overall Status:** □ APPROVED  □ NEEDS REMEDIATION

**Critical Issues Found:**
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

**Remediation Plan:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

**Next Review Date:** _______________

---

## Sign-Off

**Verified By:** _______________
**Signature:** _______________
**Date:** _______________

**Approved By:** _______________
**Signature:** _______________
**Date:** _______________

---

## Appendix: Quick Reference

### Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Magic link not received | Email in spam folder | Check spam/junk folder |
| "Organization not found" | Discovery Flow disabled | Enable in Dashboard |
| "Invalid redirect URL" | URL not in allowed list | Add to Redirect URLs |
| Authentication fails | Wrong environment vars | Verify credentials in .env.local |
| CORS errors | Origin not authorized | Add to Authorized Origins |

### Emergency Contacts

**Stytch Support:** support@stytch.com
**Internal Team Lead:** _______________
**Security Team:** _______________

### References

- [Stytch Setup Guide](./STYTCH_SETUP.md)
- [Stytch Test Documentation](./STYTCH_TESTS.md)
- [Security Tests](./SECURITY_TESTS.md)
- [Stytch B2B Documentation](https://stytch.com/docs/b2b)
