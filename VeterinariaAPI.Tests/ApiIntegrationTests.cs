using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace VeterinariaAPI.Tests
{
    public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public ApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            // Crea un cliente HTTP en memoria apuntando a tu aplicación
            _client = factory.CreateClient();
        }

        private static string GenerarTokenAdmin()
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("VeterinariaAPI_SuperSecret_JwtSigningKey_2026_OWASP_Compliant!"));
            var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Name, "Admin Test"),
                new Claim(ClaimTypes.Role, "Administrador")
            };
            var token = new JwtSecurityToken(
                issuer: "VeterinariaAPI",
                audience: "VeterinariaClient",
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
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarTokenAdmin());

            var response = await _client.SendAsync(request);

            // Assert: Verifica que la ruta responde 200 OK y no falla
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotNull(response.Content.Headers.ContentType);
            Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType.ToString());
        }

        [Fact]
        public async Task Test_Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange: Payload con credenciales falsas
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
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", GenerarTokenAdmin());

            var response = await _client.SendAsync(request);

            // Assert: Verifica que el middleware/validación devuelva 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Test_RateLimiting_ExceedLimit_Returns429TooManyRequests()
        {
            // Arrange: Intentos de login seguidos para activar la AuthPolicy (Límite = 5)
            var payload = new { Email = "fail@test.com", Password = "wrong" };
            HttpResponseMessage lastResponse = null!;

            // Act: Realizar 7 peticiones consecutivas
            for (int i = 0; i < 7; i++)
            {
                lastResponse = await _client.PostAsJsonAsync("/api/v1/usuarios/login", payload);
            }

            // Assert: Las últimas peticiones deben ser bloqueadas con HTTP 429
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
            // Arrange: Generar token con audiencia diferente a la configurada
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("VeterinariaAPI_SuperSecret_JwtSigningKey_2026_OWASP_Compliant!"));
            var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Administrador")
            };
            var token = new JwtSecurityToken(
                issuer: "VeterinariaAPI",
                audience: "AudienceInvalida",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60),
                signingCredentials: credenciales
            );
            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

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
            // Act: Invocar endpoint de error en entorno Development
            var response = await _client.GetAsync("/api/test-error");

            // Assert: Código 500 sin exponer detalles internos ni exception.Message
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("Prueba de falla capturada por el middleware", content);
            Assert.DoesNotContain("detalle", content, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Ocurrió un error inesperado al procesar la solicitud", content);
        }
    }
}
