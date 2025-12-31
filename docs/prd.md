# **Product Requirements Document (PRD): Inbound Secret Collection Portal**

## **1\. Executive Summary and Strategic Context**

### **1.1 Introduction to the Problem**

Modern B2B (Business-to-Business) consulting firms operate in an environment of heightened digital risk, where the exchange of sensitive authentication data – such as API tokens, SSH private keys, database passwords, or CRM system credentials – represents one of the most critical attack vectors. Traditional methods of transferring this information, including sending it in plain text via email, communication tools (Slack, MS Teams) or temporary notes like "pastebin", are fundamentally incompatible with modern security standards such as SOC2, ISO 27001 or GDPR.  
This report defines the architecture and requirements for the **Inbound Secret Collection Portal (ISCP)** – a dedicated web application of the "Secure Drop Box" type. The system aims to eliminate the "secret sprawl" phenomenon (scattered secrets) by enabling clients to securely deposit credentials directly into the consulting company's password vault, bypassing direct communication channels. The key design assumption is a "Zero-Trust" architecture regarding the intermediary layer and full automation of the ingestion process (data intake) using a modern technology stack: Next.js (Vercel hosting), Stytch (B2B Authentication), and Infisical (Secret Management).  
Analysis of collected research materials indicates that the critical challenge in such implementations on serverless infrastructure (Vercel) is the risk of data leakage through system logs and Account Enumeration attacks. This PRD document has been formulated in a detailed and technical manner to serve as direct implementation instructions for autonomous AI programming agents (such as Cursor or Windsurf), defining not only "what" is to be built, but precisely "how" to secure the data flow against infrastructural threats.

### **1.2 Project Strategic Objectives**

The ISCP project implements five fundamental strategic objectives that determine the choice of technology and solution architecture:

1. **Elimination of Communication Intermediaries:** Complete removal of the necessity for humans to transmit passwords through text channels. The secret should go directly from the client's browser to the Infisical vault.  
2. **B2B Identity Verification:** Every deposited secret must be cryptographically linked to the verified identity of a client organization member. Using Stytch B2B allows mapping users to specific Tenants (Organizations), which is crucial in a consulting model serving multiple clients simultaneously.1  
3. **"Write-Only" Architecture:** The ISCP frontend and backend applications have permissions exclusively to create new secrets in Infisical, without the ability to read, edit, or list them. This minimizes the consequences of potential application compromise by an attacker.3  
4. **Protection Against Log Leaks (Vercel):** Implementation of hybrid encryption on the client side (Client-Side Encryption) before sending data to Vercel, to prevent reading secrets from runtime logs that may record HTTP request bodies in case of errors.4  
5. **AI-Development Adaptation:** Code structure, typing, and documentation are optimized for interpretation by LLMs, enabling rapid iteration and code maintenance by AI agents.

## ---

**2\. System Architecture and Threat Model Analysis**

### **2.1 Data Flow Model**

Understanding data flow is crucial for identifying critical points. In the traditional model, data flows through the server in plain form (even if the TLS tunnel is encrypted). In ISCP, we introduce an application encryption layer.

| Step | Actor | Action | Data State | Security Context |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Client Browser | Session initialization and retrieval of server's public key. | Plain (Meta-data) | Stytch Authentication (Session JWT).6 |
| 2 | Client Browser | User fills form and clicks "Send". | **On-the-fly encryption** | Data is encrypted with AES key (one-time), and AES key is encrypted with server's RSA key.5 |
| 3 | Network (Internet) | Transmission of payload to Vercel Serverless Function. | Encrypted (TLS \+ App Layer) | Double encryption protects against TLS inspection (MitM) and WAF logs. |
| 4 | Vercel (Backend) | Request reception, Stytch session validation. | Encrypted (Ciphertext) | In case of 500 error, Vercel logs see only useless string sequence. |
| 5 | Vercel (RAM Memory) | Payload decryption with server's private key (Env Var). | Plain (Ephemeral) | Data exists in RAM memory for only milliseconds. |
| 6 | Vercel (Backend) | Domain parsing and secret key formatting. | Plain (Ephemeral) | URL transformation to APPNAME. |
| 7 | Infisical SDK | Machine Identity authentication and secret transmission. | Encrypted (Infisical E2EE) | Backend uses Universal Auth for Infisical API communication.7 |
| 8 | Infisical Vault | Saving secrets in appropriate path. | Encrypted (AES-256-GCM) | Data rests securely in Infisical infrastructure.8 |

