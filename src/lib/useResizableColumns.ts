"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface ColumnDef {
  key: string;
  label: string;
  defaultWidth: number; // px
  minWidth?: number;
}

interface ColumnState {
  key: string;
  width: number;
  order: number;
}

function loadFromStorage(storageKey: string, defaults: ColumnDef[]): ColumnState[] {
  if (typeof window === "undefined") {
    return defaults.map((c, i) => ({ key: c.key, width: c.defaultWidth, order: i }));
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error("no data");
    const parsed: ColumnState[] = JSON.parse(raw);
    // Merge: garante que todas as colunas existam (caso novas colunas sejam adicionadas)
    const result: ColumnState[] = defaults.map((def, i) => {
      const saved = parsed.find((p) => p.key === def.key);
      return saved ?? { key: def.key, width: def.defaultWidth, order: i };
    });
    return result.sort((a, b) => a.order - b.order);
  } catch {
    return defaults.map((c, i) => ({ key: c.key, width: c.defaultWidth, order: i }));
  }
}

function saveToStorage(storageKey: string, cols: ColumnState[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cols));
  } catch {
    // ignore
  }
}

export function useResizableColumns(storageKey: string, defaults: ColumnDef[]) {
  const [columns, setColumns] = useState<ColumnState[]>(() =>
    loadFromStorage(storageKey, defaults)
  );

  // Persist whenever columns change
  useEffect(() => {
    saveToStorage(storageKey, columns);
  }, [storageKey, columns]);

  // ── Resize ──────────────────────────────────────────────────────────────────
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const startResize = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns.find((c) => c.key === key);
      if (!col) return;
      resizingRef.current = { key, startX: e.clientX, startWidth: col.width };

      const def = defaults.find((d) => d.key === key);
      const minW = def?.minWidth ?? 60;

      const onMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = ev.clientX - resizingRef.current.startX;
        const newWidth = Math.max(minW, resizingRef.current.startWidth + delta);
        setColumns((prev) =>
          prev.map((c) => (c.key === key ? { ...c, width: newWidth } : c))
        );
      };

      const onUp = () => {
        resizingRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [columns, defaults]
  );

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────
  const dragSrcRef = useRef<string | null>(null);

  const onDragStart = useCallback((key: string, e: React.DragEvent) => {
    dragSrcRef.current = key;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (targetKey: string, e: React.DragEvent) => {
      e.preventDefault();
      const srcKey = dragSrcRef.current;
      if (!srcKey || srcKey === targetKey) return;

      setColumns((prev) => {
        const ordered = [...prev].sort((a, b) => a.order - b.order);
        const srcIdx = ordered.findIndex((c) => c.key === srcKey);
        const tgtIdx = ordered.findIndex((c) => c.key === targetKey);
        if (srcIdx === -1 || tgtIdx === -1) return prev;
        const moved = ordered.splice(srcIdx, 1)[0];
        ordered.splice(tgtIdx, 0, moved);
        return ordered.map((c, i) => ({ ...c, order: i }));
      });

      dragSrcRef.current = null;
    },
    []
  );

  const onDragEnd = useCallback(() => {
    dragSrcRef.current = null;
  }, []);

  // Ordered columns (sorted by order field) — merged with ColumnDef for label/minWidth access
  const orderedColumns = [...columns]
    .sort((a, b) => a.order - b.order)
    .map((col) => {
      const def = defaults.find((d) => d.key === col.key)!;
      return { ...col, label: def.label, minWidth: def.minWidth };
    });

  return {
    orderedColumns,
    startResize,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  };
}
