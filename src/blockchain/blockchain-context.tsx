import { createContext, useContext, useRef } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { Provider, ExternalProvider } from "@ethersproject/providers";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "./ierc20";
import { IERC20 } from "../types/ierc20";

export const getProvider = detectEthereumProvider;

export const ADDRESS_ZERO = ethers.constants.AddressZero;

interface State {
  provider: Provider | null;
  isIniting: boolean;
  isSupported: boolean;
  isMultipleWalletsDetected: boolean;
}

const useInitBlockchain = (onChainChanged: () => any): State => {
  const onChainChangedHandlerRef = useRef(onChainChanged);
  onChainChangedHandlerRef.current = onChainChanged;

  const [state, originalSetState] = useState<State>({
    isIniting: true,
    isMultipleWalletsDetected: false,
    isSupported: false,
    provider: null,
  });

  const setState = (newState: Partial<State>) =>
    originalSetState((s) => ({ ...s, ...newState }));

  useEffect(() => {
    getProvider().then((p) => {
      if (p && window.ethereum === p) {
        setState({
          provider: new ethers.providers.Web3Provider(
            window.ethereum as ExternalProvider
          ),
          isSupported: true,
          isIniting: false,
        });
      } else if (p && window.ethereum !== p) {
        setState({
          isMultipleWalletsDetected: true,
          isSupported: true,
          isIniting: false,
        });
      } else {
        setState({ isSupported: false, isIniting: false });
      }
    });
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      // @ts-ignore
      window.ethereum.on("chainChanged", () => {
        onChainChangedHandlerRef.current();
      });
    }
  }, []);

  return state;
};

export const BlockchainContext = createContext<{ provider: Provider }>({
  provider: null as any,
});

interface Props {
  onChainChanged?: () => any;
  loading?: JSX.Element;
  children: JSX.Element;
}

const defaultChainChangedHandler = () => window.location.reload();

export const BlockchainProvider = ({
  onChainChanged = defaultChainChangedHandler,
  loading,
  ...rest
}: Props) => {
  const blockchain = useInitBlockchain(onChainChanged);

  if (blockchain.isIniting) {
    return loading || <div>Loading</div>;
  }

  if (!blockchain.isSupported || !blockchain.provider) {
    return <div>Please install MetaMask first</div>;
  }

  if (blockchain.isMultipleWalletsDetected) {
    return <div>Multiple wallets detected. Please use MetaMask.</div>;
  }

  return (
    <BlockchainContext.Provider
      {...rest}
      value={{ provider: blockchain.provider }}
    />
  );
};

export const useBlockchain = () => {
  const blockchain = useContext(BlockchainContext);

  return blockchain;
};

export const useContract = (address: string): IERC20 | null => {
  const unifiedAddress = address.toLowerCase();
  const [contractMap, setContractMap] = useState<{ [key: string]: IERC20 }>({});

  const { provider } = useBlockchain();

  useEffect(() => {
    if (unifiedAddress !== ADDRESS_ZERO) {
      setContractMap((map) => {
        if (!map[unifiedAddress]) {
          return {
            ...map,
            [unifiedAddress]: getContract(unifiedAddress, provider),
          };
        }

        return map;
      });
    }
  }, [unifiedAddress, provider, setContractMap]);

  return contractMap[unifiedAddress];
};
