import { createCertificateGenerationWorker } from "../lib/queue/certificate-generation";
import { processCertificateGenerationJob } from "../lib/batch-processing";

const worker = createCertificateGenerationWorker(processCertificateGenerationJob);

worker.on("ready", () => {
  console.log("certificate-generation worker ready");
});

worker.on("completed", (job) => {
  console.log(`certificate-generation job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(
    `certificate-generation job failed: ${job?.id ?? "unknown"}`,
    error
  );
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
