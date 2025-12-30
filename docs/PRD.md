# **Dokument Wymagań Produktowych (PRD): Portal Inbound Secret Collection**

## **1\. Streszczenie Wykonawcze i Kontekst Strategiczny**

### **1.1 Wprowadzenie do Problematyki**

Współczesne firmy konsultingowe B2B (Business-to-Business) operują w środowisku podwyższonego ryzyka cyfrowego, gdzie wymiana wrażliwych danych uwierzytelniających – takich jak tokeny API, klucze prywatne SSH, hasła do baz danych czy poświadczenia do systemów CRM – stanowi jeden z najbardziej krytycznych wektorów ataku. Tradycyjne metody przekazywania tych informacji, obejmujące przesyłanie ich otwartym tekstem poprzez e-mail, komunikatory (Slack, MS Teams) czy tymczasowe notatki typu "pastebin", są fundamentalnie niezgodne z nowoczesnymi standardami bezpieczeństwa takimi jak SOC2, ISO 27001 czy RODO (GDPR).  
Niniejszy raport definiuje architekturę i wymagania dla **Inbound Secret Collection Portal (ISCP)** – dedykowanej aplikacji webowej typu "Secure Drop Box". System ten ma na celu wyeliminowanie zjawiska "secret sprawl" (rozproszonych sekretów) poprzez umożliwienie klientom bezpiecznego deponowania poświadczeń bezpośrednio do skarbca haseł firmy konsultingowej, z pominięciem kanałów komunikacji bezpośredniej. Kluczowym założeniem projektowym jest architektura "Zero-Trust" w odniesieniu do warstwy pośredniczącej oraz pełna automatyzacja procesu ingestion (przyjmowania danych) z wykorzystaniem nowoczesnego stosu technologicznego: Next.js (hosting Vercel), Stytch (B2B Authentication) oraz Infisical (Secret Management).  
Analiza zgromadzonych materiałów badawczych wskazuje, że krytycznym wyzwaniem w tego typu implementacjach na infrastrukturze serverless (Vercel) jest ryzyko wycieku danych poprzez logi systemowe oraz ataki typu Account Enumeration. Niniejszy dokument PRD został sformułowany w sposób szczegółowy i techniczny, aby służyć jako bezpośrednia instrukcja implementacyjna dla autonomicznych agentów programistycznych AI (takich jak Cursor lub Windsurf), definiując nie tylko "co" ma zostać zbudowane, ale precyzyjnie "jak" zabezpieczyć przepływ danych przed zagrożeniami infrastrukturalnymi.

### **1.2 Cele Strategiczne Projektu**

Projekt ISCP realizuje pięć fundamentalnych celów strategicznych, które determinują wybór technologii i architekturę rozwiązania:

1. **Eliminacja Pośredników Komunikacyjnych:** Całkowite usunięcie konieczności przesyłania haseł przez ludzi w kanałach tekstowych. Sekret ma trafiać z przeglądarki klienta bezpośrednio do skarbca Infisical.  
2. **Weryfikacja Tożsamości B2B:** Każdy zdeponowany sekret musi być kryptograficznie powiązany z zweryfikowaną tożsamością członka organizacji klienta. Wykorzystanie Stytch B2B pozwala na mapowanie użytkowników do konkretnych Tenantów (Organizacji), co jest kluczowe w modelu konsultingowym obsługującym wielu klientów jednocześnie.1  
3. **Architektura "Write-Only" (Tylko do zapisu):** Aplikacja frontendowa i backendowa ISCP posiada uprawnienia wyłącznie do tworzenia nowych sekretów w Infisical, bez możliwości ich odczytu, edycji czy wylistowania. Minimalizuje to skutki ewentualnego przejęcia aplikacji przez atakującego.3  
4. **Ochrona przed Wyciekiem w Logach (Vercel):** Implementacja hybrydowego szyfrowania po stronie klienta (Client-Side Encryption) przed wysłaniem danych do Vercel, aby uniemożliwić odczytanie sekretów z logów runtime, które mogą rejestrować ciała zapytań HTTP w przypadku błędów.4  
5. **Przystosowanie do AI-Development:** Struktura kodu, typowanie i dokumentacja są zoptymalizowane pod kątem interpretacji przez LLM, co pozwala na szybką iterację i utrzymanie kodu przez agentów AI.

## ---

**2\. Architektura Systemu i Analiza Modelu Zagrożeń**

### **2.1 Model Przepływu Danych (Data Flow)**

