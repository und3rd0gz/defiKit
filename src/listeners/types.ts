import { DexData } from '../third-party-data/types';

export enum RaydiumListenerEvents {
  NEW_LP = 'NEW_LP',
}

export enum SolanaListenerEvents {
  ON_BALANCE_CHANGE = 'ON_BALANCE_CHANGE',
}

export type TokenPoolData = {
  address: string;
  decimal: number;
  amount: number;
  vaultAddress: string;
};

export type TokenLP = {
  creator: string;
  base: TokenPoolData;
  quote: TokenPoolData;
  pairAddress: string;
  quoteSupply: number;
};

export type VaultsMonitorData = {
  base?: number;
  quote?: number;
  addTimestamp: number;
  addTime: number;
};

export enum TokenSources {
  RAYDIUM = 'RAYDIUM',
}

export type TokenHolderInfo = {
  address: string;
  balance: number;
};

export type StoredTokenHolders = {
  addTime: number;
  tokenHolders: TokenHolderInfo[];
};

export type TokenInfo = {
  tokenAddress: string;
  symbol: string;
  name: string;
  supply: number;
  devAddress: string;
  tokenSource: TokenSources;
};

export type StoredToken = {
  lp: TokenLP;
  vaultsData: VaultsMonitorData[];
  info: TokenInfo;
  addTime: number;
  lastUpdateTime: number;
  updatesCount: number;
  isIgnore: boolean;
  holders: StoredTokenHolders[];
  largestHolders: StoredTokenHolders[];
  dexData: DexData[];
};

export type BalanceChange = {
  isBase: boolean;
  amount: number;
};

export type RaydiumListeners = {
  [RaydiumListenerEvents.NEW_LP]: [TokenLP];
};

export type SolanaListeners = {
  [SolanaListenerEvents.ON_BALANCE_CHANGE]: [BalanceChange];
};
