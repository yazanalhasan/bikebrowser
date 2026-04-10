import type { GlobalCart, Product, ProjectCartItem } from './types';

type ProjectCartSourceMap = Record<string, ProjectCartItem[]>;
type Listener = (cart: GlobalCart) => void;

const STORAGE_KEY = 'bikebrowser.global-cart.v1';

class GlobalCartService {
  private projectCarts: ProjectCartSourceMap = {};
  private listeners = new Set<Listener>();

  constructor() {
    this.load();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getCart());
    return () => this.listeners.delete(listener);
  }

  mergeProjectCart(projectId: string, items: ProjectCartItem[]) {
    this.projectCarts[projectId] = items;
    this.persist();
    this.emit();
  }

  removeItem(name: string) {
    const normalizedTarget = this.normalizeName(name);
    const nextProjectCarts: ProjectCartSourceMap = {};

    Object.entries(this.projectCarts).forEach(([projectId, items]) => {
      const filteredItems = items.filter((item) => this.normalizeName(item.name) !== normalizedTarget);
      if (filteredItems.length > 0) {
        nextProjectCarts[projectId] = filteredItems;
      }
    });

    this.projectCarts = nextProjectCarts;
    this.persist();
    this.emit();
  }

  clearAll() {
    this.projectCarts = {};
    this.persist();
    this.emit();
  }

  getCart(): GlobalCart {
    const merged = new Map<string, ProjectCartItem>();

    Object.values(this.projectCarts).flat().forEach((item) => {
      const key = this.normalizeName(item.name);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          name: item.name,
          quantity: item.quantity,
          selectedProduct: item.selectedProduct,
          alternatives: item.alternatives || [],
        });
        return;
      }

      existing.quantity += item.quantity;
      existing.alternatives = this.mergeAlternatives(existing.alternatives || [], item.alternatives || []);
      if (this.pickBetterProduct(existing.selectedProduct, item.selectedProduct)) {
        existing.selectedProduct = item.selectedProduct;
      }
    });

    const items = Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
    const totalEstimatedCost = items.reduce((sum, item) => {
      const unitCost = item.selectedProduct?.totalPrice || 0;
      return sum + unitCost * item.quantity;
    }, 0);

    return {
      items,
      totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
    };
  }

  private emit() {
    const cart = this.getCart();
    this.listeners.forEach((listener) => listener(cart));
  }

  private persist() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projectCarts));
  }

  private load() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.projectCarts = JSON.parse(raw);
      }
    } catch (error) {
      console.warn('Failed to load global cart state:', error);
    }
  }

  private normalizeName(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private mergeAlternatives(existing: Product[], incoming: Product[]) {
    const unique = new Map<string, Product>();
    [...existing, ...incoming].forEach((product) => {
      unique.set(product.id, product);
    });
    return Array.from(unique.values()).sort((left, right) => left.totalPrice - right.totalPrice).slice(0, 5);
  }

  private pickBetterProduct(current?: Product, candidate?: Product) {
    if (!candidate) {
      return false;
    }
    if (!current) {
      return true;
    }
    return candidate.totalPrice < current.totalPrice;
  }
}

export const globalCartService = new GlobalCartService();
