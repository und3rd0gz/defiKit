import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  RpcResponseAndContext,
  TokenAmount,
} from '@solana/web3.js';
import { SOLANA_CONNECTION } from './constants';
import { decimalToLamports } from './utils';
import BN from 'bn.js';
import { EventEmitter } from 'stream';
import { SolanaListenerEvents, SolanaListeners, TokenInfo, TokenLP, TokenSources } from './types';
import { unpackAccount } from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';
import Logout from '../utils/Logout';

export default abstract class SolanaListener<T extends Record<keyof T, any[]>> extends EventEmitter<
  T | SolanaListeners
> {
  protected loggerPrefix = '[Solana]:';

  protected onLogsListeners: number[] = [];

  protected onAccountChangeListeners: { address: string; listenerId: number }[] = [];

  protected connection: Connection;

  private metaplex: Metaplex;

  constructor() {
    super();
    this.connection = SOLANA_CONNECTION;

    this.metaplex = Metaplex.make(this.connection);
  }

  private _getMessageWithPrefix(message: string) {
    return `${this.loggerPrefix} ${message}`;
  }

  private async _getTokenBalance(tokenAddress: string | PublicKey) {
    const tokenAccountPublicKey = this.toPublicKey(tokenAddress);

    const response = (await this.connection
      .getTokenAccountBalance(tokenAccountPublicKey, 'confirmed')
      .catch((error) => {
        Logout.redAccent(
          this._getMessageWithPrefix('error get token balance for address:'),
          tokenAddress
        );
        Logout.red(error);

        return undefined;
      })) as RpcResponseAndContext<TokenAmount>;

    return Number.parseInt(response?.value.amount, 10);
  }

  private async _getTokenInfo(tokenAddress: string | PublicKey): Promise<TokenInfo> {
    const token = this.toPublicKey(tokenAddress);

    const metadataAccount = this.metaplex.nfts().pdas().metadata({ mint: token });

    const metadataAccountInfo = await this.connection.getAccountInfo(metadataAccount, 'confirmed');

    const tokenSupply = await this.connection.getTokenSupply(token, 'confirmed');

    if (metadataAccountInfo) {
      const tokenMeta = await this.metaplex.nfts().findByMint({ mintAddress: token });

      return {
        tokenAddress: token.toBase58(),
        symbol: tokenMeta.symbol,
        name: tokenMeta.name,
        supply: tokenSupply.value.uiAmount,
        devAddress: tokenMeta.updateAuthorityAddress.toBase58(),
        tokenSource: TokenSources.RAYDIUM,
      };
    }

    return undefined;
  }

  private async _getTokenPrice(
    splTokenAddress: string | PublicKey,
    tokenDecimals: number | BN,
    solPoolAddress: string | PublicKey
  ) {
    const splTokenBalance = await this._getTokenBalance(splTokenAddress);
    const solPoolBalance = await this._getTokenBalance(solPoolAddress);

    if (
      Number.isNaN(splTokenBalance) ||
      Number.isNaN(solPoolBalance) ||
      splTokenBalance === undefined ||
      solPoolBalance === undefined
    ) {
      return undefined;
    }

    console.log(splTokenBalance, solPoolBalance);

    const tokenPrice =
      solPoolBalance /
      LAMPORTS_PER_SOL /
      (splTokenBalance / decimalToLamports(tokenDecimals as number));

    return tokenPrice;
  }

  protected toPublicKey(address: string | PublicKey): PublicKey {
    return typeof address === 'string' ? new PublicKey(address) : address;
  }

  protected abstract _findLiquidityPool(tokenAddress: string | PublicKey);

  public async getTokenPrice(
    splTokenAddress: string | PublicKey,
    splTokenDecimals: number | BN,
    solPoolAddress: string | PublicKey
  ) {
    const tokenPrice = await this._getTokenPrice(splTokenAddress, splTokenDecimals, solPoolAddress);

    return tokenPrice;
  }

  /**
   * @deprecated не работает так, как ожидается, при создании лп в самом Raydium - уже можно откопать vaults. См в класс {@link RaydiumListener}
   */
  public async findLiquidityPool(tokenAddress: string | PublicKey) {
    const result = await this._findLiquidityPool(tokenAddress);

    return result;
  }

  public monitorLiquidPoolChanges(tokenLP: TokenLP) {
    const baseVault = this.toPublicKey(tokenLP.base.vaultAddress);
    const quoteVault = this.toPublicKey(tokenLP.quote.vaultAddress);

    this.connection.onAccountChange(
      baseVault,
      (accountInfo) => {
        const data = unpackAccount(baseVault, accountInfo);

        this.emit(SolanaListenerEvents.ON_BALANCE_CHANGE, {
          isBase: true,
          // @ts-ignore
          amount: new BN(data.amount).toNumber() / LAMPORTS_PER_SOL,
        });
      },
      { commitment: 'confirmed' }
    );

    this.connection.onAccountChange(
      quoteVault,
      (accountInfo) => {
        const data = unpackAccount(quoteVault, accountInfo);

        this.emit(SolanaListenerEvents.ON_BALANCE_CHANGE, {
          isBase: true,
          // @ts-ignore
          amount: new BN(data.amount).toNumber() / LAMPORTS_PER_SOL,
        });
      },
      { commitment: 'confirmed' }
    );
  }

  public removeSolanaListeners() {
    this.onLogsListeners.forEach(async (id) => {
      await this.connection.removeOnLogsListener(id);
    });
  }

  public async getTokenInfo(tokenAddress: string | PublicKey) {
    const result = await this._getTokenInfo(tokenAddress);

    return result;
  }
}
