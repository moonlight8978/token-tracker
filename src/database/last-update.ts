import { IDBPTransaction } from "idb";
import { LastUpdate as ILastUpdate } from "../types/schemas";
import { connect, Schema } from "./connection";

type Transaction = IDBPTransaction<Schema, ["last-update"], "readwrite">;

export const LastUpdate = {
  async tx<T>(procedure: (tx: Transaction) => Promise<T>) {
    const db = await connect();
    const tx = db.transaction("last-update", "readwrite");
    const result = await procedure(tx);
    db.close();
    return result;
  },

  async save(event: ILastUpdate) {
    await this.tx(async (tx) => {
      const record = await tx.store.get(event.token);
      if (!record) {
        await tx.store.add(event);
      } else {
        record.blockNumber = event.blockNumber;
        record.updatedAt = event.updatedAt;
        await tx.store.put(record);
      }
      await tx.done;
    });
  },

  async ofToken(address: string) {
    return await this.tx((tx) => {
      return tx.store.get(address as any);
    });
  },
};
