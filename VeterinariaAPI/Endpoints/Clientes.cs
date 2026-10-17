using System.ComponentModel.DataAnnotations;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;

namespace VeterinariaAPI.Endpoints
{
    public static class ClientesApi
    {
        public static void MapClienteApi(this WebApplication app)
        {
            var clientes = app.MapGroup("/api/v1/clientes").WithTags("Clientes (v1)");

            // API para listar clientes
            clientes.MapGet("/", async (IRepository<Cliente> repo) =>
            {
                var listaClientes = await repo.ObtenerTodosAsync();
                return Results.Ok(listaClientes);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para obtener un cliente por ID
            clientes.MapGet("/{id:int}", async (int id, IRepository<Cliente> repo) =>
            {
                var cliente = await repo.ObtenerPorIdAsync(id);
                return cliente is null ? Results.NotFound() : Results.Ok(cliente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario", "Recepcionista"));

            // API para crear un cliente
            clientes.MapPost("/", async (ClienteCreateDto dto, IRepository<Cliente> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var nuevoCliente = new Cliente
                {
                    DocumentoIdentidad = dto.DocumentoIdentidad,
                    NombreCompleto = dto.NombreCompleto,
                    Telefono = dto.Telefono,
                    Email = dto.Email
                };

                await repo.CrearAsync(nuevoCliente);
                await repo.GuardarCambiosAsync();

                return Results.Created($"/api/v1/clientes/{nuevoCliente.Id}", nuevoCliente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Veterinario"));

            // API para editar un cliente por ID
            clientes.MapPut("/{id:int}", async (int id, ClienteCreateDto dto, IRepository<Cliente> repo) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var clienteExistente = await repo.ObtenerPorIdAsync(id);
                if (clienteExistente is null) return Results.NotFound();

                clienteExistente.DocumentoIdentidad = dto.DocumentoIdentidad;
                clienteExistente.NombreCompleto = dto.NombreCompleto;
                clienteExistente.Telefono = dto.Telefono;
                clienteExistente.Email = dto.Email;

                await repo.GuardarCambiosAsync();
                return Results.Ok(clienteExistente);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // API para eliminar cliente
            clientes.MapDelete("/{id:int}", async (int id, IRepository<Cliente> repo) =>
            {
                var clienteExistente = await repo.ObtenerPorIdAsync(id);
                if (clienteExistente is null) return Results.NotFound();

                await repo.EliminarAsync(clienteExistente);
                await repo.GuardarCambiosAsync();
                return Results.NoContent();
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));
        }

        // DTO estructurado con el prefijo 'property:' para la correcta validación por reflexión
        public record ClienteCreateDto(
            [property: Required(ErrorMessage = "El documento de identidad es obligatorio.")]
            [property: StringLength(20, ErrorMessage = "El documento de identidad no puede superar los 20 caracteres.")]
            string DocumentoIdentidad,

            [property: Required(ErrorMessage = "El nombre completo es obligatorio.")]
            [property: StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre completo debe tener entre 3 y 100 caracteres.")]
            string NombreCompleto,

            [property: Required(ErrorMessage = "El teléfono es obligatorio.")]
            [property: Phone(ErrorMessage = "El formato del teléfono no es válido.")]
            string Telefono,

            [property: Required(ErrorMessage = "El correo electrónico es obligatorio.")]
            [property: EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
            string Email
        );
    }
}