# 🤖 Bitácora de Uso de Inteligencia Artificial (AI_LOG.md)
## Trabajo Práctico Nº 2: Lenguaje de Programación Web II (LPW2)

---

## 1. Declaración Formal de Uso de IA

En cumplimiento con la pauta académica de evaluación y las políticas de integridad académica del curso, se deja constancia del uso de herramientas de Inteligencia Artificial Generativa como asistente de programación en pares (*pair programming*) durante el desarrollo y aseguramiento de la calidad del proyecto.

- **Herramientas utilizadas:** Google Antigravity Agentic Coding Assistant.
- **Modelos de lenguaje involucrados:**
  - Gemini 2.5 Pro (Google DeepMind).
  - Claude 3.7 Sonnet (Anthropic).
- **Entorno / Plan:** Antigravity Agentic Workspace.
- **Propósito:** Generación de esqueletos de código, diseño de pruebas unitarias, de integración y end-to-end, verificación de estándares WCAG 2.2 AA, estructuración de esquemas Zod con Módulo 11 y mitigación de vulnerabilidades de seguridad OWASP.
- **Autoría y Responsabilidad Técnica:** Cada línea de código, migración, regla de autorización y caso de prueba generado fue sometido a revisión humana, compilación estricta (`dotnet build`, `tsc -b`, `vite build`) y validación automatizada mediante suites de pruebas (`dotnet test`, Vitest y Playwright).

---

## 2. Registro Cronológico por Fases

### Fase 1: Backend Refinement, Seguridad OWASP y Rate Limiting
- **Objetivo:** Adecuar la API en ASP.NET Core (.NET 10) para el consumo seguro desde un cliente React externo y robustecer los mecanismos de autenticación.
- **Prompts Relevantes del Usuario:**
  > *"Ejecutemos la Fase 1: Crea appsettings.json y appsettings.example.json. Revisa Program.cs para asegurar CORS hacia http://localhost:5173 con credenciales, inyectar cabeceras OWASP (nosniff, DENY, strict-origin) y validar Rate Limiting en /login y /register. Ejecuta dotnet build."*
- **Acciones Ejecutadas:**
  - Configuración de política CORS con orígenes explícitos.
  - Inyección de middleware de cabeceras de seguridad HTTP previas al pipeline.
  - Implementación de `AuthPolicy` (5 solicitudes por minuto en endpoints de autenticación).
  - Verificación de compilación sin errores con `dotnet build`.

---

### Fase 2: Arquitectura Frontend y Capa de Consumo HTTP
- **Objetivo:** Inicializar la SPA en React 19 + TypeScript + Vite, estructurar la arquitectura modular y configurar el cliente HTTP centralizado con manejo de interceptores JWT.
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 2: Arquitectura del Frontend y Capa de Consumo HTTP. Crea veterinaria-client con Vite react-ts, instala axios, react-router-dom, react-query, react-hook-form, zod, lucide-react y Tailwind CSS. Configura variables de entorno (.env). Modela los contratos en src/types/. Implementa el cliente Axios en src/api/client.ts con interceptor Bearer y redirección en 401. Implementa clienteService y pacienteService. Ejecuta npm run build."*
- **Acciones Ejecutadas:**
  - Creación del proyecto `veterinaria-client` con Tailwind CSS v4.
  - Modelado estricto de interfaces TypeScript sincronizadas con el esquema de base de datos (`Cliente`, `Paciente`, `UsuarioAuth`, `ApiValidationError`).
  - Creación del cliente Axios centralizado con decodificación de tokens y redirección segura ante 401 Unauthorized.
  - Verificación de compilación exitosa con `npm run build`.

---

### Fase 3: CRUD Completo con TanStack Query, Zod y Accesibilidad WCAG 2.2 AA
- **Objetivo:** Implementar formularios y vistas reactivas, cumpliendo con la pauta de accesibilidad universal, contraste de colores y diseño mobile-first.
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 3: CRUD Completo con TanStack Query, Formularios con React Hook Form + Zod y Accesibilidad WCAG 2.2 AA. Crea esquemas Zod respetando la BD y DTOs C#. Envuélvelo con QueryClientProvider. Crea ConfirmDialog accesible con focus trap y escape, InputField con aria-describedby y aria-invalid, target mínimo de 44x44px. Vistas mobile-first con tarjetas en móvil y tabla en escritorio. Manejo de 4 estados. Control de roles. Ejecuta npm run build."*
- **Acciones Ejecutadas:**
  - Creación de esquemas Zod validados en cliente (`clienteSchema.ts`, `pacienteSchema.ts`).
  - Implementación de `InputField.tsx` asociando `htmlFor`, `id`, `aria-describedby` y `role="alert"`.
  - Implementación de `ConfirmDialog.tsx` con trampa de foco nativa, cierre por tecla `Escape` y accesibilidad ARIA.
  - Soporte responsivo desde 320 px a desktop y áreas de toque mínimas de 44x44 px.

---

