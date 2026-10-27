using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class CitasApi
    {
        public static void MapCitasApi(this WebApplication app)
        {
            var citas = app.MapGroup("/api/v1/citas").WithTags("Citas (v1)");

            // API para listar citas con paginación y orden por recencia (FechaHora descendente)
            citas.MapGet("/", async (int? page, int? pageSize, string? estado, int? pacienteId, int? usuarioId, VeterinariodbContext db) =>
            {
                var query = db.Citas.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(estado) && estado != "todos")
                {
                    query = query.Where(c => c.Estado == estado);
                }

                if (pacienteId.HasValue && pacienteId.Value > 0)
                {
                    query = query.Where(c => c.PacienteId == pacienteId.Value);
                }

                if (usuarioId.HasValue && usuarioId.Value > 0)
                {
                    query = query.Where(c => c.UsuarioId == usuarioId.Value);
                }

                // Criterio de recencia: fecha/hora de la cita descendente, luego ID descendente
                query = query.OrderByDescending(c => c.FechaHora).ThenByDescending(c => c.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var items = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    return Results.Ok(new PagedResult<Cita>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                return Results.Ok(await query.ToListAsync());
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para obtener una cita por ID
            citas.MapGet("/{id:int}", async (int id, IRepository<Cita> repo) =>
            {
                var cita = await repo.ObtenerPorIdAsync(id);
                return cita is null ? Results.NotFound() : Results.Ok(cita);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear una cita
            citas.MapPost("/", async (CitaCreateDto dto, IRepository<Cita> repo) =>
            {
                // Validación estructurada del DTO
                var errores = dto.Validar();

                // Validación de fecha no retroactiva para agendamiento (interpreta datetime-local en America/Santiago)
                var nowUtc = DateTime.UtcNow;
                var inputUtc = dto.FechaHora.ToChileUtc();

                if (inputUtc < nowUtc.AddMinutes(-5))
                {
                    errores["FechaHora"] = new[] { "La fecha y hora de la cita no pueden ser anteriores a la fecha y hora actual." };
                }

                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevaCita = new Cita
                {
                    PacienteId = dto.PacienteId,
                    UsuarioId = dto.UsuarioId,
                    EspecialidadId = dto.EspecialidadId,
                    FechaHora = dto.FechaHora,
                    Estado = dto.Estado
                };

                await repo.CrearAsync(nuevaCita);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/citas/{nuevaCita.Id}", nuevaCita);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para editar una cita por ID
            citas.MapPut("/{id:int}", async (int id, CitaCreateDto dto, IRepository<Cita> repo) =>
            {
                var errores = dto.Validar();

                var nowUtc = DateTime.UtcNow;
                var inputUtc = dto.FechaHora.ToChileUtc();

                // Al modificar una cita pendiente o confirmada, la nueva fecha debe ser futura
                if (dto.Estado != "Realizada" && dto.Estado != "Cancelada" && inputUtc < nowUtc.AddMinutes(-5))
                {
                    errores["FechaHora"] = new[] { "La fecha y hora de la cita no pueden ser anteriores a la fecha y hora actual." };
                }

                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var citaExistente = await repo.ObtenerPorIdAsync(id);
                if (citaExistente is null) return Results.NotFound();

                citaExistente.PacienteId = dto.PacienteId;
                citaExistente.UsuarioId = dto.UsuarioId;
                citaExistente.EspecialidadId = dto.EspecialidadId;
                citaExistente.FechaHora = dto.FechaHora;
                citaExistente.Estado = dto.Estado;

                await repo.GuardarCambiosAsync();
                return Results.Ok(citaExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para eliminar citas
            citas.MapDelete("/{id:int}", async (int id, IRepository<Cita> repo) =>
            {
                var citaExistente = await repo.ObtenerPorIdAsync(id);
                if (citaExistente is null) return Results.NotFound();

                await repo.EliminarAsync(citaExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));
        }

        // DTO de entrada estructurado con reglas de validación
        public record CitaCreateDto(
            [Required(ErrorMessage = "El ID del paciente es obligatorio.")]
            [Range(1, int.MaxValue, ErrorMessage = "El ID del paciente debe ser un número entero positivo.")]
            int PacienteId,

            [Required(ErrorMessage = "El ID del usuario/veterinario es obligatorio.")]
            [Range(1, int.MaxValue, ErrorMessage = "El ID del usuario debe ser un número entero positivo.")]
            int UsuarioId,

            [Required(ErrorMessage = "El ID de la especialidad es obligatorio.")]
            [Range(1, int.MaxValue, ErrorMessage = "El ID de la especialidad debe ser un número entero positivo.")]
            int EspecialidadId,

            [Required(ErrorMessage = "La fecha y hora de la cita son obligatorias.")]
            DateTime FechaHora,

            [Required(ErrorMessage = "El estado de la cita es obligatorio.")]
            [StringLength(50, ErrorMessage = "El estado no puede superar los 50 caracteres.")]
            string Estado
        );
    }
}
