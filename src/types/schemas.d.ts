export type HexPrefixed = `0x${string}`;

export interface Transfer {
  token: string;
  from: string;
  to: string;
  amount: string;
  blockHash: string;
  blockNumber: number;
  txHash: string;
  txIndex: number;
}

export interface LastUpdate {
  blockNumber: number;
  updatedAt: number;
  token: string;
}

export interface TransferEvent {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  data: string;
  topics: [string, string, string];
  transactionHash: string;
  logIndex: number;
  event: "Transfer";
  eventSignature: string;
  args: [string, string, { _hex: string }];
}
