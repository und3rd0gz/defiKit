export type TokenPoolResponse = {
  pairAddress: string;
  priceNative: string;
  priceUsd: string;
  fdv: number;
  marketCap: number;
  liquidity: {
    usd: number;
  };
  info: {
    socials: { type: string; url: string }[];
  };
  boosts: { active: number };
};

export type DexData = {
  addTime: number;
  tokenPools: TokenPoolResponse[];
};
