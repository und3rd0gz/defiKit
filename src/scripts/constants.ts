//
// ----- STOP TRIGGERS -----
//

/**
 * Min SOL market cap for add to db
 */
export const MIN_SOL_LIQ = 75;

/**
 * Max SOL market cap for add to db
 */
export const MAX_SOL_LIQ = 400;

/**
 * When start verify (since token added) sol token liq to stop monitor token
 */
export const VERIFY_SOL_LIQ_TIME_SECONDS = 60 * 7;

/**
 * How long to monitor token from start
 */
export const STOP_MONITOR_TOKEN_DATA_SECONDS = 60 * 15;

//
// ----- INTERVALS -----
//

/**
 * Interval between check holders
 */
export const FETCH_HOLDERS_INTERVAL_SECONDS = 60;

/**
 * Fetch token data from descreener by interval
 */
export const FETCH_DEX_DATA_INTERVAL_SECONDS = 60 * 2;

/**
 * Fetch largest token holders by interval
 */
export const FETCH_LARGEST_HOLDERS_INTERVAL_SECONDS = 60;
