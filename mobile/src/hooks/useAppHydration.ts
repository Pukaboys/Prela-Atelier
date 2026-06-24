import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useUserStore } from '../store/userStore';

export function useAppHydration() {
  const [ready, setReady] = useState(false);

  const hydrateCart = useCartStore((s) => s.hydrate);
  const hydrateCurrency = useCurrencyStore((s) => s.hydrate);
  const hydrateUser = useUserStore((s) => s.hydrate);

  useEffect(() => {
    Promise.all([hydrateCart(), hydrateCurrency(), hydrateUser()]).finally(() =>
      setReady(true)
    );
  }, []);

  return ready;
}
