import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

let connection: IORedis | null = null;
let certificateQueue: Queue | null = null;

export const getCertificateQueue = () => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return null; // Gracefully handle missing Redis
  }

  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }

  if (!certificateQueue) {
    certificateQueue = new Queue('certificates', {
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
  }

  return certificateQueue;
};

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
