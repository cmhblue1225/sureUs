"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;
const listeners: Set<(state: ToastState) => void> = new Set();
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: "ADD"; toast: Toast } | { type: "REMOVE"; id: string }) {
  if (action.type === "ADD") {
    memoryState = {
      toasts: [...memoryState.toasts, action.toast],
    };

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dispatch({ type: "REMOVE", id: action.toast.id });
    }, 5000);
  } else if (action.type === "REMOVE") {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.id),
    };
  }

  listeners.forEach((listener) => listener(memoryState));
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  // Subscribe to state changes
  useState(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  });

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
    }: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      const id = `toast-${++toastCount}`;
      dispatch({
        type: "ADD",
        toast: { id, title, description, variant },
      });

      // Also log to console for now
      if (variant === "destructive") {
        console.error(`[Toast] ${title}: ${description}`);
      } else {
        console.log(`[Toast] ${title}: ${description}`);
      }

      // Show native alert for now (simple implementation)
      if (typeof window !== "undefined") {
        // Don't block UI - using setTimeout to make it non-blocking
        setTimeout(() => {
          // For a simple implementation, we'll just log.
          // A proper implementation would use a toast UI component.
        }, 0);
      }

      return { id };
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}

// Simple toast function for non-hook usage
export const toast = ({
  title,
  description,
  variant = "default",
}: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) => {
  const id = `toast-${++toastCount}`;
  dispatch({
    type: "ADD",
    toast: { id, title, description, variant },
  });

  if (variant === "destructive") {
    console.error(`[Toast] ${title}: ${description}`);
  } else {
    console.log(`[Toast] ${title}: ${description}`);
  }

  return { id };
};
