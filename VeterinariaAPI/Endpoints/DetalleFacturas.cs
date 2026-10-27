using System.ComponentModel.DataAnnotations;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class DetalleFacturasAPI
    {
        public static void MapDetalleFacApi(this WebApplication app)
        {
            var detallefac = app.MapGroup("/api/v1/detallefac").WithTags("DetalleFactura (v1)");

            // API para listar detalle factura
            detallefac.MapGet("/", async (IRepository<DetallesFactura> repo) =>
            {
                var listaDetalleFac = await repo.ObtenerTodosAsync();
                return Results.Ok(listaDetalleFac);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear un detalle de factura
            detallefac.MapPost("/", async (DetalleFacturaCreateDto dto, IRepository<DetallesFactura> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevoDetalle = new DetallesFactura
                {
                    FacturaId = dto.FacturaId,
                    ConsultaId = dto.ConsultaId,
                    InsumoId = dto.InsumoId,
                    Subtotal = dto.Subtotal
                };

                await repo.CrearAsync(nuevoDetalle);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/detallefac/{nuevoDetalle.Id}", nuevoDetalle);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para editar detalle factura por ID
            detallefac.MapPut("/{id:int}", async (int id, DetalleFacturaCreateDto dto, IRepository<DetallesFactura> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var detallefacExistente = await repo.ObtenerPorIdAsync(id);
                if (detallefacExistente is null) return Results.NotFound();

                detallefacExistente.FacturaId = dto.FacturaId;
                detallefacExistente.ConsultaId = dto.ConsultaId;
                detallefacExistente.InsumoId = dto.InsumoId;
                detallefacExistente.Subtotal = dto.Subtotal;

                await repo.GuardarCambiosAsync();
                return Results.Ok(detallefacExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para eliminar un detalle de factura
            detallefac.MapDelete("/{id:int}", async (int id, IRepository<DetallesFactura> repo) =>
            {
                var detallefacExistente = await repo.ObtenerPorIdAsync(id);
                if (detallefacExistente is null) return Results.NotFound();

                await repo.EliminarAsync(detallefacExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record DetalleFacturaCreateDto(
            [property: Required(ErrorMessage = "El ID de la factura es obligatorio.")]
            [property: Range(1, int.MaxValue, ErrorMessage = "El ID de la factura debe ser un número entero positivo.")]
            int FacturaId,

            int? ConsultaId,

            int? InsumoId,

            [property: Required(ErrorMessage = "El subtotal es obligatorio.")]
            [property: Range(0.01, 10000000.0, ErrorMessage = "El subtotal debe ser mayor a 0.")]
            decimal Subtotal
        );
    }
}