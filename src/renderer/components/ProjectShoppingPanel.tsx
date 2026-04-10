import { useMemo, useState } from 'react';
import { useProjectShopping } from '../hooks/useProjectShopping';
import { useLocalStores } from '../hooks/useLocalStores';
import { buildOnlineRetailers } from '../services/shopping/onlineRetailers';
import type { Product } from '../services/shopping/types';
import type { LocalStore } from '../hooks/useLocalStores';
import type { OnlineRetailer } from '../services/shopping/onlineRetailers';

type Props = {
  projectId: string;
  materials: string[];
};

function getTags(product: Product, products: Product[], index: number) {
  const cheapest = Math.min(...products.map((item) => item.totalPrice));
  const fastestShipping = Math.min(...products.map((item) => item.shipping));
  const tags = [] as string[];

  if (index === 0) {
    tags.push('🥇 Best Value');
  }
  if (product.totalPrice === cheapest) {
    tags.push('💲 Cheapest');
  }
  if (product.shipping === fastestShipping) {
    tags.push('🚀 Fastest Shipping');
  }

  return tags.slice(0, 2);
}

export default function ProjectShoppingPanel({ projectId, materials }: Props) {
  const [zipcode, setZipcode] = useState('85255');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { results, loadingMap, cart, totalRange, selectProduct, updateQuantity, removeItem, addBestValueItems } =
    useProjectShopping(projectId, materials, zipcode);

  const { stores: localStores, loading: storesLoading, error: storesError } = useLocalStores(zipcode, materials);

  const onlineRetailers = useMemo(() => buildOnlineRetailers(results, materials), [results, materials]);

  const selectedMap = useMemo(
    () => Object.fromEntries(cart.items.map((item) => [item.name.toLowerCase(), item.selectedProduct?.id || ''])),
    [cart.items]
  );

  if (materials.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">🛒 Price-Aware Materials</h3>
          <p className="text-sm text-slate-600">
            Compare best-value options, build a project cart, and roll everything into your global cart.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">
            ZIP
            <input
              value={zipcode}
              onChange={(event) => setZipcode(event.target.value)}
              className="ml-2 w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={addBestValueItems}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Add All Best Value Items
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {materials.map((material) => {
          const products = results[material] || [];
          const loading = loadingMap[material];
          const expanded = Boolean(expandedItems[material]);
          const cartItem = cart.items.find((item) => item.name.toLowerCase() === material.toLowerCase());

          return (
            <div key={material} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold capitalize text-slate-900">{material}</p>
                  <p className="text-sm text-slate-600">
                    {cartItem?.selectedProduct
                      ? `Selected: ${cartItem.selectedProduct.source} · $${cartItem.selectedProduct.totalPrice.toFixed(2)}`
                      : 'No product selected yet'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setExpandedItems((current) => ({
                        ...current,
                        [material]: !current[material],
                      }))
                    }
                    className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    {expanded ? 'Hide Prices' : 'Find Best Price'}
                  </button>
                  {cartItem && (
                    <button
                      onClick={() => removeItem(material)}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="mt-4 space-y-3">
                  {loading && (
                    <div className="grid gap-3">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
                          <div className="h-4 w-40 rounded bg-slate-200" />
                          <div className="mt-3 h-3 w-64 rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && products.length === 0 && (
                    <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
                      No kid-safe results found right now.
                    </div>
                  )}

                  {!loading && products.length > 0 && (
                    <div className="grid gap-3">
                      {products.slice(0, 3).map((product, index) => {
                        const isSelected = selectedMap[material.toLowerCase()] === product.id;
                        return (
                          <div
                            key={product.id}
                            className={`rounded-xl border p-4 shadow-sm transition ${
                              isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt={product.title} className="h-14 w-14 rounded-lg object-cover" />
                                <div>
                                  <p className="font-semibold text-slate-900">{product.title}</p>
                                  <p className="text-sm text-slate-600">
                                    ${product.price.toFixed(2)} + ${product.shipping.toFixed(2)} shipping · {product.sourceLabel || product.source}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {getTags(product, products, index).map((tag) => (
                                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-start gap-2 md:items-end">
                                <p className="text-lg font-bold text-slate-900">${product.totalPrice.toFixed(2)}</p>
                                <button
                                  onClick={() => selectProduct(material, product)}
                                  className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-600"
                                >
                                  {isSelected ? 'Selected' : 'Add to Project Cart'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {cartItem?.selectedProduct && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                      <label className="text-sm font-semibold text-slate-700">
                        Quantity
                        <input
                          type="number"
                          min="1"
                          value={cartItem.quantity}
                          onChange={(event) => updateQuantity(material, Number(event.target.value))}
                          className="ml-2 w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </label>
                      <a
                        href={cartItem.selectedProduct.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View Listing
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Local Stores Section ── */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h4 className="text-base font-bold text-slate-900">📍 Local Stores Near {zipcode}</h4>
        <p className="mt-1 text-sm text-slate-600">
          Nearby shops that may carry bike parts and materials for same-day pickup.
        </p>

        {storesLoading && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-56 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {storesError && (
          <p className="mt-3 text-sm text-rose-600">{storesError}</p>
        )}

        {!storesLoading && !storesError && localStores.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No local stores found near this ZIP code.</p>
        )}

        {!storesLoading && localStores.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {localStores.map((store) => (
              <LocalStoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>

      {/* ── Online Retailers Section ── */}
      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h4 className="text-base font-bold text-slate-900">🌐 Online Retailers</h4>
        <p className="mt-1 text-sm text-slate-600">
          Products and search links from major online stores.
        </p>

        <div className="mt-4 grid gap-4">
          {onlineRetailers.map((retailer) => (
            <OnlineRetailerSection key={retailer.key} retailer={retailer} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-slate-900 p-4 text-white md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Project Cart</p>
          <p className="mt-2 text-2xl font-bold">${cart.subtotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Estimated Range</p>
          <p className="mt-2 text-lg font-semibold">
            ${totalRange.low.toFixed(2)} - ${totalRange.high.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Selected Items</p>
          <p className="mt-2 text-lg font-semibold">{cart.items.filter((item) => item.selectedProduct).length} / {materials.length}</p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Local Store Card ──────────────── */

function LocalStoreCard({ store }: { store: LocalStore }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{store.name}</p>
          <p className="mt-1 text-sm text-slate-600">{store.address}</p>
        </div>
        {store.rating != null && (
          <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
            ⭐ {store.rating.toFixed(1)}
            {store.totalRatings != null && <span className="font-normal text-amber-600"> ({store.totalRatings})</span>}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {store.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {tag}
          </span>
        ))}
        {store.isOpen === true && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Open Now</span>
        )}
        {store.isOpen === false && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Closed</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {store.phone ? (
          <a href={`tel:${store.phone}`} className="font-semibold text-blue-600 hover:text-blue-700">
            📞 {store.phone}
          </a>
        ) : (
          <span className="text-slate-400">No phone listed</span>
        )}
        {store.website && (
          <a
            href={store.website}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            🌐 Website
          </a>
        )}
      </div>
    </div>
  );
}

/* ──────────────── Online Retailer Section ──────────────── */

function OnlineRetailerSection({ retailer }: { retailer: OnlineRetailer }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">{retailer.icon}</span>
        <h5 className="font-bold text-slate-900">{retailer.name}</h5>
        <span className={`ml-auto rounded-full ${retailer.color} px-2.5 py-0.5 text-xs font-semibold text-white`}>
          {retailer.products.length} {retailer.products.length === 1 ? 'product' : 'products'} found
        </span>
      </div>

      {retailer.products.length > 0 && (
        <div className="mt-3 grid gap-2">
          {retailer.products.slice(0, 4).map((product) => (
            <a
              key={product.id}
              href={product.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-100 p-2 transition hover:bg-slate-50"
            >
              {product.image && (
                <img src={product.image} alt={product.title} className="h-10 w-10 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{product.title}</p>
                <p className="text-xs text-slate-500">{product.sourceLabel || product.source}</p>
              </div>
              {product.price > 0 && (
                <p className="flex-shrink-0 text-sm font-bold text-slate-900">${product.price.toFixed(2)}</p>
              )}
            </a>
          ))}
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Search on {retailer.name}</p>
        <div className="flex flex-wrap gap-2">
          {retailer.searchLinks.map(({ material, url }) => (
            <a
              key={material}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {material} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}