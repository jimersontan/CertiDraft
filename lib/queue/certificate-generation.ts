import { type Job, JobsOptions, Queue, Worker } from "bullmq";

import { createRedisConnection } from "@/lib/queue/redis";

export const CERTIFICATE_GENERATION_QUEUE = "certificate-generation";

export type CertificateGenerationJobData = {
  batchJobId: string;
  batchUploadId: string;
  templateId?: string | null;
  bucket?: string | null;
  designSnapshot?: string | null;
  userId: string;
};

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 4,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 100,
};

declare global {
  var __certidraftCertificateQueue__:
    | Queue<CertificateGenerationJobData>
    | undefined;
}

export function getCertificateGenerationQueue() {
  if (!globalThis.__certidraftCertificateQueue__) {
    globalThis.__certidraftCertificateQueue__ =
      new Queue<CertificateGenerationJobData>(CERTIFICATE_GENERATION_QUEUE, {
        connection: createRedisConnection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
  }

  return globalThis.__certidraftCertificateQueue__;
}

export function createCertificateGenerationWorker(
  processor: (job: Job<CertificateGenerationJobData>) => Promise<unknown>
) {
  return new Worker<CertificateGenerationJobData>(
    CERTIFICATE_GENERATION_QUEUE,
    processor,
    {
      connection: createRedisConnection(),
      concurrency: Number(process.env.CERTIFICATE_WORKER_CONCURRENCY || 4),
    }
  );
}