Zrozumienie przepływu danych jest kluczowe dla identyfikacji punktów krytycznych. W tradycyjnym modelu dane przepływają przez serwer w postaci jawnej (nawet jeśli tunel TLS jest szyfrowany). W ISCP wprowadzamy warstwę szyfrowania aplikacyjnego.

| Krok | Aktor | Akcja | Stan Danych | Kontekst Bezpieczeństwa |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Przeglądarka Klienta | Inicjalizacja sesji i pobranie klucza publicznego serwera. | Jawny (Meta-dane) | Uwierzytelnienie Stytch (Session JWT).6 |
| 2 | Przeglądarka Klienta | Użytkownik wypełnia formularz i klika "Wyślij". | **Szyfrowanie w locie** | Dane są szyfrowane kluczem AES (jednorazowym), a klucz AES jest szyfrowany kluczem RSA serwera.5 |
| 3 | Sieć (Internet) | Transmisja payloadu do Vercel Serverless Function. | Szyfrowany (TLS \+ App Layer) | Podwójne szyfrowanie chroni przed inspekcją TLS (MitM) i logami WAF. |
| 4 | Vercel (Backend) | Odbiór żądania, walidacja sesji Stytch. | Szyfrowany (Ciphertext) | W przypadku błędu 500, logi Vercel widzą tylko bezużyteczny ciąg znaków. |
| 5 | Vercel (Pamięć RAM) | Deszyfrowanie payloadu kluczem prywatnym (Env Var). | Jawny (Epimeryczny) | Dane istnieją w pamięci RAM tylko przez milisekundy. |
| 6 | Vercel (Backend) | Parsowanie domeny i formatowanie kluczy sekretów. | Jawny (Epimeryczny) | Transformacja URL na NAZWAAPLIKACJI. |
| 7 | Infisical SDK | Uwierzytelnienie Machine Identity i wysłanie sekretów. | Szyfrowany (E2EE Infisical) | Backend używa Universal Auth do komunikacji z API Infisical.7 |
| 8 | Infisical Vault | Zapisanie sekretów w odpowiedniej ścieżce. | Szyfrowany (AES-256-GCM) | Dane spoczywają bezpiecznie w infrastrukturze Infisical.8 |

### **2.2 Analiza Ryzyka: Logi Vercel i Serverless**

Jednym z najpoważniejszych ryzyk zidentyfikowanych w dokumentacji Vercel jest sposób obsługi logów w środowisku Serverless. Zgodnie z analizą dokumentacji 4, Vercel Runtime Logs zbierają standardowe wyjście (stdout) i błędy (stderr). W przypadku nieobsłużonego wyjątku lub błędnej konfiguracji, ciało żądania HTTP (request body) może zostać zrzucone do logów.  
**Ryzyko:** Jeśli aplikacja przyjmuje sekret w postaci czystego tekstu (nawet po HTTPS), a funkcja serverless ulegnie awarii (np. błąd parsowania JSON), pełna treść sekretu może zostać zapisana w logach Vercel, które są przechowywane i potencjalnie dostępne dla szerokiego grona deweloperów mających dostęp do dashboardu Vercel.  
**Mitygacja (Wymaganie Krytyczne):**

1. **Szyfrowanie Client-Side:** Aplikacja *musi* szyfrować dane przed wysłaniem. Backend nigdy nie powinien otrzymać sekretu w JSON-ie w postaci jawnej.  
2. **Konfiguracja Next.js:** Należy jawnie wyłączyć logowanie żądań deweloperskich i produkcyjnych w next.config.js, wykorzystując opcję logging: false lub granulując incomingRequests.9  
3. **Sanityzacja Wyjątków:** Wszelkie bloki try-catch na backendzie muszą rzutować błędy na generyczne komunikaty ("Internal Server Error") i nigdy nie logować obiektu req lub error w całości, jeśli istnieje ryzyko, że zawierają dane wrażliwe.

### **2.3 Analiza Ryzyka: Enumeracja Kont (Stytch)**

Aplikacje B2B są podatne na ataki typu Account Enumeration, gdzie atakujący próbuje zgadnąć adresy e-mail pracowników lub nazwy organizacji, aby mapować strukturę klienta. Dokumentacja Stytch 10 wskazuje, że endpointy takie jak "Send Magic Link" mogą zwracać różne kody błędów (200 vs 404\) w zależności od tego, czy użytkownik istnieje.  
**Mitygacja:**

