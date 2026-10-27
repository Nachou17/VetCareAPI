using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VeterinariaAPI.Data;
using VeterinariaAPI.Extensions;
using VeterinariaAPI.Models;
using VeterinariaAPI.Repositories;
using VeterinariaAPI.Services;

namespace VeterinariaAPI.Endpoints
{
    public static class UsuariosApi
    {
        public static void MapUsuariosApi(this WebApplication app)
        {
            var usuarios = app.MapGroup("/api/v1/usuarios").WithTags("Usuarios (v1)");

            // API para listar usuarios (solo Administrador) con paginación y orden por recencia
            usuarios.MapGet("/", async (int? page, int? pageSize, string? search, VeterinariodbContext db) =>
            {
                var query = db.Usuarios.Include(u => u.Rol).AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var q = search.Trim().ToLower();
                    query = query.Where(u => u.NombreCompleto.ToLower().Contains(q) ||
                                             u.Email.ToLower().Contains(q));
                }

                query = query.OrderByDescending(u => u.Id);

                if (page.HasValue)
                {
                    var p = Math.Max(1, page.Value);
                    var ps = Math.Clamp(pageSize ?? 10, 1, 100);
                    var total = await query.CountAsync();
                    var pagedUsers = await query.Skip((p - 1) * ps).Take(ps).ToListAsync();

                    var items = pagedUsers.Select(u => new UsuarioResponseDto(
                        u.Id,
                        u.NombreCompleto,
                        u.Email,
                        u.Rol != null ? u.Rol.Nombre : "Sin Rol"
                    )).ToList();

                    return Results.Ok(new PagedResult<UsuarioResponseDto>
                    {
                        Items = items,
                        Page = p,
                        PageSize = ps,
                        TotalItems = total
                    });
                }

                var listaUsuarios = await query.ToListAsync();
                var respuesta = listaUsuarios.Select(u => new UsuarioResponseDto(
                    u.Id,
                    u.NombreCompleto,
                    u.Email,
                    u.Rol != null ? u.Rol.Nombre : "Sin Rol"
                ));

                return Results.Ok(respuesta);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // API para registrar/crear un usuario (Protegido con AuthPolicy - solo Administrador)
            async Task<IResult> RegistrarUsuarioHandler(UsuarioRegisterDto dto, VeterinariodbContext db, AuthService auth)
            {
                // Validar DTO antes de procesar
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                // Verificar existencia y validez del rol
                var rol = await db.Roles.FindAsync(dto.RolId);
                if (rol is null)
                {
                    return Results.BadRequest(new
                    {
                        status = StatusCodes.Status400BadRequest,
                        error = "Rol no encontrado",
                        message = "El rol especificado no existe."
                    });
                }

                // Regla de seguridad: Solo se permite crear usuarios con rol Veterinario o Recepcionista (nunca Administrador)
                if (string.Equals(rol.Nombre, "Administrador", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.BadRequest(new
                    {
                        status = StatusCodes.Status400BadRequest,
                        error = "Operación no permitida",
                        message = "No se permite registrar nuevos usuarios con el rol Administrador."
                    });
                }

                var nuevoUsuario = new Usuario
                {
                    RolId = dto.RolId,
                    NombreCompleto = dto.NombreCompleto,
                    Email = dto.Email
                };

                nuevoUsuario.PasswordHash = auth.HashPassword(nuevoUsuario, dto.Password);

                await db.Usuarios.AddAsync(nuevoUsuario);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/usuarios/{nuevoUsuario.Id}", new
                {
                    nuevoUsuario.Id,
                    nuevoUsuario.NombreCompleto,
                    nuevoUsuario.Email,
                    nuevoUsuario.RolId
                });
            }

            usuarios.MapPost("/register", RegistrarUsuarioHandler)
                .RequireRateLimiting("AuthPolicy")
                .RequireAuthorization(policy => policy.RequireRole("Administrador"));

            usuarios.MapPost("/", RegistrarUsuarioHandler)
                .RequireRateLimiting("AuthPolicy")
                .RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // API para editar usuario por ID (solo Administrador)
            usuarios.MapPut("/{id:int}", async (int id, UsuarioUpdateDto dto, VeterinariodbContext db, AuthService auth) =>
            {
                var errores = dto.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var usuarioExistente = await db.Usuarios.Include(u => u.Rol).FirstOrDefaultAsync(u => u.Id == id);
                if (usuarioExistente is null) return Results.NotFound();

                // Si se envía un rol para actualizar
                if (dto.RolId > 0)
                {
                    var rol = await db.Roles.FindAsync(dto.RolId);
                    if (rol is null)
                    {
                        return Results.BadRequest(new
                        {
                            status = StatusCodes.Status400BadRequest,
                            error = "Rol no encontrado",
                            message = "El rol especificado no existe."
                        });
                    }

                    // Regla de seguridad: No se puede cambiar el rol a Administrador
                    if (string.Equals(rol.Nombre, "Administrador", StringComparison.OrdinalIgnoreCase))
                    {
                        return Results.BadRequest(new
                        {
                            status = StatusCodes.Status400BadRequest,
                            error = "Operación no permitida",
                            message = "No se permite asignar el rol Administrador a un usuario."
                        });
                    }

                    usuarioExistente.RolId = dto.RolId;
                }

                if (!string.IsNullOrWhiteSpace(dto.NombreCompleto))
                {
                    usuarioExistente.NombreCompleto = dto.NombreCompleto.Trim();
                }

                if (!string.IsNullOrWhiteSpace(dto.Email))
                {
                    usuarioExistente.Email = dto.Email.Trim().ToLowerInvariant();
                }

                if (!string.IsNullOrWhiteSpace(dto.Password))
                {
                    usuarioExistente.PasswordHash = auth.HashPassword(usuarioExistente, dto.Password);
                }

                await db.SaveChangesAsync();

                var rolActualizado = await db.Roles.FindAsync(usuarioExistente.RolId);

                return Results.Ok(new UsuarioResponseDto(
                    usuarioExistente.Id,
                    usuarioExistente.NombreCompleto,
                    usuarioExistente.Email,
                    rolActualizado?.Nombre ?? "Sin Rol"
                ));
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // API para Iniciar Sesión (Login) y obtener JWT Token (Protegido con AuthPolicy - público)
            usuarios.MapPost("/login", async (LoginRequest login, IUsuarioRepository repo, AuthService auth, IConfiguration config) =>
            {
                // Validar credenciales de entrada
                var errores = login.Validar();
                if (errores.Count > 0)
                {
                    return Results.ValidationProblem(errores);
                }

                var usuario = await repo.ObtenerPorEmailAsync(login.Email);

                if (usuario is null || !auth.VerifyPassword(usuario, login.Password))
                    return Results.Unauthorized();

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Name, usuario.NombreCompleto),
                    new Claim(ClaimTypes.Email, usuario.Email),
                    new Claim(ClaimTypes.Role, usuario.Rol?.Nombre ?? "Cliente")
                };

                var jwtKey = config["Jwt:Key"]!;
                var jwtIssuer = config["Jwt:Issuer"]!;
                var jwtAudience = config["Jwt:Audience"]!;
                var jwtExpireMinutes = config["Jwt:ExpireMinutes"]!;

                if (!double.TryParse(jwtExpireMinutes, out var expireMinutes) || expireMinutes <= 0)
                {
                    expireMinutes = 60;
                }

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: jwtIssuer,
                    audience: jwtAudience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                    signingCredentials: credenciales
                );

                return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
            }).RequireRateLimiting("AuthPolicy");

            // API para eliminar usuario por ID (solo Administrador)
            usuarios.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, VeterinariodbContext db) =>
            {
                // Regla de seguridad: Impedir que el Administrador elimine su propia cuenta autenticada
                var currentUserIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentUserEmail = user.FindFirst(ClaimTypes.Email)?.Value;

                if (int.TryParse(currentUserIdClaim, out var currentUserId) && currentUserId == id)
                {
                    return Results.BadRequest(new
                    {
                        status = StatusCodes.Status400BadRequest,
                        error = "Operación no permitida",
                        message = "No puedes eliminar tu propia cuenta mientras estás autenticado."
                    });
                }

                var usuario = await db.Usuarios.FindAsync(id);
                if (usuario is null) return Results.NotFound();

                if (!string.IsNullOrEmpty(currentUserEmail) &&
                    string.Equals(currentUserEmail, usuario.Email, StringComparison.OrdinalIgnoreCase))
                {
                    return Results.BadRequest(new
                    {
                        status = StatusCodes.Status400BadRequest,
                        error = "Operación no permitida",
                        message = "No puedes eliminar tu propia cuenta mientras estás autenticado."
                    });
                }

                // Regla de integridad: No permitir eliminación si tiene dependencias asociadas (ej. Citas)
                var tieneCitas = await db.Citas.AnyAsync(c => c.UsuarioId == id);
                if (tieneCitas)
                {
                    return Results.Conflict(new
                    {
                        status = StatusCodes.Status409Conflict,
                        error = "Conflicto de integridad referencial",
                        message = "No se puede eliminar el usuario seleccionado porque tiene registros asociados (como citas o atenciones clínicas). Conserve los registros o reasígnelos antes de eliminar."
                    });
                }

                try
                {
                    db.Usuarios.Remove(usuario);
                    await db.SaveChangesAsync();
                    return Results.NoContent();
                }
                catch (DbUpdateException)
                {
                    return Results.Conflict(new
                    {
                        status = StatusCodes.Status409Conflict,
                        error = "Conflicto de integridad referencial",
                        message = "No se puede eliminar el usuario seleccionado porque tiene registros asociados en la base de datos."
                    });
                }
            }).RequireAuthorization(policy => policy.RequireRole("Administrador"));
        }

        public record UsuarioResponseDto(int Id, string NombreCompleto, string Email, string Rol);

        public record UsuarioUpdateDto(
            int RolId,
            string? NombreCompleto,
            string? Email,
            string? Password
        )
        {
            public Dictionary<string, string[]> Validar()
            {
                var errores = new Dictionary<string, string[]>();

                if (RolId <= 0)
                {
                    errores["RolId"] = ["El ID de rol es obligatorio y debe ser mayor a 0."];
                }

                if (!string.IsNullOrWhiteSpace(NombreCompleto) && NombreCompleto.Trim().Length < 3)
                {
                    errores["NombreCompleto"] = ["El nombre debe tener al menos 3 caracteres."];
                }

                if (!string.IsNullOrWhiteSpace(Email))
                {
                    var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
                    if (!emailRegex.IsMatch(Email.Trim()))
                    {
                        errores["Email"] = ["El formato del correo electrónico no es válido."];
                    }
                }

                if (!string.IsNullOrWhiteSpace(Password) && Password.Length < 6)
                {
                    errores["Password"] = ["La contraseña debe tener al menos 6 caracteres."];
                }

                return errores;
            }
        }

        // DTOs estructurados con el prefijo 'property:' para la correcta validación por reflexión
        public record UsuarioRegisterDto(
            [property: Required(ErrorMessage = "El ID de rol es obligatorio.")]
            int RolId,

            [property: Required(ErrorMessage = "El nombre completo es obligatorio.")]
            [property: StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres.")]
            string NombreCompleto,

            [property: Required(ErrorMessage = "El correo electrónico es obligatorio.")]
            [property: EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
            string Email,

            [property: Required(ErrorMessage = "La contraseña es obligatoria.")]
            [property: MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
            string Password
        );

        public record LoginRequest(
            [property: Required(ErrorMessage = "El correo electrónico es obligatorio.")]
            [property: EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
            string Email,

            [property: Required(ErrorMessage = "La contraseña es obligatoria.")]
            string Password
        );
    }
}
