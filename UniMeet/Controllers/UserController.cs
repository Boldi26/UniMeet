using Microsoft.AspNetCore.Mvc;
using UniMeet.DataContext;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Entities;
using UniMeet.DataContext.Dtos;
using Microsoft.EntityFrameworkCore;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("User already exists.");

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest("Username already taken.");

            var allowedDomains = await _context.AllowedEmailDomains.Select(d => d.Domain).ToListAsync();
            if (!allowedDomains.Any(domain => dto.Email.EndsWith(domain, StringComparison.OrdinalIgnoreCase)))
                return BadRequest("Email domain not allowed.");

            PasswordHelper.CreatePasswordHash(dto.Password, out var hash, out var salt);

            var user = new User
            {
                Email = dto.Email,
                Username = dto.Username,
                PasswordHash = hash,
                PasswordSalt = salt
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.Email, user.Username, user.IsAdmin });
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null)
                return Unauthorized("Invalid credentials.");

            if (!PasswordHelper.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                return Unauthorized("Invalid credentials.");

            // Ban ellenőrzés
            if (user.IsBanned)
            {
                // Ha ideiglenes ban és lejárt, feloldás
                if (user.BannedUntil.HasValue && user.BannedUntil.Value < DateTime.UtcNow)
                {
                    user.IsBanned = false;
                    user.BanReason = null;
                    user.BannedUntil = null;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    var banMessage = user.BannedUntil.HasValue
                        ? $"A fiókod fel van függesztve {user.BannedUntil.Value:yyyy.MM.dd}-ig. Indok: {user.BanReason}"
                        : $"A fiókod véglegesen fel van függesztve. Indok: {user.BanReason}";
                    return Unauthorized(banMessage);
                }
            }

            return Ok(new { user.Id, user.Username, user.IsAdmin });
        }

        // Admin user létrehozása/inicializálása
        [HttpPost("init-admin")]
        public async Task<IActionResult> InitAdmin()
        {
            // Ellenőrizzük, hogy létezik-e már az admin
            var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Username == "UniMeetAdmin");
            if (existingAdmin != null)
            {
                return Ok(new { message = "Admin user már létezik.", id = existingAdmin.Id });
            }

            PasswordHelper.CreatePasswordHash("root", out var hash, out var salt);

            var admin = new User
            {
                Email = "admin@unimeet.hu",
                Username = "UniMeetAdmin",
                PasswordHash = hash,
                PasswordSalt = salt,
                IsAdmin = true
            };

            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Admin user létrehozva.", id = admin.Id, username = admin.Username });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpPut("users/{userId}/username")]
        public async Task<IActionResult> ChangeUsername(int userId, [FromBody] ChangeUsernameDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            user.Username = dto.Username;
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.Username });
        }
    }
}
