import { transferEvents } from "../blockchain";
import { LastUpdate, Transfer } from "../database";
import { IERC20 } from "../types/ierc20";

const MAX_EVENTS_COUNT = 20;

export const TransferApi = {
  async fetchHistory(contract: IERC20, fromBlock: number, toBlock: number) {
    let currentFromBlock = fromBlock;

    const transferStore = new Transfer(contract.address);
    const lastUpdate = await LastUpdate.ofToken(contract.address);
    const lastBlockNumber = lastUpdate?.blockNumber ?? 0;
    let eventsCount = await transferStore.count();

    if (lastBlockNumber >= currentFromBlock) {
      currentFromBlock = lastBlockNumber + 1;
    }

    let currentToBlock = currentFromBlock;

    try {
      while (eventsCount < MAX_EVENTS_COUNT && currentToBlock < toBlock) {
        currentToBlock = currentFromBlock + 5000;

        if (currentToBlock > toBlock) {
          currentToBlock = toBlock;
        }

        const events = await transferEvents(
          contract,
          currentFromBlock,
          currentToBlock
        );
        console.log(events);
        eventsCount += events.length;
        currentFromBlock = currentToBlock + 1;
        await transferStore.saveMultiple(events);
        await LastUpdate.save({
          token: contract.address,
          blockNumber: currentToBlock,
          updatedAt: new Date().getTime(),
        });
      }
    } catch (e) {
      // DELETE from currentFromBlock to currentToBlock
      console.error(e);
    }
  },
};
