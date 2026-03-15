/**
 * Signal Detection Layer
 * Analyzes raw data to flag important insights for sales reps
 */

export interface Signal {
  type: string;
  title: string;
  description: string;
  importanceScore: number; // 1-10
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

export async function detectSignals(extractedData: Record<string, any>): Promise<Signal[]> {
  const signals: Signal[] = [];

  // 1. Hiring signals
  const jobs = extractedData['Hiring Signals'];
  if (jobs?.hiringSignal) {
    const engRoles: string[] = jobs.engineeringRoles || [];
    const leaderRoles: string[] = jobs.leadershipRoles || [];

    if (engRoles.length > 0) {
      signals.push({
        type: 'engineering_expansion',
        title: 'Engineering Team Growing',
        description: `Engineering roles open — building new capabilities`,
        importanceScore: 7,
        metadata: { roles: engRoles },
      });
    }

    if (leaderRoles.length > 0) {
      signals.push({
        type: 'leadership_hiring',
        title: 'Hiring Senior Leaders',
        description: `Recruiting for: ${leaderRoles.slice(0, 3).join(', ')}`,
        importanceScore: 8,
        metadata: { roles: leaderRoles },
      });
    } else if (jobs.hiringContext?.match(/hiring|recruiting|open roles/i)) {
      signals.push({
        type: 'hiring_surge',
        title: 'Active Hiring Detected',
        description: 'Company is actively recruiting across multiple roles',
        importanceScore: 6,
        metadata: { context: jobs.hiringContext?.substring(0, 300) },
      });
    }
  }

  // 2. Funding signal from Google search
  const funding = extractedData['Funding & Company Info'];
  if (funding?.fundingInfo) {
    const fundingText: string = funding.fundingInfo;
    const fundingMatch = fundingText.match(/\$[\d,.]+\s*(million|billion|M|B)/i);
    const seriesMatch = fundingText.match(/series\s+[a-z]/i);
    const raisedMatch = fundingText.match(/raised/i);

    if (fundingMatch || seriesMatch) {
      signals.push({
        type: 'recent_funding',
        title: 'Funding Activity Detected',
        description: [fundingMatch?.[0], seriesMatch?.[0]].filter(Boolean).join(' — ') ||
          'Funding round mentioned in search results',
        importanceScore: 9,
        metadata: { context: fundingText.substring(0, 300) },
      });
    } else if (raisedMatch) {
      signals.push({
        type: 'funding_mention',
        title: 'Funding Mentioned',
        description: 'Funding activity found in company search results',
        importanceScore: 6,
        metadata: { context: fundingText.substring(0, 300) },
      });
    }
  }

  // 3. News signals
  const news = extractedData['Recent News'];
  if (news?.recentNews?.length > 0) {
    const newsItems: { title: string; source: string; time: string }[] = news.recentNews;
    const titles = newsItems.map((n) => (typeof n === 'string' ? n : n.title));

    const leadershipNews = titles.filter((t) =>
      /hire|appoint|ceo|cto|cro|vp|executive|joins|named/i.test(t)
    );
    if (leadershipNews.length > 0) {
      signals.push({
        type: 'new_leadership',
        title: 'Leadership Changes in News',
        description: leadershipNews[0],
        importanceScore: 8,
        metadata: { allMatches: leadershipNews },
      });
    }

    const productNews = titles.filter((t) =>
      /launch|release|announce|introduc|unveil|partner|acqui/i.test(t)
    );
    if (productNews.length > 0) {
      signals.push({
        type: 'product_activity',
        title: 'Recent Product or Partnership News',
        description: productNews[0],
        importanceScore: 7,
        metadata: { allMatches: productNews },
      });
    }
  }

  // 4. Competitor signals
  const competitors = extractedData['Competitor Research'];
  if (competitors?.competitorContext) {
    const ctx: string = competitors.competitorContext;
    const vsMatch = ctx.match(/vs\.?\s+\w+/gi);
    if (vsMatch?.length) {
      signals.push({
        type: 'competitive_landscape',
        title: 'Competitive Context Available',
        description: `Competitors mentioned: ${vsMatch.slice(0, 3).join(', ')}`,
        importanceScore: 6,
        metadata: { mentions: vsMatch.slice(0, 5) },
      });
    }
  }

  // 5. Contact is decision maker
  const contact = extractedData['Contact Research'];
  if (contact?.contactContext) {
    const ctx: string = contact.contactContext;
    if (/vp|director|head of|chief|ceo|cto|cro|president|founder/i.test(ctx)) {
      signals.push({
        type: 'decision_maker',
        title: 'Senior Decision Maker',
        description: 'Contact appears to hold a senior/executive role',
        importanceScore: 8,
        metadata: { linkedinUrl: contact.linkedinUrl },
      });
    }
  }

  // Sort by importance
  signals.sort((a, b) => b.importanceScore - a.importanceScore);

  return signals;
}
