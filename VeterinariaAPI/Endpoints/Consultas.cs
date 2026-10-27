using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class ConsultasApi
    {
        public static void MapConsultasApi(this WebApplication app)
        {
            var consultas = app.MapGroup("/api/v1/consultas").WithTags("Consultas (v1)");

            // API para listar consultas con paginación y orden por recencia (Id descendente)
            consultas.MapGet("/", async (int? page, int? pageSize, string? search, int? pacienteId, VeterinariodbContext db) =>
            {
                var query = db.Consultas.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var q = search.Trim().ToLower();
                    query = query.Where(c => c.Motivo.ToLower().Contains(q) ||
                                             (c.Diagnostico != null && c.Diagnostico.ToLower().Contains(q)));
                }

                if (pacienteId.HasValue && pacienteId.Value > 0)
                {
                    query = query.Where(c => c.PacienteId == pacienteId.Value);
                }

                // Criterio de recencia: ID descendente
                query = query.OrderByDescending(c => c.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var items = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    return Results.Ok(new PagedResult<Consulta>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                return Results.Ok(await query.ToListAsync());
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para obtener consulta por ID
            consultas.MapGet("/{id:int}", async (int id, IRepository<Consulta> repo) =>
            {
                var consulta = await repo.ObtenerPorIdAsync(id);
                return consulta is null ? Results.NotFound() : Results.Ok(consulta);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear una consulta
            consultas.MapPost("/", async (ConsultaCreateDto dto, IRepository<Consulta> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevaConsulta = new Consulta
                {
                    PacienteId = dto.PacienteId,
                    CitaId = dto.CitaId,
                    Motivo = dto.Motivo,
                    Diagnostico = dto.Diagnostico
                };

                await repo.CrearAsync(nuevaConsulta);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/consultas/{nuevaConsulta.Id}", nuevaConsulta);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para editar consulta por ID
            consultas.MapPut("/{id:int}", async (int id, ConsultaCreateDto dto, IRepository<Consulta> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var consultaExistente = await repo.ObtenerPorIdAsync(id);
                if (consultaExistente is null) return Results.NotFound();

                consultaExistente.PacienteId = dto.PacienteId;
                consultaExistente.CitaId = dto.CitaId;
                consultaExistente.Motivo = dto.Motivo;
                consultaExistente.Diagnostico = dto.Diagnostico;

                await repo.GuardarCambiosAsync();
                return Results.Ok(consultaExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para eliminar consultas
            consultas.MapDelete("/{id:int}", async (int id, IRepository<Consulta> repo) =>
            {
                var consultaExistente = await repo.ObtenerPorIdAsync(id);
                if (consultaExistente is null) return Results.NotFound();

                await repo.EliminarAsync(consultaExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record ConsultaCreateDto(
            [property: Required(ErrorMessage = "El ID del paciente es obligatorio.")]
            [property: Range(1, int.MaxValue, ErrorMessage = "El ID del paciente debe ser un número entero positivo.")]
            int PacienteId,

            int? CitaId,

            [property: Required(ErrorMessage = "El motivo de la consulta es obligatorio.")]
            [property: StringLength(250, MinimumLength = 3, ErrorMessage = "El motivo debe tener entre 3 y 250 caracteres.")]
            string Motivo,

            [property: Required(ErrorMessage = "El diagnóstico es obligatorio.")]
            [property: StringLength(1000, MinimumLength = 3, ErrorMessage = "El diagnóstico debe tener entre 3 y 1000 caracteres.")]
            string Diagnostico
        );
    }
}
