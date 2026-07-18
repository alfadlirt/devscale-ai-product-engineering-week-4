import { Worker } from "bullmq";
import { connection, QUEUE_NAME } from "./config/queue-connection.js";
import { processContract } from "./modules/contracts/services/contract-services.js";
import { markContractFailed } from "./modules/contracts/data/contract.repository.js";

type ProcessContractJob = {
  contractId: string;
};

export const worker = new Worker<ProcessContractJob>(
  QUEUE_NAME,
  async (job) => {
    const { contractId } = job.data;

    if (!contractId) {
      throw new Error("Job missing contractId");
    }

    try {
      console.log(`[worker] starting contract ${contractId}`);
      await processContract(contractId);
      console.log(`[worker] finished contract ${contractId}`);
    } catch (error) {
      try {
        await markContractFailed(contractId);
      } catch (updateError) {
        console.error(
          `[worker] failed to mark contract ${contractId} as FAILED`,
          updateError,
        );
      }

      console.error(`[worker] failed contract ${contractId}`, error);
      throw error;
    }
  },
  {
    connection,
  },
);

worker.on("ready", () => {
  console.log(`[worker] listening on queue "${QUEUE_NAME}"`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] job ${job?.id} failed`, error);
});
