/**
 * AppLayout Component
 * 
 * STEP 5: Fix Architecture - Persistent Global Layout
 * 
 * This is the ONE place where navigation controls live.
 * No page is allowed to define its own header anymore.
 * 
 * Pattern:
 * - Header is always visible at top
 * - Home button (🏠) is always accessible
 * - Back button (←) is available when not on homepage
 * - Content area is consistent across all pages
 */

import React, { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useGlobalCart from '../hooks/useGlobalCart';
import CartDrawer from './CartDrawer';
import ProjectSwitcher from '../../components/ProjectSwitcher';
import ConnectionPanel from './ConnectionPanel';

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGameRoute = location.pathname.startsWith('/play');
  const [cartOpen, setCartOpen] = useState(false);
  const globalCart = useGlobalCart();

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  // ── Immersive game layout — ZERO app chrome ─────────────────────────
  // The game route gets the full viewport. Navigation is handled by a
  // floating pointer-events-none overlay inside GameContainer itself.
  if (isGameRoute) {
    return (
      <div
        data-testid="app-layout"
        className="w-screen bg-black overflow-hidden"
        style={{
          height: '100dvh',
          overscrollBehavior: 'none',
        }}
      >
        <main
          data-testid="main-content"
          className="w-full h-full overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          {children}
        </main>
      </div>
    );
  }

  // ── Normal app layout (all other routes) ─────────────────────────────
  return (
    <div data-testid="app-layout" className="min-h-screen flex flex-col bg-gray-50">
      {/* ========== PERSISTENT HEADER ========== */}
      <header
        data-testid="app-header"
        className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200"
      >
        <div data-testid="nav-container" className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* Home Button - ALWAYS visible */}
          <button
            data-testid="home-button"
            onClick={handleHome}
            className="text-3xl hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            title="Go to home page"
            aria-label="Home"
          >
            🏠
          </button>

          {/* Back Button - Only on non-home pages */}
          {!isHome && (
            <button
              data-testid="back-button"
              onClick={handleBack}
              className="text-2xl text-gray-700 hover:text-gray-900 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              title="Go back"
              aria-label="Back"
            >
              ←
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Breadcrumb/Title - Optional, shows current page */}
          <div
            data-testid="breadcrumb"
            className="text-sm text-gray-700 font-medium hidden sm:block truncate max-w-xs"
          >
            {getBreadcrumbText(location.pathname)}
          </div>

          <div className="hidden lg:block">
            <ProjectSwitcher />
          </div>

          <button
            data-testid="cart-button"
            onClick={() => setCartOpen(true)}
            className="relative rounded-lg bg-slate-900 px-3 py-2 text-lg text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Open cart"
            aria-label="Open cart"
          >
            🛒
            {globalCart.items.length > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                {globalCart.items.length}
              </span>
            )}
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <ConnectionPanel />
        </div>
      </header>

      {/* ========== MAIN CONTENT AREA ========== */}
      <main
        data-testid="main-content"
        className="flex-1 w-full"
      >
        {children}
      </main>

      {/* ========== OPTIONAL FOOTER ========== */}
      <footer
        data-testid="app-footer"
        className="bg-gray-100 border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-600"
      >
        <p>BikeBrowser - Safe Learning for Kids 🚴</p>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

/**
 * Helper to generate breadcrumb text based on route
 */
function getBreadcrumbText(pathname) {
  const breadcrumbs = {
    '/': 'Home',
    '/youtube/search': 'Search Videos',
    '/youtube/watch': 'Watch Video',
    '/project-builder': 'Project Builder',
    '/current-projects': 'Current Projects',
    '/build-planner': 'Build Planner',
    '/saved-notes': 'Saved Parts / Notes',
    '/shop': 'Shop Materials',
    '/safe-search': 'Safe Search',
    '/play': 'Play Game',
    '/spelling-trainer': "Zaydan's Spelling Trainer",
  };

  // Try exact match first
  if (breadcrumbs[pathname]) {
    return breadcrumbs[pathname];
  }

  // Try prefix match for dynamic routes like /youtube/watch/:videoId
  for (const [route, label] of Object.entries(breadcrumbs)) {
    if (pathname.startsWith(route)) {
      return label;
    }
  }

  return pathname;
}

export default AppLayout;