### **2.2 Risk Analysis: Vercel Logs and Serverless**

One of the most serious risks identified in Vercel documentation is the way logs are handled in the Serverless environment. According to documentation analysis 4, Vercel Runtime Logs collect standard output (stdout) and errors (stderr). In case of an unhandled exception or misconfiguration, the HTTP request body may be dumped to logs.  
**Risk:** If the application accepts secrets in plain text form (even after HTTPS), and the serverless function fails (e.g., JSON parsing error), the full content of the secret may be saved in Vercel logs, which are stored and potentially accessible to a wide range of developers with access to the Vercel dashboard.  
**Mitigation (Critical Requirement):**

1. **Client-Side Encryption:** The application *must* encrypt data before sending. Backend should never receive secrets in plain JSON form.  
2. **Next.js Configuration:** Logging of development and production requests must be explicitly disabled in next.config.js, using the logging: false option or granularizing incomingRequests.9  
3. **Exception Sanitization:** All try-catch blocks on the backend must throw errors to generic messages ("Internal Server Error") and never log the req object or error in full if there is a risk that they contain sensitive data.

### **2.3 Risk Analysis: Account Enumeration (Stytch)**

B2B applications are vulnerable to Account Enumeration attacks, where attackers try to guess employee email addresses or organization names to map client structure. Stytch documentation 10 indicates that endpoints such as "Send Magic Link" may return different error codes (200 vs 404) depending on whether the user exists.  
**Mitigation:**

1. **Opaque Errors:** Enforcement of "Opaque Errors" configuration in Stytch dashboard. This ensures the API always returns code 200, even if the user does not exist, preventing email database verification.10  
2. **Discovery Flow:** Instead of logging into a specific organization (which reveals its existence), the user logs into the platform, and the system "discovers" their organizations after authentication.2

### **2.4 Risk Analysis: Access to Infisical**

The application backend acts as an intermediary. If backend API keys leak, an attacker could theoretically gain access to all secrets of all clients.  
**Mitigation:**

1. **Machine Identity (Universal Auth):** Instead of service tokens (Service Tokens), which are being phased out and are less secure 12, Machine Identity with Universal Auth should be used.13  
2. **Write-Only Principle (Inversion):** The role assigned to this identity in Infisical must have the read permission (read) explicitly blocked on secrets. This allows "uploading" data but prevents its "extraction" by the same identity.3

## ---

**3\. Technical Specification: Authentication and Identity Management (Stytch B2B)**

### **3.1 Stytch Project Configuration**

The application will use the **B2B SaaS** model in Stytch. This is a key distinction from the Consumer model, as it introduces the Organization -> Member hierarchy.  
**Configuration Requirements:**

* **Project Type:** B2B SaaS.  
* **Authentication Methods:** Email Magic Links (primary), OAuth (Google/Microsoft - optional for convenience). SMS OTP is prohibited due to "Toll Fraud" risk and lower security level.14  
* **Email Templates:** Custom email templates must be configured ("You have been invited to deposit a secret") instead of default "Log in" to increase client trust.1

### **3.2 User Data Model (Stytch Member)**

According to documentation 1, every user (Depositor) is represented as a Member within an Organization.

* **Member ID:** Unique user identifier within the organization.  
* **Email Address:** Serves as the primary key for Discovery Flow.  
* **Trusted Metadata:** Here the backend can store information about the user's role in the ISCP system (e.g., {"can\_deposit": true}). The trusted\_metadata fields are editable only by backend API, which protects against client-side manipulation.1

### **3.3 Login Process (Discovery Flow)**

Due to the consulting nature, one client may have multiple entities, and a consultant may serve multiple companies. **Discovery Flow** must be applied.2

1. **Step 1 (Frontend):** User provides email on the /login page.  
2. **Step 2 (Backend):** Call stytch.magicLinks.email.discovery.send. This call does not reveal whether the user exists (thanks to Opaque Errors).  
3. **Step 3 (User Action):** User clicks the link in the email.  
4. **Step 4 (Backend):** Token verification via stytch.magicLinks.discovery.authenticate. Returns list of discovered\_organizations.  
5. **Step 5 (Frontend):** Display list of organizations. If user is a member of only one, automatic redirection occurs.  
6. **Step 6 (Session Exchange):** Exchange of intermediate\_session\_token for full session\_token and session\_jwt for the selected organization.2

### **3.4 Just-in-Time (JIT) Provisioning**

To minimize administrative handling, JIT Provisioning must be enabled.