1. **Opaque Errors:** Wymuszenie konfiguracji "Opaque Errors" w dashboardzie Stytch. Dzięki temu API zawsze zwraca kod 200, nawet jeśli użytkownik nie istnieje, co uniemożliwia weryfikację bazy mailowej.10  
2. **Discovery Flow:** Zamiast logowania do konkretnej organizacji (co ujawnia jej istnienie), użytkownik loguje się do platformy, a system "odkrywa" jego organizacje po uwierzytelnieniu.2

### **2.4 Analiza Ryzyka: Dostęp do Infisical**

Backend aplikacji działa jako pośrednik. Jeśli klucze API backendu wyciekną, atakujący mógłby teoretycznie uzyskać dostęp do wszystkich sekretów wszystkich klientów.  
**Mitygacja:**

1. **Machine Identity (Universal Auth):** Zamiast tokenów serwisowych (Service Tokens), które są wycofywane i mniej bezpieczne 12, należy użyć Tożsamości Maszynowej z Universal Auth.13  
2. **Zasada Write-Only (Inversion):** Rola przypisana do tej tożsamości w Infisical musi mieć explicite zablokowane uprawnienie read (odczyt) na sekretach. Pozwala to na "wrzucanie" danych, ale uniemożliwia ich "wyciągnięcie" przez tę samą tożsamość.3

## ---

**3\. Specyfikacja Techniczna: Uwierzytelnianie i Zarządzanie Tożsamością (Stytch B2B)**

### **3.1 Konfiguracja Projektu Stytch**

Aplikacja będzie korzystać z modelu **B2B SaaS** w Stytch. Jest to kluczowe rozróżnienie względem modelu Consumer, ponieważ wprowadza hierarchię Organization \-\> Member.  
**Wymagania Konfiguracyjne:**

* **Typ Projektu:** B2B SaaS.  
* **Authentication Methods:** Email Magic Links (podstawowa), OAuth (Google/Microsoft \- opcjonalna dla wygody). SMS OTP jest zabronione ze względu na ryzyko "Toll Fraud" i niższy poziom bezpieczeństwa.14  
* **Email Templates:** Należy skonfigurować niestandardowe szablony e-mail ("You have been invited to deposit a secret") zamiast domyślnych "Log in", aby zwiększyć zaufanie klienta.1

### **3.2 Model Danych Użytkownika (Stytch Member)**

Zgodnie z dokumentacją 1, każdy użytkownik (Depositor) jest reprezentowany jako Member wewnątrz Organization.

* **Member ID:** Unikalny identyfikator użytkownika w ramach organizacji.  
* **Email Address:** Służy jako klucz główny do Discovery Flow.  
* **Trusted Metadata:** Tutaj backend może przechowywać informacje o roli użytkownika w systemie ISCP (np. {"can\_deposit": true}). Pola trusted\_metadata są edytowalne tylko przez API backendowe, co zabezpiecza przed manipulacją ze strony klienta.1

### **3.3 Proces Logowania (Discovery Flow)**

Ze względu na charakter konsultingowy, jeden klient może mieć wiele podmiotów, a konsultant może obsługiwać wiele firm. Należy zastosować **Discovery Flow**.2

1. **Krok 1 (Frontend):** Użytkownik podaje e-mail na stronie /login.  
2. **Krok 2 (Backend):** Wywołanie stytch.magicLinks.email.discovery.send. To wywołanie nie ujawnia, czy użytkownik istnieje (dzięki Opaque Errors).  
3. **Krok 3 (User Action):** Użytkownik klika link w e-mailu.  
4. **Krok 4 (Backend):** Weryfikacja tokenu poprzez stytch.magicLinks.discovery.authenticate. Zwraca listę discovered\_organizations.  
5. **Krok 5 (Frontend):** Wyświetlenie listy organizacji. Jeśli użytkownik jest członkiem tylko jednej, następuje automatyczne przekierowanie.  
6. **Krok 6 (Session Exchange):** Wymiana intermediate\_session\_token na pełnoprawny session\_token i session\_jwt dla wybranej organizacji.2

### **3.4 Just-in-Time (JIT) Provisioning**

Aby zminimalizować obsługę administracyjną, należy włączyć JIT Provisioning.

* **Mechanizm:** Jeśli klient loguje się przez Google Workspace (SSO) i jego domena (np. @klient.pl) jest zaufana w ustawieniach Organizacji w Stytch, konto Member zostanie utworzone automatycznie przy pierwszym logowaniu.1  
* **Restrykcje:** Należy ustawić politykę email\_jit\_provisioning na RESTRICTED, aby tylko domeny explicite dodane do email\_allowed\_domains mogły tworzyć konta. Zapobiega to dostępowi osób z prywatnych skrzynek (gmail.com).1

