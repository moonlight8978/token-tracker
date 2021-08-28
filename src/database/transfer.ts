import { IDBPTransaction } from "idb";
import { TransferEvent, Transfer as ITransfer } from "../types/schemas";
import { connect, Schema } from "./connection";

type Transaction = IDBPTransaction<Schema, ["transfer"], "readwrite">;

export class Transfer {
  constructor(private address: string) {}

  async tx<T>(procedure: (tx: Transaction) => Promise<T>) {
    const db = await connect();
    const tx = db.transaction("transfer", "readwrite");
    const result = await procedure(tx);
    db.close();
    return result;
  }

  async save(event: TransferEvent) {
    await this.tx(async (tx) => {
      await tx.store.add(this.serialize(event));
      await tx.done;
    });
  }

  async count() {
    return await this.tx((tx) => {
      return tx.store.index("by-token").count(this.address);
    });
  }

  async saveMultiple(events: TransferEvent[]) {
    await this.tx(async (tx) => {
      await Promise.all(
        events.map((event) => tx.store.add(this.serialize(event)))
      );
      await tx.done;
    });
  }

  private serialize(event: TransferEvent): ITransfer {
    return {
      from: event.args[0] as string,
      to: event.args[1] as string,
      amount: event.args[2]._hex,
      blockHash: event.blockHash,
      blockNumber: event.blockNumber,
      token: this.address,
      txHash: event.transactionHash,
      txIndex: event.transactionIndex,
    };
  }
}
