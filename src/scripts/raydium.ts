import TokensStore from '../database/TokensStore';
import RaydiumListener from '../listeners/RaydiumListener';
import { RaydiumListenerEvents } from '../listeners/types';
import TokenHandler from '../database/TokenHandler';
import Logout from '../utils/Logout';
import { tokenHandlerBalanceChangeLayer } from './tokenHandlerChangeLayers';
import { stopListen } from './stopListen';
import { setupTokenHandlerChanges } from './tokenHandlerChangesSetup';
import SolanaListener from '../listeners/SolanaListener';
import Dex from '../third-party-data/Dex';

const tokensStore = new TokensStore();
const dex = new Dex();
const raydiumListener = new RaydiumListener();

const tokens: TokenHandler[] = [];

const stopListenInterval = async () => {
  await stopListen(raydiumListener as SolanaListener<undefined>, tokens, tokensStore);

  setTimeout(stopListenInterval, 0);
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  Logout.yellow('Start...');

  raydiumListener.on(RaydiumListenerEvents.NEW_LP, async (tokenLP) => {
    Logout.purpleAccent('[S-Raydium]: New token = ', tokenLP.quote.address);

    const tokenHandler = new TokenHandler();

    tokenHandler.addTime = Date.now();

    tokenHandler.info = await raydiumListener.getTokenInfo(tokenLP.quote.address);

    tokenHandler.lp = tokenLP;

    raydiumListener.monitorLiquidPoolChanges(tokenHandler, (balanceChange) => {
      tokenHandlerBalanceChangeLayer(tokenHandler, balanceChange);
    });

    tokens.push(tokenHandler);

    setupTokenHandlerChanges(raydiumListener as SolanaListener<undefined>, tokenHandler, dex);
  });

  raydiumListener.monitorNewLp();

  setTimeout(stopListenInterval, 0);
})();
