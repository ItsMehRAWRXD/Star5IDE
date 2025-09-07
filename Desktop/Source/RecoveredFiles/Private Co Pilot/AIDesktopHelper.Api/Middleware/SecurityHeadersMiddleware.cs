namespace AIDesktopHelper.Api.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityHeadersMiddleware> _logger;

        public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers
            var headers = context.Response.Headers;

            // Prevent MIME type sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // Prevent clickjacking
            headers["X-Frame-Options"] = "DENY";

            // XSS protection
            headers["X-XSS-Protection"] = "1; mode=block";

            // Referrer policy
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Content Security Policy
            headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';";

            // Strict Transport Security (HTTPS only)
            if (context.Request.IsHttps)
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            }

            // Permissions Policy
            headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

            // Remove server information
            headers.Remove("Server");

            await _next(context);
        }
    }
}
