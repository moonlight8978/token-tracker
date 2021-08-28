import { openDB, DBSchema } from "idb/with-async-ittr";
import { LastUpdate, Transfer } from "../types/schemas";

export interface Schema extends DBSchema {
  transfer: {
    key: number;
    value: Transfer;
    indexes: {
      "by-token": string;
      "by-from": [string, string];
      "by-to": [string, string];
      "by-block-number": [string, number];
    };
  };
  "last-update": {
    key: string;
    value: LastUpdate;
  };
}

const DB_VERSION = 1;

export const connect = () => {
  return openDB<Schema>("token-tracker", DB_VERSION, {
    upgrade(db) {
      const transferStore = db.createObjectStore("transfer", {
        keyPath: "id",
        autoIncrement: true,
      });
      transferStore.createIndex("by-token", "token");
      transferStore.createIndex("by-from", ["token", "from"]);
      transferStore.createIndex("by-to", ["token", "to"]);
      transferStore.createIndex("by-block-number", ["token", "blockNumber"]);

      db.createObjectStore("last-update", {
        keyPath: "token",
      });
    },
  });
};
