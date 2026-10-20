using System.ComponentModel.DataAnnotations;
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

            // API para listar insumos
            insumos.MapGet("/", async (IRepository<Insumo> repo) =>
            {
                var listaInsumos = await repo.ObtenerTodosAsync();
                return Results.Ok(listaInsumos);
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
