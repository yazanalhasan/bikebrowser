import useGlobalCart from '../hooks/useGlobalCart';
import { globalCartService } from '../services/shopping/GlobalCartService';

export default function CartDrawer({ open, onClose }) {
  const cart = useGlobalCart();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 h-full w-full bg-black/35"
        onClick={onClose}
        aria-label="Close cart drawer"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Cart</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => globalCartService.clearAll()}
              className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {cart.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Your cart is empty. Add items from Project Builder or Shop Materials.
          </div>
        ) : (
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.name} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900 capitalize">{item.name}</p>
                  <button
                    onClick={() => globalCartService.removeItem(item.name)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-600">Qty: {item.quantity}</p>
                {item.selectedProduct ? (
                  <>
                    <p className="mt-1 text-sm text-slate-700">{item.selectedProduct.title}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      ${(item.selectedProduct.totalPrice * item.quantity).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">No product selected yet.</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-xl bg-slate-900 p-4 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Estimated Total</p>
          <p className="mt-2 text-2xl font-bold">${cart.totalEstimatedCost.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-300">Safety checks still apply to all shopping search results.</p>
        </div>
      </aside>
    </div>
  );
}
