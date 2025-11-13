/**
 * Email Finder Service
 * Attempts to find email addresses from business websites
 * 
 * Methods:
 * 1. Web scraping - Parses website HTML for email patterns
 * 2. Common patterns - Tries common email formats (info@, contact@, etc.)
 * 3. Third-party API - Optional integration with Hunter.io
 */

interface EmailFinderResult {
  email: string | null
  confidence: 'high' | 'medium' | 'low'
  source: 'scraped' | 'pattern' | 'api'
  found_at: Date
}

/**
 * Extract emails from HTML text using regex
 */
function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex) || []
  
  // Filter out common non-business emails and images
  return matches.filter(email => {
    const lower = email.toLowerCase()
    return !lower.includes('.png') &&
           !lower.includes('.jpg') &&
           !lower.includes('.gif') &&
           !lower.includes('example.com') &&
           !lower.includes('sentry') &&
           !lower.includes('wixpress') &&
           !lower.includes('placeholder')
  })
}

/**
 * Score email based on common business patterns
 */
function scoreEmail(email: string): number {
  const lower = email.toLowerCase()
  let score = 0
  
  // High value prefixes
  if (lower.startsWith('info@')) score += 30
  if (lower.startsWith('contact@')) score += 30
  if (lower.startsWith('hello@')) score += 25
  if (lower.startsWith('sales@')) score += 25
  if (lower.startsWith('support@')) score += 20
  if (lower.startsWith('admin@')) score += 15
  
  // Personal names are good
  if (lower.match(/^[a-z]+@/)) score += 10
  
  // Penalties for generic/spam
  if (lower.includes('noreply')) score -= 50
  if (lower.includes('no-reply')) score -= 50
  if (lower.includes('donotreply')) score -= 50
  if (lower.includes('unsubscribe')) score -= 30
  if (lower.includes('privacy')) score -= 20
  
  return score
}

/**
 * Find email by scraping website
 */
export async function findEmailFromWebsite(
  websiteUrl: string,
  businessName: string
): Promise<EmailFinderResult | null> {
  try {
    // Normalize URL
    const url = websiteUrl.startsWith('http') 
      ? websiteUrl 
      : `https://${websiteUrl}`
    
    // Fetch website with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadScraperBot/1.0)',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`)
      return null
    }
    
    const html = await response.text()
    
    // Extract all emails from the page
    const emails = extractEmailsFromText(html)
    
    if (emails.length === 0) {
      return null
    }
    
    // Score and sort emails
    const scoredEmails = emails.map(email => ({
      email,
      score: scoreEmail(email),
    }))
    
    scoredEmails.sort((a, b) => b.score - a.score)
    
    // Get best email
    const bestEmail = scoredEmails[0]
    
    // Only return if score is positive
    if (bestEmail.score <= 0) {
      return null
    }
    
    return {
      email: bestEmail.email,
      confidence: bestEmail.score >= 25 ? 'high' : bestEmail.score >= 10 ? 'medium' : 'low',
      source: 'scraped',
      found_at: new Date(),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`Timeout fetching ${websiteUrl}`)
    } else {
      console.error(`Error finding email for ${websiteUrl}:`, error)
    }
    return null
  }
}

/**
 * Try common email patterns based on domain
 */
export function generateCommonEmailPatterns(domain: string): string[] {
  return [
    `info@${domain}`,
    `contact@${domain}`,
    `hello@${domain}`,
    `sales@${domain}`,
    `support@${domain}`,
    `admin@${domain}`,
  ]
}

/**
 * Find email using Hunter.io API (requires API key)
 * https://hunter.io/api-documentation/v2
 */
export async function findEmailWithHunter(
  domain: string,
  apiKey?: string
): Promise<EmailFinderResult | null> {
  if (!apiKey) {
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&limit=1`
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (data.data?.emails && data.data.emails.length > 0) {
      const email = data.data.emails[0]
      
      return {
        email: email.value,
        confidence: email.confidence >= 80 ? 'high' : email.confidence >= 50 ? 'medium' : 'low',
        source: 'api',
        found_at: new Date(),
      }
    }
    
    return null
  } catch (error) {
    console.error('Error with Hunter.io API:', error)
    return null
  }
}

/**
 * Main email finding function - tries all methods
 */
export async function findEmail(
  websiteUrl: string,
  businessName: string,
  hunterApiKey?: string
): Promise<EmailFinderResult | null> {
  // Try Hunter.io first if API key provided (most reliable)
  if (hunterApiKey && websiteUrl) {
    try {
      const domain = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname
      const hunterResult = await findEmailWithHunter(domain, hunterApiKey)
      if (hunterResult) {
        return hunterResult
      }
    } catch (error) {
      console.error('Hunter.io failed:', error)
    }
  }
  
  // Try web scraping
  if (websiteUrl) {
    const scrapedResult = await findEmailFromWebsite(websiteUrl, businessName)
    if (scrapedResult) {
      return scrapedResult
    }
  }
  
  return null
}

