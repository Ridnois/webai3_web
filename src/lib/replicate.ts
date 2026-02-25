import Replicate from "replicate";
import { getServerEnv } from "./server-env";

let client: Replicate | null = null;

export function getReplicateClient(): Replicate {
  if (!client) {
    const env = getServerEnv();
    client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  }
  return client;
}
