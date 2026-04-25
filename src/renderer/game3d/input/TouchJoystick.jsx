import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { InputContext } from './InputProvider';

// TouchJoystick — virtual on-screen joystick for mobile viewports.
//
// This cycle: the visual is minimal (outer ring + inner knob). The
// important contract is that dragging the knob pushes (dx, dy) into
// InputProvider via the setTouch() callback, which the rAF tick then
// picks up as moveX / moveY with source='touch'.
//
// The joystick is only rendered when:
//   1. The `visible` prop is true (default: auto-detect mobile).
//   2. The screen is narrow enough to suggest a touch device
//      (window.innerWidth <= 768) — overridable via the `forceVisible` prop.
//
// Props:
//   forceVisible  boolean  — show regardless of viewport width (dev aid)
//   size          number   — outer ring diameter in px (default 120)
//   bottom        number   — px from bottom of parent (default 32)
//   left          number   — px from left of parent (default 32)

const DEFAULT_SIZE = 120;
const KNOB_RATIO  = 0.38; // knob diameter as fraction of outer size

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || navigator.maxTouchPoints > 0;
}

export default function TouchJoystick({
  forceVisible = false,
  size = DEFAULT_SIZE,
  bottom = 32,
  left = 32,
}) {
  const ctx = useContext(InputContext);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 }); // px offset from center
  const originRef = useRef({ x: 0, y: 0 }); // touch start position
  const outerRef  = useRef(null);

  const shouldRender = forceVisible || isTouchDevice();

  // Emit touch deltas to InputProvider; clear when finger lifts.
  const emitDelta = useCallback(
    (dx, dy) => {
      if (ctx?.setTouch) ctx.setTouch(dx, dy);
    },
    [ctx],
  );

  const clearDelta = useCallback(() => {
    if (ctx?.setTouch) ctx.setTouch(0, 0);
  }, [ctx]);

  // ----------------------------------------------------------------
  // Touch handlers
  // ----------------------------------------------------------------
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return;
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top  + rect.height / 2,
    };
    setActive(true);
    setKnobPos({ x: 0, y: 0 });
    emitDelta(0, 0);
  }, [emitDelta]);

  const handleTouchMove = useCallback((e) => {
    if (!active) return;
    e.preventDefault();
    const touch = e.touches[0];
    const maxRadius = size / 2;
    let dx = touch.clientX - originRef.current.x;
    let dy = touch.clientY - originRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Clamp knob to the inside of the outer ring.
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobPos({ x: dx, y: dy });
    // Normalize to -1..+1; invert Y so up-drag = positive moveY (forward).
    emitDelta(dx / maxRadius, -(dy / maxRadius));
  }, [active, size, emitDelta]);

  const handleTouchEnd = useCallback(() => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    clearDelta();
  }, [clearDelta]);

  // Attach passive:false so we can preventDefault inside the handlers.
  useEffect(() => {
    const el = outerRef.current;
    if (!el || !shouldRender) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    el.addEventListener('touchend',   handleTouchEnd,   { passive: false });
    el.addEventListener('touchcancel',handleTouchEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove',  handleTouchMove);
      el.removeEventListener('touchend',   handleTouchEnd);
      el.removeEventListener('touchcancel',handleTouchEnd);
    };
  }, [shouldRender, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!shouldRender) return null;

  const knobSize = size * KNOB_RATIO;

  return (
    <div
      ref={outerRef}
      style={{
        position: 'absolute',
        bottom,
        left,
        width:  size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)',
        border:  '2px solid rgba(255,255,255,0.30)',
        boxSizing: 'border-box',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Inner knob */}
      <div
        style={{
          position: 'absolute',
          width:  knobSize,
          height: knobSize,
          borderRadius: '50%',
          background: active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
          border: '2px solid rgba(255,255,255,0.5)',
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: active ? 'none' : 'transform 0.15s ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
