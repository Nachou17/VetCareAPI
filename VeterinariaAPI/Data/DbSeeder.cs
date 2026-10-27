using Microsoft.EntityFrameworkCore;
using VeterinariaAPI.Models;
using VeterinariaAPI.Services;

namespace VeterinariaAPI.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<VeterinariodbContext>();
            var auth = scope.ServiceProvider.GetRequiredService<AuthService>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            try
            {
                // Sembrado de demostración condicionado a configuración explícita
                var seedEnabled = config.GetValue<bool>("SeedDemoData", false);
                if (!seedEnabled)
                {
                    logger.LogInformation("ℹ️ [DbSeeder] Sembrado de datos de prueba omitido (configuración 'SeedDemoData': false).");
                    return;
                }

                // Verificar si la base de datos es accesible
                if (!await context.Database.CanConnectAsync())
                {
                    logger.LogWarning("⚠️ [DbSeeder] No se pudo conectar a la base de datos SQL Server. Se omite el sembrado inicial.");
                    return;
                }

                logger.LogInformation("🌱 [DbSeeder] Verificando e inicializando datos de prueba en 'veterinariodb'...");

                // 1. ROLES
                if (!await context.Roles.AnyAsync())
                {
                    logger.LogInformation("  -> Sembrando roles...");
                    var roles = new List<Role>
                    {
                        new Role { Nombre = "Administrador", PermisosEscritura = true },
                        new Role { Nombre = "Veterinario", PermisosEscritura = true },
                        new Role { Nombre = "Recepcionista", PermisosEscritura = false }
                    };
                    await context.Roles.AddRangeAsync(roles);
                    await context.SaveChangesAsync();
                }

                var adminRol = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Administrador") ?? await context.Roles.FirstAsync();
                var vetRol = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Veterinario") ?? await context.Roles.FirstAsync();
                var recepRol = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Recepcionista") ?? await context.Roles.FirstAsync();

                // Contraseñas de cuentas demo configurables de forma local (variables de entorno o configuración)
                var adminPass = config["SeedDemoPasswords:Admin"] ?? config["SeedDemoPassword"] ?? "Admin123!";
                var vetPass = config["SeedDemoPasswords:Vet"] ?? "Vet123!";
                var recepPass = config["SeedDemoPasswords:Recep"] ?? "Recep123!";

                // 2. USUARIOS (solo crea cuentas iniciales si no existen; nunca sobreescribe contraseñas existentes)
                var adminUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "admin@veterinaria.com");
                if (adminUser == null)
                {
                    logger.LogInformation("  -> Sembrando usuario Administrador con BCrypt...");
                    adminUser = new Usuario
                    {
                        RolId = adminRol.Id,
                        NombreCompleto = "Dr. Carlos Mendoza (Admin)",
                        Email = "admin@veterinaria.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPass)
                    };
                    await context.Usuarios.AddAsync(adminUser);
                    await context.SaveChangesAsync();
                }

                var vetUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "vet@veterinaria.com");
                if (vetUser == null)
                {
                    logger.LogInformation("  -> Sembrando usuario Veterinario con BCrypt...");
                    vetUser = new Usuario
                    {
                        RolId = vetRol.Id,
                        NombreCompleto = "Dra. Valentina Ríos (Veterinaria)",
                        Email = "vet@veterinaria.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(vetPass)
                    };
                    await context.Usuarios.AddAsync(vetUser);
                    await context.SaveChangesAsync();
                }

                var recepUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "recepcion@veterinaria.com");
                if (recepUser == null)
                {
                    logger.LogInformation("  -> Sembrando usuario Recepcionista con BCrypt...");
                    recepUser = new Usuario
                    {
                        RolId = recepRol.Id,
                        NombreCompleto = "Martín Soto (Recepción)",
                        Email = "recepcion@veterinaria.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(recepPass)
                    };
                    await context.Usuarios.AddAsync(recepUser);
                    await context.SaveChangesAsync();
                }

                var vetResponsable = await context.Usuarios.FirstOrDefaultAsync(u => u.RolId == vetRol.Id) 
                                     ?? await context.Usuarios.FirstAsync();

                // 3. ESPECIALIDADES
                if (await context.Especialidades.CountAsync() < 3)
                {
                    logger.LogInformation("  -> Sembrando catálogo de especialidades...");
                    var especialidadesBase = new List<Especialidade>
                    {
                        new Especialidade { Nombre = "Medicina General", CostoBase = 25000m },
                        new Especialidade { Nombre = "Cirugía General", CostoBase = 45000m },
                        new Especialidade { Nombre = "Dermatología", CostoBase = 35000m },
                        new Especialidade { Nombre = "Cardiología", CostoBase = 40000m }
                    };

                    foreach (var esp in especialidadesBase)
                    {
                        if (!await context.Especialidades.AnyAsync(e => e.Nombre == esp.Nombre))
                        {
                            await context.Especialidades.AddAsync(esp);
                        }
                    }
                    await context.SaveChangesAsync();
                }

                var espList = await context.Especialidades.ToListAsync();

                // 4. CLIENTES
                if (await context.Clientes.CountAsync() < 5)
                {
                    logger.LogInformation("  -> Sembrando clientes tutores...");
                    var clientesBase = new List<Cliente>
                    {
                        new Cliente { DocumentoIdentidad = "12.345.678-9", NombreCompleto = "Juan Pérez González", Telefono = "+56911223344", Email = "juan.perez@gmail.com" },
                        new Cliente { DocumentoIdentidad = "15.678.901-2", NombreCompleto = "María Ignacia López", Telefono = "+56922334455", Email = "maria.lopez@gmail.com" },
                        new Cliente { DocumentoIdentidad = "18.234.567-8", NombreCompleto = "Carlos Silva Morales", Telefono = "+56933445566", Email = "carlos.silva@hotmail.com" },
                        new Cliente { DocumentoIdentidad = "9.876.543-2", NombreCompleto = "Ana Luisa Torres", Telefono = "+56944556677", Email = "ana.torres@outlook.com" },
                        new Cliente { DocumentoIdentidad = "14.567.890-K", NombreCompleto = "Roberto Gómez Castro", Telefono = "+56955667788", Email = "roberto.gomez@gmail.com" }
                    };

                    foreach (var cli in clientesBase)
                    {
                        if (!await context.Clientes.AnyAsync(c => c.DocumentoIdentidad == cli.DocumentoIdentidad))
                        {
                            await context.Clientes.AddAsync(cli);
                        }
                    }
                    await context.SaveChangesAsync();
                }

                var cliList = await context.Clientes.ToListAsync();

                // 5. PACIENTES
                if (await context.Pacientes.CountAsync() < 8)
                {
                    logger.LogInformation("  -> Sembrando pacientes veterinarios...");
                    var pacientesBase = new List<(string Nombre, string Especie, string Raza, decimal Peso, string Alergias)>
                    {
                        ("Thor", "Perro", "Golden Retriever", 32.5m, "Ninguna"),
                        ("Luna", "Gato", "Siamés", 4.2m, "Alergia a picadura de pulgas"),
                        ("Rocky", "Perro", "Bulldog Francés", 12.0m, "Alergia a la proteína de pollo"),
                        ("Misi", "Gato", "Persa", 3.8m, "Ninguna"),
                        ("Lucas", "Ave", "Canario", 0.05m, "Ninguna"),
                        ("Max", "Perro", "Pastor Alemán", 35.0m, "Alergia estacional a gramíneas"),
                        ("Bella", "Perro", "Poodle Toy", 5.1m, "Ninguna"),
                        ("Simón", "Gato", "Europeo Común", 4.8m, "Ninguna")
                    };

                    int cliIndex = 0;
                    foreach (var p in pacientesBase)
                    {
                        if (!await context.Pacientes.AnyAsync(pac => pac.Nombre == p.Nombre))
                        {
                            var targetCliente = cliList[cliIndex % cliList.Count];
                            await context.Pacientes.AddAsync(new Paciente
                            {
                                ClienteId = targetCliente.Id,
                                Nombre = p.Nombre,
                                Especie = p.Especie,
                                Raza = p.Raza,
                                Peso = p.Peso,
                                Alergias = p.Alergias
                            });
                        }
                        cliIndex++;
                    }
                    await context.SaveChangesAsync();
                }

                var pacList = await context.Pacientes.ToListAsync();

                // 6. INSUMOS Y FARMACIA
                if (await context.Insumos.CountAsync() < 6)
                {
                    logger.LogInformation("  -> Sembrando insumos y medicamentos...");
                    var insumosBase = new List<Insumo>
                    {
                        new Insumo { NombreProducto = "Amoxicilina 250mg", Tipo = "Medicamento", StockActual = 45, PrecioUnitario = 12500m },
                        new Insumo { NombreProducto = "Meloxicam 1mg", Tipo = "Medicamento", StockActual = 8, PrecioUnitario = 16800m }, // Stock bajo
                        new Insumo { NombreProducto = "Vacuna Antirrábica Rabisin", Tipo = "Vacuna", StockActual = 30, PrecioUnitario = 18500m },
                        new Insumo { NombreProducto = "NexGard Spectra Antiparasitario", Tipo = "Antiparasitario", StockActual = 4, PrecioUnitario = 24990m }, // Stock crítico
                        new Insumo { NombreProducto = "Clorhexidina Spray 0.5%", Tipo = "Material Quirúrgico", StockActual = 15, PrecioUnitario = 9500m },
                        new Insumo { NombreProducto = "Complejo Vitamínico Canino", Tipo = "Alimento / Suplemento", StockActual = 20, PrecioUnitario = 14000m }
                    };

                    foreach (var ins in insumosBase)
                    {
                        if (!await context.Insumos.AnyAsync(i => i.NombreProducto == ins.NombreProducto))
                        {
                            await context.Insumos.AddAsync(ins);
                        }
                    }
                    await context.SaveChangesAsync();
                }

                var insumoList = await context.Insumos.ToListAsync();

                // 7. CITAS
                if (await context.Citas.CountAsync() < 4)
                {
                    logger.LogInformation("  -> Sembrando citas médicas...");
                    var hoy = DateTime.UtcNow;
                    var esp0 = espList[0];
                    var esp1 = espList.Count > 1 ? espList[1] : esp0;
                    var esp2 = espList.Count > 2 ? espList[2] : esp0;

                    var citasNuevas = new List<Cita>
                    {
                        new Cita
                        {
                            PacienteId = pacList[0].Id,
                            UsuarioId = vetResponsable.Id,
                            EspecialidadId = esp1.Id,
                            FechaHora = hoy.AddDays(-2),
                            Estado = "Realizada"
                        },
                        new Cita
                        {
                            PacienteId = pacList[1 % pacList.Count].Id,
                            UsuarioId = vetResponsable.Id,
                            EspecialidadId = esp2.Id,
                            FechaHora = hoy.AddDays(-1),
                            Estado = "Realizada"
                        },
                        new Cita
                        {
                            PacienteId = pacList[2 % pacList.Count].Id,
                            UsuarioId = vetResponsable.Id,
                            EspecialidadId = esp0.Id,
                            FechaHora = hoy.AddHours(4),
                            Estado = "Confirmada"
                        },
                        new Cita
                        {
                            PacienteId = pacList[3 % pacList.Count].Id,
                            UsuarioId = vetResponsable.Id,
                            EspecialidadId = esp1.Id,
                            FechaHora = hoy.AddDays(1).AddHours(2),
                            Estado = "Pendiente"
                        }
                    };
                    await context.Citas.AddRangeAsync(citasNuevas);
                    await context.SaveChangesAsync();
                }

                var citasList = await context.Citas.ToListAsync();

                // 8. CONSULTAS MÉDICAS
                if (await context.Consultas.CountAsync() < 2)
                {
                    logger.LogInformation("  -> Sembrando consultas médicas clínicas...");
                    var citaRealizada1 = citasList.FirstOrDefault(c => c.Estado == "Realizada") ?? citasList[0];
                    var citaRealizada2 = citasList.LastOrDefault(c => c.Estado == "Realizada") ?? citasList[0];

                    var consultasNuevas = new List<Consulta>
                    {
                        new Consulta
                        {
                            PacienteId = citaRealizada1.PacienteId,
                            CitaId = citaRealizada1.Id,
                            Motivo = "Control post-operatorio y retiro de puntos quirúrgicos",
                            Diagnostico = "Evolución clínica favorable, herida limpia y cicatrizada. Se retiran puntos y se indica analgésico preventivo."
                        },
                        new Consulta
                        {
                            PacienteId = citaRealizada2.PacienteId,
                            CitaId = citaRealizada2.Id,
                            Motivo = "Dermatitis por picadura de pulga con prurito intenso",
                            Diagnostico = "Dermatitis alérgica por pulgas (DAPP) confirmada con eritema abdominal. Se indica tratamiento antibiótico y desparasitación estricta."
                        }
                    };
                    await context.Consultas.AddRangeAsync(consultasNuevas);
                    await context.SaveChangesAsync();
                }

                var consultasList = await context.Consultas.ToListAsync();

                // 9. RECETAS MÉDICAS Y DETALLES
                if (await context.Recetas.CountAsync() < 2)
                {
                    logger.LogInformation("  -> Sembrando recetas médicas...");
                    var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
                    var cons1 = consultasList[0];
                    var cons2 = consultasList.Count > 1 ? consultasList[1] : cons1;

                    var receta1 = new Receta
                    {
                        ConsultaId = cons1.Id,
                        FechaEmision = todayDate,
                        ValidaHasta = todayDate.AddDays(15)
                    };
                    var receta2 = new Receta
                    {
                        ConsultaId = cons2.Id,
                        FechaEmision = todayDate,
                        ValidaHasta = todayDate.AddDays(30)
                    };

                    await context.Recetas.AddRangeAsync(receta1, receta2);
                    await context.SaveChangesAsync();

                    var ins0 = insumoList[0];
                    var ins1 = insumoList.Count > 1 ? insumoList[1] : ins0;

                    var detalleReceta1 = new DetallesRecetum
                    {
                        RecetaId = receta1.Id,
                        InsumoId = ins1.Id,
                        Dosis = "1 comprimido cada 24 horas vía oral con alimento",
                        DuracionDias = 5
                    };
                    var detalleReceta2 = new DetallesRecetum
                    {
                        RecetaId = receta2.Id,
                        InsumoId = ins0.Id,
                        Dosis = "1/2 comprimido cada 12 horas vía oral",
                        DuracionDias = 7
                    };

                    await context.DetallesReceta.AddRangeAsync(detalleReceta1, detalleReceta2);
                    await context.SaveChangesAsync();
                }

                // 10. FACTURAS Y DETALLES
                if (await context.Facturas.CountAsync() < 2)
                {
                    logger.LogInformation("  -> Sembrando facturas y cobros...");
                    var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
                    var cons1 = consultasList[0];
                    var cons2 = consultasList.Count > 1 ? consultasList[1] : cons1;

                    var cli1 = cliList[0];
                    var cli2 = cliList.Count > 1 ? cliList[1] : cli1;

                    var subtotal1 = 35000m;
                    var iva1 = Math.Round(subtotal1 * 0.19m);
                    var factura1 = new Factura
                    {
                        ClienteId = cli1.Id,
                        FechaEmision = todayDate,
                        MontoImpuestos = iva1,
                        MontoTotal = subtotal1 + iva1
                    };

                    var subtotal2 = 25000m;
                    var iva2 = Math.Round(subtotal2 * 0.19m);
                    var factura2 = new Factura
                    {
                        ClienteId = cli2.Id,
                        FechaEmision = todayDate,
                        MontoImpuestos = iva2,
                        MontoTotal = subtotal2 + iva2
                    };

                    await context.Facturas.AddRangeAsync(factura1, factura2);
                    await context.SaveChangesAsync();

                    var detalleFac1 = new DetallesFactura
                    {
                        FacturaId = factura1.Id,
                        ConsultaId = cons1.Id,
                        InsumoId = null,
                        Subtotal = subtotal1
                    };

                    var detalleFac2 = new DetallesFactura
                    {
                        FacturaId = factura2.Id,
                        ConsultaId = cons2.Id,
                        InsumoId = null,
                        Subtotal = subtotal2
                    };

                    await context.DetallesFacturas.AddRangeAsync(detalleFac1, detalleFac2);
                    await context.SaveChangesAsync();
                }

                logger.LogInformation("✅ [DbSeeder] Poblado de datos iniciales completado exitosamente.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ [DbSeeder] Ocurrió un error al ejecutar el sembrador de base de datos.");
            }
        }

        /// <summary>
        /// Restablece los hashes de contraseña de las cuentas de demostración existentes
        /// y asegura la correspondencia con sus roles respectivos.
        /// Solo debe ejecutarse manualmente en entorno Development mediante la configuración
        /// ResetDemoPasswords: true. Nunca se ejecuta automáticamente en cada inicio.
        /// </summary>
        public static async Task ResetDemoPasswordsAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<VeterinariodbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            logger.LogWarning("⚠️  [DbSeeder] ResetDemoPasswords activado. Actualizando hashes y roles de cuentas demo...");

            if (!await context.Database.CanConnectAsync())
            {
                logger.LogError("❌ [DbSeeder] No se pudo conectar a la base de datos. Se cancela el restablecimiento.");
                return;
            }

            var adminRol = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Administrador");
            var vetRol = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Veterinario");
            var recepRol = await context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Recepcionista");

            var adminPass = config["SeedDemoPasswords:Admin"] ?? config["SeedDemoPassword"] ?? "Admin123!";
            var vetPass   = config["SeedDemoPasswords:Vet"]   ?? "Vet123!";
            var recepPass = config["SeedDemoPasswords:Recep"] ?? "Recep123!";

            var demoAccounts = new[]
            {
                ("admin@veterinaria.com",     adminPass, adminRol?.Id),
                ("vet@veterinaria.com",       vetPass,   vetRol?.Id),
                ("recepcion@veterinaria.com", recepPass, recepRol?.Id),
            };

            int updated = 0;
            foreach (var (email, password, expectedRolId) in demoAccounts)
            {
                var user = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
                if (user is null)
                {
                    logger.LogWarning("  -> Cuenta '{Email}' no encontrada en la base de datos, se omite.", email);
                    continue;
                }

                if (expectedRolId.HasValue && user.RolId != expectedRolId.Value)
                {
                    user.RolId = expectedRolId.Value;
                    logger.LogInformation("  -> Rol sincronizado a Id {RolId} para '{Email}'.", expectedRolId.Value, email);
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                updated++;
                logger.LogInformation("  -> Hash actualizado para '{Email}'.", email);
            }

            await context.SaveChangesAsync();
            logger.LogWarning("✅ [DbSeeder] Restablecimiento completado: {Count} cuenta(s) actualizadas con sus roles. " +
                "Desactiva 'ResetDemoPasswords' antes de continuar.", updated);
        }
    }
}
