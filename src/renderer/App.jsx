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
const SafeSearchPage = lazy(() => import('./pages/SafeSearchPage'));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'));
const BuildPlannerPage = lazy(() => import('./pages/BuildPlannerPage'));
const AllProjectNotesPage = lazy(() => import('./pages/AllProjectNotesPage'));
const GameRebuildPage = lazy(() => import('./pages/GameRebuildPage'));
// QUARANTINED abandoned parallel game implementations (kept on disk, not routed
// or bundled): GamePage (legacy Phaser /legacy-play), Game3DPage (Three.js
// prototype /play3d), GodotPrototypePage (Godot iframe /play, /godot-prototype).
// The canonical playable experience is GameRebuildPage at /game-rebuild.
const SpellingTrainerApp = lazy(() => import('./spellingTrainer/SpellingTrainerApp'));
const UTMLabPage = lazy(() => import('./utm/UTMLab.jsx'));
const EngineDynoLabPage = lazy(() => import('./dyno/EngineDynoLab.jsx'));
const BridgeDesignLabPage = lazy(() => import('./bridge/BridgeDesignLab.jsx'));
const CrashTestLabPage = lazy(() => import('./crash/CrashTestLab.jsx'));
const WindTunnelLabPage = lazy(() => import('./tunnel/WindTunnelLab.jsx'));
const CircuitBenchLabPage = lazy(() => import('./circuit/CircuitBenchLab.jsx'));
const BoatTankLabPage = lazy(() => import('./boat/BoatTankLab.jsx'));
const VacuumChamberLabPage = lazy(() => import('./vacuum/VacuumChamberLab.jsx'));
const ExtractionLabPage = lazy(() => import('./extraction/ExtractionLab.jsx'));
const PhytoLabPage = lazy(() => import('./phyto/PhytoLab.jsx'));
const MicroscopeLabPage = lazy(() => import('./microscope/MicroscopeLab.jsx'));
const FermentLabPage = lazy(() => import('./ferment/FermentLab.jsx'));
const MechanismLabPage = lazy(() => import('./mechanism/MechanismLab.jsx'));
const EcosystemLabPage = lazy(() => import('./ecosystem/EcosystemLab.jsx'));
const LoadTestLabPage = lazy(() => import('./loadtest/LoadTestLab.jsx'));
const SkateLabPage = lazy(() => import('./skate/SkateLab.jsx'));
const EcologyLabPage = lazy(() => import('./habitat/EcologyLab.jsx'));
const BiomeLabPage = lazy(() => import('./habitat/BiomeLab.jsx'));

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
          <Route path="/build-planner" element={<BuildPlannerPage />} />
          <Route path="/saved-notes" element={<AllProjectNotesPage />} />
          <Route path="/shop" element={<ShoppingPage />} />
          <Route path="/safe-search" element={<SafeSearchPage />} />
          <Route path="/game-rebuild" element={<GameRebuildPage />} />
          {/* Quarantined: /play, /legacy-play, /godot-prototype, /play3d removed.
              The abandoned legacy-Phaser, Godot, and Three.js game prototypes are
              kept on disk but no longer routed or bundled. /game-rebuild is the
              single canonical playable experience. */}
          <Route path="/spelling-trainer" element={<SpellingTrainerApp />} />
          <Route path="/utm-lab" element={<div className="bb-lab-route"><UTMLabPage /></div>} />
          <Route path="/dyno-lab" element={<div className="bb-lab-route"><EngineDynoLabPage /></div>} />
          <Route path="/bridge-lab" element={<div className="bb-lab-route"><BridgeDesignLabPage /></div>} />
          <Route path="/crash-lab" element={<div className="bb-lab-route"><CrashTestLabPage /></div>} />
          <Route path="/tunnel-lab" element={<div className="bb-lab-route"><WindTunnelLabPage /></div>} />
          <Route path="/circuit-lab" element={<div className="bb-lab-route"><CircuitBenchLabPage /></div>} />
          <Route path="/boat-lab" element={<div className="bb-lab-route"><BoatTankLabPage /></div>} />
          <Route path="/vacuum-lab" element={<div className="bb-lab-route"><VacuumChamberLabPage /></div>} />
          <Route path="/extraction-lab" element={<div className="bb-lab-route"><ExtractionLabPage /></div>} />
          <Route path="/phyto-lab" element={<div className="bb-lab-route"><PhytoLabPage /></div>} />
          <Route path="/scope-lab" element={<div className="bb-lab-route"><MicroscopeLabPage /></div>} />
          <Route path="/ferment-lab" element={<div className="bb-lab-route"><FermentLabPage /></div>} />
          <Route path="/enzyme-lab" element={<div className="bb-lab-route"><MechanismLabPage /></div>} />
          <Route path="/ecosystem-lab" element={<div className="bb-lab-route"><EcosystemLabPage /></div>} />
          <Route path="/loadtest-lab" element={<div className="bb-lab-route"><LoadTestLabPage /></div>} />
          <Route path="/skate-lab" element={<div className="bb-lab-route"><SkateLabPage /></div>} />
          <Route path="/ecology-lab" element={<div className="bb-lab-route"><EcologyLabPage /></div>} />
          <Route path="/biome-lab" element={<div className="bb-lab-route"><BiomeLabPage /></div>} />
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
