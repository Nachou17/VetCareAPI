using System.Net;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace VeterinariaAPI.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Continúa con la ejecución de la petición
                await _next(context);
            }
            catch (Exception ex)
            {
                // 1. Interceptar violaciones de restricciones de clave foránea (FK Constraint 547)
                if (EsViolacionClaveForanea(ex))
                {
                    _logger.LogWarning(ex, "Violación de restricción de clave foránea interceptada (409 Conflict) en la ruta {Path}.", context.Request.Path);
                    await ManejarConflictoClaveForaneaAsync(context);
                    return;
                }

                // 2. Errores no controlados estándar (500 Internal Server Error)
                _logger.LogError(ex, "Excepción no controlada capturada por GlobalExceptionMiddleware en {Path}.", context.Request.Path);
                await ManejarExcepcionAsync(context, ex);
            }
        }

        private static bool EsViolacionClaveForanea(Exception ex)
        {
            Exception? actual = ex;
            while (actual != null)
            {
                // SqlException número 547: The DELETE/INSERT/UPDATE statement conflicted with the REFERENCE constraint
                if (actual is SqlException sqlEx && sqlEx.Number == 547)
                {
                    return true;
                }

                if (actual is DbUpdateException dbEx && dbEx.InnerException is SqlException innerSql && innerSql.Number == 547)
                {
                    return true;
                }

                var msg = actual.Message.ToLowerInvariant();
                if (msg.Contains("foreign key") ||
                    msg.Contains("reference constraint") ||
                    msg.Contains("conflicted with the reference constraint") ||
                    msg.Contains("restricción de clave externa") ||
                    msg.Contains("restricción de clave foránea") ||
                    msg.Contains("restricción foreign key") ||
                    msg.Contains("instrucción delete entró en conflicto con la restricción reference"))
                {
                    return true;
                }

                actual = actual.InnerException;
            }

            return false;
        }

        private static Task ManejarConflictoClaveForaneaAsync(HttpContext context)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status409Conflict;

            var respuesta = new
            {
                status = StatusCodes.Status409Conflict,
                message = "No se puede eliminar el registro seleccionado porque tiene otros elementos asociados (consultas, citas, mascotas o facturas vinculadas)."
            };

            var jsonOpciones = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            return context.Response.WriteAsync(JsonSerializer.Serialize(respuesta, jsonOpciones));
        }

        private static Task ManejarExcepcionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var respuesta = new
            {
                status = context.Response.StatusCode,
                error = "Error Interno del Servidor",
                message = "Ocurrió un error inesperado al procesar la solicitud."
            };

            var jsonOpciones = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };
            return context.Response.WriteAsync(JsonSerializer.Serialize(respuesta, jsonOpciones));
        }
    }
}
