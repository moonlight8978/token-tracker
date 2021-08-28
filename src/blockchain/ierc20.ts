import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import IERC20Artifact from "./IERC20.json";
import { IERC20 } from "../types/ierc20";
import { TransferEvent } from "../types/schemas";

export const getContract = (address: string, provider: Provider): IERC20 => {
  return new ethers.Contract(address, IERC20Artifact.abi, provider) as IERC20;
};

export const transferEvents = (
  contract: IERC20,
  fromBlock: number,
  toBlock: number,
  from = null,
  to = null
): Promise<TransferEvent[]> => {
  const filter = contract.filters.Transfer(from, to);
  return contract.queryFilter(filter, fromBlock, toBlock);
};
