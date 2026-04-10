import { useEffect, useMemo, useState } from 'react';
import { priceSearchService } from '../services/shopping/PriceSearchService';
import { projectCartService } from '../services/shopping/ProjectCartService';
import type { PriceSearchResultMap, Product, ProjectCart } from '../services/shopping/types';

const EMPTY_CART: ProjectCart = {
  projectId: '',
  items: [],
  subtotal: 0,
};

export function useProjectShopping(projectId: string, materials: string[], zipcode: string) {
  const [results, setResults] = useState<PriceSearchResultMap>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<ProjectCart>({ ...EMPTY_CART, projectId });

  useEffect(() => {
    if (!projectId) {
      return undefined;
    }

    return projectCartService.subscribe(projectId, setCart);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || materials.length === 0) {
      return;
    }

    let active = true;
    setLoadingMap((current) => {
      const next = { ...current };
      materials.forEach((material) => {
        next[material] = true;
      });
      return next;
    });

    priceSearchService.searchMany(materials, zipcode).then((searchResults) => {
      if (!active) {
        return;
      }

      setResults(searchResults);
      setLoadingMap((current) => {
        const next = { ...current };
        materials.forEach((material) => {
          next[material] = false;
        });
        return next;
      });

      Object.entries(searchResults).forEach(([name, alternatives]) => {
        projectCartService.setAlternatives(projectId, name, alternatives);
      });
    });

    return () => {
      active = false;
    };
  }, [projectId, materials, zipcode]);

  const selectProduct = (name: string, product: Product) => {
    const existing = cart.items.find((item) => item.name.toLowerCase() === name.toLowerCase());
    projectCartService.addItem(projectId, {
      name,
      quantity: existing?.quantity || 1,
      selectedProduct: product,
      alternatives: results[name] || existing?.alternatives || [],
    });
  };

  const addBestValueItems = () => {
    materials.forEach((material) => {
      const bestValue = results[material]?.[0];
      if (bestValue) {
        selectProduct(material, bestValue);
      }
    });
  };

  const totalRange = useMemo(() => {
    const totals = materials
      .map((material) => results[material] || [])
      .filter((list) => list.length > 0)
      .map((list) => ({ low: list[0].totalPrice, high: list[list.length - 1].totalPrice }));

    return totals.reduce(
      (accumulator, entry) => ({
        low: accumulator.low + entry.low,
        high: accumulator.high + entry.high,
      }),
      { low: 0, high: 0 }
    );
  }, [materials, results]);

  return {
    results,
    loadingMap,
    cart,
    totalRange,
    selectProduct,
    updateQuantity: (name: string, quantity: number) => projectCartService.updateQuantity(projectId, name, quantity),
    removeItem: (name: string) => projectCartService.removeItem(projectId, name),
    addBestValueItems,
  };
}

export default useProjectShopping;
