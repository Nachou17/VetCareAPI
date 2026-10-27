using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class FacturasApi
    {
        public static void MapFacturasApi(this WebApplication app)
        {
            var facturas = app.MapGroup("/api/v1/facturas").WithTags("Facturas (v1)");

            // API para listar facturas con paginación y orden por recencia (FechaEmision descendente)
            facturas.MapGet("/", async (int? page, int? pageSize, int? clienteId, VeterinariodbContext db) =>
            {
                var query = db.Facturas.AsNoTracking().AsQueryable();

                if (clienteId.HasValue && clienteId.Value > 0)
                {
                    query = query.Where(f => f.ClienteId == clienteId.Value);
                }

                // Criterio de recencia: Fecha de emisión descendente, luego ID descendente
                query = query.OrderByDescending(f => f.FechaEmision).ThenByDescending(f => f.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var items = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    return Results.Ok(new PagedResult<Factura>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                return Results.Ok(await query.ToListAsync());
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para obtener factura por ID
            facturas.MapGet("/{id:int}", async (int id, IRepository<Factura> repo) =>
            {
                var factura = await repo.ObtenerPorIdAsync(id);
                return factura is null ? Results.NotFound() : Results.Ok(factura);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear una factura
            facturas.MapPost("/", async (FacturaCreateDto dto, IRepository<Factura> repo) =>
            {
                var errores = dto.Validar();

                var today = ChileTimeHelper.Today;
                if (dto.FechaEmision < today)
                {
                    errores["FechaEmision"] = new[] { "La fecha de emisión no puede ser anterior a la fecha actual." };
                }

                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevaFactura = new Factura
                {
                    ClienteId = dto.ClienteId,
                    FechaEmision = dto.FechaEmision,
                    MontoImpuestos = dto.MontoImpuestos,
                    MontoTotal = dto.MontoTotal
                };

                await repo.CrearAsync(nuevaFactura);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/facturas/{nuevaFactura.Id}", nuevaFactura);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para editar factura por ID
            facturas.MapPut("/{id:int}", async (int id, FacturaCreateDto dto, IRepository<Factura> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var facturaExistente = await repo.ObtenerPorIdAsync(id);
                if (facturaExistente is null) return Results.NotFound();

                facturaExistente.ClienteId = dto.ClienteId;
                facturaExistente.FechaEmision = dto.FechaEmision;
                facturaExistente.MontoImpuestos = dto.MontoImpuestos;
                facturaExistente.MontoTotal = dto.MontoTotal;

                await repo.GuardarCambiosAsync();
                return Results.Ok(facturaExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para eliminar Facturas
            facturas.MapDelete("/{id:int}", async (int id, IRepository<Factura> repo) =>
            {
                var facturaExistente = await repo.ObtenerPorIdAsync(id);
                if (facturaExistente is null) return Results.NotFound();

                await repo.EliminarAsync(facturaExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record FacturaCreateDto(
            [property: Required(ErrorMessage = "El ID del cliente es obligatorio.")]
            [property: Range(1, int.MaxValue, ErrorMessage = "El ID del cliente debe ser un número entero positivo.")]
            int ClienteId,

            [property: Required(ErrorMessage = "La fecha de emisión es obligatoria.")]
            DateOnly FechaEmision,

            [property: Range(0.0, 10000000.0, ErrorMessage = "El monto de impuestos debe ser igual o mayor a 0.")]
            decimal MontoImpuestos,

            [property: Required(ErrorMessage = "El monto total es obligatorio.")]
            [property: Range(0.01, 10000000.0, ErrorMessage = "El monto total debe ser mayor a 0.")]
            decimal MontoTotal
        );
    }
}
