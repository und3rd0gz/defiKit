import path from 'path';

export const PROXY_LIST_PATH =
  process.env.PROXY_LIST_PATH || path.join(process.cwd(), 'proxy-list.txt');
