import { StoredToken, TokenInfo, TokenLP, VaultsMonitorData } from '../listeners/types';

export default class TokenHolder implements StoredToken {
  public lp: TokenLP;

  public vaultsData: VaultsMonitorData[];

  public info: TokenInfo;

  public addTime: number;

  public lastUpdateTime: number;

  public updatesCount: number;

  public isIgnore: boolean;

  public formToken(): StoredToken {
    return {
      addTime: this.addTime,
      info: this.info,
      isIgnore: this.isIgnore,
      lastUpdateTime: this.lastUpdateTime,
      lp: this.lp,
      updatesCount: this.updatesCount,
      vaultsData: this.vaultsData,
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
}
