"use client";

import { useState, useEffect } from "react";
import type { HistoryItem } from "@/lib/vlsm/types";

const HISTORY_KEY = "vlsm-history";
const MAX_HISTORY_ITEMS = 10;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // save history to localStorage on change
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addHistoryItem = (item: HistoryItem) => {
    setHistory((prev) => [item, ...prev.slice(0, MAX_HISTORY_ITEMS - 1)]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addHistoryItem,
    deleteHistoryItem,
    clearHistory,
  };
};
