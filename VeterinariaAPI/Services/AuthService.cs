using VeterinariaAPI.Models;
using Microsoft.AspNetCore.Identity;

namespace VeterinariaAPI.Services
{
    public class AuthService
    {
        private readonly PasswordHasher<Usuario> hasher = new();

        /// <summary>
        /// Encripta la contraseña utilizando BCrypt seguro.
        /// </summary>
        public string HashPassword(Usuario usuario, string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Valida la contraseña comparando exclusivamente mediante el hash almacenado (BCrypt.Verify con fallback para hashes legacy de Identity).
        /// </summary>
        public bool VerifyPassword(Usuario usuario, string passwordIntento)
        {
            if (string.IsNullOrWhiteSpace(usuario.PasswordHash) || string.IsNullOrWhiteSpace(passwordIntento))
                return false;

            // 1. Verificación primaria con BCrypt.Verify
            if (usuario.PasswordHash.StartsWith("$2"))
            {
                try
                {
                    if (BCrypt.Net.BCrypt.Verify(passwordIntento, usuario.PasswordHash))
                        return true;
                }
                catch
                {
                    // Formato BCrypt no estándar o alterado
                }
            }

            // 2. Soporte fallback para hashes previos de ASP.NET Core Identity PasswordHasher
            try
            {
                var result = hasher.VerifyHashedPassword(usuario, usuario.PasswordHash, passwordIntento);
                if (result != PasswordVerificationResult.Failed)
                    return true;
            }
            catch
            {
                // Formato no reconocido por PasswordHasher
            }

            return false;
        }
    }
}
