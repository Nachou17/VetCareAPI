// ======================================================
// e2e/a11y.spec.ts
// Verificación Automatizada de Accesibilidad WCAG 2.2 AA
// Utiliza AxeBuilder (@axe-core/playwright)
// ======================================================

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accesibilidad Universal WCAG 2.2 Nivel AA (Axe)', () => {
  test('la página de inicio de sesión (/login) no debe tener violaciones críticas de accesibilidad', async ({
    page,
  }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /VetCare/i })).toBeVisible()

    // Ejecución de análisis Axe restringido a reglas WCAG 2.2 AA
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    // Filtrar violaciones graves o críticas
    const violacionesGraves = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )

    expect(violacionesGraves).toEqual([])
  })

  test('los campos del formulario de login deben tener etiquetas accesibles y foco visible', async ({
    page,
  }) => {
    await page.goto('/login')

    const inputEmail = page.getByLabel(/correo electrónico/i)
    const inputPassword = page.getByLabel(/contraseña/i)
    const submitBtn = page.getByRole('button', { name: /iniciar sesión/i })

    await expect(inputEmail).toBeVisible()
    await expect(inputPassword).toBeVisible()
    await expect(submitBtn).toBeVisible()

    // Comprobación de navegación por teclado y foco visible
    await inputEmail.focus()
    await expect(inputEmail).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(inputPassword).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(submitBtn).toBeFocused()
  })
})
