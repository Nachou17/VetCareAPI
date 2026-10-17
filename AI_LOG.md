# 🤖 Bitácora de Uso de Inteligencia Artificial (AI_LOG.md)
## Trabajo Práctico Nº 2 — Lenguaje de Programación Web II (LPW2)

---

## 1. Declaración Formal de Uso de IA

En cumplimiento estricto con la pauta académica de evaluación y las políticas de integridad académica del curso, se deja constancia del uso de herramientas de Inteligencia Artificial Generativa y asistencia de código como **asistente de pair programming** durante el ciclo de vida del proyecto.

- **Herramientas utilizadas:** Google Antigravity Agentic IDE.
- **Modelos de lenguaje involucrados:** 
  - `Claude 3.7 Sonnet` (Anthropic / Claude Engine).
  - `Gemini 2.5 Pro` (Google DeepMind).
- **Entorno / Plan:** Antigravity Advanced Agentic Coding Workspace (Plan Pro / Academic Tier).
- **Propósito:** Generación de esqueletos de código, diseño de pruebas unitarias y de integración, verificación de estándares WCAG 2.2 AA, estructuración de esquemas Zod y mitigación de vulnerabilidades OWASP.
- **Autoría y Responsabilidad Técnica:** Cada línea de código, configuración de seguridad, migración y caso de prueba generado fue sometido a revisión humana, compilación estricta (`dotnet build`, `tsc -b`, `vite build`) y validación automatizada mediante suites de pruebas (`dotnet test`, Vitest y Playwright).

---

## 2. Registro Cronológico por Fases

### Fase 1: Backend Refinement, Seguridad OWASP y Rate Limiting
- **Objetivo:** Adecuar la API existente en ASP.NET Core (.NET 10) para el consumo seguro desde un cliente React externo y robustecer los mecanismos de autenticación y autorización.
- **Prompts Relevantes del Usuario:**
  > *"Ahora, ejecutemos la Fase 1 del desarrollo: Crea appsettings.json y appsettings.example.json. Revisa Program.cs para asegurar CORS hacia http://localhost:5173 con credenciales, inyectar cabeceras OWASP (nosniff, DENY, strict-origin) y validar Rate Limiting en /login y /register. Ejecuta dotnet build."*
- **Acciones Ejecutadas por el Asistente:**
  - Configuración de `WithOrigins("http://localhost:5173").AllowCredentials().AllowAnyHeader().AllowAnyMethod()`.
  - Inyección de middleware de cabeceras de seguridad HTTP previas al pipeline.
  - Verificación de la política `AuthPolicy` (5 solicitudes por minuto en endpoints de autenticación).
  - Verificación de compilación sin errores con `dotnet build`.

---

### Fase 2: Arquitectura Frontend y Capa de Consumo HTTP
- **Objetivo:** Inicializar la SPA en React 19 + TypeScript + Vite, estructurar la arquitectura modular y configurar el cliente HTTP centralizado con manejo de interceptores JWT.
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 2: Arquitectura del Frontend y Capa de Consumo HTTP. Crea veterinaria-client con Vite react-ts, instala axios, react-router-dom, react-query, react-hook-form, zod, lucide-react y Tailwind CSS. Configura variables de entorno (.env). Modela los contratos en src/types/. Implementa el cliente Axios en src/api/client.ts con interceptor Bearer y redirección en 401. Implementa clienteService y pacienteService. Ejecuta npm run build."*
- **Acciones Ejecutadas por el Asistente:**
  - Creación del proyecto `veterinaria-client` con Tailwind CSS v4.
  - Modelado estricto de interfaces TypeScript sincronizadas con el esquema de base de datos (`Cliente`, `Paciente`, `UsuarioAuth`, `ApiValidationError`).
  - Creación del cliente Axios centralizado con decodificación de tokens y redirección en caso de 401 Unauthorized.
  - Creación de servicios modulares desacoplados de la interfaz gráfica.
  - Verificación de compilación sin advertencias mediante `npm run build`.

---

### Fase 3: CRUD Completo con TanStack Query, Zod y Accesibilidad WCAG 2.2 AA
- **Objetivo:** Implementar los formularios y vistas reactivas de Clientes y Pacientes, cumpliendo con la pauta de accesibilidad universal, contraste de colores y diseño mobile-first.
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 3: CRUD Completo con TanStack Query, Formularios con React Hook Form + Zod y Accesibilidad WCAG 2.2 AA. Crea esquemas Zod respetando la BD y DTOs C#. Envuélvelo con QueryClientProvider. Crea ConfirmDialog accesible con focus trap y escape, InputField con aria-describedby y aria-invalid, target mínimo de 44x44px. Vistas mobile-first con tarjetas en móvil y tabla en escritorio. Manejo de 4 estados. Control de roles. Ejecuta npm run build."*
- **Acciones Ejecutadas por el Asistente:**
  - Creación de esquemas Zod validados en cliente (`clienteSchema.ts`, `pacienteSchema.ts`).
  - Implementación de `InputField.tsx` asociando `htmlFor`, `id`, `aria-describedby` y `role="alert"`.
  - Implementación de `ConfirmDialog.tsx` con trampa de foco nativa, cierre por tecla `Escape` y accesibilidad ARIA (`role="dialog"`, `aria-modal="true"`).
  - Creación de páginas completas con soporte responsivo de 320 px a desktop, barra de búsqueda en vivo y botones interactivos de al menos $44 \times 44$ px.

---

