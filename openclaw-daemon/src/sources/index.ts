import { Page } from 'playwright';

export interface ResearchSource {
  name: string;
  url: string;
  extractor: (page: Page, companyName: string, contactName: string) => Promise<any>;
  priority: number;
  timeout?: number;
}

/**
 * Helper: Google search and return top N organic result URLs
 */
async function googleSearchUrls(page: Page, query: string, n = 3): Promise<string[]> {
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await page.waitForTimeout(1500);

  // Extract all organic result links (Google wraps them in /url?q= or direct h3 > a)
  const urls = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    return anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) =>
        href.startsWith('http') &&
        !href.includes('google.com') &&
        !href.includes('youtube.com/watch') &&
        !href.includes('accounts.google') &&
        !href.includes('maps.google')
      );
  });

  return [...new Set(urls)].slice(0, n);
}

/**
 * Helper: Extract visible text from a page, truncated to maxChars
 */
async function pageText(page: Page, maxChars = 3000): Promise<string> {
  const text = await page.evaluate(() => {
    // Remove nav, footer, scripts
    const remove = ['nav', 'footer', 'script', 'style', 'noscript'];
    remove.forEach((tag) =>
      document.querySelectorAll(tag).forEach((el) => el.remove())
    );
    return document.body?.innerText || '';
  });
  return text.replace(/\s+/g, ' ').trim().substring(0, maxChars);
}

