import { BrowserRouter, HashRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { setupAudioNormalization } from './utils/audioManager';
import AppLayout from './components/AppLayout';
import useUXAudit from './hooks/useUXAudit';

// Eager load home page for instant startup
import HomePage from './pages/HomePage';

// Lazy load heavy pages - only load when user navigates to them
const YouTubeSearchView = lazy(() => import('./pages/YouTubeSearchView'));
const VideoWatchPage = lazy(() => import('./pages/VideoWatchPage'));
const ProjectBuilderPage = lazy(() => import('./pages/ProjectBuilderPage'));
const CurrentProjectsPage = lazy(() => import('./pages/CurrentProjectsPage'));
const SafeSearchPage = lazy(() => import('./pages/SafeSearchPage'));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'));
const BuildPlannerPage = lazy(() => import('./pages/BuildPlannerPage'));
const AllProjectNotesPage = lazy(() => import('./pages/AllProjectNotesPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const Game3DPage = lazy(() => import('./pages/Game3DPage'));
const SpellingTrainerApp = lazy(() => import('./spellingTrainer/SpellingTrainerApp'));

const VERSION_STORAGE_KEY = 'bikebrowser_cached_version';

function DeprecatedMobileRouteRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.pathname.startsWith('/m')) {
      return;
    }

    if (import.meta.env.DEV) {
      console.warn('Deprecated mobile route detected:', location.pathname);
    }

    let target = '/';
    if (location.pathname.startsWith('/m/results')) {
      target = '/youtube/search';
    } else if (location.pathname.startsWith('/m/project')) {
      target = '/project-builder';
    } else if (location.pathname.startsWith('/m/parent')) {
      target = '/saved-notes';
    }

    navigate(target, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

function AppContent() {
  // STEP 6: Auto UX Audit Loop - runs on every route change
  useUXAudit();

  return (
    <AppLayout>
      <DeprecatedMobileRouteRedirect />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/youtube/search" element={<YouTubeSearchView />} />
          <Route path="/youtube/watch/:videoId" element={<VideoWatchPage />} />
          <Route path="/project-builder" element={<ProjectBuilderPage />} />
          <Route path="/current-projects" element={<CurrentProjectsPage />} />
          <Route path="/build-planner" element={<BuildPlannerPage />} />
          <Route path="/saved-notes" element={<AllProjectNotesPage />} />
          <Route path="/shop" element={<ShoppingPage />} />
          <Route path="/safe-search" element={<SafeSearchPage />} />
          <Route path="/play" element={<GamePage />} />
          <Route path="/play3d" element={<Game3DPage />} />
          <Route path="/spelling-trainer" element={<SpellingTrainerApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  const [showVersionBanner, setShowVersionBanner] = useState(false);
  const RouterComponent =
    typeof window !== 'undefined' && window.location?.protocol === 'file:'
      ? HashRouter
      : BrowserRouter;

  useEffect(() => {
    const stopAudioNormalization = setupAudioNormalization();

    return () => {
      stopAudioNormalization();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const latestVersion = payload?.version;
        if (!latestVersion || cancelled) {
          return;
        }

        const cachedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
        if (cachedVersion && cachedVersion !== latestVersion) {
          setShowVersionBanner(true);
        }

        localStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
      } catch (error) {
        console.warn('Version check failed:', error);
      }
    };

    checkVersion();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ErrorBoundary>
      {showVersionBanner && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-amber-100 border-b border-amber-300 px-4 py-3 text-amber-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span className="text-sm font-medium">New version available - Refresh</span>
            <button
              type="button"
              onClick={() => window.location.reload(true)}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
      <RouterComponent>
        <AppContent />
      </RouterComponent>
    </ErrorBoundary>
  );
}

export default App;
