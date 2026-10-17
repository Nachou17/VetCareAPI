// ======================================================
// e2e/flow.spec.ts
// Prueba End-to-End: Flujo crítico Login -> Clientes -> Crear -> Listar
// ======================================================

import { test, expect } from '@playwright/test'

test.describe('Flujo Crítico de Usuario: Login y Gestión de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepción de API para ejecución reproducible y determinista
    const mockToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(
        JSON.stringify({
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 1,
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Administrador General',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'admin@veterinaria.com',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Administrador',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64') +
      '.mock-signature'

    const clientes = [
      {
        id: 1,
        documentoIdentidad: '12345678-9',
        nombreCompleto: 'Juan Pérez',
        telefono: '+56912345678',
        email: 'juan.perez@email.com',
      },
    ]

    // Mock Login
    await page.route('*/**/api/v1/usuarios/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: mockToken }),
      })
    })

    // Mock Clientes GET & POST
    await page.route('*/**/api/v1/clientes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clientes),
        })
      } else if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON()
        const nuevo = { id: 2, ...payload }
        clientes.push(nuevo)
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(nuevo),
        })
      }
    })
  })

  test('debe permitir iniciar sesión, navegar a Clientes, crear un nuevo cliente y verificarlo en la lista', async ({ page, isMobile }) => {
    // 1. Navegar a /login
    await page.goto('/login')
    await expect(page).toHaveTitle(/VetCare/i)
    await expect(page.getByRole('heading', { name: /VetCare/i })).toBeVisible()

    // 2. Ingresar credenciales y enviar formulario
    await page.getByLabel(/correo electrónico/i).fill('admin@veterinaria.com')
    await page.getByLabel(/contraseña/i).fill('Admin123!')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()

    // 3. Redirección exitosa al Dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByRole('heading', { name: /Bienvenido, Administrador General/i })).toBeVisible()

    // 4. Navegar a la sección de Clientes desde el menú principal
    await page.getByRole('link', { name: /clientes/i }).click()
    await expect(page).toHaveURL(/.*clientes/)
    await expect(page.getByRole('heading', { name: /Clientes/i })).toBeVisible()

    // Verificar cliente inicial
    if (isMobile) {
      await expect(page.locator('ul.md\\:hidden').getByText('Juan Pérez', { exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole('cell', { name: 'Juan Pérez', exact: true })).toBeVisible()
    }

    // 5. Abrir formulario de nuevo cliente
    await page.getByRole('button', { name: /nuevo cliente/i }).click()
    await expect(page.getByRole('heading', { name: /Nuevo Cliente/i })).toBeVisible()

    // 6. Rellenar formulario validado
    await page.getByLabel(/documento de identidad/i).fill('11223344-5')
    await page.getByLabel(/nombre completo/i).fill('Carlos Santana')
    await page.getByLabel(/teléfono/i).fill('+56999887766')
    await page.getByLabel(/correo electrónico/i).fill('carlos.santana@email.com')

    // 7. Guardar cliente
    await page.getByRole('button', { name: /crear cliente/i }).click()

    // 8. Verificar que el formulario se cierra y el nuevo cliente aparece en la lista
    if (isMobile) {
      await expect(page.locator('ul.md\\:hidden').getByText('Carlos Santana', { exact: true })).toBeVisible()
      await expect(page.locator('ul.md\\:hidden').getByText('11223344-5', { exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole('cell', { name: 'Carlos Santana', exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: '11223344-5', exact: true })).toBeVisible()
    }
  })
})
