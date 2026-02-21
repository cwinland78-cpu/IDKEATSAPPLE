import { useState, useEffect, useCallback } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
} from '@/lib/revenuecatClient';

/**
 * Hook to check if user has premium status
 */
export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPremiumStatus = useCallback(async () => {
    setIsLoading(true);
    const result = await hasEntitlement('premium');
    if (result.ok) {
      setIsPremium(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  return { isPremium, isLoading, refresh: checkPremiumStatus };
}

/**
 * Hook to get available offerings/packages
 */
export function useOfferings() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getOfferings();

      if (result.ok) {
        const availablePackages = result.data.current?.availablePackages ?? [];
        setPackages(availablePackages);
      } else {
        setError(result.reason);
      }

      setIsLoading(false);
    };

    fetchOfferings();
  }, []);

  return { packages, isLoading, error };
}

/**
 * Hook to handle purchases
 */
export function usePurchase() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    setError(null);

    const result = await purchasePackage(pkg);

    setIsPurchasing(false);

    if (!result.ok) {
      setError(result.reason);
      throw new Error(result.reason);
    }

    return result.data;
  }, []);

  return { purchase, isPurchasing, error };
}

/**
 * Hook to handle restore purchases
 */
export function useRestorePurchases() {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = useCallback(async () => {
    setIsRestoring(true);
    setError(null);

    const result = await restorePurchases();

    setIsRestoring(false);

    if (!result.ok) {
      setError(result.reason);
      throw new Error(result.reason);
    }

    return result.data;
  }, []);

  return { restore, isRestoring, error };
}
