# 🎤 Guía de Exposición y Demostración en Vivo (DEMO_GUIA.md)
## Trabajo Práctico Nº 2 — Lenguaje de Programación Web II (LPW2)

---

## ⏱️ 1. Estructura y Cronograma de la Exposición (10 – 15 Minutos)

Esta pauta está diseñada para guiar la presentación individual ante la comisión docente, optimizando el tiempo y cubriendo todos los criterios evaluativos de la rúbrica.

```
┌────────────────────────────────────────────────────────────────────────┐
│ CRONOGRAMA DE EXPOSICIÓN ORAL (15 MINUTOS MÁXIMO)                      │
├───────────────┬────────────────────────────────────────┬───────────────┤
│ Minuto        │ Sección / Tema                         │ Foco Técnico  │
├───────────────┼────────────────────────────────────────┼───────────────┤
│ 00:00 - 02:00 │ Introducción y Arquitectura General    │ Desacople     │
│ 02:00 - 04:00 │ Autenticación, JWT y Control de Roles  │ RBAC          │
│ 04:00 - 07:00 │ Demostración de CRUD y TanStack Query │ React Query   │
│ 07:00 - 10:00 │ Pruebas en Vivo de Accesibilidad y RWD │ WCAG 2.2 AA   │
│ 10:00 - 12:00 │ Demostración de Seguridad OWASP        │ XSS, 401, 403 │
│ 12:00 - 15:00 │ Ronda de Preguntas y Cierre            │ Fundamentos   │
└───────────────┴────────────────────────────────────────┴───────────────┘
```

---

## 🎬 2. Secuencia Paso a Paso de la Demostración

### Paso 1: Introducción y Arquitectura (Minutos 0 a 2)
1. **Presentación de la solución:**
   - Explicar brevemente que la solución se compone de un backend en **ASP.NET Core (.NET 10)** con Minimal APIs y Entity Framework Core, y un frontend SPA moderno en **React 19, TypeScript y Vite**.
   - Resaltar la separación de responsabilidades: el backend expone una API RESTful sin estado (*stateless*), protegida por JWT y Rate Limiting; el cliente gestiona la experiencia de usuario con TanStack Query y accesibilidad WCAG 2.2 AA.

### Paso 2: Autenticación y Control de Acceso por Roles (Minutos 2 a 4)
1. **Inicio de Sesión como Administrador:**
   - Ingresar a `http://localhost:5173/login`.
   - Mostrar el formulario accesible con autofocus en el correo y validación en cliente con Zod.
   - Iniciar sesión con: `admin@veterinaria.com` / `Admin123!`.
   - Señalar la redirección inmediata al Dashboard (`/dashboard`) mostrando el saludo personalizado: *"Bienvenido, Dra. Andrea Morales (Administrador)"*.
   - Abrir DevTools (`Application -> Session Storage` o `Local Storage`) y mostrar el token JWT almacenado. Explicar brevemente la estructura `Header.Payload.Signature`.

### Paso 3: CRUD Completo con TanStack Query (Minutos 4 a 7)
1. **Navegación a Clientes (`/clientes`):**
   - Mostrar la barra de búsqueda en tiempo real. Escribir un término y evidenciar el filtrado instantáneo sin recarga.
2. **Creación de Registro con Validación Zod:**
   - Hacer clic en *"Nuevo cliente"*.
   - Dejar los campos vacíos y presionar *"Crear cliente"*.
   - Mostrar cómo los mensajes de error emergen inmediatamente en rojo, con `aria-invalid="true"` y anunciados mediante `role="alert"`.
   - Ingresar datos válidos:
     - Documento: `12345678-9`
     - Nombre: `Constanza Valenzuela`
     - Teléfono: `+56987654321`
     - Correo: `constanza.v@email.com`
   - Guardar. Mostrar que el modal se cierra y el nuevo cliente aparece de inmediato en la tabla gracias a la invalidación automática de caché de TanStack Query (`queryClient.invalidateQueries`).
3. **Detalle y Edición:**
   - Hacer clic en el icono de ver detalle (`/clientes/1`) para mostrar la ficha completa y pacientes asociados.
4. **Eliminación con Modal Accesible:**
   - Presionar el botón de eliminar.
   - Mostrar el modal de confirmación `ConfirmDialog`.
   - Cancelar y confirmar que no se borra. Reabrir y presionar *"Eliminar"*, mostrando la actualización reactiva de la lista.

---

## 🛠️ 3. Demostraciones Prácticas Obligatorias

