import { PublicKey } from '@solana/web3.js';
import { RAYDIUM_AMM_PROGRAM_ID, RAYDIUM_AUTHORITY, RAYDIUM_FEE, SOL } from './constants';
import SolanaListener from './SolanaListener';
import { TokenLP, RaydiumListenerEvents, RaydiumListeners } from './types';
import Logout from '../utils/Logout';
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';

export default class RaydiumListener extends SolanaListener<RaydiumListeners> {
  constructor() {
    super();

    this.loggerPrefix = '[Raydium]:';
  }

  private async _parseNewLP(signature: string) {
    Logout.greenAccent(`${this.loggerPrefix} New token LP added:`, signature);

    const parsedTransaction = await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });

    if (!parsedTransaction || !!parsedTransaction?.meta.err) {
      Logout.red(`${this.loggerPrefix} Error on parse tx`);
    }

    const accounts = parsedTransaction.transaction.message.instructions.find(
      (ix) => ix.programId.toBase58() === RAYDIUM_AMM_PROGRAM_ID.toBase58()
      // @ts-ignore
    ).accounts as PublicKey[];

    if (!accounts) {
      Logout.red(`${this.loggerPrefix} No accounts found in the transaction.`);
      return;
    }

    const signer = parsedTransaction?.transaction.message.accountKeys[0].pubkey.toString();

    const postTokenBalances = parsedTransaction?.meta.postTokenBalances;

    const quoteInfo = postTokenBalances?.find(
      (balance) => balance.owner === RAYDIUM_AUTHORITY.toBase58() && balance.mint !== SOL.toBase58()
    );

    const baseInfo = postTokenBalances.find(
      (balance) => balance.owner === RAYDIUM_AUTHORITY.toBase58() && balance.mint === SOL.toBase58()
    );

    if (!baseInfo) {
      return;
    }

    if (signer && quoteInfo && baseInfo) {
      this.emit(RaydiumListenerEvents.NEW_LP, {
        creator: signer,
        pairAddress: accounts[4].toBase58(),
        quote: {
          address: quoteInfo.mint,
          amount: quoteInfo.uiTokenAmount.uiAmount,
          decimal: quoteInfo.uiTokenAmount.decimals,
          vaultAddress: accounts[10].toBase58(),
        },
        base: {
          address: baseInfo.mint,
          amount: baseInfo.uiTokenAmount.uiAmount,
          decimal: baseInfo.uiTokenAmount.decimals,
          vaultAddress: accounts[11].toBase58(),
        },
      } as TokenLP);
    }
  }

  /**
   * @deprecated doesn't work as expected, when creating LP in Raydium itself - vaults can already be found. See what is returned from {@link _parseNewLP}
   */
  protected async _findLiquidityPool(tokenAddress: string | PublicKey) {
    const [marketAccount] = await this.connection.getProgramAccounts(RAYDIUM_AMM_PROGRAM_ID, {
      filters: [
        { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
        {
          memcmp: {
            offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
            bytes: SOL.toBase58(),
          },
        },
        {
          memcmp: {
            offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
            bytes: this.toPublicKey(tokenAddress).toBase58(),
          },
        },
      ],
      commitment: 'confirmed',
    });

    if (!marketAccount) {
      Logout.red(`${this.loggerPrefix} No market account`);
      return undefined;
    }

    const marketData = LIQUIDITY_STATE_LAYOUT_V4.decode(marketAccount.account.data);

    return marketData;
  }

  public monitorNewLp() {
    const callbackId = this.connection.onLogs(
      RAYDIUM_FEE,
      async ({ logs, err, signature }) => {
        if (err) {
          Logout.red(`${this.loggerPrefix} Connection contains error`);
          Logout.white(`${err}`);
          return;
        }

        this._parseNewLP(signature).catch((reason) => {
          Logout.red(
            `${this.loggerPrefix} error occured in new solana token log callback function`
          );
          Logout.white(`${reason}`);
        });
      },
      'confirmed'
    );

    this.onLogsListeners.push(callbackId);
  }
}
