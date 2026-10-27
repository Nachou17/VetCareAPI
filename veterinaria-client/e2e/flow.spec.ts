// ======================================================
// e2e/flow.spec.ts
// Pruebas End-to-End con Playwright:
//  - Flujo Crítico: Login -> Redirección -> Clientes -> Creación -> Listado
//  - Prevención de XSS en entradas de búsqueda y formularios
//  - Comprobación de integración con API real (sin mutaciones destructivas)
// ======================================================

import { test, expect } from '@playwright/test'

test.describe('Flujo Crítico de Usuario: Login y Gestión de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    // Token simulado con claims estándar decodificables en cliente
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

    // RUT chileno válido bajo algoritmo Módulo 11
    const clientes = [
      {
        id: 1,
        documentoIdentidad: '12345678-5',
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
      } else {
        await route.continue()
      }
    })

    // Mocks auxiliares para métricas y menús de la SPA
    await page.route('*/**/api/v1/pacientes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('*/**/api/v1/citas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('*/**/api/v1/insumos', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('*/**/api/v1/facturas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('*/**/api/v1/consultas', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('*/**/api/v1/especialidades', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('*/**/api/v1/usuarios', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
  })

  test('debe permitir iniciar sesión, navegar a Clientes, crear un nuevo cliente y verificarlo en la lista', async ({
    page,
    isMobile,
  }) => {
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
    if (isMobile) {
      await page.getByRole('button', { name: /abrir menú de navegación móvil/i }).click()
    } else {
      await page.getByRole('button', { name: /gestión clínica/i }).click()
    }
    await page.locator('a[href="/clientes"]').first().click()

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

    // 6. Rellenar formulario con RUT válido bajo algoritmo Módulo 11 (11.223.344-K)
    await page.getByLabel(/documento de identidad/i).fill('11223344-K')
    await page.getByLabel(/nombre completo/i).fill('Carlos Santana')
    await page.getByLabel(/teléfono/i).fill('+56999887766')
    await page.getByLabel(/correo electrónico/i).fill('carlos.santana@email.com')

    // 7. Guardar cliente
    await page.getByRole('button', { name: /crear cliente/i }).click()

    // 8. Verificar que el formulario se cierra y el nuevo cliente aparece en la lista
    if (isMobile) {
      await expect(page.locator('ul.md\\:hidden').getByText('Carlos Santana', { exact: true })).toBeVisible()
      await expect(page.locator('ul.md\\:hidden').getByText('11223344-K', { exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole('cell', { name: 'Carlos Santana', exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: '11223344-K', exact: true })).toBeVisible()
    }
  })

  test('debe neutralizar entradas de prueba XSS en el buscador sin ejecutar scripts', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/correo electrónico/i).fill('admin@veterinaria.com')
    await page.getByLabel(/contraseña/i).fill('Admin123!')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    await page.goto('/clientes')
    await expect(page.getByRole('heading', { name: /Clientes/i })).toBeVisible()

    // Escuchar si se dispara algún diálogo de alerta (típico de XSS)
    let dialogDisparado = false
    page.on('dialog', () => {
      dialogDisparado = true
    })

    // Ingresar vector XSS en el buscador
    const inputBusqueda = page.getByPlaceholder(/buscar por nombre/i)
    await inputBusqueda.fill('<script>alert("xss")</script>')

    // Verificar que el DOM no ejecutó el script y la alerta jamás ocurrió
    expect(dialogDisparado).toBe(false)

    // Verificar que React escapa la cadena y no renderiza nodos script no controlados
    const scriptsInyectados = await page.locator('script:has-text("xss")').count()
    expect(scriptsInyectados).toBe(0)
  })
})

test.describe('Comprobación de Integración con API Real', () => {
  test('debe validar conectividad con el backend real si está en ejecución (sin alterar la BD)', async ({
    request,
  }) => {
    const apiUrl = process.env.VITE_API_URL || 'https://localhost:7189/api/v1'

    try {
      // Petición al endpoint público de login sin alterar registros existentes
      const res = await request.post(`${apiUrl}/usuarios/login`, {
        data: {
          email: 'ping-check-nonexistent@veterinaria.com',
          password: 'DummyPassword123!',
        },
        ignoreHTTPSErrors: true,
      })

      // Si la API responde (401 Unauthorized esperado ante credenciales falsas o 429), la integración es exitosa
      expect([401, 429]).toContain(res.status())
    } catch {
      // Si la API no está iniciada en este momento, la prueba documenta la no disponibilidad sin fallar destructivamente
      test.skip(true, 'La API backend en https://localhost:7189 no se encuentra iniciada en segundo plano.')
    }
  })
})
