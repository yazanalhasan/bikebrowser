import useInput from './useInput';

// InputDebugHUD — shows live input state as an overlay.
//
// Usage:
//   <InputDebugHUD visible />          — show
//   <InputDebugHUD />                  — hidden (default)
//
// Must be rendered inside <InputProvider>. Typically placed just inside
// the wrapper div of Game3D so it overlays the Canvas.
//
// The HUD is pointer-events:none so it never interferes with gameplay.
export default function InputDebugHUD({ visible = false }) {
  const { moveX, moveY, action, cancel, debug, source } = useInput();

  if (!visible) return null;

  const row = (label, value) => (
    <div
      key={label}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        color: value && value !== 0 && value !== '0.000' ? '#7ef57e' : '#ccc',
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'boolean' ? (value ? 'ON' : 'off') : String(value)}
      </span>
    </div>
  );

  // Format axis values to fixed 3 decimal places for stability.
  const fmtAxis = (v) => v.toFixed(3);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.72)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 11,
        borderRadius: 4,
        lineHeight: 1.7,
        pointerEvents: 'none',
        minWidth: 170,
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: 4, opacity: 0.5, fontSize: 10, letterSpacing: 1 }}>
        INPUT DEBUG
      </div>
      {row('moveX', fmtAxis(moveX))}
      {row('moveY', fmtAxis(moveY))}
      {row('action', action)}
      {row('cancel', cancel)}
      {row('debug', debug)}
      {row('source', source)}
    </div>
  );
}
