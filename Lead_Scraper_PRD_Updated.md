# Product Requirements Document (PRD)
## Project: Lead Scraper Feature

---

### 1. Overview

The **Lead Scraper** feature expands the functionality of the internal marketing web application by allowing users to create and manage projects that collect business leads from Google search results.  
Each project enables users to input one or more Google search terms, scrape business listing results from the first ten Google search result pages, and store the data for later review and analysis.

This feature will form the foundation for future lead management, outreach, and campaign tracking capabilities.

---

### 2. Goals & Success Metrics

**Primary Goals**
- Allow users to create, name, and manage multiple “Lead Scraper” projects.
- Enable input of one or more Google search terms per project.
- Scrape the first ten pages of Google business listing results for each search term.
- Avoid duplicate entries when multiple search terms yield overlapping results.
- Store scraped data for future use (using Supabase).

**Success Metrics**
- Users can successfully create and save Lead Scraper projects.
- Multiple search terms are handled per project without duplication.
- The scraper successfully captures and stores data from at least 90% of business listings on the first 10 pages of Google results.

---

### 3. User Stories

- **As a user,** I want to create a Lead Scraper project so I can collect leads from specific Google searches.  
- **As a user,** I want to input multiple search terms for a single project to broaden my lead pool.  
- **As a user,** I want the scraper to automatically check for duplicates so that I don’t see the same lead multiple times.  
- **As a user,** I want to clearly view which search terms are associated with each project.

---

### 4. Functional Requirements

#### Project Management
- Users can create and name new Lead Scraper projects.
- Each project displays its name and associated search terms.
- Projects are stored in the database with metadata such as:
  - Project ID
  - Project name
  - Search terms (array)
  - Date created / last modified

#### Search Term Input
- User can input multiple Google search terms per project.
- Display all search terms for each project in the UI.
- Ability to add or remove search terms before scraping begins.

#### Scraper Functionality
- For each search term:
  - Perform a Google search.
  - Scrape the first **10 pages** of **Google business listing results** (Google Maps / Google My Business listings).
  - Extract and store the following data fields for each business:
    - **Business name**
    - **Link to the Google business listing**
    - **Website (if available)**
    - **Star rating**
    - **Number of reviews**
    - **Contact information** (phone number, email if visible)
    - **Address**
  - Store the data in Supabase for each project.

- Prevent duplicates:
  - Before inserting into Supabase, check if the business name + address combination already exists in the database for that project.

#### Display & Storage
- Clearly list all search terms for each project.
- Display total number of leads collected per project.
- Show summary stats (e.g., unique leads scraped, duplicates removed).

---

### 5. Non-Functional Requirements

#### Design
- Modern, intuitive UI consistent with existing app design (Slack-inspired).  
- Projects displayed in a card or list layout.  
- Simple visual indicators for scraper progress and completion.  

#### Performance
- Scraper should handle up to 10 search terms per project efficiently.  
- Each full scrape should complete within ~2–3 minutes depending on network conditions.  

#### Security & Compliance
- Only authorized internal users can access the feature.  
- Respect Google’s terms of service and avoid rate-limit violations.  
- Include rate limiting and delay logic to prevent being blocked by Google.  

---

### 6. Dependencies & Risks

#### Dependencies
- **Frontend:** React or similar JS framework, Tailwind CSS.  
- **Backend:** Node.js or Python for scraping logic.  
- **Database:** Supabase for storing projects and leads.  
- **Libraries:**  
  - Puppeteer, Playwright, or Cheerio for web scraping.  
  - Supabase JS client for data persistence.

#### Risks
- Google’s HTML structure may change, requiring scraper maintenance.  
- Aggressive scraping could trigger temporary IP bans.  
- Duplicate detection might need refinement for businesses with similar names or addresses.

---

### 7. Timeline / Milestones

| Milestone | Description | Owner | Target Date |
|------------|--------------|--------|--------------|
| M1 | Design UI for Lead Scraper project list & creation | Design | Week 1 |
| M2 | Implement project creation and search term input | Dev | Week 2 |
| M3 | Build scraper logic (10 pages, deduplication, field extraction) | Dev | Week 3 |
| M4 | Integrate Supabase for project + lead storage | Dev | Week 4 |
| M5 | Add duplicate detection and UI display | Dev | Week 5 |
| M6 | QA testing and internal review | QA | Week 6 |
| M7 | Feature sign-off | PM | Week 7 |

---

### 8. Future Considerations

- Export leads to CSV or integrate with CRM systems.  
- Add filtering and sorting (by location, rating, etc.).  
- Enable scheduling of scrapes (e.g., weekly updates).  
- Expand data sources beyond Google (Yelp, LinkedIn, etc.).  