### Demostración A: Navegación Exclusiva por Teclado (Accesibilidad WCAG 2.2)
1. **Instrucción al evaluador:** *"A continuación, soltaré el mouse para demostrar que el 100% de la aplicación es operable mediante el teclado."*
2. **Procedimiento:**
   - Desde la barra de direcciones o recargando la página, presionar `Tab`.
   - Mostrar el enlace de salto accesible: *"Saltar al contenido principal"* (`#main-content`).
   - Continuar con `Tab` recorriendo el menú de navegación (Dashboard, Clientes, Pacientes), la barra de búsqueda y los botones de acción.
   - Señalar el **anillo de foco visible de alto contraste** (`focus-visible:ring-2 focus-visible:ring-blue-500`).
   - Abrir el formulario o modal presionando `Enter` o `Espacio`.
   - **Trampa de foco en Modal:** Dentro del modal de confirmación o formulario, presionar `Tab` repetidamente y demostrar que el foco no puede escapar hacia los elementos del fondo.
   - Presionar la tecla `Escape` y mostrar cómo el modal se cierra inmediatamente, devolviendo el foco al botón que lo abrió.

### Demostración B: Adaptabilidad Responsive Mobile a 320 px (Mobile-First)
1. **Procedimiento:**
   - Abrir las DevTools del navegador (`F12`), activar el modo responsive (`Ctrl + Shift + M`).
   - Ajustar el ancho del viewport a **320 px** (el ancho más exigente de la pauta WCAG).
   - Mostrar que **no existe scroll horizontal** en ninguna parte de la pantalla.
   - Demostrar la transformación de la interfaz:
     - En pantallas grandes ($\ge 768$ px) se muestra la **tabla semántica**.
     - En pantallas móviles (< 768 px y 320 px) se transforma automáticamente en **tarjetas verticales independientes**.
   - Mostrar que los botones de acción (`Editar`, `Eliminar`, `Ver`) mantienen un **área táctil de al menos $44 \times 44$ px** (`min-h-[44px] min-w-[44px]`), garantizando la usabilidad táctil según el Criterio 2.5.8 de WCAG 2.2.

### Demostración C: Intento de Inyección XSS Bloqueado (Seguridad OWASP)
1. **Procedimiento:**
   - En el formulario de creación de cliente o paciente, ingresar en el campo Nombre:
     ```html
     <script>alert('XSS-Vulnerable!')</script>
     ```
     o
     ```html
     <img src="x" onerror="alert('XSS')" />
     ```
   - Guardar el registro.
   - Mostrar que el navegador **no ejecuta ningún script ni ventana emergente**.
   - Explicar técnicamente: *"React utiliza interpolación JSX segura por defecto, escapando los caracteres `<` y `>` antes de inyectarlos en el árbol DOM. En ningún lugar se utiliza `dangerouslySetInnerHTML`, neutralizando el riesgo OWASP A03 Injection."*

### Demostración D: Prueba de Token Expirado / Manipulado (HTTP 401)
1. **Procedimiento:**
   - En DevTools (`Application -> Storage`), modificar deliberadamente el valor del token JWT (por ejemplo, cambiar caracteres de la firma o vaciarlo).
   - Intentar realizar una acción (recargar la página o crear un paciente).
   - Mostrar cómo el interceptor de Axios captura inmediatamente el código `HTTP 401 Unauthorized`.
   - Evidenciar que la aplicación:
     1. Limpia automáticamente el token corrupto del almacenamiento.
     2. Cierra la sesión en memoria.
     3. Redirige de inmediato a la pantalla `/login` protegiendo las vistas privadas.

### Demostración E: Control de Acceso por Rol Insuficiente (HTTP 403)
1. **Procedimiento:**
   - Iniciar sesión con la cuenta de Recepción: `recepcion@veterinaria.com` / `Recep123!`.
   - Mostrar que en la interfaz de Clientes y Pacientes:
     - El botón *"Nuevo cliente"* está oculto.
     - Los botones de eliminación están completamente ausentes.
   - Demostrar la protección de rutas: Forzar la navegación escribiendo en la barra de direcciones una ruta administrativa protegida (o intentar invocar el endpoint `DELETE /api/v1/clientes/1` por consola/cURL con el token del recepcionista).
   - Mostrar que la aplicación y el backend responden con **403 Forbidden / Acceso Denegado**, demostrando la doble barrera cliente-servidor.

---

## 🧠 4. Banco de Preguntas Frecuentes del Docente y Respuestas Fundamentadas

### Pregunta 1: ¿Por qué eligió Minimal APIs en lugar de Controladores tradicionales en ASP.NET Core?
> **Respuesta:**
> *"Las Minimal APIs en .NET 10 ofrecen un modelo de desarrollo orientado a microservicios y APIs RESTful de alto rendimiento. Al eliminar la sobrecarga de reflexión y ciclo de vida de los controladores tradicionales (`ControllerBase`), logramos menor latencia, menor huella de memoria y una configuración explícita de endpoints mediante métodos de extensión como `MapGroup('/api/v1/clientes')`. Además, permiten enlazar políticas de seguridad como `.RequireRateLimiting('AuthPolicy')` y `.RequireAuthorization(policy => policy.RequireRole(...))` de manera fluida y declarativa directamente en cada ruta."*

