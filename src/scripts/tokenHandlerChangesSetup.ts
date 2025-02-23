import TokenHandler from '../database/TokenHandler';
import SolanaListener from '../listeners/SolanaListener';
import Dex from '../third-party-data/Dex';
import {
  FETCH_DEX_DATA_INTERVAL_SECONDS,
  FETCH_HOLDERS_INTERVAL_SECONDS,
  FETCH_LARGEST_HOLDERS_INTERVAL_SECONDS,
} from './constants';

/**
 * Fetches and logs the current token holders using the Solana listener.
 * @param solanaListener - The Solana blockchain listener instance
 * @param tokenHandler - Handler containing token information and LP details
 */
const fetchTokenHolders = async (
  solanaListener: SolanaListener<undefined>,
  tokenHandler: TokenHandler
) => {
  const holders = await solanaListener.getTokenHolders(
    tokenHandler.info.tokenAddress,
    tokenHandler.lp.quote.decimal
  );

  tokenHandler.addHolders({
    addTime: Date.now(),
    tokenHolders: holders,
  });
};

const fetchDexData = async (dex: Dex, tokenHandler: TokenHandler) => {
  const dexData = await dex.getDexData(tokenHandler.info.tokenAddress);

  tokenHandler.addDexData(dexData);
};

const fetchLargestTokenHolders = async (
  solanaListener: SolanaListener<undefined>,
  tokenHandler: TokenHandler
) => {
  const largestTokenHolders = await solanaListener.getLargestTokenHolders(
    tokenHandler.info.tokenAddress
  );

  tokenHandler.addLargestHolders({
    addTime: Date.now(),
    tokenHolders: largestTokenHolders,
  });
};

/**
 * Sets up periodic token holder fetching for a given token.
 * Creates an interval that regularly fetches and updates the token holders list.
 * The interval is stored in the tokenHandler for cleanup.
 *
 * @param solanaListener - The Solana blockchain listener instance used to fetch holder data
 * @param tokenHandler - Handler containing token information and managing holder updates
 */
export const setupTokenHandlerChanges = (
  solanaListener: SolanaListener<undefined>,
  tokenHandler: TokenHandler,
  dex: Dex
) => {
  const fetchTokenHoldersInterval = setInterval(
    fetchTokenHolders,
    FETCH_HOLDERS_INTERVAL_SECONDS * 1000,
    solanaListener,
    tokenHandler
  );

  const fetchDexDataInterval = setInterval(
    fetchDexData,
    FETCH_DEX_DATA_INTERVAL_SECONDS * 1000,
    dex,
    tokenHandler
  );

  const fetchLargestTokenHoldersInterval = setInterval(
    fetchLargestTokenHolders,
    FETCH_LARGEST_HOLDERS_INTERVAL_SECONDS * 1000,
    solanaListener,
    tokenHandler
  );

  tokenHandler.intervals.push(
    fetchTokenHoldersInterval,
    fetchDexDataInterval,
    fetchLargestTokenHoldersInterval
  );
};
