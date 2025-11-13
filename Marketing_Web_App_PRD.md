# Product Requirements Document (PRD)
## Project: Internal Marketing Web App (MVP Login)

---

### 1. Overview

This project will serve as the foundation for an internal marketing web application that will eventually manage campaign data and insights.  
The **MVP phase** focuses on creating a **secure, locally hosted login page** with authentication backed by **Supabase**, enabling controlled access for internal testing and future scalability.

---

### 2. Goals & Success Metrics

**Primary Goals**
- Build a functional login system with Supabase authentication.
- Restrict sign-ups and logins to one authorized email (`parkercostaging@gmail.com`).
- Deliver a polished, modern UI inspired by Slack’s design.

**Success Metrics**
- Supabase authentication works end-to-end locally.
- Only the whitelisted email can successfully create an account and log in.
- The app runs smoothly in a local environment.

---

### 3. User Stories

- **As the internal tester (Parker),** I want to log in securely with my email and password so I can test the web app.  
- **As a developer,** I want an easy local setup with Supabase integration for authentication.  
- **As a product manager,** I want a simple, professional login experience aligned with our future branding.

---

### 4. Functional Requirements

#### Authentication
- Implement **Supabase Auth** using email + password.
- Restrict sign-ups so that only `parkercostaging@gmail.com` can register.  
  - Any other email should trigger:  
    `"Access restricted. Please contact the administrator."`
- Validate inputs for required fields, proper email format, and minimum password strength.
- Redirect to a basic “Welcome” page after successful login.
- Logout functionality included (optional for MVP).

#### Access Control
- Supabase RLS (Row-Level Security) policies or simple email filtering to ensure only authorized access.
- Restrict backend data access to the whitelisted user.

#### Hosting & Environment
- Hosted **locally** for MVP (e.g., `localhost:3000`).
- Connection to a **Supabase project** using environment variables for the API key and URL.
- Dev environment should allow local testing of Supabase authentication flows.

---

### 5. Non-Functional Requirements

#### Design
- Clean, minimal, and modern — inspired by Slack’s login screen.  
  - Rounded input fields, subtle gradients, neutral color palette.  
  - Use **Tailwind CSS** for rapid and consistent styling.
- Responsive across desktop and mobile.
- Optional: Add small “brand” logo or placeholder header.

#### Performance
- Fast initial load time (<2 seconds).
- Lightweight dependencies and minimal client-side scripts.

#### Security
- Authentication managed through **Supabase Auth**.
- All credentials stored securely in Supabase (hashed passwords by default).
- Never store raw passwords locally.
- Environment variables managed via `.env.local`.

---

### 6. Dependencies & Risks

#### Dependencies
- **Frontend:**  
  - HTML, JavaScript (or React if desired for scalability).  
  - Tailwind CSS for styling.

- **Backend / Auth:**  
  - Supabase (for authentication, database, and hosting backend).  
  - Node.js local server or Vite/Next.js setup for local development.

- **Environment Configuration:**  
  - `.env.local` file for storing Supabase keys (e.g., `SUPABASE_URL`, `SUPABASE_ANON_KEY`).

#### Risks
- Supabase rate limits may affect local testing if misconfigured.  
- Migration from local → production will require updated Supabase environment variables.  
- Future marketing data storage must extend Supabase schema appropriately.

---

