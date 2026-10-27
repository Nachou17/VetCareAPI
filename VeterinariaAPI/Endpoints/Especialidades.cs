using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class EspecialidadesApi
    {
        public static void MapEspecialidadApi(this WebApplication app)
        {
            var especialidad = app.MapGroup("/api/v1/especialidades").WithTags("Especialidades (v1)");

            // API para listar especialidades con paginación y orden por recencia (Id descendente)
            especialidad.MapGet("/", async (int? page, int? pageSize, string? search, VeterinariodbContext db) =>
            {
                var query = db.Especialidades.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var q = search.Trim().ToLower();
                    query = query.Where(e => e.Nombre.ToLower().Contains(q));
                }

                // Criterio de recencia: ID descendente
                query = query.OrderByDescending(e => e.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var items = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    return Results.Ok(new PagedResult<Especialidade>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                return Results.Ok(await query.ToListAsync());
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para crear una especialidad
            especialidad.MapPost("/", async (EspecialidadCreateDto dto, IRepository<Especialidade> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevaEspecialidad = new Especialidade
                {
                    Nombre = dto.Nombre,
                    CostoBase = dto.CostoBase
                };

                await repo.CrearAsync(nuevaEspecialidad);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/especialidades/{nuevaEspecialidad.Id}", nuevaEspecialidad);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // API para editar especialidad por ID
            especialidad.MapPut("/{id:int}", async (int id, EspecialidadCreateDto dto, IRepository<Especialidade> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var especialidadExistente = await repo.ObtenerPorIdAsync(id);
                if (especialidadExistente is null) return Results.NotFound();

                especialidadExistente.Nombre = dto.Nombre;
                especialidadExistente.CostoBase = dto.CostoBase;

                await repo.GuardarCambiosAsync();
                return Results.Ok(especialidadExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // API para eliminar especialidades
            especialidad.MapDelete("/{id:int}", async (int id, IRepository<Especialidade> repo) =>
            {
                var especialidadExistente = await repo.ObtenerPorIdAsync(id);
                if (especialidadExistente is null) return Results.NotFound();

                await repo.EliminarAsync(especialidadExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record EspecialidadCreateDto(
            [property: Required(ErrorMessage = "El nombre de la especialidad es obligatorio.")]
            [property: StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres.")]
            string Nombre,

            [property: Required(ErrorMessage = "El costo base es obligatorio.")]
            [property: Range(0.0, 10000000.0, ErrorMessage = "El costo base debe ser mayor o igual a 0.")]
            decimal CostoBase
        );
    }
}
