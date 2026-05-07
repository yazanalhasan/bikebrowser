import { useEffect, useMemo, useRef, useState } from 'react';
import { computeGearTrain } from '../../../spellingTrainer/math/gearPhysics.js';

const BASE_RADIUS = 60;
const BASE_TEETH = 40;
const BASE_ROTATIONS_PER_SECOND = 0.16;
const REDUCED_MOTION_ROTATIONS_PER_SECOND = 0.035;

function formatNumber(value, digits = 2) {
  const rounded = Number(value.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener?.('change', sync);

    return () => query.removeEventListener?.('change', sync);
  }, []);

  return reducedMotion;
}

function teeth(cx, cy, radius, count, color) {
  const toothWidth = Math.max(3, Math.min(7, radius * 0.12));
  const toothLength = Math.max(6, Math.min(12, radius * 0.18));

  return Array.from({ length: count }, (_, index) => {
    const angle = (360 * index) / count;
    return (
      <rect
        key={index}
        x={cx - toothWidth / 2}
        y={cy - radius - toothLength}
        width={toothWidth}
        height={toothLength}
        rx="2"
        fill={color}
        opacity={index % 4 === 0 ? 1 : 0.78}
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    );
  });
}

function DirectionArrow({ gear }) {
  const sweep = gear.rotationDirection === 1 ? 'M -14 -6 A 22 22 0 0 1 13 -9' : 'M 14 -6 A 22 22 0 0 0 -13 -9';
  const marker = gear.rotationDirection === 1 ? `url(#arrow-${gear.id})` : `url(#arrow-${gear.id})`;

  return (
    <g transform={`translate(${gear.x} ${gear.y})`} opacity="0.68">
      <path d={sweep} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" markerEnd={marker} />
    </g>
  );
}

function GearShape({ gear, groupRef }) {
  const pitchRadius = gear.radius;
  const outerRadius = pitchRadius + Math.max(6, Math.min(12, pitchRadius * 0.18));
  const innerRadius = Math.max(8, pitchRadius * 0.22);

  return (
    <g>
      <g ref={groupRef}>
        {teeth(gear.x, gear.y, pitchRadius, gear.teeth, gear.color)}
        <circle cx={gear.x} cy={gear.y} r={pitchRadius} fill={`${gear.color}22`} stroke={gear.color} strokeWidth="4" />
        <circle cx={gear.x} cy={gear.y} r={pitchRadius * 0.72} fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.85" />
        <line x1={gear.x - pitchRadius * 0.82} y1={gear.y} x2={gear.x + pitchRadius * 0.82} y2={gear.y} stroke="#0f172a" strokeWidth="3" opacity="0.35" />
        <line x1={gear.x} y1={gear.y - pitchRadius * 0.82} x2={gear.x} y2={gear.y + pitchRadius * 0.82} stroke="#0f172a" strokeWidth="3" opacity="0.35" />
        <circle cx={gear.x} cy={gear.y} r={innerRadius} fill="#0f172a" opacity="0.86" />
        <circle cx={gear.x - innerRadius * 0.25} cy={gear.y - innerRadius * 0.25} r={innerRadius * 0.28} fill="#ffffff" opacity="0.38" />
      </g>
      <circle cx={gear.x} cy={gear.y} r={outerRadius} fill="none" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.22" />
      <DirectionArrow gear={gear} />
    </g>
  );
}

function GearLabel({ gear, driverGear }) {
  const speed = gear.angularVelocity / driverGear.angularVelocity;
  const size = gear.radius / driverGear.radius;
  const y = gear.y + gear.radius + 35;

  return (
    <g>
      <text x={gear.x} y={y} textAnchor="middle" fontSize="13" fontWeight="900" fill="#0f172a">
        {gear.role}: {formatNumber(size)}x size
      </text>
      <text x={gear.x} y={y + 17} textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155">
        {gear.teeth} teeth · {formatNumber(speed)}x speed
      </text>
    </g>
  );
}

export default function GearMultiplicationIllustration({
  factorA = 1,
  factorB = 1,
  showGearMath = true,
  includeIdler = false,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const gearRefs = useRef(new Map());
  const pausedRef = useRef(paused);
  const train = useMemo(
    () => computeGearTrain({ factorA, factorB, baseRadius: BASE_RADIUS, baseTeeth: BASE_TEETH, includeIdler }),
    [factorA, factorB, includeIdler]
  );
  const driverGear = train.gears[0];
  const outputGear = train.gears[train.gears.length - 1];
  const viewWidth = Math.max(420, outputGear.x + outputGear.radius + 92);
  const baseRps = reducedMotion ? REDUCED_MOTION_ROTATIONS_PER_SECOND : BASE_ROTATIONS_PER_SECOND;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let frameId = 0;
    let lastNow = performance.now();
    let elapsed = 0;

    function frame(now) {
      const delta = (now - lastNow) / 1000;
      lastNow = now;

      if (!pausedRef.current) {
        elapsed += delta;

        for (const gear of train.gears) {
          const node = gearRefs.current.get(gear.id);
          if (!node) continue;

          const angle = elapsed * baseRps * gear.angularVelocity * gear.rotationDirection * 360;
          node.setAttribute('transform', `rotate(${angle} ${gear.x} ${gear.y})`);
        }
      }

      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(frameId);
  }, [baseRps, train]);

  function setGearRef(id) {
    return (node) => {
      if (node) gearRefs.current.set(id, node);
      else gearRefs.current.delete(id);
    };
  }

  return (
    <div className="edu-illustration gear-simulator" aria-label={`Gear ratio simulator for ${factorA} x ${factorB}`}>
      <button className="gear-pause-button" type="button" onClick={() => setPaused((value) => !value)}>
        {paused ? 'Play' : 'Pause'}
      </button>
      <svg viewBox={`0 0 ${viewWidth} 330`} role="img">
        <defs>
          {train.gears.map((gear) => (
            <marker key={gear.id} id={`arrow-${gear.id}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#0f172a" />
            </marker>
          ))}
          <linearGradient id="gearShade" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0f172a" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <path
          d={`M${driverGear.x} ${driverGear.y} L${outputGear.x} ${outputGear.y}`}
          stroke="#334155"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 8"
          opacity="0.24"
        />
        {train.gears.map((gear) => (
          <GearShape key={gear.id} gear={gear} groupRef={setGearRef(gear.id)} />
        ))}
        {train.gears.map((gear) => (
          <GearLabel key={`${gear.id}-label`} gear={gear} driverGear={driverGear} />
        ))}

        <text x="28" y="36" fontSize="20" fontWeight="900" fill="#0f172a">
          {factorA} x {factorB} gear ratio
        </text>
        <text x="28" y="61" fontSize="13" fontWeight="800" fill="#334155">
          r1 x speed1 = r2 x speed2
        </text>
        {showGearMath && (
          <g transform={`translate(${Math.max(258, viewWidth - 168)} 28)`}>
            <rect x="-12" y="-16" width="150" height="92" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
            <text x="0" y="5" fontSize="12" fontWeight="900" fill="#0f172a">Radius: {formatNumber(outputGear.radius)} px</text>
            <text x="0" y="24" fontSize="12" fontWeight="900" fill="#0f172a">Circ: {formatNumber(outputGear.circumference, 1)} px</text>
            <text x="0" y="43" fontSize="12" fontWeight="900" fill="#0f172a">Teeth: {outputGear.teeth}</text>
            <text x="0" y="62" fontSize="12" fontWeight="900" fill="#0f172a">Speed: {formatNumber(train.ratio.speedMultiplier)}x</text>
          </g>
        )}
      </svg>
    </div>
  );
}
