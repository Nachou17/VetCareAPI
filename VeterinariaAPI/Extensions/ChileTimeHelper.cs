using System;

namespace VeterinariaAPI.Extensions
{
    public static class ChileTimeHelper
    {
        private static readonly Lazy<TimeZoneInfo> SantiagoTimeZone = new(() =>
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("America/Santiago");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Pacific SA Standard Time");
            }
        });

        public static TimeZoneInfo TimeZone => SantiagoTimeZone.Value;

        /// <summary>
        /// Obtiene la fecha y hora actual en la zona horaria de Chile (America/Santiago).
        /// </summary>
        public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZone);

        /// <summary>
        /// Obtiene la fecha local actual de Chile (DateOnly) sin desfase UTC de medianoche.
        /// </summary>
        public static DateOnly Today => DateOnly.FromDateTime(Now);

        /// <summary>
        /// Convierte un DateTime recibido desde cliente (ej. input datetime-local sin offset)
        /// interpretado como hora local de Chile a su instante exacto UTC.
        /// </summary>
        public static DateTime ToChileUtc(this DateTime dt)
        {
            if (dt.Kind == DateTimeKind.Utc)
            {
                return dt;
            }

            var unspecified = DateTime.SpecifyKind(dt, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(unspecified, TimeZone);
        }
    }
}
