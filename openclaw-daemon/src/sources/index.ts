import axios from 'axios';
import { Page } from 'playwright';

export interface ResearchSource {
  name: string;
  url: string;
  extractor: (page: Page, companyName: string, contactName: string) => Promise<any>;
  priority: number;
  timeout?: number;
}

/**
 * Tavily AI search — bypasses bot-detection, returns clean text snippets
 */
async function tavilySearch(
  query: string,
  options: { maxResults?: number; searchDepth?: 'basic' | 'advanced' } = {}
): Promise<{ title: string; url: string; content: string; score: number }[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  TAVILY_API_KEY not set');
    return [];
  }

  const { maxResults = 5, searchDepth = 'advanced' } = options;

  try {
    const { data } = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: true,
      },
      { timeout: 20000 }
    );
    return data.results || [];
  } catch (error: any) {
    console.warn(`Tavily search failed for "${query}":`, error.message);
    return [];
  }
}

/** Combine top result contents into a single text block */
function combineContent(
  results: { title: string; url: string; content: string }[],
  maxChars = 3000
): string {
  return results
    .map((r) => `[${r.title}]\n${r.content}`)
    .join('\n\n')
    .substring(0, maxChars);
}

export const researchSources: ResearchSource[] = [
  {
    name: 'Company Overview',
    url: 'tavily://company-overview',
    priority: 1,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const results = await tavilySearch(`${companyName} company overview what do they do`, {
          maxResults: 5,
          searchDepth: 'advanced',
        });

        if (!results.length) return { error: 'No results' };

        return {
          overview: combineContent(results, 3000),
          sources: results.map((r) => ({ title: r.title, url: r.url })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Funding & Company Info',
    url: 'tavily://funding',
    priority: 2,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const [fundingResults, foundedResults] = await Promise.all([
          tavilySearch(`${companyName} funding raised investors series valuation`, {
            maxResults: 5,
            searchDepth: 'advanced',
          }),
          tavilySearch(`${companyName} founded year headquarters employees`, {
            maxResults: 3,
            searchDepth: 'basic',
          }),
        ]);

        return {
          fundingInfo: combineContent(fundingResults, 2500),
          companyInfo: combineContent(foundedResults, 1500),
          sources: [...fundingResults, ...foundedResults].map((r) => ({
            title: r.title,
            url: r.url,
          })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Recent News',
    url: 'tavily://news',
    priority: 3,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const results = await tavilySearch(
          `${companyName} news announcements 2024 2025`,
          { maxResults: 8, searchDepth: 'advanced' }
        );

        return {
          recentNews: results.map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.content.substring(0, 300),
          })),
          totalArticlesFound: results.length,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Tech Stack',
    url: 'tavily://tech-stack',
    priority: 4,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const results = await tavilySearch(
          `${companyName} tech stack engineering technology infrastructure programming languages`,
          { maxResults: 5, searchDepth: 'advanced' }
        );

        return {
          techStackContext: combineContent(results, 2000),
          sources: results.map((r) => ({ title: r.title, url: r.url })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Hiring Signals',
    url: 'tavily://hiring',
    priority: 5,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const results = await tavilySearch(
          `${companyName} hiring jobs open positions engineering leadership 2024 2025`,
          { maxResults: 6, searchDepth: 'advanced' }
        );

        const hiringText = combineContent(results, 2000);

        // Extract role signals from content
        const leadershipMatches = hiringText.match(/\b(VP|Director|Head of|Chief|Manager|Lead)\s+\w[\w\s]*/gi) || [];
        const engineeringMatches = hiringText.match(/\b(Engineer|Developer|Architect|Backend|Frontend|Data|ML|AI)\s+\w[\w\s]*/gi) || [];

        return {
          hiringContext: hiringText,
          hiringSignal: results.length > 0,
          leadershipRoles: [...new Set(leadershipMatches)].slice(0, 5),
          engineeringRoles: [...new Set(engineeringMatches)].slice(0, 5),
          sources: results.map((r) => ({ title: r.title, url: r.url })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Reviews & Reputation',
    url: 'tavily://reviews',
    priority: 6,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const results = await tavilySearch(
          `${companyName} reviews rating G2 Glassdoor Capterra customer feedback`,
          { maxResults: 5, searchDepth: 'advanced' }
        );

        const reviewText = combineContent(results, 2000);
        const ratingMatch = reviewText.match(/(\d+\.?\d*)\s*(out of 5|\/5|\s*stars?)/i);

        return {
          reviewContext: reviewText,
          ratingFound: ratingMatch ? ratingMatch[0] : null,
          sources: results.map((r) => ({ title: r.title, url: r.url })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Competitor Research',
    url: 'tavily://competitors',
    priority: 7,
    timeout: 25000,
    extractor: async (_page, companyName) => {
      try {
        const results = await tavilySearch(
          `${companyName} competitors alternatives vs comparison market`,
          { maxResults: 5, searchDepth: 'advanced' }
        );

        return {
          competitorContext: combineContent(results, 2000),
          sources: results.map((r) => ({ title: r.title, url: r.url })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  {
    name: 'Contact Research',
    url: 'tavily://contact',
    priority: 8,
    timeout: 25000,
    extractor: async (_page, companyName, contactName) => {
      try {
        if (!contactName || contactName === 'Unknown') {
          return { note: 'No contact name provided' };
        }

        const results = await tavilySearch(
          `${contactName} ${companyName} linkedin role background`,
          { maxResults: 5, searchDepth: 'advanced' }
        );

        const linkedinResult = results.find((r) => r.url.includes('linkedin.com'));

        return {
          contactContext: combineContent(results, 1500),
          linkedinProfileFound: !!linkedinResult,
          linkedinUrl: linkedinResult?.url || null,
          sources: results.map((r) => ({ title: r.title, url: r.url })),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },
];
