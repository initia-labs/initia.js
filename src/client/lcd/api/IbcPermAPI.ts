import { BaseAPI } from './BaseAPI';

export interface ChannelRelayer {
  channel: string;
  relayer: string;
}

export class IbcPermAPI extends BaseAPI {
  public async channelRelayer(channel: string): Promise<ChannelRelayer> {
    return this.c
      .get<{ channel_relayer: ChannelRelayer }>(
        `/ibc/apps/perm/v1/channel_relayer/${channel}`
      )
      .then(d => d.channel_relayer);
  }
}
