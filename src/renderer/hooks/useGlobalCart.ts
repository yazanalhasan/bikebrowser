import { useEffect, useState } from 'react';
import { globalCartService } from '../services/shopping/GlobalCartService';
import type { GlobalCart } from '../services/shopping/types';

const EMPTY_CART: GlobalCart = {
  items: [],
  totalEstimatedCost: 0,
};

export function useGlobalCart() {
  const [cart, setCart] = useState<GlobalCart>(globalCartService.getCart?.() || EMPTY_CART);

  useEffect(() => globalCartService.subscribe(setCart), []);

  return cart;
}

export default useGlobalCart;
