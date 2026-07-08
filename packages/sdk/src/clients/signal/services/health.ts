import { HealthService } from "../../../generated/api";
import type { HealthData } from "../../../generated/api/models";

export class SignalHealthService {
  async check(): Promise<HealthData["responses"]["GetHealth"]> {
    return HealthService.getHealth();
  }
}
