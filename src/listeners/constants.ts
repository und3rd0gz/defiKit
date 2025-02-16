import { Connection, PublicKey } from '@solana/web3.js';

export const { SOLANA_RPC_ENDPOINT, SOLANA_RPC_WEBSOCKET_ENDPOINT } = process.env;

export const SOLANA_CONNECTION = new Connection(SOLANA_RPC_ENDPOINT, {
  wsEndpoint: SOLANA_RPC_WEBSOCKET_ENDPOINT,
  commitment: 'confirmed',
});

export const RAYDIUM_LIQUIDITY_POOL_PROGRAM_ID = new PublicKey(
  '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'
);

export const RAYDIUM_FEE = new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5');

export const RAYDIUM_AUTHORITY = new PublicKey('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1');

export const SOL = new PublicKey('So11111111111111111111111111111111111111112');

export const RAYDIUM_AMM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