---

### Pregunta 2: ¿Dónde y cómo se almacena el JWT en el cliente, y cómo mitiga el riesgo de robo de token?
> **Respuesta:**
> *"El token JWT se almacena en el cliente a través de una abstracción en `src/utils/token.ts` y se transporta mediante la cabecera `Authorization: Bearer <token>` inyectada por el interceptor de Axios. Esta estrategia es ideal para APIs desacopladas de orígenes cruzados (CORS) y elimina por completo el riesgo de Cross-Site Request Forgery (CSRF). Para mitigar el riesgo de robo por XSS: primero, React escapa de forma nativa todo el contenido renderizado; segundo, el token tiene una expiración corta de 60 minutos en el backend; y tercero, ante cualquier respuesta 401, el interceptor de Axios purga inmediatamente el almacenamiento."*

---

### Pregunta 3: Si un usuario con rol 'Recepcionista' manipula el código en las DevTools de React y hace visible el botón 'Eliminar', ¿puede borrar datos?
> **Respuesta:**
> *"No, en absoluto. La interfaz de usuario solo proporciona una primera capa defensiva para optimizar la experiencia de usuario ocultando botones no autorizados. La verdadera autoridad de seguridad reside en el servidor: el endpoint `DELETE /api/v1/clientes/{id}` en `Clientes.cs` tiene configurada la directiva `.RequireRole('Administrador')`. Si el usuario envía la petición manipulada con su token JWT, el middleware de autorización de ASP.NET Core valida los claims del token en el servidor y rechaza la solicitud inmediatamente con un código `HTTP 403 Forbidden`, sin llegar a tocar la base de datos."*

---

### Pregunta 4: ¿Cómo está configurada la política de CORS y por qué no se debe usar `AllowAnyOrigin()` en producción?
> **Respuesta:**
> *"En `Program.cs`, la política CORS está configurada de manera estricta utilizando `WithOrigins('http://localhost:5173')`, `AllowCredentials()`, `AllowAnyHeader()` y `AllowAnyMethod()`. Utilizar `AllowAnyOrigin()` con comodín (`*`) cuando se manejan credenciales es una vulnerabilidad grave y está prohibido por los estándares de los navegadores (el navegador rechaza la respuesta si `Access-Control-Allow-Credentials: true` coincide con `Access-Control-Allow-Origin: *`). Delimitar el origen exacto del frontend garantiza que solo nuestra aplicación SPA autorizada pueda intercambiar información con la API."*

---

### Pregunta 5: ¿Qué ventajas aporta TanStack Query frente a usar simplemente `useEffect` y `useState` para el consumo de la API?
> **Respuesta:**
> *"TanStack Query desacopla la sincronización del estado del servidor del estado de la UI. Entre sus principales ventajas destacan: primero, almacenamiento en caché automático que evita peticiones repetitivas al navegar entre vistas; segundo, gestión nativa y declarativa de los 4 estados de la interfaz (`isLoading`, `isError`, reintentos automáticos y datos); y tercero, el mecanismo de mutaciones con invalidación de caché (`queryClient.invalidateQueries`), que garantiza que tras crear, editar o eliminar un registro, la lista se actualice en segundo plano de manera transparente y reactiva sin necesidad de recargar la página o manejar estados locales complejos."*

---

### Pregunta 6: ¿Qué criterios específicos de accesibilidad WCAG 2.2 Nivel AA se implementaron en los formularios y modales?
> **Respuesta:**
> *"Implementamos cuatro pilares fundamentales:
> 1. **Criterio 1.3.1 y 4.1.2 (Asociación semántica):** Mediante `InputField.tsx`, todos los inputs tienen un `<label>` asociado vía `htmlFor`/`id`, y los errores de validación se vinculan con `aria-describedby` y se anuncian con `role='alert'`.
> 2. **Criterio 2.4.3 (Focus Order):** El modal `ConfirmDialog.tsx` cuenta con trampa de foco (`focus trap`) que mantiene la navegación dentro del cuadro de diálogo mientras esté abierto y permite cerrarlo con la tecla `Escape`, restaurando el foco al disparador.
> 3. **Criterio 2.5.8 (Target Size):** Todos los botones e iconos interactivos tienen una dimensión mínima de toque de $44 \times 44$ píxeles.
> 4. **Criterio 2.4.7 (Focus Visible):** Cada control interactivo cuenta con anillos de foco visibles de alto contraste (`focus-visible:ring-2`)."*
