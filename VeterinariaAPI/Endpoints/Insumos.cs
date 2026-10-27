using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class InsumosApi
    {
        public static void MapInsumosApi(this WebApplication app)
        {
            var insumos = app.MapGroup("/api/v1/insumos").WithTags("Insumos (v1)");

            // API para listar insumos con paginación y orden por recencia (Id descendente)
            insumos.MapGet("/", async (int? page, int? pageSize, string? search, VeterinariodbContext db) =>
            {
                var query = db.Insumos.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var q = search.Trim().ToLower();
                    query = query.Where(i => i.NombreProducto.ToLower().Contains(q) ||
                                             i.Tipo.ToLower().Contains(q));
                }

                // Criterio de recencia: ID descendente
                query = query.OrderByDescending(i => i.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var items = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    return Results.Ok(new PagedResult<Insumo>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                return Results.Ok(await query.ToListAsync());
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para obtener insumo por ID
            insumos.MapGet("/{id:int}", async (int id, IRepository<Insumo> repo) =>
            {
                var insumo = await repo.ObtenerPorIdAsync(id);
                return insumo is null ? Results.NotFound() : Results.Ok(insumo);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear un insumo
            insumos.MapPost("/", async (InsumoCreateDto dto, IRepository<Insumo> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevoInsumo = new Insumo
                {
                    NombreProducto = dto.NombreProducto,
                    Tipo = dto.Tipo,
                    StockActual = dto.StockActual,
                    PrecioUnitario = dto.PrecioUnitario
                };

                await repo.CrearAsync(nuevoInsumo);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/insumos/{nuevoInsumo.Id}", nuevoInsumo);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para editar insumo por ID
            insumos.MapPut("/{id:int}", async (int id, InsumoCreateDto dto, IRepository<Insumo> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var insumoExistente = await repo.ObtenerPorIdAsync(id);
                if (insumoExistente is null) return Results.NotFound();

                insumoExistente.NombreProducto = dto.NombreProducto;
                insumoExistente.Tipo = dto.Tipo;
                insumoExistente.StockActual = dto.StockActual;
                insumoExistente.PrecioUnitario = dto.PrecioUnitario;

                await repo.GuardarCambiosAsync();
                return Results.Ok(insumoExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para eliminar insumos
            insumos.MapDelete("/{id:int}", async (int id, IRepository<Insumo> repo) =>
            {
                var insumoExistente = await repo.ObtenerPorIdAsync(id);
                if (insumoExistente is null) return Results.NotFound();

                await repo.EliminarAsync(insumoExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record InsumoCreateDto(
            [property: Required(ErrorMessage = "El nombre del producto es obligatorio.")]
            [property: StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre del producto debe tener entre 2 y 100 caracteres.")]
            string NombreProducto,

            [property: Required(ErrorMessage = "El tipo de insumo es obligatorio.")]
            [property: StringLength(50, ErrorMessage = "El tipo de insumo no puede superar los 50 caracteres.")]
            string Tipo,

            [property: Required(ErrorMessage = "El stock actual es obligatorio.")]
            [property: Range(0, int.MaxValue, ErrorMessage = "El stock actual debe ser un número entero mayor o igual a 0.")]
            int StockActual,

            [property: Required(ErrorMessage = "El precio unitario es obligatorio.")]
            [property: Range(0.01, 10000000.0, ErrorMessage = "El precio unitario debe ser mayor a 0.")]
            decimal PrecioUnitario
        );
    }
}
