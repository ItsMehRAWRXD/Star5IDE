using Microsoft.Extensions.Caching.Memory;
using System.Net;

namespace AIDesktopHelper.Api.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly RateLimitOptions _options;

        public RateLimitingMiddleware(
            RequestDelegate next, 
            IMemoryCache cache, 
            ILogger<RateLimitingMiddleware> logger,
            IConfiguration configuration)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
            _options = new RateLimitOptions
            {
                WindowMinutes = configuration.GetValue<int>("RateLimit:WindowMinutes", 15),
                MaxRequests = configuration.GetValue<int>("RateLimit:MaxRequests", 100)
            };
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip rate limiting for certain endpoints
            if (ShouldSkipRateLimit(context))
            {
                await _next(context);
                return;
            }

            var clientId = GetClientIdentifier(context);
            var key = $"rate_limit_{clientId}";

            var requestData = _cache.Get<RequestData>(key) ?? new RequestData();

            // Check if window has expired
            if (DateTime.UtcNow - requestData.WindowStart > TimeSpan.FromMinutes(_options.WindowMinutes))
            {
                requestData = new RequestData
                {
                    WindowStart = DateTime.UtcNow,
                    RequestCount = 0
                };
            }

            requestData.RequestCount++;

            if (requestData.RequestCount > _options.MaxRequests)
            {
                _logger.LogWarning("Rate limit exceeded for client {ClientId}. Requests: {RequestCount}", 
                    clientId, requestData.RequestCount);

                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers["Retry-After"] = "900"; // 15 minutes
                
                await context.Response.WriteAsync(new
                {
                    error = "Rate limit exceeded",
                    message = "Too many requests. Please try again later.",
                    retryAfter = "900 seconds"
                }.ToString());

                return;
            }

            // Update cache
            var expiration = requestData.WindowStart.AddMinutes(_options.WindowMinutes);
            _cache.Set(key, requestData, expiration);

            // Add rate limit headers
            context.Response.Headers["X-RateLimit-Limit"] = _options.MaxRequests.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, _options.MaxRequests - requestData.RequestCount).ToString();
            context.Response.Headers["X-RateLimit-Reset"] = ((DateTimeOffset)expiration).ToUnixTimeSeconds().ToString();

            await _next(context);
        }

        private bool ShouldSkipRateLimit(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();
            
            // Skip rate limiting for health checks and static files
            return path?.StartsWith("/health") == true ||
                   path?.StartsWith("/swagger") == true ||
                   path?.Contains(".") == true; // Static files
        }

        private string GetClientIdentifier(HttpContext context)
        {
            // Try to get user ID from JWT token first
            var userId = context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                return $"user_{userId}";
            }

            // Fallback to IP address
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                ipAddress = forwardedFor.Split(',')[0].Trim();
            }

            return $"ip_{ipAddress ?? "unknown"}";
        }

        private class RequestData
        {
            public DateTime WindowStart { get; set; } = DateTime.UtcNow;
            public int RequestCount { get; set; } = 0;
        }

        private class RateLimitOptions
        {
            public int WindowMinutes { get; set; } = 15;
            public int MaxRequests { get; set; } = 100;
        }
    }
}
