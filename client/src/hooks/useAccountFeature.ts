import { useAccount } from '../context/AccountContext';

export function useAccountFeature(featureKey: string): boolean {
    const { currentAccount } = useAccount();

    if (!currentAccount || !currentAccount.features) return false;

    const feature = currentAccount.features.find(f => f.featureKey === featureKey);
    return feature ? feature.isEnabled : false;
}