* **Mechanism:** If a client logs in through Google Workspace (SSO) and their domain (e.g., @client.pl) is trusted in Stytch Organization settings, a Member account will be created automatically on first login.1  
* **Restrictions:** The email\_jit\_provisioning policy must be set to RESTRICTED, so that only domains explicitly added to email\_allowed\_domains can create accounts. This prevents access by people with private mailboxes (gmail.com).1

### **3.5 Protection Against Enumeration and False Successes**

According to recommendations 10, the user interface must not differentiate messages.

* If a user tries to log in with an email that does not exist in the system, the UI must display: "Check your mailbox. If you have an account, we have sent a login link."  
* In the case of the /api/submit-secret API endpoint, if the session has expired, a generic 401 error must be returned without technical details.

## ---

**4\. Technical Specification: Secret Management (Infisical)**

### **4.1 Project Structure in Infisical**

Infisical will serve as the central vault.

* **Infisical Organization:** Consulting Company (Owner).  
* **Infisical Project:** Client-Secrets-Collection.  
* **Environments:** Prod (Default dump location).

### **4.2 Folder Hierarchy and Naming Convention**

Client data will be stored in a folder-based structure, where the folder name corresponds to the client's organization slug from Stytch.  
Path: /{Environment}/{Stytch\_Organization\_Slug}/  
(e.g., /Prod/acme-corp-limited/)  
Secret Keys Naming Convention:  
Within the client folder, secrets will be saved as separate entries (Key-Value). The secret key is generated dynamically based on the domain provided in the form ("APPNAME").  
Key formats:

1. APPNAME\_URL – stores the full URL.  
2. APPNAME\_LOGIN – stores the login (if provided).  
3. APPNAME\_PASSWORD – stores the password (if provided).  
4. APPNAME\_API\_TOKEN – stores the API token (if provided).

Example:  
If the client provides URL https://pipedrive.com, the system will generate the prefix PIPEDRIVE.  
Resulting secrets in the /Prod/acme-corp/ folder:

* PIPEDRIVE\_URL: https://pipedrive.com  
* PIPEDRIVE\_API\_TOKEN: xoxb-12345...

### **4.3 Machine Identity & Universal Auth**

The ISCP application will authenticate to Infisical as a **Machine Identity**.13 This is a newer and more secure standard than the phased-out Service Tokens.12

* **Identity Name:** iscp-backend-worker.  
* **Authentication Method:** Universal Auth.  
* **Credentials:** Client ID and Client Secret will be stored as environment variables in Vercel (INFISICAL\_CLIENT\_ID, INFISICAL\_CLIENT\_SECRET).  
* **Network Restrictions:** In Universal Auth configuration, IP address restriction to Vercel addresses must be enabled (if possible and known, or use Vercel Secure Compute) and set short TTL for Access Tokens (e.g., 5 minutes) to enforce frequent refresh.18

### **4.4 Role-Based Access Control (RBAC) – Write-Only Principle**

This is a key security element defined in the risk analysis.  
Definition of Custom Role "Inbound-Depositor" in Infisical:  
A new role must be created in the Infisical panel and assigned to Machine Identity iscp-backend-worker.  
Role permissions (based on 3):

1. **Secrets - Create:** ALLOW. (Must be able to create new secrets).  
2. **Folders - Create:** ALLOW. (Must be able to create directory structure for new clients).  
3. **Secrets - Read:** DENY (Inverted Permission).  
4. **Secrets - List:** DENY.  
5. **Secrets - Update:** DENY. (Secret once uploaded is immutable by the portal).  
6. **Secrets - Delete:** DENY.

Thanks to permission inversion 3, even if application code tries to retrieve a list of secrets (client.secrets().listSecrets()), it will receive a 403 Forbidden error. This protects against leakage of the entire password database in case of ISCP backend compromise.

## ---

**5\. Frontend and Backend Implementation (Next.js App Router)**

### **5.1 Technology Choice: Next.js App Router**

The application will be built based on **Next.js 14+ with App Router**.

* **Server Actions:** Allow handling form submissions directly on the server side without manually creating REST API endpoints, simplifying typing and validation.20  
* **React Server Components (RSC):** Most logic (e.g., Infisical client initialization) remains on the server, drastically reducing the amount of JS code sent to the client and hiding business logic.

### **5.2 Deposit Form (Client Component)**

The form must be a client component ("use client") to handle user interaction and browser encryption.  
**Form Fields (compliant with requirements):**

