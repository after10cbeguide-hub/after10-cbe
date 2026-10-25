'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, RotateCcw, ZoomIn, ZoomOut, Move, Navigation } from 'lucide-react';

const GRID_SIZE = 200; // 200x200 = 40,000 PIXELS
const PIXEL_SIZE = 18; // Size of each box in pixels
const CANVAS_DIM = GRID_SIZE * PIXEL_SIZE; // 3600px x 3600px

const PALETTE = [
  '#ffffff', // White (Eraser)
  '#000000', // Black
  '#22c55e', // Green
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#eab308', // Yellow
  '#ef4444', // Red
  '#f97316', // Orange
];

export default function GhostPixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pixels, setPixels] = useState<{ [key: string]: string }>({});
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[1]);
  const [scale, setScale] = useState<number>(1.0);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Pan / Drag state
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('after10_pixel_grid_white');
    if (saved) {
      try {
        setPixels(JSON.parse(saved));
      } catch {
        setPixels({});
      }
    }

    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollLeft = (CANVAS_DIM - container.clientWidth) / 2;
      container.scrollTop = (CANVAS_DIM - container.clientHeight) / 2;
    }
  }, []);

  // Redraw colored pixel blocks (canvas handles colors, CSS handles permanent grid lines)
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear transparent so the CSS white background + grid shows through
    ctx.clearRect(0, 0, CANVAS_DIM, CANVAS_DIM);

    // Paint only filled pixels
    Object.entries(pixels).forEach(([key, color]) => {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    });
  }, [pixels]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Click to paint a pixel
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    const gridX = Math.floor(clickX / PIXEL_SIZE);
    const gridY = Math.floor(clickY / PIXEL_SIZE);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      const key = `${gridX},${gridY}`;
      let newPixels = { ...pixels };

      if (selectedColor === '#ffffff') {
        delete newPixels[key];
      } else {
        newPixels[key] = selectedColor;
      }

      setPixels(newPixels);
      localStorage.setItem('after10_pixel_grid_white', JSON.stringify(newPixels));
    }
  };

  // Hover coordinate indicator
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    const gridX = Math.floor(clickX / PIXEL_SIZE);
    const gridY = Math.floor(clickY / PIXEL_SIZE);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      setHoverCoord({ x: gridX, y: gridY });
    }
  };

  // Mouse pan / drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
      if (containerRef.current) {
        setScrollPos({
          left: containerRef.current.scrollLeft,
          top: containerRef.current.scrollTop,
        });
      }
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !containerRef.current) return;
    const dx = e.clientX - startPan.x;
    const dy = e.clientY - startPan.y;
    containerRef.current.scrollLeft = scrollPos.left - dx;
    containerRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleClear = () => {
    if (confirm('Clear your local canvas?')) {
      setPixels({});
      localStorage.removeItem('after10_pixel_grid_white');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden select-none">
      {/* Top HUD Bar */}
      <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-300 font-mono">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>200×200 Grid (40,000 px)</span>
          </div>

          {hoverCoord && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              <Navigation className="w-3 h-3" />
              <span>X:{hoverCoord.x} Y:{hoverCoord.y}</span>
            </div>
          )}
        </div>

        {/* Zoom & Wipe Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.2).toFixed(2))))}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg active:scale-95 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(2))))}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg active:scale-95 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 bg-zinc-800/70 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded-lg ml-1"
            title="Wipe Board"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide Bar */}
      <div className="bg-zinc-900/60 px-3 py-1 border-b border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-purple-400" /> Scroll or drag to move around
        </span>
        <span className="font-mono text-zinc-300">Click any box to fill</span>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 overflow-auto p-6 cursor-crosshair bg-zinc-900/50"
      >
        <div
          style={{
            width: `${CANVAS_DIM * scale}px`,
            height: `${CANVAS_DIM * scale}px`,
          }}
          className="relative mx-auto my-auto border-2 border-zinc-500 shadow-2xl rounded-lg overflow-hidden bg-white"
        >
          {/* Permanent CSS Grid: NEVER blurs, NEVER disappears, 100% sharp box borders */}
          <div
            style={{
              width: `${CANVAS_DIM}px`,
              height: `${CANVAS_DIM}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              backgroundImage: `
                linear-gradient(to right, #71717a 1px, transparent 1px),
                linear-gradient(to bottom, #71717a 1px, transparent 1px)
              `,
              backgroundSize: `${PIXEL_SIZE}px ${PIXEL_SIZE}px`,
              backgroundColor: '#ffffff',
            }}
            className="relative"
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_DIM}
              height={CANVAS_DIM}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              className="absolute inset-0 block"
            />
          </div>
        </div>
      </div>

      {/* Color Palette Footer */}
      <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            style={{ backgroundColor: c }}
            className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90 shrink-0 ${
              selectedColor === c
                ? 'border-purple-400 scale-110 shadow-lg shadow-purple-500/30'
                : 'border-zinc-700 opacity-80 hover:opacity-100'
            }`}
            title={c === '#ffffff' ? 'White / Eraser' : c}
          />
        ))}
      </div>
    </div>
  );
}