import { useState } from "react";

type ToastType = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

let listeners: ((toast: ToastType) => void)[] = [];

export function useToast() {
  const toast = (data: ToastType) => {
    listeners.forEach((listener) => listener(data));
  };

  return { toast };
}

export function subscribeToast(fn: (toast: ToastType) => void) {
  listeners.push(fn);
}