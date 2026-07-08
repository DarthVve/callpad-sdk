import { UsersService } from "../../../generated/api";
import type { UsersData } from "../../../generated/api/models";

export class SignalUsersService {
  constructor(private appId: string) {}

  async getById(
    params: Omit<UsersData["payloads"]["GetSignalUsersById"], "appId">
  ): Promise<UsersData["responses"]["GetSignalUsersById"]> {
    return UsersService.getSignalUsersById({
      ...params,
    });
  }
}
