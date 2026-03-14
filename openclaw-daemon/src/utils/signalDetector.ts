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

  // 1. Hiring surge signal
  if (extractedData['LinkedIn Jobs']?.openRoles) {
    const roleCount = extractedData['LinkedIn Jobs'].openRoles.length;
    if (roleCount > 10) {
      signals.push({
        type: 'hiring_surge',
        title: 'Active Hiring Across Multiple Departments',
        description: `Company has ${roleCount} open positions - indicates growth and budget availability`,
        importanceScore: 8,
        metadata: { roleCount },
      });
    }

    // Engineering hiring signal
    const engineeringRoles = extractedData['LinkedIn Jobs'].openRoles.filter((role: string) =>
      /engineer|developer|software|technical/i.test(role)
    );
    if (engineeringRoles.length > 3) {
      signals.push({
        type: 'engineering_hiring',
        title: 'Engineering Team Expansion',
        description: `${engineeringRoles.length} engineering roles open - they're building something new`,
        importanceScore: 7,
        metadata: { engineeringRoles },
      });
    }
  }

  // 2. Recent funding signal
  if (extractedData['Crunchbase']?.fundingRaised) {
    const fundingText = extractedData['Crunchbase'].fundingRaised;
    if (fundingText && /raised/i.test(fundingText)) {
      signals.push({
        type: 'recent_funding',
        title: 'Recent Funding Round',
        description: fundingText,
        importanceScore: 9,
        sourceUrl: extractedData['Crunchbase'].crunchbaseUrl,
      });
    }
  }

  // 3. New leadership signal (from news)
  if (extractedData['Google News']?.recentNews) {
    const newsItems = extractedData['Google News'].recentNews;
    const leadershipNews = newsItems.filter((item: string) =>
      /hire|appoint|ceo|cto|cro|vp|executive|join/i.test(item)
    );

    if (leadershipNews.length > 0) {
      signals.push({
        type: 'new_leadership',
        title: 'Leadership Changes Detected',
        description: leadershipNews[0],
        importanceScore: 8,
        metadata: { newsItems: leadershipNews },
      });
    }
  }

  // 4. Product launch signal
  if (extractedData['Google News']?.recentNews) {
    const newsItems = extractedData['Google News'].recentNews;
    const productNews = newsItems.filter((item: string) =>
      /launch|release|announce|introduce|unveil/i.test(item)
    );

    if (productNews.length > 0) {
      signals.push({
        type: 'product_launch',
        title: 'Recent Product Activity',
        description: productNews[0],
        importanceScore: 6,
        metadata: { newsItems: productNews },
      });
    }
  }

  // 5. Competitor evaluation signal (from G2)
  if (extractedData['G2']?.reviewThemes) {
    const reviews = extractedData['G2'].reviewThemes;
    const competitorMentions = reviews.filter((review: string) =>
      /vs|compared to|alternative|switch/i.test(review)
    );

    if (competitorMentions.length > 0) {
      signals.push({
        type: 'competitor_evaluation',
        title: 'Actively Evaluating Alternatives',
        description: 'G2 reviews show comparison shopping behavior',
        importanceScore: 7,
        sourceUrl: extractedData['G2'].g2Url,
        metadata: { mentions: competitorMentions },
      });
    }
  }

  // 6. Employee growth signal
  if (extractedData['LinkedIn Company']?.employeeCount) {
    const count = extractedData['LinkedIn Company'].employeeCount;
    // Parse employee count ranges
    const match = count.match(/(\d+)-(\d+)/);
    if (match) {
      const avgSize = (parseInt(match[1]) + parseInt(match[2])) / 2;
      if (avgSize > 100) {
        signals.push({
          type: 'company_scale',
          title: 'Mid-Market to Enterprise Scale',
          description: `${count} employees - established organization with budget`,
          importanceScore: 6,
          sourceUrl: extractedData['LinkedIn Company'].linkedinUrl,
        });
      }
    }
  }

  // 7. Contact role signal
  if (extractedData['LinkedIn Contact']?.currentRole) {
    const role = extractedData['LinkedIn Contact'].currentRole.toLowerCase();
    if (/vp|director|head|chief|ceo|cto|cro/i.test(role)) {
      signals.push({
        type: 'decision_maker',
        title: 'Senior Decision Maker',
        description: `Contact holds ${extractedData['LinkedIn Contact'].currentRole} - has budget authority`,
        importanceScore: 8,
        sourceUrl: extractedData['LinkedIn Contact'].linkedinUrl,
      });
    }
  }

  // 8. Tech stack gap signal (simplified for MVP)
  // In production, this would compare their stack against what you sell

  // Sort by importance
  signals.sort((a, b) => b.importanceScore - a.importanceScore);

  return signals;
}
