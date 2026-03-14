#!/usr/bin/env node

/**
 * Geodo Test Server
 * Minimal backend for testing without external dependencies
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Mock job storage
const jobs = new Map();
let jobCounter = 1;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: 'test',
    services: {
      redis: 'simulated',
      database: 'simulated',
      queue: 'simulated'
    }
  });
});

// Webhook endpoint - Create research job
app.post('/api/webhook/research', (req, res) => {
  const { companyName, contactName, userId, organizationId, contactEmail, meetingTime, priority } = req.body;

  // Validation
  if (!companyName || !contactName || !userId || !organizationId) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: [
        { message: !companyName && 'companyName is required' },
        { message: !contactName && 'contactName is required' },
        { message: !userId && 'userId is required' },
        { message: !organizationId && 'organizationId is required' }
      ].filter(d => d.message)
    });
  }

  // Create job
  const jobId = String(jobCounter++);
  const job = {
    id: jobId,
    companyName,
    contactName,
    contactEmail,
    userId,
    organizationId,
    meetingTime,
    priority: priority || 5,
    status: 'processing',
    createdAt: new Date().toISOString()
  };

  jobs.set(jobId, job);

  // Simulate job processing
  setTimeout(() => {
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();

      // Create mock brief
      job.brief = {
        companySnapshot: {
          name: companyName,
          description: `Leading company in their industry`,
          employees: '100-500'
        },
        recentSignals: [
          { type: 'hiring_surge', score: 8, description: 'Active hiring detected' },
          { type: 'funding', score: 9, description: 'Recent funding round' }
        ],
        contactIntel: {
          name: contactName,
          role: 'Senior Decision Maker',
          recentActivity: 'Active on LinkedIn'
        },
        techStack: {
          crm: ['Salesforce'],
          analytics: ['Google Analytics']
        },
        competitiveContext: {
          competitors: ['Competitor A', 'Competitor B']
        },
        suggestedOpeners: [
          `Congrats on the recent growth at ${companyName}!`,
          `I saw ${companyName} is hiring - exciting times!`,
          `Would love to discuss how we can help ${companyName} scale`
        ]
      };

      console.log(`✅ Job ${jobId} completed for ${companyName}`);
    }
  }, 3000); // Complete after 3 seconds

  res.status(202).json({
    success: true,
    jobId,
    message: `Research job queued for ${companyName}`,
    estimatedCompletionTime: new Date(Date.now() + 4 * 60 * 1000).toISOString()
  });

  console.log(`📋 New job created: ${jobId} - ${companyName} (${contactName})`);
});

// Get job status
app.get('/api/webhook/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  res.json({
    success: true,
    job: {
      id: job.id,
      state: job.status,
      progress: job.status === 'completed' ? 100 : 50,
      data: job,
      brief: job.brief
    }
  });
});

// Get briefs for user
app.get('/api/briefs', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const userBriefs = Array.from(jobs.values())
    .filter(job => job.userId === userId && job.status === 'completed')
    .map(job => ({
      id: job.id,
      company_name: job.companyName,
      contact_name: job.contactName,
      created_at: job.createdAt,
      ...job.brief
    }));

  res.json({
    success: true,
    briefs: userBriefs
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Geodo Test Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Create job: POST http://localhost:${PORT}/api/webhook/research`);
  console.log(`📍 Get job: GET http://localhost:${PORT}/api/webhook/job/:jobId`);
  console.log(`📍 Get briefs: GET http://localhost:${PORT}/api/briefs?userId=xxx`);
  console.log('='.repeat(60));
  console.log('\n💡 This is a test server with simulated backend\n');
  console.log('Ready to accept requests...\n');
});
