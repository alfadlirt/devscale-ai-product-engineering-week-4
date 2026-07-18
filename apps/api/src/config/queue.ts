import { Queue } from "bullmq";
import { connection, QUEUE_NAME } from "./queue-connection.js";

export const contractsQueue = new Queue(QUEUE_NAME, {
  connection,
});