export const researchSources: ResearchSource[] = [
  {
    name: 'Company Website',
    url: 'https://www.google.com/search?q={company}+official+website',
    priority: 1,
    timeout: 30000,
    extractor: async (page, companyName) => {
      try {
        const urls = await googleSearchUrls(page, `${companyName} official website`, 3);

        if (!urls.length) return { error: 'No website found' };

        const siteUrl = urls[0];
        await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(1000);

        const title = await page.title();
        const description = await page
          .locator('meta[name="description"]')
          .getAttribute('content')
          .catch(() => null);
        const ogDescription = await page
          .locator('meta[property="og:description"]')
          .getAttribute('content')
          .catch(() => null);

        const homepageText = await pageText(page, 2000);

        // Try /about page for richer description
        let aboutText = '';
        try {
          const aboutUrl = siteUrl.replace(/\/$/, '') + '/about';
          await page.goto(aboutUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
          aboutText = await pageText(page, 1500);
        } catch {
          // /about not found, skip
        }

        return {
          url: siteUrl,
          title,
          metaDescription: description || ogDescription,
          homepageText,
          aboutText,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Funding & Company Info',
    url: 'https://www.google.com/search?q={company}+funding+crunchbase',
    priority: 2,
    timeout: 20000,
    extractor: async (page, companyName) => {
      try {
        // Google search for funding info — more reliable than scraping Crunchbase directly
        await page.goto(
          `https://www.google.com/search?q=${encodeURIComponent(companyName + ' startup funding raised investors')}`,
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        await page.waitForTimeout(1500);

        // Extract the Knowledge Panel / info box text if present
        const knowledgePanel = await page
          .locator('[data-attrid], .kno-rdesc, .IZ6rdc')
          .allTextContents()
          .catch(() => []);

        // Extract snippet text from search results
        const snippets = await page
          .locator('.VwiC3b, .s3v9rd, span[data-ved]')
          .allTextContents()
          .catch(() => []);

        const allText = [...knowledgePanel, ...snippets]
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000);

        // Also search for founding year
        const foundedSearch = await page
          .locator('text=/founded/i')
          .allTextContents()
          .catch(() => []);

        return {
          fundingInfo: allText,
          foundedMentions: foundedSearch.slice(0, 3),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Google News',
    url: 'https://news.google.com/search?q={company}',
    priority: 3,
    timeout: 20000,
    extractor: async (page, companyName) => {
      try {
        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(companyName)}&hl=en-US&gl=US&ceid=US:en`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        // Extract article data: title + publication + time
        const articles = await page.evaluate(() => {
          const results: { title: string; source: string; time: string }[] = [];
          const articleEls = document.querySelectorAll('article');
          articleEls.forEach((article) => {
            const titleEl = article.querySelector('a[class*="title"], h3 a, h4 a, a[href*="articles"]');
            const sourceEl = article.querySelector('[data-n-tid], time + div, .vr1PYe');
            const timeEl = article.querySelector('time');
            if (titleEl) {
              results.push({
                title: titleEl.textContent?.trim() || '',
                source: sourceEl?.textContent?.trim() || '',
                time: timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '',
              });
            }
          });
          return results.slice(0, 8);
        });

        return {
          recentNews: articles,
          totalArticlesFound: articles.length,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Tech Stack (Google)',
    url: 'https://www.google.com/search?q={company}+tech+stack',
    priority: 4,
    timeout: 20000,
    extractor: async (page, companyName) => {
      try {
        // Search for tech stack info via Google (more reliable than BuiltWith scraping)
        await page.goto(
          `https://www.google.com/search?q=${encodeURIComponent(companyName + ' tech stack engineering blog')}`,
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        await page.waitForTimeout(1500);

        const snippets = await page
          .locator('.VwiC3b, .s3v9rd')
          .allTextContents()
          .catch(() => []);

        const techText = snippets.join(' ').replace(/\s+/g, ' ').trim().substring(0, 1500);

        // Also try Stackshare
        const stackshareUrls = await googleSearchUrls(
          page,
          `site:stackshare.io ${companyName}`,
          1
        );

        let stackshareData = null;
        if (stackshareUrls.length > 0) {
          try {
            await page.goto(stackshareUrls[0], { waitUntil: 'domcontentloaded', timeout: 10000 });
            await page.waitForTimeout(1000);
            const tools = await page
              .locator('[class*="tool-name"], [class*="StackItem"] h3, h3[class*="tool"]')
              .allTextContents()
              .catch(() => []);
            stackshareData = {
              url: stackshareUrls[0],
              tools: tools.slice(0, 20),
            };
          } catch {
            // Stackshare blocked, skip
          }
        }

        return {
          techStackContext: techText,
          stackshare: stackshareData,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/search/?keywords={company}',
    priority: 5,
    timeout: 25000,
    extractor: async (page, companyName) => {
      try {
        // LinkedIn public job search works without login
        const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companyName)}&f_C=&location=United%20States`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);

        // Try multiple selectors for job titles (LinkedIn changes them)
        const jobTitles = await page
          .locator(
            '.job-search-card__title, .base-search-card__title, h3.base-search-card__title, .jobs-search__results-list li h3'
          )
          .allTextContents()
          .catch(() => []);

        const jobLocations = await page
          .locator('.job-search-card__location, .base-search-card__metadata')
          .allTextContents()
          .catch(() => []);

        const cleanTitles = jobTitles.map((t) => t.trim()).filter(Boolean);

        return {
          openRoles: cleanTitles.slice(0, 10),
          locations: jobLocations.slice(0, 5),
          totalJobsFound: cleanTitles.length,
          hiringSignal: cleanTitles.length > 3,
          engineeringRoles: cleanTitles.filter((t) =>
            /engineer|developer|architect|backend|frontend|infrastructure|data|ml|ai/i.test(t)
          ),
          leadershipRoles: cleanTitles.filter((t) =>
            /vp|director|head of|chief|manager|lead/i.test(t)
          ),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Reviews & Reputation',
    url: 'https://www.google.com/search?q={company}+reviews',
    priority: 6,
    timeout: 20000,
    extractor: async (page, companyName) => {
      try {
        // Search G2 and Glassdoor via Google instead of direct scraping
        await page.goto(
          `https://www.google.com/search?q=${encodeURIComponent(companyName + ' reviews g2 glassdoor capterra')}`,
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        await page.waitForTimeout(1500);

        const snippets = await page
          .locator('.VwiC3b, .s3v9rd')
          .allTextContents()
          .catch(() => []);

        const reviewText = snippets.join(' ').replace(/\s+/g, ' ').trim().substring(0, 2000);

        // Try to get G2 rating from Google snippet
        const ratingMatch = reviewText.match(/(\d+\.?\d*)\s*(out of 5|\/5|\s*stars?)/i);

        return {
          reviewContext: reviewText,
          ratingFound: ratingMatch ? ratingMatch[0] : null,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Competitor Research',
    url: 'https://www.google.com/search?q={company}+competitors+alternatives',
    priority: 7,
    timeout: 20000,
    extractor: async (page, companyName) => {
      try {
        await page.goto(
          `https://www.google.com/search?q=${encodeURIComponent(companyName + ' competitors vs alternatives')}`,
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        await page.waitForTimeout(1500);

        const snippets = await page
          .locator('.VwiC3b, .s3v9rd')
          .allTextContents()
          .catch(() => []);

        const competitorText = snippets.join(' ').replace(/\s+/g, ' ').trim().substring(0, 2000);

        // "People also search for" section
        const relatedSearches = await page
          .locator('[data-q], .s75CSd, .AB4Wff')
          .allTextContents()
          .catch(() => []);

        return {
          competitorContext: competitorText,
          relatedSearches: relatedSearches.slice(0, 8),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Contact Research',
    url: 'https://www.google.com/search?q={contact}+{company}',
    priority: 8,
    timeout: 20000,
    extractor: async (page, companyName, contactName) => {
      try {
        if (!contactName || contactName === 'Unknown') {
          return { note: 'No contact name provided' };
        }

        await page.goto(
          `https://www.google.com/search?q=${encodeURIComponent(contactName + ' ' + companyName + ' linkedin')}`,
          { waitUntil: 'domcontentloaded', timeout: 15000 }
        );
        await page.waitForTimeout(1500);

        const snippets = await page
          .locator('.VwiC3b, .s3v9rd, .kno-rdesc')
          .allTextContents()
          .catch(() => []);

        const contactContext = snippets.join(' ').replace(/\s+/g, ' ').trim().substring(0, 1500);

        // Check for LinkedIn profile
        const linkedinUrls = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href]'))
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => href.includes('linkedin.com/in/'))
            .slice(0, 2);
        });

        return {
          contactContext,
          linkedinProfileFound: linkedinUrls.length > 0,
          linkedinUrl: linkedinUrls[0] || null,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },
];
