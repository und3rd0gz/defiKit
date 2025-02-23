import { readFileSync } from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { PROXY_LIST_PATH } from './constants';

const proxyList = readFileSync(PROXY_LIST_PATH, { encoding: 'utf-8' }).split('\n');

let currentProxyIndex = 0;

export const getNextProxy = (): HttpsProxyAgent<string> | undefined => {
  if (proxyList.length === 0) {
    return undefined;
  }

  currentProxyIndex = currentProxyIndex + 1 > proxyList.length - 1 ? 0 : currentProxyIndex + 1;
  // eslint-disable-next-line no-plusplus
  return new HttpsProxyAgent(proxyList[currentProxyIndex]);
};
