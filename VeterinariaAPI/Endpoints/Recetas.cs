using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class RecetasApi
    {
        public static void MapRecetaApi(this WebApplication app)
        {
            var recetas = app.MapGroup("/api/v1/recetas").WithTags("Recetas (v1)");

            // API para listar recetas con paginación y orden por recencia (FechaEmision descendente)
            recetas.MapGet("/", async (int? page, int? pageSize, int? consultaId, VeterinariodbContext db) =>
            {
                var query = db.Recetas.AsNoTracking().AsQueryable();

                if (consultaId.HasValue && consultaId.Value > 0)
                {
                    query = query.Where(r => r.ConsultaId == consultaId.Value);
                }

                // Criterio de recencia: Fecha de emisión descendente, luego ID descendente
                query = query.OrderByDescending(r => r.FechaEmision).ThenByDescending(r => r.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var items = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    return Results.Ok(new PagedResult<Receta>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                return Results.Ok(await query.ToListAsync());
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para obtener receta por ID
            recetas.MapGet("/{id:int}", async (int id, IRepository<Receta> repo) =>
            {
                var receta = await repo.ObtenerPorIdAsync(id);
                return receta is null ? Results.NotFound() : Results.Ok(receta);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear una receta
            recetas.MapPost("/", async (RecetaCreateDto dto, IRepository<Receta> repo) =>
            {
                var errores = dto.Validar();

                var today = ChileTimeHelper.Today;
                if (dto.FechaEmision < today)
                {
                    errores["FechaEmision"] = new[] { "La fecha de emisión no puede ser anterior a la fecha actual." };
                }

                if (dto.ValidaHasta < dto.FechaEmision)
                {
                    errores["ValidaHasta"] = new[] { "La fecha de vigencia no puede ser anterior a la fecha de emisión." };
                }
                else if (dto.ValidaHasta < today)
                {
                    errores["ValidaHasta"] = new[] { "La fecha de vigencia no puede ser anterior a la fecha actual." };
                }

                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevaReceta = new Receta
                {
                    ConsultaId = dto.ConsultaId,
                    FechaEmision = dto.FechaEmision,
                    ValidaHasta = dto.ValidaHasta
                };

                await repo.CrearAsync(nuevaReceta);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/recetas/{nuevaReceta.Id}", nuevaReceta);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para editar una receta por ID
            recetas.MapPut("/{id:int}", async (int id, RecetaCreateDto dto, IRepository<Receta> repo) =>
            {
                var errores = dto.Validar();

                var today = ChileTimeHelper.Today;
                if (dto.ValidaHasta < dto.FechaEmision)
                {
                    errores["ValidaHasta"] = new[] { "La fecha de vigencia no puede ser anterior a la fecha de emisión." };
                }

                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var recetaExistente = await repo.ObtenerPorIdAsync(id);
                if (recetaExistente is null) return Results.NotFound("La receta no existe");

                recetaExistente.ConsultaId = dto.ConsultaId;
                recetaExistente.FechaEmision = dto.FechaEmision;
                recetaExistente.ValidaHasta = dto.ValidaHasta;

                await repo.GuardarCambiosAsync();
                return Results.Ok(recetaExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para eliminar recetas
            recetas.MapDelete("/{id:int}", async (int id, IRepository<Receta> repo) =>
            {
                var recetaExistente = await repo.ObtenerPorIdAsync(id);
                if (recetaExistente is null) return Results.NotFound();

                await repo.EliminarAsync(recetaExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record RecetaCreateDto(
            [property: Required(ErrorMessage = "El ID de la consulta es obligatorio.")]
            [property: Range(1, int.MaxValue, ErrorMessage = "El ID de la consulta debe ser un número entero positivo.")]
            int ConsultaId,

            [property: Required(ErrorMessage = "La fecha de emisión es obligatoria.")]
            DateOnly FechaEmision,

            [property: Required(ErrorMessage = "La fecha de vencimiento (Válida Hasta) es obligatoria.")]
            DateOnly ValidaHasta
        );
    }
}
