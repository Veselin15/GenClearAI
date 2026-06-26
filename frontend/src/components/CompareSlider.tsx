"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface CompareSliderProps {
  before: ReactNode;
  after: ReactNode;
  aspectRatio?: string;
  className?: string;
  defaultPosition?: number;
  min?: number;
  max?: number;
  labels?: { before: string; after: string };
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  caption?: ReactNode;
  onPositionChange?: (position: number) => void;
}

export function CompareSlider({
  before,
  after,
  aspectRatio = "16 / 9",
  className = "",
  defaultPosition = 50,
  min = 4,
  max = 96,
  labels,
  loading = false,
  loadingLabel = "Loading preview…",
  disabled = false,
  caption,
  onPositionChange,
}: CompareSliderProps) {
  const [pos, setPos] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const updatePosition = useCallback(
    (next: number) => {
      const clamped = Math.max(min, Math.min(max, Math.round(next)));
      setPos(clamped);
      onPositionChange?.(clamped);
      setHint(false);
    },
    [max, min, onPositionChange],
  );

  const positionFromClientX = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return pos;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return ratio * 100;
    },
    [pos],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || loading) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      updatePosition(positionFromClientX(e.clientX));
    },
    [disabled, loading, positionFromClientX, updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || disabled || loading) return;
      updatePosition(positionFromClientX(e.clientX));
    },
    [dragging, disabled, loading, positionFromClientX, updatePosition],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled || loading) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updatePosition(pos - 2);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        updatePosition(pos + 2);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, loading, pos, updatePosition]);

  const style = {
    "--pos": `${pos}%`,
    "--aspect": aspectRatio,
  } as CSSProperties;

  return (
    <div className={`compare-wrap ${className}`.trim()}>
      <div
        ref={containerRef}
        className={`compare${dragging ? " compare-dragging" : ""}${disabled ? " compare-disabled" : ""}`}
        style={style}
        role="group"
        aria-labelledby={labels ? labelId : undefined}
        aria-label={labels ? undefined : "Before and after comparison"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {loading && (
          <div className="compare-loading">
            <div className="spinner" />
            <span className="muted">{loadingLabel}</span>
          </div>
        )}

        <div className="compare-layer compare-before" aria-hidden>
          {before}
        </div>
        <div className="compare-layer compare-after" aria-hidden>
          {after}
        </div>

        <div className="compare-divider" aria-hidden />
        <div className="compare-handle" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M6.5 4.5L3 9l3.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.5 4.5L15 9l-3.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {labels && (
          <>
            <span
              id={labelId}
              className={`cmp-label l${pos < 18 ? " cmp-label-hidden" : ""}`}
            >
              {labels.before}
            </span>
            <span className={`cmp-label r${pos > 82 ? " cmp-label-hidden" : ""}`}>
              {labels.after}
            </span>
          </>
        )}

        {hint && !loading && !disabled && (
          <div className="compare-hint" aria-hidden>
            Drag to compare
          </div>
        )}

        <input
          type="range"
          className="compare-range"
          min={min}
          max={max}
          value={pos}
          disabled={disabled || loading}
          aria-label="Comparison slider position"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={pos}
          onChange={(e) => updatePosition(Number(e.target.value))}
        />
      </div>
      {caption}
    </div>
  );
}
