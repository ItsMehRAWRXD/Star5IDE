[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    // Validate user credentials against your PostgreSQL database
    if (IsValidUser(request.Username, request.Password))
    {
        var token = GenerateJwtToken(request.Username);
        return Ok(new { token });
    }
    return Unauthorized();
}
