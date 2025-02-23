import TokenHandler from '../database/TokenHandler';
import TokensStore from '../database/TokensStore';
import { StopHandlingReasons } from '../database/types';
import SolanaListener from '../listeners/SolanaListener';
import { humanTime } from '../utils/humanizeTime';
import Logout from '../utils/Logout';
import {
  MAX_SOL_LIQ,
  MIN_SOL_LIQ,
  STOP_MONITOR_TOKEN_DATA_SECONDS,
  VERIFY_SOL_LIQ_TIME_SECONDS,
} from './constants';

export const stopListen = async (
  solanaListener: SolanaListener<undefined>,
  tokenHandlersList: TokenHandler[],
  tokensStore: TokensStore
) => {
  const tokensToRemove = [];

  for (let i = 0; i < tokenHandlersList.length; i += 1) {
    const tokenHandler = tokenHandlersList[i];

    if (tokenHandler.isIgnore) {
      tokensToRemove.push(tokenHandler);
      // eslint-disable-next-line no-continue
      continue;
    }

    const tokenLifetime = Date.now() - tokenHandler.addTime;

    if (tokenLifetime > STOP_MONITOR_TOKEN_DATA_SECONDS * 1000) {
      tokenHandler.stopHandlingReason = StopHandlingReasons.TIME;

      await tokensStore.addNewToken(tokenHandler.formToken());
      tokensToRemove.push(tokenHandler.info.tokenAddress);
      Logout.green('[Stop]: Token added to store:', tokenHandler.info.tokenAddress);
    }

    if (tokenLifetime > VERIFY_SOL_LIQ_TIME_SECONDS * 1000) {
      const lastBaseVault = tokenHandler.vaultsData
        .slice()
        .reverse()
        .find((vault) => vault.base !== undefined);

      if (lastBaseVault && (lastBaseVault.base < MIN_SOL_LIQ || lastBaseVault.base > MAX_SOL_LIQ)) {
        tokenHandler.stopHandlingReason = StopHandlingReasons.WRONG_LIQ;
      }
    }

    if (
      tokenHandler.stopHandlingReason &&
      (tokenHandler.onAccountChangeListeners.length || tokenHandler.intervals.length)
    ) {
      Logout.yellow(
        '[Stop]: Listing is stopped for:',
        tokenHandler.info.tokenAddress,
        ' \treason=',
        tokenHandler.stopHandlingReason,
        ' \tlifeTime=',
        humanTime(tokenLifetime)
      );
      if (tokenHandler.onAccountChangeListeners.length) {
        await solanaListener.removeTokenHandlerListeners(tokenHandler);
      }

      if (tokenHandler.intervals.length) {
        tokenHandler.intervals.forEach((interval) => clearInterval(interval));
      }

      tokensToRemove.push(tokenHandler);
      tokenHandler.isIgnore = true;
    }
  }

  tokensToRemove.forEach((tokenHandler) => {
    tokenHandlersList.splice(
      tokenHandlersList.findIndex((t) => t.info?.tokenAddress === tokenHandler.info?.tokenAddress),
      1
    );
  });
};
