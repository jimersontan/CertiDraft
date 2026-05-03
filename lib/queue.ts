import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const certificateQueue = new Queue('certificates', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: false,
  },
});

// The worker would typically run in a separate process
// But we can define it here for local/dev simplicity if needed
export const createWorker = () => {
  return new Worker('certificates', async (job: Job) => {
    const { projectId, uploadId, userId, aiEnabled } = job.data;

    try {
      await job.updateProgress(10);
      // Simulate processing
      await new Promise(r => setTimeout(r, 1000));
      await job.updateProgress(50);
      await new Promise(r => setTimeout(r, 1000));
      await job.updateProgress(100);

      return { success: true, certificatesGenerated: 100 };
    } catch (error: any) {
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }, { connection });
};