### **3.5 Ochrona przed Enumeracją i Fałszywe Sukcesy**

Zgodnie z zaleceniami 10, interfejs użytkownika nie może różnicować komunikatów.

* Jeśli użytkownik próbuje się zalogować e-mailem, który nie istnieje w systemie, UI musi wyświetlić: "Sprawdź swoją skrzynkę pocztową. Jeśli posiadasz konto, wysłaliśmy link logowania."  
* W przypadku endpointu API /api/submit-secret, jeśli sesja wygasła, należy zwrócić generyczny błąd 401 bez detali technicznych.

## ---

**4\. Specyfikacja Techniczna: Zarządzanie Sekretami (Infisical)**

### **4.1 Struktura Projektu w Infisical**

Infisical będzie pełnił rolę centralnego skarbca.

* **Organizacja Infisical:** Firma Konsultingowa (Właściciel).  
* **Projekt Infisical:** Client-Secrets-Collection.  
* **Środowiska (Environments):** Prod (Domyślne miejsce zrzutu).

### **4.2 Hierarchia Folderów i Konwencja Nazewnictwa**

Dane klientów będą przechowywane w strukturze opartej na folderach, gdzie nazwa folderu odpowiada slug organizacji klienta ze Stytch.  
Ścieżka: /{Environment}/{Stytch\_Organization\_Slug}/  
(np. /Prod/acme-corp-limited/)  
Konwencja Nazewnictwa Kluczy (Secret Keys):  
Wewnątrz folderu klienta, sekrety będą zapisywane jako osobne wpisy (Klucz-Wartość). Klucz sekretu jest generowany dynamicznie na podstawie domeny podanej w formularzu ("NAZWAAPLIKACJI").  
Formaty kluczy:

1. NAZWAAPLIKACJI\_URL – przechowuje pełny adres URL.  
2. NAZWAAPLIKACJI\_LOGIN – przechowuje login (jeśli podano).  
3. NAZWAAPLIKACJI\_PASSWORD – przechowuje hasło (jeśli podano).  
4. NAZWAAPLIKACJI\_API\_TOKEN – przechowuje token API (jeśli podano).

Przykład:  
Jeśli klient poda URL https://pipedrive.com, system wygeneruje przedrostek PIPEDRIVE.  
Powstałe sekrety w folderze /Prod/acme-corp/:

* PIPEDRIVE\_URL: https://pipedrive.com  
* PIPEDRIVE\_API\_TOKEN: xoxb-12345...

### **4.3 Machine Identity & Universal Auth**

Aplikacja ISCP będzie uwierzytelniać się w Infisical jako **Machine Identity** (Tożsamość Maszynowa).13 Jest to nowszy i bezpieczniejszy standard niż wycofywane Service Tokens.12

* **Nazwa Tożsamości:** iscp-backend-worker.  
* **Metoda Uwierzytelniania:** Universal Auth.  
* **Credentials:** Client ID i Client Secret będą przechowywane jako zmienne środowiskowe w Vercel (INFISICAL\_CLIENT\_ID, INFISICAL\_CLIENT\_SECRET).  
* **Ograniczenia sieciowe:** W konfiguracji Universal Auth należy włączyć ograniczenie do adresów IP Vercel (jeśli możliwe i znane, lub użyć Vercel Secure Compute) oraz ustawić krótki TTL dla Access Tokenów (np. 5 minut), aby wymusić częste odświeżanie.18

### **4.4 Role-Based Access Control (RBAC) – Zasada Write-Only**

Jest to kluczowy element bezpieczeństwa zdefiniowany w analizie ryzyka.  
Definicja Roli Niestandardowej "Inbound-Depositor" w Infisical:  
Należy utworzyć nową rolę w panelu Infisical i przypisać ją do Machine Identity iscp-backend-worker.  
Uprawnienia roli (na podstawie 3):

1. **Secrets \- Create:** ALLOW. (Musi móc tworzyć nowe sekrety).  
2. **Folders \- Create:** ALLOW. (Musi móc tworzyć strukturę katalogów dla nowych klientów).  
3. **Secrets \- Read:** DENY (Inverted Permission).  
4. **Secrets \- List:** DENY.  
5. **Secrets \- Update:** DENY. (Sekret raz wrzucony jest niezmienny przez portal).  
6. **Secrets \- Delete:** DENY.

