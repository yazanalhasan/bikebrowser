import { globalCartService } from './GlobalCartService';
import type { Product, ProjectCart, ProjectCartItem } from './types';

type ProjectListener = (cart: ProjectCart) => void;

class ProjectCartService {
  private carts = new Map<string, ProjectCartItem[]>();
  private listeners = new Map<string, Set<ProjectListener>>();

  subscribe(projectId: string, listener: ProjectListener) {
    const projectListeners = this.listeners.get(projectId) || new Set<ProjectListener>();
    projectListeners.add(listener);
    this.listeners.set(projectId, projectListeners);
    listener(this.getCart(projectId));

    return () => {
      projectListeners.delete(listener);
    };
  }

  getCart(projectId: string): ProjectCart {
    const items = this.carts.get(projectId) || [];
    return {
      projectId,
      items,
      subtotal: Number(
        items.reduce((sum, item) => sum + (item.selectedProduct?.totalPrice || 0) * item.quantity, 0).toFixed(2)
      ),
    };
  }

  addItem(projectId: string, item: ProjectCartItem) {
    const items = [...(this.carts.get(projectId) || [])];
    const index = items.findIndex((entry) => entry.name.toLowerCase() === item.name.toLowerCase());

    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...item,
        quantity: item.quantity || items[index].quantity,
      };
    } else {
      items.push(item);
    }

    this.commit(projectId, items);
  }

  setAlternatives(projectId: string, name: string, alternatives: Product[]) {
    const items = [...(this.carts.get(projectId) || [])];
    const index = items.findIndex((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (index >= 0) {
      items[index] = { ...items[index], alternatives };
    } else {
      items.push({ name, quantity: 1, alternatives });
    }
    this.commit(projectId, items);
  }

  updateQuantity(projectId: string, name: string, quantity: number) {
    const items = (this.carts.get(projectId) || []).map((item) =>
      item.name.toLowerCase() === name.toLowerCase()
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    );
    this.commit(projectId, items);
  }

  removeItem(projectId: string, name: string) {
    const items = (this.carts.get(projectId) || []).filter(
      (item) => item.name.toLowerCase() !== name.toLowerCase()
    );
    this.commit(projectId, items);
  }

  calculateSubtotal(projectId: string) {
    return this.getCart(projectId).subtotal;
  }

  private commit(projectId: string, items: ProjectCartItem[]) {
    this.carts.set(projectId, items);
    globalCartService.mergeProjectCart(projectId, items);
    const cart = this.getCart(projectId);
    const listeners = this.listeners.get(projectId) || new Set<ProjectListener>();
    listeners.forEach((listener) => listener(cart));
  }
}

export const projectCartService = new ProjectCartService();