### Fase 4: Pruebas Automatizadas (Vitest, Testing Library, MSW y Playwright)
- **Objetivo:** Garantizar la calidad, reproducibilidad y estabilidad del software en ambos extremos (Frontend y Backend).
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 4: Pruebas Automatizadas. Instala vitest, @testing-library/react, @testing-library/jest-dom, jsdom, msw y @playwright/test. Implementa handlers MSW para login, clientes y pacientes. Crea Login.test.tsx, ProtectedRoute.test.tsx y ClientesCrud.test.tsx. Configura Playwright y crea flow.spec.ts. Ejecuta dotnet test y npm run test."*
- **Acciones Ejecutadas por el Asistente:**
  - Configuración del servidor Mock Service Worker (MSW v3) y configuración de Vitest con entorno `jsdom`.
  - Elaboración de 9 pruebas de componentes validando lógica de inicio de sesión, denegación 403 y CRUD.
  - Implementación de prueba End-to-End con Playwright simulando el flujo real del usuario.
  - Verificación exitosa de la suite del backend (`dotnet test` con 4 pruebas superadas).

---

### Fase 5: Documentación y Material de Demostración
- **Objetivo:** Consolidar la documentación técnica y pedagógica para la defensa del proyecto.
- **Prompts Relevantes del Usuario:**
  > *"Procedamos con la Fase 5: Documentación Obligatoria y Material de Demostración. Genera de forma completa, profesional y detallada: README.md, AI_LOG.md, INFORME_TECNICO.md y DEMO_GUIA.md."*
- **Acciones Ejecutadas por el Asistente:**
  - Redacción técnica estructurada de la arquitectura, seguridad, accesibilidad y matriz OWASP.
  - Elaboración de bitácora y guía paso a paso para la defensa oral del alumno.

---

## 3. Decisiones Técnicas y Adaptación de Sugerencias de IA

Durante la interacción con el modelo de IA se identificaron discrepancias técnicas y sugerencias que requirieron intervención y corrección crítica:

| Sugerencia Inicial de la IA | Problema o Limitación Detectada | Decisión Técnica Aplicada y Justificación |
| :--- | :--- | :--- |
| **Almacenamiento de JWT en Cookie `HttpOnly` vía Frontend** | La IA sugirió configurar cookies `HttpOnly` desde el código cliente de JavaScript. | **Rechazada / Adaptada:** Por definición de seguridad de los navegadores, JavaScript no puede crear ni manipular cookies marcadas como `HttpOnly`. Se implementó almacenamiento de token en memoria con fallback en cliente (`localStorage`/`sessionStorage`), interceptor Axios Bearer y limpieza defensiva automática ante cualquier respuesta HTTP 401. |
| **Uso de API obsoleta de MSW (`onUnhandledRequest`)** | La IA generó `server.listen({ onUnhandledRequest: 'bypass' })` en `setup.ts`. | **Corregida:** Con la versión instalada de Mock Service Worker v3, dicha opción fue renombrada a `onUnhandledFrame: 'bypass'`. El asistente adaptó la configuración al tipado estricto de MSW v3, permitiendo la compilación de TypeScript. |
| **Importaciones de tipos estándar bajo `verbatimModuleSyntax`** | La IA importó `import { ReactElement, ReactNode } from 'react'` en archivos de utilidades de prueba. | **Corregida:** El compilador de TypeScript en Vite 8 tiene habilitado `verbatimModuleSyntax: true`. Se corrigió para usar sintaxis explícita `import type { ReactElement, ReactNode }`, eliminando los errores `TS1484`. |
| **Selección de elementos en Playwright con `getByText().first()`** | Al probar el CRUD responsivo en escritorio, la IA usó `.first()`, el cual seleccionó la tarjeta móvil que tenía la clase `md:hidden` (oculta en escritorio). | **Adaptada:** Se incorporó el selector semántico accesible `getByRole('cell', { name: '...', exact: true })` para escritorios y la condición `isMobile` nativa de Playwright para vistas móviles, garantizando que el test evalúe la visibilidad real del usuario según el viewport. |
| **Alineación de esquemas Zod con restricciones SQL Server** | La IA propuso validaciones genéricas de cadenas en Zod (sin límite de longitud o con expresiones regulares complejas). | **Adaptada:** Se revisaron las definiciones exactas de las tablas SQL Server (`DocumentoIdentidad nvarchar(20)`, `NombreCompleto nvarchar(100)`, `Especie nvarchar(50)`), adaptando las reglas de Zod para que las validaciones cliente rechacen valores que romperían las restricciones de la base de datos antes de enviar la petición. |
| **Preservación de pruebas de Backend existentes** | Al configurar las pruebas de frontend, existía el riesgo de sobrescribir o desatender los tests del Trabajo 1. | **Mantenida:** Se preservó intacto el proyecto `VeterinariaAPI.Tests` y se verificó que sus 4 pruebas de integración con `WebApplicationFactory` continuaran pasando exitosamente sin regresiones. |

---

## 4. Conclusiones sobre la Asistencia de IA

El uso de Inteligencia Artificial en este proyecto actuó como un multiplicador de productividad, permitiendo:
1. Reducir el tiempo de escritura de código repetitivo (*boilerplate*) en TypeScript y Minimal APIs.
2. Identificar proactivamente estándares de accesibilidad WCAG 2.2 AA (como trampas de foco en modales y atributos ARIA sincronizados).
3. Asegurar una cobertura de pruebas automatizadas profunda y reproducible tanto a nivel unitario como de integración y extremo a extremo.

Sin embargo, el criterio técnico del programador fue fundamental para resolver sutilezas de versiones de librerías, compatibilidad de tipos con TypeScript 6 y garantizar la seguridad en la capa HTTP.
