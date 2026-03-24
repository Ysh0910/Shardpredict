import { useMemo } from 'react';
import { Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

export function useContract(provider) {
  return useMemo(() => {
    if (!provider) return null;
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [provider]);
}
