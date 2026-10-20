// ======================================================
// src/utils/toast.ts
// Gestor de eventos global para notificaciones Toast accesibles
// Permite disparar toasts desde interceptores de Axios y servicios.
// ======================================================

import type { ToastMessage } from '../components/ui/Toast'

type ToastListener = (toast: ToastMessage) => void

const listeners = new Set<ToastListener>()

export const toastEvent = {
  show(toast: Omit<ToastMessage, 'id'>) {
    const fullToast: ToastMessage = {
      ...toast,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }
    listeners.forEach((listener) => listener(fullToast))
  },
  subscribe(listener: ToastListener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
