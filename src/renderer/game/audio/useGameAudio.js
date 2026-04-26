/**
 * useGameAudio — React hook that manages the AudioManager lifecycle.
 *
 * Returns:
 *   audio      – the AudioManager instance
 *   isUnlocked – whether audio has been unlocked by user gesture
 *   unlock()   – call on first tap/click to enable audio
 *   settings   – current audio settings (reactive)
 *   setSetting – update a single setting
 *
 * The hook:
 *   • Creates a single AudioManager per mount
 *   • Destroys it on unmount (leaving /play)
 *   • Provides unlock gating for mobile autoplay policy
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import AudioManager from './AudioManager.js';

export default function useGameAudio() {
  const managerRef = useRef(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [settings, setSettings] = useState(null);

  // Create manager on mount, destroy on unmount.
  // On HMR hot-swap (React Refresh), React Refresh re-runs this effect but
  // preserves useState values — meaning isUnlocked could stay true while the
  // underlying AudioManager is destroyed and replaced. Reset isUnlocked in
  // cleanup so the unlock overlay re-appears and the new instance gets
  // properly initialized via a fresh user gesture.
  useEffect(() => {
    const mgr = new AudioManager();
    managerRef.current = mgr;
    setSettings({ ...mgr.settings });

    return () => {
      mgr.destroy();
      managerRef.current = null;
      setIsUnlocked(false); // force overlay re-show if HMR swaps the module
    };
  }, []);

  /**
   * Unlock audio context — must be called from a user gesture handler.
   * After unlocking, preloads common UI sounds.
   */
  const unlock = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr) return;
    const wasNew = mgr.unlock();
    if (wasNew) {
      setIsUnlocked(true);
      // Preload common sounds in background
      mgr.preloadKeys([
        'ui_tap', 'ui_panel_open', 'ui_panel_close', 'ui_notebook_open',
        'ui_quest_accept', 'ui_quest_complete', 'ui_error', 'ui_success',
        'interaction_ping', 'reward_stinger', 'item_pickup',
      ]);
    }
  }, []);

  /**
   * Update a single audio setting.
   */
  const setSetting = useCallback((prop, value) => {
    const mgr = managerRef.current;
    if (!mgr) return;
    mgr.setSetting(prop, value);
    setSettings({ ...mgr.settings });
  }, []);

  return {
    audio: managerRef.current,
    isUnlocked,
    unlock,
    settings,
    setSetting,
  };
}
