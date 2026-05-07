import React, { useEffect, useRef, useState } from 'react';
import { Check, Eraser, Play, RotateCcw } from 'lucide-react';
import { buildStrokePoint, createStrokeSession } from '../engine/strokeCapture.js';
import TracingOverlay from './TracingOverlay.jsx';
import GhostReplay from './GhostReplay.jsx';
import StrokeGuide from './StrokeGuide.jsx';

function drawPaper(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 1;
  const baseline = height * 0.72;
  const midline = height * 0.42;
  ctx.beginPath();
  ctx.moveTo(0, midline);
  ctx.lineTo(width, midline);
  ctx.moveTo(0, baseline);
  ctx.lineTo(width, baseline);
  ctx.stroke();
}

function drawStrokes(ctx, strokes) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 8;
  strokes.forEach((stroke) => {
    if (!stroke.length) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  });
}

export default function HandwritingCanvas({
  target = 'b',
  mode = 'trace-letter',
  title = 'Handwriting practice',
  onSubmit,
  onChange,
}) {
  const traceTarget = String(target).length === 1
    ? target
    : (String(target).match(/[BDbdpq]/)?.[0] || 'b');
  const canvasRef = useRef(null);
  const sessionRef = useRef(createStrokeSession());
  const startedAtRef = useRef(0);
  const [strokes, setStrokes] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawPaper(ctx, canvas.width, canvas.height);
    drawStrokes(ctx, sessionRef.current.strokes);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawPaper(ctx, rect.width, rect.height);
      drawStrokes(ctx, sessionRef.current.strokes);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  function publish(nextStrokes) {
    const cloned = nextStrokes.map((stroke) => stroke.map((point) => ({ ...point })));
    setStrokes(cloned);
    onChange?.(cloned);
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    const bounds = canvas.getBoundingClientRect();
    startedAtRef.current = event.timeStamp || Date.now();
    sessionRef.current.start(buildStrokePoint(event, bounds, startedAtRef.current));
    publish(sessionRef.current.strokes);
    redraw();
  }

  function handlePointerMove(event) {
    const canvas = canvasRef.current;
    if (!canvas || !sessionRef.current.activeStroke) return;
    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    sessionRef.current.append(buildStrokePoint(event, bounds, startedAtRef.current));
    publish(sessionRef.current.strokes);
    redraw();
  }

  function handlePointerUp(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture?.(event.pointerId);
    sessionRef.current.end();
    publish(sessionRef.current.strokes);
    redraw();
  }

  function clear() {
    sessionRef.current.clear();
    publish([]);
    redraw();
  }

  function undo() {
    sessionRef.current.undo();
    publish(sessionRef.current.strokes);
    redraw();
  }

  function replay() {
    setIsReplaying(true);
    window.setTimeout(() => setIsReplaying(false), 1200);
  }

  return (
    <section className="bb-handwriting-panel" data-testid="handwriting-panel">
      <div className="bb-handwriting-heading">
        <div>
          <p>{title}</p>
          <h2>{mode.includes('word') ? `Write ${target}` : `Trace ${target}`}</h2>
        </div>
        <StrokeGuide target={target} mode={mode} />
      </div>

      <div className="bb-handwriting-surface">
        <TracingOverlay target={traceTarget} />
        <canvas
          ref={canvasRef}
          className="bb-handwriting-canvas"
          aria-label={`Handwriting canvas for ${target}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        <GhostReplay target={traceTarget} strokes={strokes} active={isReplaying} />
      </div>

      <div className="bb-handwriting-actions">
        <button type="button" onClick={undo} disabled={!strokes.length}>
          <RotateCcw size={18} /> Undo
        </button>
        <button type="button" onClick={clear} disabled={!strokes.length}>
          <Eraser size={18} /> Clear
        </button>
        <button type="button" onClick={replay} disabled={!strokes.length}>
          <Play size={18} /> Replay
        </button>
        <button type="button" className="is-primary" onClick={() => onSubmit?.(strokes)} disabled={!strokes.length}>
          <Check size={18} /> Check writing
        </button>
      </div>
    </section>
  );
}
