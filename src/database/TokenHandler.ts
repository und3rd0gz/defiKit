import {
  StoredToken,
  StoredTokenHolders,
  TokenInfo,
  TokenLP,
  VaultsMonitorData,
} from '../listeners/types';
import { DexData } from '../third-party-data/types';

export default class TokenHandler implements StoredToken {
  public holders: StoredTokenHolders[] = [];

  public largestHolders: StoredTokenHolders[] = [];

  public stopHandlingReason: string;

  public lp: TokenLP;

  public vaultsData: VaultsMonitorData[] = [];

  public info: TokenInfo;

  public addTime: number;

  public lastUpdateTime: number;

  public updatesCount: number;

  public isIgnore: boolean;

  public onAccountChangeListeners: number[] = [];

  public intervals: NodeJS.Timeout[] = [];

  public dexData: DexData[] = [];

  public formToken(): StoredToken {
    return {
      addTime: this.addTime,
      info: this.info,
      isIgnore: this.isIgnore,
      lastUpdateTime: this.lastUpdateTime,
      lp: this.lp,
      updatesCount: this.updatesCount || 0,
      vaultsData: this.vaultsData,
      holders: this.holders,
      dexData: this.dexData,
      largestHolders: this.largestHolders,
    };
  }

  public addVault(isBase: boolean, amount: number) {
    if (isBase) {
      const empty = this.vaultsData.find((val) => !val.base);

      if (empty) {
        empty.base = amount;
      } else {
        this.vaultsData.push({
          base: amount,
          addTimestamp: Date.now(),
          addTime: this.vaultsData[0]?.addTimestamp
            ? Date.now() - this.vaultsData[0].addTimestamp
            : 0,
        });
      }
    } else {
      const empty = this.vaultsData.find((val) => !val.quote);

      if (empty) {
        empty.quote = amount;
      } else {
        this.vaultsData.push({
          quote: amount,
          addTimestamp: Date.now(),
          addTime: this.vaultsData[0]?.addTimestamp
            ? Date.now() - this.vaultsData[0].addTimestamp
            : 0,
        });
      }
    }
  }

  public addDexData(dexData: DexData) {
    this.dexData.push(dexData);
  }

  public addHolders(holders: StoredTokenHolders) {
    this.holders.push(holders);
  }

  public addLargestHolders(holders: StoredTokenHolders) {
    this.largestHolders.push(holders);
  }
}
