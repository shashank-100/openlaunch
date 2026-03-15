import { BrowserContext, Page } from 'playwright';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { researchSources } from '../sources';
import { detectSignals } from '../utils/signalDetector';

export interface ResearchResults {
  companyData: any;
  contactData: any;
  signals: any[];
  sourcesVisited: number;
  extractedData: Record<string, any>;
}

export class ResearchAgent {
  private context: BrowserContext;
  private supabase: SupabaseClient;
  private jobId: string;
  private openai: OpenAI;
  private page: Page | null = null;

  constructor(context: BrowserContext, supabase: SupabaseClient, jobId: string) {
    this.context = context;
    this.supabase = supabase;
    this.jobId = jobId;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Main research orchestrator
   * Visits all sources in sequence and extracts data
   */
  async research(
    companyName: string,
    contactName: string,
    onProgress?: (progress: number) => void
  ): Promise<ResearchResults> {
    const results: ResearchResults = {
      companyData: {},
      contactData: {},
      signals: [],
      sourcesVisited: 0,
      extractedData: {},
    };

    this.page = await this.context.newPage();

    const totalSources = researchSources.length;
    const progressPerSource = 80 / totalSources; // 10-90% for research

    for (let i = 0; i < researchSources.length; i++) {
      const source = researchSources[i];
      const startTime = Date.now();

      try {
        console.log(`  📍 Visiting: ${source.name}`);

        await this.logAgentAction({
          sourceName: source.name,
          sourceUrl: source.url,
          actionType: 'navigate',
          actionDescription: `Starting extraction from ${source.name}`,
        });

        // Extract data from source
        const data = await this.extractWithRetry(source, companyName, contactName);

        // Store extracted data
        results.extractedData[source.name] = data;
        results.sourcesVisited++;

        const duration = Date.now() - startTime;

        await this.logAgentAction({
          sourceName: source.name,
          sourceUrl: source.url,
          actionType: 'extract',
          actionDescription: `Successfully extracted data from ${source.name}`,
          extractedData: data,
          durationMs: duration,
          success: true,
        });

        console.log(`  ✅ ${source.name} complete (${duration}ms)`);

        // Update progress
        if (onProgress) {
          onProgress(10 + (i + 1) * progressPerSource);
        }

      } catch (error: any) {
        console.log(`  ⚠️  ${source.name} failed: ${error.message}`);

        await this.logAgentAction({
          sourceName: source.name,
          sourceUrl: source.url,
          actionType: 'error',
          actionDescription: `Failed to extract from ${source.name}`,
          errorMessage: error.message,
          success: false,
        });

        // Continue with other sources even if one fails
        continue;
      }
    }

    // Detect signals from all extracted data
    results.signals = await detectSignals(results.extractedData);

    console.log(`  🎯 Detected ${results.signals.length} signals`);

    await this.page.close();

    return results;
  }

  /**
   * Extract data with retry logic
   */
  private async extractWithRetry(
    source: any,
    companyName: string,
    contactName: string,
    maxRetries = 3
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeout = source.timeout || 30000;

        const data = await Promise.race([
          source.extractor(this.page!, companyName, contactName),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ]);

        return data;

      } catch (error: any) {
        lastError = error;
        console.log(`    Retry ${attempt}/${maxRetries} for ${source.name}`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    throw lastError || new Error('Extraction failed');
  }

  /**
   * Generate brief using OpenAI GPT-5.1-codex-mini
   */
  async generateBrief(results: ResearchResults): Promise<any> {
    console.log('  🤖 Generating brief with gpt-5-mini...');

    const prompt = this.buildBriefPrompt(results);

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const briefContent = completion.choices[0]?.message?.content || '';

    // Parse response into structured sections
    const brief = this.parseBriefContent(briefContent);

    console.log('  ✅ Brief generated');

    return brief;
  }

  /**
   * Build prompt for AI model
   */
  private buildBriefPrompt(results: ResearchResults): string {
    return `You are an expert sales intelligence analyst. You've just completed research on a prospect company and contact. Generate a concise, actionable one-page intelligence brief for a sales rep.

**Research Data:**
${JSON.stringify(results.extractedData, null, 2)}

**Detected Signals:**
${JSON.stringify(results.signals, null, 2)}

**Your Task:**
Create a brief with exactly these six sections:

1. **Company Snapshot** (2-4 bullets)
   - Size, stage, what they do in 2 sentences
   - Key customers if available
   - Industry and market position

2. **Recent Signals** (Top 3 most important things from last 90 days)
   - Recent funding, hiring surges, leadership changes
   - Product launches, partnerships
   - News that changes the conversation

3. **Contact Intel** (2-4 bullets)
   - Current role and tenure
   - What they post about
   - Recent activity that matters

4. **Tech Stack** (Current tools - especially ones relevant to the pitch)
   - CRM, analytics, infrastructure
   - Gaps and opportunities

5. **Competitive Context**
   - Who else they're evaluating
   - G2/Capterra review themes
   - Public competitor mentions

6. **Suggested Openers** (3 specific conversation starters for this exact meeting)
   - Reference specific recent events
   - Personalized to this contact
   - Opens that show you did your homework

**Guidelines:**
- One page max
- Bullet points, not paragraphs
- Specific facts with sources
- Write like a human analyst, not a data dump
- Focus on what changes the conversation
- Skip generic information
- If data is missing, say "Not found" rather than making it up

Generate the brief now in clean markdown format.`;
  }

  /**
   * Parse GPT markdown response into structured data for DB storage
   */
  private parseBriefContent(content: string): any {
    const sections = {
      companySnapshot: this.extractSectionAsBullets(content, 'Company Snapshot'),
      recentSignals: this.extractSectionAsBullets(content, 'Recent Signals'),
      contactIntel: this.extractSectionAsBullets(content, 'Contact Intel'),
      techStack: this.extractSectionAsBullets(content, 'Tech Stack'),
      competitiveContext: this.extractSectionAsBullets(content, 'Competitive Context'),
      suggestedOpeners: this.extractSectionAsBullets(content, 'Suggested Openers'),
      fullBriefMarkdown: content,
      fullBriefHtml: this.markdownToHtml(content),
    };

    return sections;
  }

  /**
   * Extract a named section from markdown and return as { text, bullets[] }
   * so DB columns get non-null JSON objects instead of raw strings
   */
  private extractSectionAsBullets(content: string, sectionName: string): any {
    // Matches: "## 1) Company Snapshot", "## 1. Company Snapshot", "## Company Snapshot", "**Company Snapshot**"
    const regex = new RegExp(
      `#{1,3}\\s*(?:\\d+[.)\\s]+)?\\*{0,2}${sectionName}\\*{0,2}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`,
      'i'
    );
    const match = content.match(regex);
    if (!match) return null;

    const raw = match[1].trim();
    const bullets = raw
      .split('\n')
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter((line) => line.length > 0 && !line.match(/^#+/));

    return {
      text: raw,
      bullets,
    };
  }

  /**
   * Simple markdown to HTML converter
   */
  private markdownToHtml(markdown: string): string {
    // Basic conversion - use a proper library in production
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Log agent action to database
   */
  private async logAgentAction(log: {
    sourceName: string;
    sourceUrl?: string;
    actionType: 'navigate' | 'extract' | 'error' | 'skip';
    actionDescription?: string;
    extractedData?: any;
    durationMs?: number;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.supabase.from('agent_logs').insert({
        job_id: this.jobId,
        source_name: log.sourceName,
        source_url: log.sourceUrl,
        action_type: log.actionType,
        action_description: log.actionDescription,
        extracted_data: log.extractedData,
        duration_ms: log.durationMs,
        success: log.success !== false,
        error_message: log.errorMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log agent action:', error);
    }
  }
}