### Fase 4: Pruebas Automatizadas Iniciales
- **Objetivo:** Garantizar la calidad, reproducibilidad y estabilidad del software en ambos extremos.
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 4: Pruebas Automatizadas. Instala vitest, @testing-library/react, @testing-library/jest-dom, jsdom, msw y @playwright/test. Implementa handlers MSW para login, clientes y pacientes. Crea Login.test.tsx, ProtectedRoute.test.tsx y ClientesCrud.test.tsx. Configura Playwright y crea flow.spec.ts. Ejecuta dotnet test y npm run test."*
- **Acciones Ejecutadas:**
  - Configuración del servidor Mock Service Worker (MSW v3) y configuración de Vitest con entorno `jsdom`.
  - Elaboración de 9 pruebas de componentes validando lógica de inicio de sesión, denegación 403 y CRUD.
  - Creación de suite inicial de pruebas E2E con Playwright.

---

### Fase 5: Precarga y Optimización de Consultas en Navegación
- **Objetivo:** Optimizar los tiempos de respuesta al interactuar con el menú lateral y las vistas principales.
- **Prompts Relevantes del Usuario:**
  > *"Optimiza el tiempo de respuesta y la activación de peticiones HTTP al hacer clic en los botones laterales de Clientes y Pacientes en veterinaria-client: En useClientes.ts y usePacientes.ts ajusta staleTime para forzar la revalidación instantánea. En Sidebar / Navbar agrega precarga onMouseEnter u onFocus en los enlaces para precargar la consulta queryClient.prefetchQuery antes de que el usuario haga clic. Compila el proyecto con npm run build."*
- **Acciones Ejecutadas:**
  - Ajuste de `staleTime` y configuración de revalidación inmediata al montar vistas.
  - Incorporación de callbacks `prefetchClientes` y `prefetchPacientes` en eventos `onMouseEnter`, `onFocus` y `onPointerDown` en la barra de navegación.

---

### Fase 6: Control Global de Restricciones de Clave Foránea (FK Constraints)
- **Objetivo:** Evitar que eliminaciones fallidas provoquen respuestas 500 con trazas SQL internas.
- **Prompts Relevantes del Usuario:**
  > *"Implementa un control global y preventivo de Restricciones de Clave Foránea para evitar el error 500 Internal Server Error al eliminar registros en cualquier tabla del sistema: En el middleware de excepciones captura SqlException o DbUpdateException (código 547) y retorna HTTP 409 Conflict con mensaje amigable. En el interceptor global de Axios muestra una notificación clara."*
- **Acciones Ejecutadas:**
  - Intercepción específica de violaciones de clave foránea en `GlobalExceptionMiddleware.cs`, retornando HTTP 409 Conflict con mensaje comprensible.
  - Manejo en el interceptor de Axios para notificar al usuario de forma no intrusiva mediante mensajes de conflicto.

---

### Fase 7: Restricción Estricta de Usuarios y Reorganización de Rutas Administrativas
- **Objetivo:** Proteger la administración de cuentas y personal del centro veterinario.
- **Prompts Relevantes del Usuario:**
  > *"Restringe los endpoints de gestión de usuarios (/api/v1/usuarios) para exigir explícitamente el rol de Administrador. Separa el módulo de Administración en páginas individuales: Personal y Usuarios (/admin/usuarios) y Catálogo Clínico (/admin/catalogo). Aplica validación estricta de RUT chileno con algoritmo Módulo 11."*
- **Acciones Ejecutadas:**
  - Protección de endpoints de usuarios con `.RequireRole("Administrador")`.
  - Desacoplamiento de rutas administrativas en `AdminUsuariosPage` y `AdminCatalogoPage`.
  - Implementación de la utilidad `rut.ts` con validación de dígito verificador bajo algoritmo Módulo 11 y formateo estándar.

---

### Fase 8: Refuerzo de Seguridad, Desacoplamiento de Secretos y Verificación en Vivo
- **Objetivo:** Cumplir con los estándares de seguridad requeridos por la rúbrica del Trabajo 2, eliminando contraseñas fijas, aislando claves de pruebas y preparando la demostración en vivo.
- **Prompts Relevantes del Usuario:**
  > *"Actúa como revisor técnico y desarrollador del proyecto VetCareAPI. Revisa el estado actual del repositorio y completa lo necesario para cumplir la rúbrica del Trabajo 2. Elimina llaves JWT, cadenas de conexión y contraseñas fijas de los archivos versionados. Crea .env.example para el backend y documenta User Secrets. Mantén el sembrado limitado a Development y desactivado por defecto sin sobrescribir contraseñas existentes. Configura contraseñas demo localmente. Alinea credenciales del README con la API real. Cambia lang='en' a lang='es'. Revisa permisos por rol en backend y frontend para citas y facturas. Revisa CORS, cabeceras y errores. Configura HSTS. Actualiza README, INFORME_TECNICO y AI_LOG. Ejecuta dotnet test, npm run test, npm run build y npm run test:e2e. Corrige fallos. Ejecuta npm audit y comprueba accesibilidad con axe."*
