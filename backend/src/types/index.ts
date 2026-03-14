export interface ResearchJob {
  id: string;
  userId: string;
  organizationId: string;
  meetingId?: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  meetingTime?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface Brief {
  id: string;
  jobId: string;
  userId: string;
  organizationId: string;
  companyName: string;
  contactName: string;
  companySnapshot?: CompanySnapshot;
  recentSignals?: Signal[];
  contactIntel?: ContactIntel;
  techStack?: TechStack;
  competitiveContext?: CompetitiveContext;
  suggestedOpeners?: string[];
  fullBriefHtml?: string;
  fullBriefMarkdown?: string;
  confidenceScore?: number;
  sourcesVisited: number;
  extractionQuality?: Record<string, any>;
  deliveredSlack: boolean;
  deliveredEmail: boolean;
  deliveredCrm: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySnapshot {
  legalName: string;
  employeeCount?: string;
  fundingStatus?: string;
  description: string;
  customers?: string[];
  industry?: string;
}

export interface Signal {
  type: string;
  title: string;
  description: string;
  importanceScore: number;
  sourceUrl?: string;
  detectedAt: Date;
  metadata?: Record<string, any>;
}

export interface ContactIntel {
  currentRole: string;
  tenure?: string;
  recentPosts?: Post[];
  jobHistory?: JobHistory[];
  sharedConnections?: string[];
}

export interface Post {
  content: string;
  url: string;
  date: Date;
  platform: string;
}

export interface JobHistory {
  company: string;
  role: string;
  duration: string;
}

export interface TechStack {
  crm?: string[];
  analytics?: string[];
  infrastructure?: string[];
  marketing?: string[];
  other?: string[];
}

export interface CompetitiveContext {
  competitors?: string[];
  alternatives?: string[];
  g2Reviews?: ReviewTheme[];
}

export interface ReviewTheme {
  theme: string;
  sentiment: 'positive' | 'negative';
  mentions: number;
}

export interface AgentLog {
  id: string;
  jobId: string;
  briefId?: string;
  sourceName: string;
  sourceUrl?: string;
  actionType: 'navigate' | 'extract' | 'error' | 'skip';
  actionDescription?: string;
  extractedData?: Record<string, any>;
  screenshotUrl?: string;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

export interface ResearchSource {
  name: string;
  url: string;
  extractor: (context: BrowserContext, companyName: string, contactName: string) => Promise<any>;
  priority: number;
  timeout?: number;
}

export interface BrowserContext {
  page: any;
  navigate: (url: string) => Promise<void>;
  extractText: (selector: string) => Promise<string>;
  extractAll: (selector: string) => Promise<string[]>;
  screenshot: () => Promise<string>;
  waitForSelector: (selector: string, timeout?: number) => Promise<void>;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: Attendee[];
  organizerEmail: string;
}

export interface Attendee {
  email: string;
  name?: string;
  responseStatus?: string;
}
