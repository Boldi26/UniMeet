using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Dtos;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProfileController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/Profile/{userId}?currentUserId=123
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(int userId, [FromQuery] int currentUserId)
        {
            var user = await _context.Users
                .Include(u => u.Posts)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("Felhasználó nem található.");

            var response = new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                ProfileImageUrl = user.ProfileImageUrl,
                Faculty = user.Faculty,
                Major = user.Major,
                Bio = user.Bio,
                PostsCount = user.Posts.Count,
                IsOwnProfile = userId == currentUserId,
                DateCreated = user.DateCreated
            };

            return Ok(response);
        }

        // GET api/Profile/by-username/{username}?currentUserId=123
        [HttpGet("by-username/{username}")]
        public async Task<IActionResult> GetProfileByUsername(string username, [FromQuery] int currentUserId)
        {
            var user = await _context.Users
                .Include(u => u.Posts)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return NotFound("Felhasználó nem található.");

            var response = new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                ProfileImageUrl = user.ProfileImageUrl,
                Faculty = user.Faculty,
                Major = user.Major,
                Bio = user.Bio,
                PostsCount = user.Posts.Count,
                IsOwnProfile = user.Id == currentUserId,
                DateCreated = user.DateCreated
            };

            return Ok(response);
        }

        // PUT api/Profile/{userId}
        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("Felhasználó nem található.");

            // Csak a beküldött mezőket frissítjük
            if (dto.ProfileImageUrl != null)
                user.ProfileImageUrl = dto.ProfileImageUrl;
            
            if (dto.Faculty != null)
                user.Faculty = dto.Faculty;
            
            if (dto.Major != null)
                user.Major = dto.Major;
            
            if (dto.Bio != null)
                user.Bio = dto.Bio;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil sikeresen frissítve." });
        }

        // DELETE api/Profile/{userId} - Saját profil törlése
        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteProfile(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Posts)
                    .ThenInclude(p => p.Comments)
                .Include(u => u.Posts)
                    .ThenInclude(p => p.Interests)
                .Include(u => u.Comments)
                .Include(u => u.Interests)
                .Include(u => u.GroupMemberships)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("Felhasználó nem található.");

            // Töröljük a felhasználó érdeklődéseit más posztokra
            _context.PostInterests.RemoveRange(user.Interests);

            // Töröljük a felhasználó kommentjeit más posztokra
            _context.Comments.RemoveRange(user.Comments);

            // Töröljük a csoport tagságokat
            _context.GroupMembers.RemoveRange(user.GroupMemberships);

            // A felhasználó posztjai és azok kommentjei/érdeklődései automatikusan törlődnek (Cascade)
            _context.Users.Remove(user);
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Fiók sikeresen törölve." });
        }
    }

    // DTO a profil válaszhoz
    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public string? Faculty { get; set; }
        public string? Major { get; set; }
        public string? Bio { get; set; }
        public int PostsCount { get; set; }
        public bool IsOwnProfile { get; set; }
        public DateTime DateCreated { get; set; }
    }
}
