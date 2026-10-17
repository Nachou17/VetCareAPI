// ======================================================
// src/utils/token.ts
// Gestión del JWT en sessionStorage (con riesgos documentados).
// Estrategia elegida: sessionStorage
//   Ventajas: no persiste entre pestañas/reinicios, menos
//   superficie de ataque que localStorage.
//   Riesgos documentados: accesible desde JS en la misma
//   página; mitigado mediante Content-Security-Policy (CSP)
//   estricta para bloquear scripts inline y externos no
//   autorizados. Ver matriz de riesgos OWASP en AI_LOG.md.
// ======================================================

const TOKEN_KEY = 'vet_jwt'

export const tokenStorage = {
  get(): string | null {
    return sessionStorage.getItem(TOKEN_KEY)
  },

  set(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token)
  },

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY)
  },
}
