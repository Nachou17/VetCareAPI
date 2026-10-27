using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace VeterinariaAPI.Tests
{
    public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        // Clave JWT aislada y exclusiva para entorno de pruebas automatizadas (nunca usada en producción)
        private const string TestJwtSigningKey = "VeterinariaAPI_Test_Isolated_Jwt_Key_2026_OWASP_Compliant_Key!";
        private readonly HttpClient _client;

        public ApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            // Configura un host de prueba con variables en memoria independientes de secretos locales
            _client = factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Jwt:Key", TestJwtSigningKey);
                builder.UseSetting("Jwt:Issuer", "VeterinariaAPI");
                builder.UseSetting("Jwt:Audience", "VeterinariaClient");
                builder.UseSetting("Jwt:ExpireMinutes", "60");
                builder.UseSetting("SeedDemoData", "false");
            }).CreateClient();
        }

        private static string GenerarToken(string rol = "Administrador", string audience = "VeterinariaClient", string userId = "1")
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSigningKey));
            var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, $"Usuario {rol}"),
                new Claim(ClaimTypes.Role, rol)
            };
            var token = new JwtSecurityToken(
                issuer: "VeterinariaAPI",
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60),
                signingCredentials: credenciales
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [Fact]
        public async Task Test_GetUsuarios_ReturnsSuccessAndJson()
        {
            // Act: Invocación al endpoint de usuarios con token de Administrador
            var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/usuarios");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            var response = await _client.SendAsync(request);

            // Assert: Verifica que la ruta responde 200 OK y formato JSON
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(response.Content.Headers.ContentType);
            Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType.ToString());
        }

        [Fact]
        public async Task Test_GetUsuarios_WithoutToken_ReturnsUnauthorized()
        {
            // Act: Solicitud a endpoint protegido sin cabecera Authorization
            var response = await _client.GetAsync("/api/v1/usuarios");

            // Assert: Debe retornar 401 Unauthorized
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Test_GetUsuarios_WithRecepcionistaRole_ReturnsForbidden()
        {
            // Act: Solicitud con token válido pero rol insuficiente (Recepcionista)
            var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/usuarios");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Recepcionista"));

            var response = await _client.SendAsync(request);

            // Assert: Debe retornar 403 Forbidden
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Test_DeleteCliente_WithRecepcionistaRole_ReturnsForbidden()
        {
            // Act: Intento de eliminación con rol de Recepcionista (solo Administrador permitido)
            var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/clientes/1");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Recepcionista"));

            var response = await _client.SendAsync(request);

            // Assert: 403 Forbidden en el servidor
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Test_Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange: Payload con credenciales inexistentes
            var invalidLogin = new
            {
                Email = "desconocido@veterinaria.com",
                Password = "Password123!"
            };

            // Act: Invocación al POST /login
            var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", invalidLogin);

            // Assert: Verifica que devuelva 401 Unauthorized
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Test_Register_InvalidModel_ReturnsValidationProblem()
        {
            // Arrange: DTO con datos inválidos (correo erróneo y contraseña corta)
            var invalidRegister = new
            {
                RolId = 1,
                NombreCompleto = "A",
                Email = "correo-invalido",
                Password = "123"
            };

            // Act: Invocación al POST /register con autorización de Administrador
            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/usuarios/register")
            {
                Content = JsonContent.Create(invalidRegister)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            var response = await _client.SendAsync(request);

            // Assert: Verifica que devuelva 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Test_RateLimiting_ExceedLimit_Returns429TooManyRequests()
        {
            // Arrange: Intentos de login seguidos para activar la AuthPolicy (Límite = 5 req/min)
            var payload = new { Email = "fail@test.com", Password = "wrong" };
            HttpResponseMessage lastResponse = null!;

            // Act: Realizar 7 peticiones consecutivas
            for (int i = 0; i < 7; i++)
            {
                lastResponse = await _client.PostAsJsonAsync("/api/v1/usuarios/login", payload);
            }

            // Assert: Las peticiones excedentes deben ser bloqueadas con HTTP 429
            Assert.Equal((HttpStatusCode)429, lastResponse.StatusCode);
        }

        [Fact]
        public async Task Test_ForeignKeyConflict_Returns409Conflict()
        {
            // Act: Invocación a ruta que dispara excepción con restricción de clave foránea
            var response = await _client.GetAsync("/api/test-fk-conflict");

            // Assert: Verifica código HTTP 409 Conflict y mensaje estructurado
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("409", json);
            Assert.Contains("No se puede eliminar el registro seleccionado", json);
        }

        [Fact]
        public async Task Test_InvalidAudience_ReturnsUnauthorized()
        {
            // Arrange: Token firmado con audiencia no reconocida
            var jwt = GenerarToken("Administrador", audience: "AudienceInvalida");

            var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/usuarios");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Validación de audiencia habilitada debe rechazar con 401
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Test_InternalServerError_DoesNotExposeExceptionDetails()
        {
            // Act: Invocar endpoint de error de prueba en entorno Development
            var response = await _client.GetAsync("/api/test-error");

            // Assert: Código 500 sin exponer detalles internos ni exception.Message
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("Prueba de falla capturada por el middleware", content);
            Assert.DoesNotContain("detalle", content, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Ocurrió un error inesperado al procesar la solicitud", content);
        }

        [Fact]
        public async Task Test_Cors_DisallowedOrigin_DoesNotExposeAllowOriginHeader()
        {
            // Arrange: Petición desde un origen no autorizado
            var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/usuarios");
            request.Headers.Add("Origin", "http://sitio-malicioso.com");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: CORS Policy no debe emitir Access-Control-Allow-Origin para el sitio no autorizado
            if (response.Headers.TryGetValues("Access-Control-Allow-Origin", out var allowOrigin))
            {
                Assert.DoesNotContain("http://sitio-malicioso.com", allowOrigin);
            }
        }

        [Fact]
        public async Task Test_SecurityHeaders_ArePresentInResponse()
        {
            // Act
            var response = await _client.GetAsync("/api/v1/clientes");

            // Assert: Verifica las cabeceras de seguridad OWASP
            Assert.True(response.Headers.Contains("X-Content-Type-Options"));
            Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").First());

            Assert.True(response.Headers.Contains("X-Frame-Options"));
            Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").First());

            Assert.True(response.Headers.Contains("Referrer-Policy"));
            Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").First());

            Assert.True(response.Headers.Contains("Permissions-Policy"));
        }

        [Fact]
        public async Task Test_GetClientes_WithPagination_ReturnsPagedResult()
        {
            // Act: Invocación a clientes con paginación explícita
            var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/clientes?page=1&pageSize=2");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            var response = await _client.SendAsync(request);

            // Assert: Verifica código 200 y estructura paginada con metadatos
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("\"page\":1", content);
            Assert.Contains("\"pageSize\":2", content);
            Assert.Contains("\"totalItems\":", content);
            Assert.Contains("\"totalPages\":", content);
        }

        [Fact]
        public async Task Test_CreateCita_WithPastDate_ReturnsBadRequest()
        {
            // Arrange: Cita con fecha en el pasado (más allá del límite de tolerancia de 5 minutos, e.g. 10 minutos atrás)
            var pastCita = new
            {
                PacienteId = 1,
                UsuarioId = 1,
                EspecialidadId = 1,
                FechaHora = DateTime.Now.AddMinutes(-10).ToString("s"),
                Estado = "Pendiente"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/citas")
            {
                Content = JsonContent.Create(pastCita)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe retornar 400 Bad Request por validación de fecha
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("FechaHora", json);
            Assert.Contains("no pueden ser anteriores", json);
        }

        [Fact]
        public async Task Test_CreateCita_WithinGracePeriod_IsAccepted()
        {
            // Arrange: Cita con fecha dentro del margen técnico de tolerancia (e.g. 2 minutos atrás por latencia/llenado)
            var graceCita = new
            {
                PacienteId = 1,
                UsuarioId = 1,
                EspecialidadId = 1,
                FechaHora = DateTime.Now.AddMinutes(-2).ToString("s"),
                Estado = "Pendiente"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/citas")
            {
                Content = JsonContent.Create(graceCita)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Aceptado dentro de la tolerancia técnica de 5 minutos (HTTP 201 Created)
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task Test_CreateCita_InterpretsSantiagoTimeZone_Correctly()
        {
            // Arrange: Simula un valor datetime-local sin offset de zona horaria enviado desde Chile (ej: 2 horas en el futuro en Chile)
            var chileNow = VeterinariaAPI.Extensions.ChileTimeHelper.Now;
            var futureChileLocal = chileNow.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss");

            var citaDto = new
            {
                PacienteId = 1,
                UsuarioId = 1,
                EspecialidadId = 1,
                FechaHora = futureChileLocal,
                Estado = "Pendiente"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/citas")
            {
                Content = JsonContent.Create(citaDto)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe interpretar America/Santiago correctamente y responder 201 Created
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task Test_UpdateCita_WithPastDate_ReturnsBadRequest()
        {
            // Arrange: Modificación (PUT) de cita con fecha en el pasado
            var pastUpdate = new
            {
                PacienteId = 1,
                UsuarioId = 1,
                EspecialidadId = 1,
                FechaHora = DateTime.Now.AddDays(-1).ToString("s"),
                Estado = "Pendiente"
            };

            var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/citas/1")
            {
                Content = JsonContent.Create(pastUpdate)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe retornar 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("FechaHora", json);
        }

        [Fact]
        public async Task Test_CreateFactura_WithPastEmission_ReturnsBadRequest()
        {
            // Arrange: Factura con fecha de emisión en el pasado
            var pastFactura = new
            {
                ClienteId = 1,
                FechaEmision = DateOnly.FromDateTime(DateTime.Now.AddDays(-5)).ToString("yyyy-MM-dd"),
                MontoImpuestos = 1900m,
                MontoTotal = 11900m
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/facturas")
            {
                Content = JsonContent.Create(pastFactura)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe retornar 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("FechaEmision", json);
        }

        [Fact]
        public async Task Test_CreateReceta_WithInvalidValidity_ReturnsBadRequest()
        {
            // Arrange: Receta donde validaHasta es anterior a fechaEmision
            var invalidReceta = new
            {
                ConsultaId = 1,
                FechaEmision = DateOnly.FromDateTime(DateTime.Now.AddDays(5)).ToString("yyyy-MM-dd"),
                ValidaHasta = DateOnly.FromDateTime(DateTime.Now.AddDays(2)).ToString("yyyy-MM-dd")
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/recetas")
            {
                Content = JsonContent.Create(invalidReceta)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("ValidaHasta", json);
        }

        [Fact]
        public async Task Test_CreateUser_AsAdmin_WithVeterinarioOrRecepcionista_Succeeds()
        {
            // Arrange: Crear usuario con rol Veterinario (RolId = 2) o Recepcionista (RolId = 3)
            var randomSuffix = Guid.NewGuid().ToString("N")[..6];
            var newUser = new
            {
                RolId = 2,
                NombreCompleto = $"Dra. Test {randomSuffix}",
                Email = $"test.vet.{randomSuffix}@veterinaria.com",
                Password = "Password123!"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/usuarios/register")
            {
                Content = JsonContent.Create(newUser)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe permitir crearlo y retornar 201 Created
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task Test_CreateUser_WithAdminRole_ReturnsBadRequest()
        {
            // Arrange: Intento de registrar un nuevo usuario con rol Administrador (RolId = 1)
            var newUser = new
            {
                RolId = 1,
                NombreCompleto = "Intento Admin",
                Email = $"admin.ilegal.{Guid.NewGuid():N}@veterinaria.com",
                Password = "Password123!"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/usuarios/register")
            {
                Content = JsonContent.Create(newUser)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe ser rechazado con 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("Administrador", json);
        }

        [Fact]
        public async Task Test_CreateUser_AsNonAdmin_ReturnsForbidden()
        {
            // Arrange: Intento de registrar un usuario por parte de un Veterinario
            var newUser = new
            {
                RolId = 2,
                NombreCompleto = "Usuario Prohibido",
                Email = $"prohibido.{Guid.NewGuid():N}@veterinaria.com",
                Password = "Password123!"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/usuarios/register")
            {
                Content = JsonContent.Create(newUser)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Veterinario"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: 403 Forbidden
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Test_EditUser_ToAdminRole_ReturnsBadRequest()
        {
            // Arrange: Intento de actualizar el rol de un usuario existente a Administrador (RolId = 1)
            var updateDto = new
            {
                RolId = 1,
                NombreCompleto = "Nombre Modificado",
                Email = "email.modificado@veterinaria.com"
            };

            var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/usuarios/2")
            {
                Content = JsonContent.Create(updateDto)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Rechazado con 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("Administrador", json);
        }

        [Fact]
        public async Task Test_EditUser_AsNonAdmin_ReturnsForbidden()
        {
            // Arrange: Intento de editar usuario con rol no administrador
            var updateDto = new
            {
                RolId = 2,
                NombreCompleto = "Intento Edicion",
                Email = "intento@veterinaria.com"
            };

            var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/usuarios/2")
            {
                Content = JsonContent.Create(updateDto)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Recepcionista"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: 403 Forbidden
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Test_DeleteUser_CannotDeleteSelf_ReturnsBadRequest()
        {
            // Arrange: El administrador autenticado con ID = 1 intenta eliminarse a sí mismo
            var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/usuarios/1");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador", userId: "1"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe ser bloqueado por la API con 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("propia cuenta", json);
        }

        [Fact]
        public async Task Test_DeleteUser_AsNonAdmin_ReturnsForbidden()
        {
            // Arrange: Recepcionista intenta eliminar un usuario
            var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/usuarios/2");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Recepcionista"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: 403 Forbidden
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Test_DeleteUser_WithoutDependencies_Succeeds()
        {
            // Arrange: Crear un usuario nuevo para luego eliminarlo
            var randomSuffix = Guid.NewGuid().ToString("N")[..6];
            var newUser = new
            {
                RolId = 3, // Recepcionista
                NombreCompleto = $"Usuario Temporal {randomSuffix}",
                Email = $"temporal.{randomSuffix}@veterinaria.com",
                Password = "Password123!"
            };

            var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/usuarios/register")
            {
                Content = JsonContent.Create(newUser)
            };
            createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador"));
            var createRes = await _client.SendAsync(createReq);
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

            var createdUser = await createRes.Content.ReadFromJsonAsync<System.Text.Json.Nodes.JsonObject>();
            var newId = createdUser!["id"]!.GetValue<int>();

            // Act: Eliminar el usuario recién creado (sin dependencias)
            var deleteReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/usuarios/{newId}");
            deleteReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador", userId: "1"));
            var deleteRes = await _client.SendAsync(deleteReq);

            // Assert: Eliminación exitosa sin dependencias
            Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);
        }

        [Fact]
        public async Task Test_DeleteUser_WithAssociatedData_ReturnsConflict409()
        {
            // Arrange: El usuario con ID 1 tiene citas asociadas.
            // El administrador realiza la petición con un userId distinto (ej. "9999") para no activar la regla de auto-eliminación
            var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/usuarios/1");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarToken("Administrador", userId: "9999"));

            // Act
            var response = await _client.SendAsync(request);

            // Assert: Debe retornar 409 Conflict sin borrar en cascada
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("409", json);
            Assert.Contains("asociados", json);
        }
    }
}
