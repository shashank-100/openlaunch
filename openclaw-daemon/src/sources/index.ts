import { Page } from 'playwright';

export interface ResearchSource {
  name: string;
  url: string;
  extractor: (page: Page, companyName: string, contactName: string) => Promise<any>;
  priority: number;
  timeout?: number;
}

/**
 * The 10 research sources that OpenClaw visits for every job
 */
export const researchSources: ResearchSource[] = [
  {
    name: 'Company Website',
    url: 'https://www.google.com/search?q={company}+official+website',
    priority: 1,
    extractor: async (page, companyName) => {
      try {
        // Search for company website
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(companyName + ' official website')}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        // Get first result
        const firstResult = await page.locator('a[href]').first();
        const url = await firstResult.getAttribute('href');

        if (url && url.startsWith('http')) {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

          // Extract basic company info
          const title = await page.title();
          const description = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
          const bodyText = await page.locator('body').innerText().catch(() => '');

          return {
            url,
            title,
            description,
            productInfo: bodyText.substring(0, 500),
          };
        }

        return { error: 'Website not found' };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Crunchbase',
    url: 'https://www.crunchbase.com/organization/{company}',
    priority: 4,
    extractor: async (page, companyName) => {
      try {
        const searchUrl = `https://www.crunchbase.com/search/organizations/field/organizations/name/${encodeURIComponent(companyName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        await page.waitForTimeout(2000);

        // Click first result
        const firstResult = await page.locator('a[href*="/organization/"]').first().getAttribute('href').catch(() => null);

        if (!firstResult) {
          return { error: 'Company not found on Crunchbase' };
        }

        await page.goto(`https://www.crunchbase.com${firstResult}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);

        // Extract funding data
        const fundingText = await page.locator('text=/\\$.*raised/').innerText().catch(() => null);
        const founded = await page.locator('text=/Founded.*\\d{4}/').innerText().catch(() => null);

        return {
          fundingRaised: fundingText,
          founded,
          crunchbaseUrl: `https://www.crunchbase.com${firstResult}`,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Google News',
    url: 'https://news.google.com/search?q={company}',
    priority: 5,
    extractor: async (page, companyName) => {
      try {
        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(companyName)}&hl=en-US&gl=US&ceid=US:en`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        await page.waitForTimeout(2000);

        // Extract news headlines
        const headlines = await page.locator('article a').allTextContents().catch(() => []);

        return {
          recentNews: headlines.slice(0, 5),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'BuiltWith',
    url: 'https://builtwith.com/{company}',
    priority: 6,
    extractor: async (page, companyName) => {
      try {
        // This would require the company domain
        // Simplified version
        return {
          techStack: 'Requires domain - skipped in MVP',
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/search/?keywords={company}',
    priority: 7,
    extractor: async (page, companyName) => {
      try {
        const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companyName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        await page.waitForTimeout(2000);

        // Extract job titles
        const jobTitles = await page.locator('.job-card-list__title').allTextContents().catch(() => []);

        return {
          openRoles: jobTitles.slice(0, 10),
          hiringSignal: jobTitles.length > 5,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'G2',
    url: 'https://www.g2.com/search?query={company}',
    priority: 8,
    extractor: async (page, companyName) => {
      try {
        const searchUrl = `https://www.g2.com/search?query=${encodeURIComponent(companyName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        await page.waitForTimeout(2000);

        // Click first product result
        const firstProduct = await page.locator('a[href*="/products/"]').first().getAttribute('href').catch(() => null);

        if (!firstProduct) {
          return { error: 'Product not found on G2' };
        }

        await page.goto(`https://www.g2.com${firstProduct}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);

        // Extract review themes
        const reviewSnippets = await page.locator('.review-snippet').allTextContents().catch(() => []);

        return {
          g2Url: `https://www.g2.com${firstProduct}`,
          reviewThemes: reviewSnippets.slice(0, 5),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Twitter/X',
    url: 'https://twitter.com/search?q={contact}',
    priority: 9,
    extractor: async (page, companyName, contactName) => {
      try {
        // X/Twitter requires login - simplified for MVP
        return {
          recentTweets: 'Requires Twitter login - skipped in MVP',
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Company Blog',
    url: '{company_domain}/blog',
    priority: 10,
    extractor: async (page, companyName) => {
      try {
        // Would need to find blog from website - simplified for MVP
        return {
          recentPosts: 'Blog discovery - skipped in MVP',
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },
];
