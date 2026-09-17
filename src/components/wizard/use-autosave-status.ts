"use client";

import { useCallback, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("saving");
    try {
      await fn();
      setStatus("saved");
      resetTimer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      throw error;
    }
  }, []);

  return { status, run };
}