- **Acciones Ejecutadas:**
  - Creación de `VeterinariaAPI/.env.example` y actualización de `appsettings.example.json` con marcadores seguros.
  - Desacoplamiento de claves en `VeterinariaAPI.Tests/ApiIntegrationTests.cs`, utilizando una clave JWT de prueba aislada e inyectada en memoria en el fixture de xUnit.
  - Ampliación de la suite xUnit de 7 a 12 pruebas de integración (cubriendo acceso sin token, 403 por rol insuficiente, CORS ante orígenes no permitidos y presencia de cabeceras OWASP con `Permissions-Policy`).
  - Configuración de contraseñas de cuentas demo parametrizadas localmente en `DbSeeder.cs`, garantizando que nunca se sobrescriban cuentas existentes en la base de datos.
  - Corrección de inconsistencias de roles en `ClientesApi` (permitiendo edición a Veterinario) y `DetalleFacturasApi` (permitiendo creación y edición a Recepcionista para emitir boletas con detalle).
  - Corrección del atributo de idioma a `<html lang="es">` en `index.html`.
  - Actualización de `playwright.config.ts` hacia Chromium y Mobile Chrome (`Pixel 5`), eliminando dependencia de WebKit no instalado.
  - Implementación de `a11y.spec.ts` con `@axe-core/playwright`, validando 0 violaciones graves de accesibilidad WCAG 2.2 AA.
  - Corrección del contraste de color en `LoginPage.tsx` para superar el umbral WCAG AA 4.5:1 exigido por Axe.

---

## 3. Decisiones Técnicas y Adaptación Crítica de Sugerencias de IA

Durante la interacción con las herramientas de IA se aplicó criterio técnico y análisis crítico sobre las propuestas generadas:

| Sugerencia Inicial de la IA | Problema o Limitación Detectada | Decisión Técnica Aplicada y Justificación |
| :--- | :--- | :--- |
| **Almacenamiento de JWT en Cookie `HttpOnly` vía Frontend** | La IA sugirió configurar cookies `HttpOnly` mediante código JavaScript del cliente. | **Rechazada y adaptada:** JavaScript no puede crear ni manipular cookies marcadas como `HttpOnly` por restricciones de los navegadores. Se implementó almacenamiento en cliente con interceptor Axios Bearer y purga defensiva automática ante cualquier respuesta HTTP 401. |
| **Uso de contraseñas fijas demo en `AuthService.cs`** | La IA incluyó un bloque de validación rápida con cadenas `"123456"` y `"Admin123!"` en texto plano. | **Rechazada y eliminada:** Rompe el principio de verificación criptográfica. Se eliminó el bloque completo; la verificación depende exclusivamente del hash BCrypt almacenado en la base de datos. |
| **Sobrescribir contraseñas en cada inicio mediante `DbSeeder.cs`** | La IA configuró el sembrador para resetear contraseñas de usuarios existentes a `"123456"`. | **Rechazada y corregida:** Se eliminó la sobrescritura. El sembrador solo crea usuarios iniciales si la tabla está vacía y permite configurar las contraseñas iniciales localmente vía variables de entorno. |
| **Reutilización de la clave JWT local en las pruebas xUnit** | La IA generó tokens de prueba en `ApiIntegrationTests.cs` utilizando la clave del archivo `appsettings.json`. | **Rechazada y adaptada:** Las pruebas unitarias e integración no deben depender de secretos del entorno ni exponerlos en el repositorio. Se configuró un fixture que inyecta una clave de prueba exclusiva en memoria. |
| **Uso del navegador WebKit en Playwright** | La IA incluyó `devices['iPhone 12']` (WebKit) en `playwright.config.ts`, fallando la ejecución por ausencia de binarios de WebKit en el sistema. | **Corregida:** Se configuró `devices['Pixel 5']` con motor Chromium, permitiendo ejecutar pruebas responsivas móviles completas utilizando los binarios ya instalados. |
| **Aceptación acrítica de actualización destructiva de Zod en `npm audit`** | La herramienta `npm audit` recomendaba forzar la actualización a Zod v4 para mitigar una vulnerabilidad en colecciones anidadas ilimitadas. | **Evaluada y mantenida con justificación:** La actualización forzada genera rotura con `@hookform/resolvers/zod`. Se constató que los esquemas de la aplicación validan tipos escalares estrictos con longitudes máximas acotadas, mitigando el riesgo de denegación de servicio por memoria sin introducir regresiones de compilación. |

---

## 4. Conclusiones sobre la Asistencia de IA

El uso estructurado de Inteligencia Artificial como asistente de pair programming permitió:
1. Reducir significativamente el tiempo de desarrollo de infraestructura base en ASP.NET Core y React.
2. Identificar y aplicar estándares de accesibilidad WCAG 2.2 AA (trampas de foco, contraste de colores y atributos ARIA sincronizados).
3. Robustecer la cobertura de pruebas automatizadas alcanzando 12 pruebas de integración en backend, 9 pruebas unitarias en frontend y suites completas de verificación E2E y accesibilidad con Playwright y Axe.
