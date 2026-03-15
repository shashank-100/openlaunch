import { Router } from 'express';
import { z } from 'zod';
import { researchQueue } from '../index';

const router = Router();

// Webhook schema validation
const webhookSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email().optional(),
  meetingTime: z.string().datetime().optional(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  meetingId: z.string().optional(),
  priority: z.number().min(0).max(10).default(5),
});

/**
 * POST /api/webhook/research
 * Trigger a new research job
 */
router.post('/research', async (req, res) => {
  try {
    const data = webhookSchema.parse(req.body);

    // Add job to queue
    const job = await researchQueue.add(
      'research',
      {
        ...data,
        meetingTime: data.meetingTime ? new Date(data.meetingTime) : undefined,
      },
      {
        priority: data.priority,
        removeOnComplete: false,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    console.log(`✅ Research job queued: ${job.id} for ${data.companyName}`);

    res.status(202).json({
      success: true,
      jobId: job.id,
      message: `Research job queued for ${data.companyName}`,
      estimatedCompletionTime: new Date(Date.now() + 4 * 60 * 1000), // ~4 minutes
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue research job',
    });
  }
});

/**
 * GET /api/webhook/job/:jobId
 * Get job status
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await researchQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const state = await job.getState();
    const progress = job.progress;

    res.json({
      success: true,
      job: {
        id: job.id,
        state,
        progress,
        data: job.data,
        returnvalue: job.returnvalue,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        failedReason: job.failedReason,
      },
    });
  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
    });
  }
});

export default router;
