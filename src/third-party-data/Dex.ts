import { getNextProxy } from './utils';
import fetch from 'node-fetch';
import { DexData, TokenPoolResponse } from './types';
import Logout from '../utils/Logout';

export default class Dex {
  private readonly logoutPrefix = '[Dex]:';

  private readonly dexUrl = 'https://api.dexscreener.com';

  private proxy = getNextProxy();

  private async _getTokenPools(tokenAddress: string): Promise<TokenPoolResponse[]> {
    const tokenPoolResponse = await fetch(`${this.dexUrl}/token-pairs/v1/solana/${tokenAddress}`, {
      method: 'GET',
      headers: {},
      agent: this.proxy,
    }).then((response) => {
      if (response.status !== 200) {
        throw new Error('Unable to get token-pairs');
      }

      return response.json();
    });

    return tokenPoolResponse as TokenPoolResponse[];
  }

  public async getDexData(tokenAddress: string): Promise<DexData> {
    for (let i = 0; i < 5; i += 1) {
      try {
        const tokenPools = await this._getTokenPools(tokenAddress);

        return {
          addTime: Date.now(),
          tokenPools,
        };
      } catch (e) {
        Logout.red(`${this.logoutPrefix} Error fetching dex data for ${tokenAddress}`);
      }
    }

    return {
      addTime: Date.now(),
      tokenPools: [],
    };
  }
}