Dzięki inwersji uprawnień 3, nawet jeśli kod aplikacji spróbuje pobrać listę sekretów (client.secrets().listSecrets()), otrzyma błąd 403 Forbidden. Zabezpiecza to przed wyciekiem całej bazy haseł w przypadku kompromitacji backendu ISCP.

## ---

**5\. Implementacja Frontendowa i Backendowa (Next.js App Router)**

### **5.1 Wybór Technologii: Next.js App Router**

Aplikacja zostanie zbudowana w oparciu o **Next.js 14+ z App Routerem**.

* **Server Actions:** Pozwalają na obsługę przesyłania formularzy bezpośrednio po stronie serwera bez konieczności ręcznego tworzenia endpointów API REST, co upraszcza typowanie i walidację.20  
* **React Server Components (RSC):** Większość logiki (np. inicjalizacja klienta Infisical) pozostaje na serwerze, co drastycznie zmniejsza ilość kodu JS wysyłanego do klienta i ukrywa logikę biznesową.

### **5.2 Formularz Deponowania (Client Component)**

Formularz musi być komponentem klienckim ("use client"), aby obsłużyć interakcję użytkownika i szyfrowanie w przeglądarce.  
**Pola Formularza (zgodne z wymaganiami):**

1. **Adres www aplikacji** (url) – Pole **obowiązkowe**. (np. https://pipedrive.com).  
2. **Twój login do aplikacji** (login) – Pole **nieobowiązkowe**.  
3. **Twoje hasło do aplikacji** (password) – Pole **nieobowiązkowe**, maskowane.  
4. **Token API do aplikacji** (apiToken) – Pole **nieobowiązkowe**, maskowane.

Logika Szyfrowania (Client-Side):  
Przed wysłaniem formularza (onSubmit):

1. Pobierz **Klucz Publiczny RSA** serwera.  
2. Wygeneruj jednorazowy klucz symetryczny **AES-256-GCM** (sessionKey).  
3. Utwórz obiekt JSON zawierający wypełnione pola: { url, login, password, apiToken }.  
4. Zaszyfruj cały obiekt JSON kluczem sessionKey.  
5. Zaszyfruj sessionKey kluczem publicznym RSA.  
6. Wyślij payload: { encryptedData, encryptedSessionKey, iv, authTag } do Server Action.5

### **5.3 Server Action: depositSecret**

Ta funkcja uruchamia się w środowisku Node.js na Vercel.  
**Kroki Przetwarzania:**

1. **Walidacja Sesji:** Pobierz stytch\_session\_jwt z ciasteczek. Zweryfikuj sesję używając stytchClient.sessions.authenticateJwt().  
2. **Deszyfrowanie:** Odszyfruj dane wejściowe kluczem prywatnym serwera.  
3. **Przetwarzanie Domeny (Ekstrakcja Nazwy Aplikacji):**  
   * Wyodrębnij hostname z pola url (np. https://app.pipedrive.com/login \-\> app.pipedrive.com).  
   * Pobierz główną część domeny (np. pipedrive).  
   * Znormalizuj nazwę: zamień na wielkie litery, usuń znaki specjalne (np. PIPEDRIVE). To będzie NAZWAAPLIKACJI.  
4. **Przygotowanie Sekretów dla Infisical:**  
   * Dla każdego wypełnionego pola utwórz parę Key-Value do wysłania.  
   * SECRET\_KEY\_1: {NAZWAAPLIKACJI}\_URL \= url  
   * SECRET\_KEY\_2: {NAZWAAPLIKACJI}\_LOGIN \= login (jeśli podano)  
   * SECRET\_KEY\_3: {NAZWAAPLIKACJI}\_PASSWORD \= password (jeśli podano)  
   * SECRET\_KEY\_4: {NAZWAAPLIKACJI}\_API\_TOKEN \= apiToken (jeśli podano)  
5. **Zapis do Infisical:**  
   * Ustal ścieżkę folderu: /{Environment}/{stytch\_org\_slug}/.  
   * Wywołaj InfisicalSDK w pętli lub batchu, tworząc każdy z powyższych sekretów w tej ścieżce.  
   * *Uwaga:* Należy obsłużyć błąd, jeśli sekret o takiej nazwie już istnieje (np. dodać sufiks losowy lub timestamp, jeśli biznesowo dopuszczalne jest nadpisywanie lub duplikacja).  
6. **Powiadomienie (Webhook):** Wyślij powiadomienie do admina (Webhook) zawierające nazwę klienta i przetworzony URL (bez danych wrażliwych).  
7. **Czyszczenie Pamięci:** Nadpisz zmienne z hasłami po wysłaniu.

### **5.4 Ochrona Danych: React Taint API**

Należy wykorzystać eksperymentalne API experimental\_taintUniqueValue dostępne w Next.js.22

* Oznaczamy INFISICAL\_CLIENT\_SECRET, SERVER\_PRIVATE\_KEY oraz wszelkie pobrane sekrety jako "tainted".  
* Jeśli deweloper przez pomyłkę spróbuje przekazać te obiekty do komponentu klienckiego (np. w props), Next.js przerwie budowanie lub wyrzuci błąd w runtime, zapobiegając wyciekowi danych do przeglądarki.

### **5.5 Wyłączenie Logowania (Next.config.js)**

Aby spełnić wymaganie dotyczące wycieków logów Vercel, plik konfiguracyjny musi zawierać:

JavaScript

// next.config.js  
module.exports \= {  
  logging: {  
    fetches: {  
      fullUrl: false, // Ukrywa parametry URL  
    },  
    incomingRequests: false, // Wyłącza logowanie żądań przychodzących w dev/prod  
  },  
  experimental: {  
    serverActions: {  
      bodySizeLimit: '100kb', // Ograniczenie wielkości payloadu  
    },  
    taint: true, // Włączenie Taint API  
  },  
};

To ustawienie, w połączeniu z szyfrowaniem payloadu, zapewnia, że logi Vercel są "czyste".9

## ---

**6\. Protokół Bezpieczeństwa i Szyfrowanie (Cryptography Deep Dive)**

### **6.1 Uzasadnienie Hybrydowego Szyfrowania**

Szyfrowanie wyłącznie asymetryczne (RSA) ma ograniczenia co do wielkości danych (zależne od długości klucza). Sekrety (np. pliki certyfikatów) mogą być dłuższe. Dlatego stosujemy model hybrydowy.

### **6.2 Algorytmy**

1. **Warstwa Transportowa:** TLS 1.2/1.3 (wymuszane przez Vercel).  
2. **Warstwa Aplikacyjna (Klucz Sesji):** AES-256-GCM. GCM zapewnia uwierzytelnione szyfrowanie (integrity check), co chroni przed manipulacją ciphertextem w locie.  
3. **Warstwa Aplikacyjna (Wymiana Klucza):** RSA-OAEP z kluczem 2048-bit lub 4096-bit. Padding OAEP jest konieczny, aby zapobiec atakom typu padding oracle.

### **6.3 Zarządzanie Kluczami**

* **Klucz Prywatny Serwera:** Generowany raz, przechowywany w Infisical (jako sekret dla samego projektu ISCP) i wstrzykiwany do Vercel jako Env Var podczas deploymentu.  
* **Klucz Publiczny Serwera:** Dostępny publicznie dla aplikacji frontendowej. Może być zaszyty w kodzie (hardcoded) lub serwowany dynamicznie, ale jego rotacja wymaga redeploymentu.  
* **Klucze Sesyjne:** Generowane losowo przez przeglądarkę (window.crypto.subtle) dla każdego wysłania formularza. Nie są nigdzie składowane.

## ---

**7\. Plan Wdrożenia dla Agentów AI (Cursor/Windsurf Guidelines)**

Poniższa sekcja jest sformatowana jako instrukcja bezpośrednia dla agenta AI, który będzie generował kod.

### **7.1 Struktura Plików i Konwencje**

/src  
/app  
/(auth) \# Grupa tras uwierzytelniania (publiczna)  
/login/page.tsx  
/authenticate/page.tsx  
/(portal) \# Grupa tras chronionych (wymaga sesji)  
/dashboard/page.tsx \# Lista organizacji / Wybór  
/deposit/\[orgId\]/page.tsx \# Formularz deponowania  
/api  
/webhooks/stytch/route.ts \# Webhook handler  
/lib  
/stytch \# Klient Stytch (B2B)  
/infisical \# Klient Infisical (Universal Auth)  
/crypto \# Logika szyfrowania/deszyfrowania (WebCrypto API \+ Node Crypto)  
/utils \# Parsowanie domen (extractAppNameFromUrl)  
/components  
/forms/secret-form.tsx \# "use client" \- z logiką szyfrowania i polami (URL, Login, Hasło, Token)  
/actions  
deposit.ts \# "use server" \- Server Action  
env.ts \# Walidacja zmiennych środowiskowych (Zod)  
middleware.ts \# Weryfikacja JWT Stytch na Edge

### **7.2 Instrukcje Typowania (TypeScript)**

Agent AI powinien stosować ścisłe typowanie. Nie używaj any.

* Użyj biblioteki zod do definiowania schematów DTO (Data Transfer Objects).  
* Przykład schematu dla Server Action:

TypeScript

// schemas/deposit.ts  
import { z } from "zod";

export const DepositSchema \= z.object({  
  encryptedData: z.string().base64(), // Base64 ciphertext (contains JSON with url, login, etc)  
  encryptedKey: z.string().base64(),  // Base64 encrypted AES key  
  iv: z.string().base64(),            // Base64 Initialization Vector  
  orgId: z.string().uuid(),  
});

### **7.3 Data Access Layer (DAL) Guidelines**

* Kod wywołujący InfisicalSDK i StytchClient musi znajdować się wyłącznie w katalogu /lib.  
* Funkcje DAL muszą przyjmować proste argumenty i zwracać proste obiekty (Plain Old JavaScript Objects), aby były kompatybilne z serializacją Server Actions.  
* Nigdy nie eksportuj instancji klienta Infisical/Stytch poza plik, w którym są tworzone.

## ---

**8\. Analiza Zgodności i Audyt (Compliance)**

### **8.1 SOC2 (System and Organization Controls)**

Projekt ISCP wspiera zgodność z SOC2 poprzez:

* **Audit Trails:** Każda operacja zapisu sekretu jest logowana w Infisical (kto: Machine Identity, gdzie: ścieżka klienta). Backend dodatkowo powinien logować metadane zdarzenia (bez wartości sekretu) powiązane z ID użytkownika Stytch.  
* **Access Control:** Rygorystyczny podział ról. Konsultant nie widzi hasła podczas jego przesyłania. Klient traci do niego dostęp po wysłaniu.

### **8.2 RODO / GDPR**

* **Minimalizacja Danych:** System przechowuje tylko e-maile służbowe niezbędne do logowania.  
* **Prawo do Zapomnienia:** Usunięcie użytkownika w Stytch (poprzez API lub Dashboard) automatycznie odcina mu dostęp.  
* **Szyfrowanie:** Dane osobowe (w sekretach) są szyfrowane spoczynkowo (At Rest) i w tranzycie (In Transit).

### **8.3 Weryfikacja Stosu Technologicznego**

* **Stytch:** Posiada certyfikację SOC2 Type II.  
* **Infisical:** Posiada certyfikację SOC2 Type II, szyfrowanie E2EE.  
* **Vercel:** Zgodny z SOC2, ISO 27001\.

## ---

**9\. Podsumowanie i Rekomendacje Końcowe**

Zaprojektowany system Inbound Secret Collection Portal stanowi bezpieczną, skalowalną i zgodną z regulacjami alternatywę dla ręcznego przesyłania haseł. Kluczowe innowacje to:

1. **Write-Only Vault Access:** Uniemożliwienie aplikacji odczytu danych, co drastycznie redukuje wektor ataku.  
2. **Client-Side Hybrid Encryption:** Matematyczna gwarancja, że infrastruktura pośrednicząca (Vercel) nie ma wglądu w dane jawne, nawet w przypadku błędów logowania.  
3. **Discovery-First Auth:** Uproszczenie UX dla użytkowników korporacyjnych przy zachowaniu ścisłej izolacji tenantów.

Zaleca się wdrożenie tego PRD przy ścisłej współpracy z zespołem Security Operations Center (SOC) firmy konsultingowej w celu monitorowania logów auditowych Infisical pod kątem anomalii (np. nagłego wzrostu liczby tworzonych sekretów).

| Komponent | Status Weryfikacji | Uwagi Krytyczne |
| :---- | :---- | :---- |
| **Stytch B2B** | Zatwierdzony | Wymaga włączenia "Opaque Errors" i "JIT Restricted". |
| **Infisical** | Zatwierdzony | Wymaga użycia Universal Auth i inwersji uprawnień (Deny Read). |
| **Vercel** | Zatwierdzony warunkowo | Wymaga wyłączenia logów w next.config.js i szyfrowania payloadu. |
| **Next.js** | Zatwierdzony | Wymaga użycia Server Actions i Taint API. |

Niniejszy dokument jest gotowy do przekazania zespołowi inżynierskiemu oraz agentom AI w celu rozpoczęcia implementacji.

### **Koniec Raportu / PRD**

#### **Cytowane prace**

1. Create a Member \- Stytch – The most powerful identity platform built for developers, otwierano: grudnia 30, 2025, [https://stytch.com/docs/b2b/api/create-member](https://stytch.com/docs/b2b/api/create-member)  
2. What is Stytch B2B Auth, otwierano: grudnia 30, 2025, [https://stytch.com/docs/b2b/guides/what-is-stytch-b2b-auth](https://stytch.com/docs/b2b/guides/what-is-stytch-b2b-auth)  
3. Overview \- Infisical, otwierano: grudnia 30, 2025, [https://infisical.com/docs/internals/permissions/overview](https://infisical.com/docs/internals/permissions/overview)  
4. Runtime Logs \- Vercel, otwierano: grudnia 30, 2025, [https://vercel.com/docs/logs/runtime](https://vercel.com/docs/logs/runtime)  
5. Concept: An Attempt at Securing Front End NextJS Application | by Uchenna Awa \- Medium, otwierano: grudnia 30, 2025, [https://urchymanny.medium.com/concept-an-attempt-at-securing-front-end-nextjs-application-ef05baa4839d](https://urchymanny.medium.com/concept-an-attempt-at-securing-front-end-nextjs-application-ef05baa4839d)  
6. Stytch and Next.js \- Authentication, otwierano: grudnia 30, 2025, [https://stytch.com/docs/b2b/guides/frameworks/nextjs/sessions](https://stytch.com/docs/b2b/guides/frameworks/nextjs/sessions)  
7. Infisical Node.js SDK, otwierano: grudnia 30, 2025, [https://infisical.com/docs/sdks/languages/node](https://infisical.com/docs/sdks/languages/node)  
8. Security \- Infisical, otwierano: grudnia 30, 2025, [https://infisical.com/docs/internals/security](https://infisical.com/docs/internals/security)  
9. logging \- next.config.js, otwierano: grudnia 30, 2025, [https://nextjs.org/docs/app/api-reference/config/next-config-js/logging](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging)  
10. Preventing account enumeration attacks | Stytch Platform & Security, otwierano: grudnia 30, 2025, [https://stytch.com/docs/resources/platform/account-enumeration](https://stytch.com/docs/resources/platform/account-enumeration)  
11. How to prevent enumeration attacks \- Stytch, otwierano: grudnia 30, 2025, [https://stytch.com/blog/prevent-enumeration-attacks/](https://stytch.com/blog/prevent-enumeration-attacks/)  
12. infisical service-token, otwierano: grudnia 30, 2025, [https://infisical.com/docs/cli/commands/service-token](https://infisical.com/docs/cli/commands/service-token)  
13. Machine Identities \- Infisical, otwierano: grudnia 30, 2025, [https://infisical.com/docs/documentation/platform/identities/machine-identities](https://infisical.com/docs/documentation/platform/identities/machine-identities)  
14. Stytch and frontend development (headless) | Stytch B2B authentication, otwierano: grudnia 30, 2025, [https://stytch.com/docs/b2b/guides/implementation/frontend-headless](https://stytch.com/docs/b2b/guides/implementation/frontend-headless)  
15. Stytch and NextJS \- Authentication | Stytch B2B authentication, otwierano: grudnia 30, 2025, [https://stytch.com/docs/b2b/guides/frameworks/nextjs/authentication](https://stytch.com/docs/b2b/guides/frameworks/nextjs/authentication)  
16. User privacy measures | Stytch JavaScript SDK, otwierano: grudnia 30, 2025, [https://stytch.com/docs/sdks/resources/user-privacy](https://stytch.com/docs/sdks/resources/user-privacy)  
17. Introducing Machine Identities \- Infisical, otwierano: grudnia 30, 2025, [https://infisical.com/blog/introducing-machine-identities](https://infisical.com/blog/introducing-machine-identities)  
18. Token Auth \- Infisical, otwierano: grudnia 30, 2025, [https://infisical.com/docs/documentation/platform/identities/token-auth](https://infisical.com/docs/documentation/platform/identities/token-auth)  
19. Project Permissions \- Infisical, otwierano: grudnia 30, 2025, [https://infisical.com/docs/internals/permissions/project-permissions](https://infisical.com/docs/internals/permissions/project-permissions)  
20. Guides: Authentication \- Next.js, otwierano: grudnia 30, 2025, [https://nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)  
21. Getting Started: Updating Data \- Next.js, otwierano: grudnia 30, 2025, [https://nextjs.org/docs/app/getting-started/updating-data](https://nextjs.org/docs/app/getting-started/updating-data)  
22. Guides: Data Security \- Next.js, otwierano: grudnia 30, 2025, [https://nextjs.org/docs/app/guides/data-security](https://nextjs.org/docs/app/guides/data-security)