1. **Application www address** (url) – **Required** field. (e.g., https://pipedrive.com).  
2. **Your application login** (login) – **Optional** field.  
3. **Your application password** (password) – **Optional** field, masked.  
4. **API token for the application** (apiToken) – **Optional** field, masked.

Encryption Logic (Client-Side):  
Before sending the form (onSubmit):

1. Retrieve the server's **RSA Public Key**.  
2. Generate a one-time symmetric **AES-256-GCM** key (sessionKey).  
3. Create a JSON object containing filled fields: { url, login, password, apiToken }.  
4. Encrypt the entire JSON object with the sessionKey.  
5. Encrypt the sessionKey with the RSA public key.  
6. Send payload: { encryptedData, encryptedSessionKey, iv, authTag } to Server Action.5

### **5.3 Server Action: depositSecret**

This function runs in the Node.js environment on Vercel.  
**Processing Steps:**

1. **Session Validation:** Retrieve stytch\_session\_jwt from cookies. Verify session using stytchClient.sessions.authenticateJwt().  
2. **Decryption:** Decrypt input data with the server's private key.  
3. **Domain Processing (Application Name Extraction):**  
   * Extract hostname from the url field (e.g., https://app.pipedrive.com/login -> app.pipedrive.com).  
   * Get the main part of the domain (e.g., pipedrive).  
   * Normalize the name: convert to uppercase, remove special characters (e.g., PIPEDRIVE). This will be APPNAME.  
4. **Preparation of Secrets for Infisical:**  
   * For each filled field, create a Key-Value pair to send.  
   * SECRET\_KEY\_1: {APPNAME}\_URL = url  
   * SECRET\_KEY\_2: {APPNAME}\_LOGIN = login (if provided)  
   * SECRET\_KEY\_3: {APPNAME}\_PASSWORD = password (if provided)  
   * SECRET\_KEY\_4: {APPNAME}\_API\_TOKEN = apiToken (if provided)  
5. **Save to Infisical:**  
   * Establish folder path: /{Environment}/{stytch\_org\_slug}/.  
   * Call InfisicalSDK in a loop or batch, creating each of the above secrets in this path.  
   * *Note:* Handle error if a secret with that name already exists (e.g., add random suffix or timestamp, if overwriting or duplication is business-acceptable).  
6. **Notification (Webhook):** Send notification to admin (Webhook) containing client name and processed URL (without sensitive data).  
7. **Memory Cleanup:** Overwrite password variables after sending.

### **5.4 Data Protection: React Taint API**

The experimental experimental\_taintUniqueValue API available in Next.js must be utilized.22

* We mark INFISICAL\_CLIENT\_SECRET, SERVER\_PRIVATE\_KEY and any retrieved secrets as "tainted".  
* If a developer accidentally tries to pass these objects to a client component (e.g., in props), Next.js will break the build or throw a runtime error, preventing data leakage to the browser.

### **5.5 Logging Disabling (Next.config.js)**

To meet the Vercel log leaks requirement, the configuration file must contain:

JavaScript

// next.config.js  
module.exports = {  
  logging: {  
    fetches: {  
      fullUrl: false, // Hides URL parameters  
    },  
    incomingRequests: false, // Disables incoming request logging in dev/prod  
  },  
  experimental: {  
    serverActions: {  
      bodySizeLimit: '100kb', // Payload size limit  
    },  
    taint: true, // Enable Taint API  
  },  
};

This setting, combined with payload encryption, ensures that Vercel logs are "clean".9

## ---

**6\. Security Protocol and Encryption (Cryptography Deep Dive)**

### **6.1 Justification for Hybrid Encryption**

Pure asymmetric encryption (RSA) has limitations regarding data size (dependent on key length). Secrets (e.g., certificate files) may be longer. Therefore, we apply a hybrid model.

### **6.2 Algorithms**

1. **Transport Layer:** TLS 1.2/1.3 (enforced by Vercel).  
2. **Application Layer (Session Key):** AES-256-GCM. GCM provides authenticated encryption (integrity check), protecting against on-the-fly ciphertext manipulation.  
3. **Application Layer (Key Exchange):** RSA-OAEP with 2048-bit or 4096-bit key. OAEP padding is necessary to prevent padding oracle attacks.

### **6.3 Key Management**

* **Server Private Key:** Generated once, stored in Infisical (as a secret for the ISCP project itself) and injected into Vercel as Env Var during deployment.  
* **Server Public Key:** Publicly available for the frontend application. May be hardcoded in code or served dynamically, but its rotation requires redeployment.  
* **Session Keys:** Randomly generated by the browser (window.crypto.subtle) for each form submission. Not stored anywhere.

## ---

**7\. Deployment Plan for AI Agents (Cursor/Windsurf Guidelines)**

The section below is formatted as a direct instruction for the AI agent that will generate code.

### **7.1 File Structure and Conventions**

/src  
/app  
/(auth) \# Authentication routes group (public)  
/login/page.tsx  
/authenticate/page.tsx  
/(portal) \# Protected routes group (requires session)  
/dashboard/page.tsx \# Organization list / Selection  
/deposit/\[orgId\]/page.tsx \# Deposit form  
/api  
/webhooks/stytch/route.ts \# Webhook handler  
/lib  
/stytch \# Stytch client (B2B)  
/infisical \# Infisical client (Universal Auth)  
/crypto \# Encryption/decryption logic (WebCrypto API \+ Node Crypto)  
/utils \# Domain parsing (extractAppNameFromUrl)  
/components  
/forms/secret-form.tsx \# "use client" - with encryption logic and fields (URL, Login, Password, Token)  
/actions  
deposit.ts \# "use server" - Server Action  
env.ts \# Environment variables validation (Zod)  
middleware.ts \# Stytch JWT verification on Edge

### **7.2 Typing Instructions (TypeScript)**

AI agent should apply strict typing. Do not use any.

* Use the zod library to define DTO (Data Transfer Objects) schemas.  
* Example schema for Server Action:

TypeScript

// schemas/deposit.ts  
import { z } from "zod";

export const DepositSchema = z.object({
  encryptedData: z.string().base64(), // Base64 ciphertext (contains JSON with url, login, etc)
  encryptedKey: z.string().base64(),  // Base64 encrypted AES key
  iv: z.string().base64(),            // Base64 Initialization Vector
  organizationSlug: z.string(),
});

### **7.3 Data Access Layer (DAL) Guidelines**

* Code calling InfisicalSDK and StytchClient must be located exclusively in the /lib directory.  
* DAL functions must accept simple arguments and return simple objects (Plain Old JavaScript Objects) to be compatible with Server Actions serialization.  
* Never export Infisical/Stytch client instances outside the file where they are created.

## ---

**8\. Compliance Analysis and Audit**

### **8.1 SOC2 (System and Organization Controls)**

The ISCP project supports SOC2 compliance through:

* **Audit Trails:** Every secret write operation is logged in Infisical (who: Machine Identity, where: client path). Backend should additionally log event metadata (without secret values) linked to Stytch user ID.  
* **Access Control:** Rigorous role separation. Consultant does not see password during transmission. Client loses access to it after sending.

### **8.2 GDPR**

* **Data Minimization:** System stores only business emails necessary for login.  
* **Right to Be Forgotten:** User deletion in Stytch (via API or Dashboard) automatically cuts off their access.  
* **Encryption:** Personal data (in secrets) is encrypted at rest (At Rest) and in transit (In Transit).

### **8.3 Technology Stack Verification**

* **Stytch:** Has SOC2 Type II certification.  
* **Infisical:** Has SOC2 Type II certification, E2E encryption.  
* **Vercel:** SOC2 compliant, ISO 27001.

## ---

**9\. Summary and Final Recommendations**

The designed Inbound Secret Collection Portal system constitutes a secure, scalable, and regulation-compliant alternative to manual password transmission. Key innovations include:

1. **Write-Only Vault Access:** Preventing the application from reading data, drastically reducing the attack vector.  
2. **Client-Side Hybrid Encryption:** Mathematical guarantee that intermediary infrastructure (Vercel) has no insight into plain data, even in case of logging errors.  
3. **Discovery-First Auth:** Simplifying UX for corporate users while maintaining strict tenant isolation.

Implementation of this PRD is recommended in close cooperation with the consulting company's Security Operations Center (SOC) team to monitor Infisical audit logs for anomalies (e.g., sudden increase in the number of secrets created).

| Component | Verification Status | Critical Notes |
| :---- | :---- | :---- |
| **Stytch B2B** | Approved | Requires enabling "Opaque Errors" and "JIT Restricted". |
| **Infisical** | Approved | Requires use of Universal Auth and permission inversion (Deny Read). |
| **Vercel** | Conditionally Approved | Requires disabling logs in next.config.js and payload encryption. |
| **Next.js** | Approved | Requires use of Server Actions and Taint API. |

This document is ready to be passed to the engineering team and AI agents for implementation commencement.

### **End of Report / PRD**

#### **Cited Works**

1. Create a Member - Stytch – The most powerful identity platform built for developers, opened: December 30, 2025, [https://stytch.com/docs/b2b/api/create-member](https://stytch.com/docs/b2b/api/create-member)  
2. What is Stytch B2B Auth, opened: December 30, 2025, [https://stytch.com/docs/b2b/guides/what-is-stytch-b2b-auth](https://stytch.com/docs/b2b/guides/what-is-stytch-b2b-auth)  
3. Overview - Infisical, opened: December 30, 2025, [https://infisical.com/docs/internals/permissions/overview](https://infisical.com/docs/internals/permissions/overview)  
4. Runtime Logs - Vercel, opened: December 30, 2025, [https://vercel.com/docs/logs/runtime](https://vercel.com/docs/logs/runtime)  
5. Concept: An Attempt at Securing Front End NextJS Application | by Uchenna Awa - Medium, opened: December 30, 2025, [https://urchymanny.medium.com/concept-an-attempt-at-securing-front-end-nextjs-application-ef05baa4839d](https://urchymanny.medium.com/concept-an-attempt-at-securing-front-end-nextjs-application-ef05baa4839d)  
6. Stytch and Next.js - Authentication, opened: December 30, 2025, [https://stytch.com/docs/b2b/guides/frameworks/nextjs/sessions](https://stytch.com/docs/b2b/guides/frameworks/nextjs/sessions)  
7. Infisical Node.js SDK, opened: December 30, 2025, [https://infisical.com/docs/sdks/languages/node](https://infisical.com/docs/sdks/languages/node)  
8. Security - Infisical, opened: December 30, 2025, [https://infisical.com/docs/internals/security](https://infisical.com/docs/internals/security)  
9. logging - next.config.js, opened: December 30, 2025, [https://nextjs.org/docs/app/api-reference/config/next-config-js/logging](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging)  
10. Preventing account enumeration attacks | Stytch Platform & Security, opened: December 30, 2025, [https://stytch.com/docs/resources/platform/account-enumeration](https://stytch.com/docs/resources/platform/account-enumeration)  
11. How to prevent enumeration attacks - Stytch, opened: December 30, 2025, [https://stytch.com/blog/prevent-enumeration-attacks/](https://stytch.com/blog/prevent-enumeration-attacks/)  
12. infisical service-token, opened: December 30, 2025, [https://infisical.com/docs/cli/commands/service-token](https://infisical.com/docs/cli/commands/service-token)  
13. Machine Identities - Infisical, opened: December 30, 2025, [https://infisical.com/docs/documentation/platform/identities/machine-identities](https://infisical.com/docs/documentation/platform/identities/machine-identities)  
14. Stytch and frontend development (headless) | Stytch B2B authentication, opened: December 30, 2025, [https://stytch.com/docs/b2b/guides/implementation/frontend-headless](https://stytch.com/docs/b2b/guides/implementation/frontend-headless)  
15. Stytch and NextJS - Authentication | Stytch B2B authentication, opened: December 30, 2025, [https://stytch.com/docs/b2b/guides/frameworks/nextjs/authentication](https://stytch.com/docs/b2b/guides/frameworks/nextjs/authentication)  
16. User privacy measures | Stytch JavaScript SDK, opened: December 30, 2025, [https://stytch.com/docs/sdks/resources/user-privacy](https://stytch.com/docs/sdks/resources/user-privacy)  
17. Introducing Machine Identities - Infisical, opened: December 30, 2025, [https://infisical.com/blog/introducing-machine-identities](https://infisical.com/blog/introducing-machine-identities)  
18. Token Auth - Infisical, opened: December 30, 2025, [https://infisical.com/docs/documentation/platform/identities/token-auth](https://infisical.com/docs/documentation/platform/identities/token-auth)  
19. Project Permissions - Infisical, opened: December 30, 2025, [https://infisical.com/docs/internals/permissions/project-permissions](https://infisical.com/docs/internals/permissions/project-permissions)  
20. Guides: Authentication - Next.js, opened: December 30, 2025, [https://nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)  
21. Getting Started: Updating Data - Next.js, opened: December 30, 2025, [https://nextjs.org/docs/app/getting-started/updating-data](https://nextjs.org/docs/app/getting-started/updating-data)  
22. Guides: Data Security - Next.js, opened: December 30, 2025, [https://nextjs.org/docs/app/guides/data-security](https://nextjs.org/docs/app/guides/data-security)