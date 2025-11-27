using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Dtos;
using UniMeet.DataContext.Entities;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // Admin ellenőrzés helper
        private async Task<User?> GetAdminUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsAdmin) return null;
            return user;
        }

        // GET api/Admin/stats?adminId=1
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var stats = new AdminStatsDto
            {
                TotalUsers = await _context.Users.CountAsync(),
                BannedUsers = await _context.Users.CountAsync(u => u.IsBanned),
                TotalPosts = await _context.Posts.CountAsync(),
                TotalGroups = await _context.Groups.CountAsync(),
                PendingReports = await _context.Reports.CountAsync(r => r.Status == ReportStatus.Pending),
                TotalReports = await _context.Reports.CountAsync()
            };

            return Ok(stats);
        }

        // GET api/Admin/reports?adminId=1&status=Pending
        [HttpGet("reports")]
        public async Task<IActionResult> GetReports([FromQuery] int adminId, [FromQuery] string? status = null)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var query = _context.Reports
                .Include(r => r.ReporterUser)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedPost).ThenInclude(p => p!.User)
                .Include(r => r.ReportedComment).ThenInclude(c => c!.User)
                .Include(r => r.ReportedGroup)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<ReportStatus>(status, out var statusEnum))
            {
                query = query.Where(r => r.Status == statusEnum);
            }

            var reports = await query
                .OrderByDescending(r => r.DateCreated)
                .Select(r => new ReportResponseDto
                {
                    Id = r.Id,
                    ReporterUsername = r.ReporterUser!.Username,
                    ReportedPostId = r.ReportedPostId,
                    ReportedPostContent = r.ReportedPost != null ? r.ReportedPost.Content : null,
                    ReportedPostAuthor = r.ReportedPost != null ? r.ReportedPost.User.Username : null,
                    ReportedCommentId = r.ReportedCommentId,
                    ReportedCommentContent = r.ReportedComment != null ? r.ReportedComment.Content : null,
                    ReportedCommentAuthor = r.ReportedComment != null ? r.ReportedComment.User.Username : null,
                    ReportedGroupId = r.ReportedGroupId,
                    ReportedGroupName = r.ReportedGroup != null ? r.ReportedGroup.Name : null,
                    ReportedUserId = r.ReportedUserId,
                    ReportedUsername = r.ReportedUser != null ? r.ReportedUser.Username : null,
                    Type = r.Type.ToString(),
                    Reason = r.Reason,
                    Status = r.Status.ToString(),
                    AdminNote = r.AdminNote,
                    DateCreated = r.DateCreated,
                    DateResolved = r.DateResolved
                })
                .ToListAsync();

            return Ok(reports);
        }

        // PUT api/Admin/reports/{reportId}?adminId=1
        [HttpPut("reports/{reportId}")]
        public async Task<IActionResult> HandleReport(int reportId, [FromQuery] int adminId, [FromBody] HandleReportDto dto)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var report = await _context.Reports
                .Include(r => r.ReportedPost)
                .Include(r => r.ReportedComment)
                .Include(r => r.ReportedGroup)
                .Include(r => r.ReportedUser)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (report == null)
                return NotFound("Report nem található.");

            // Tartalom törlése ha kérték
            if (dto.DeleteContent)
            {
                if (report.ReportedPost != null)
                {
                    _context.Posts.Remove(report.ReportedPost);
                }
                if (report.ReportedComment != null)
                {
                    _context.Comments.Remove(report.ReportedComment);
                }
                if (report.ReportedGroup != null)
                {
                    _context.Groups.Remove(report.ReportedGroup);
                }
            }

            // User bannolása ha kérték
            if (dto.BanUser)
            {
                User? userToBan = null;
                
                if (report.ReportedUserId.HasValue)
                    userToBan = report.ReportedUser;
                else if (report.ReportedPost != null)
                    userToBan = await _context.Users.FindAsync(report.ReportedPost.UserId);
                else if (report.ReportedComment != null)
                    userToBan = await _context.Users.FindAsync(report.ReportedComment.UserId);

                if (userToBan != null && !userToBan.IsAdmin)
                {
                    userToBan.IsBanned = true;
                    userToBan.BanReason = dto.BanReason ?? "Közösségi irányelvek megsértése";
                    userToBan.BannedUntil = dto.BanDays.HasValue 
                        ? DateTime.UtcNow.AddDays(dto.BanDays.Value) 
                        : null;
                }
            }

            report.Status = dto.NewStatus;
            report.AdminNote = dto.AdminNote;
            report.DateResolved = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Report kezelve." });
        }

        // GET api/Admin/users?adminId=1
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.IsAdmin,
                    u.IsBanned,
                    u.BanReason,
                    u.BannedUntil,
                    u.DateCreated,
                    PostsCount = u.Posts.Count,
                    CommentsCount = u.Comments.Count,
                    ReportsCount = u.ReceivedReports.Count
                })
                .OrderByDescending(u => u.DateCreated)
                .ToListAsync();

            return Ok(users);
        }

        // POST api/Admin/users/{userId}/ban?adminId=1
        [HttpPost("users/{userId}/ban")]
        public async Task<IActionResult> BanUser(int userId, [FromQuery] int adminId, [FromBody] BanUserDto dto)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("Felhasználó nem található.");

            if (user.IsAdmin)
                return BadRequest("Admin felhasználót nem lehet bannolni.");

            user.IsBanned = true;
            user.BanReason = dto.Reason;
            user.BannedUntil = dto.Days.HasValue ? DateTime.UtcNow.AddDays(dto.Days.Value) : null;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Felhasználó bannolva: {user.Username}" });
        }

        // DELETE api/Admin/users/{userId}/ban?adminId=1
        [HttpDelete("users/{userId}/ban")]
        public async Task<IActionResult> UnbanUser(int userId, [FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("Felhasználó nem található.");

            user.IsBanned = false;
            user.BanReason = null;
            user.BannedUntil = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Felhasználó unbannolva: {user.Username}" });
        }

        // DELETE api/Admin/users/{userId}?adminId=1
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId, [FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var user = await _context.Users
                .Include(u => u.Posts)
                .Include(u => u.Comments)
                .Include(u => u.Interests)
                .Include(u => u.GroupMemberships)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("Felhasználó nem található.");

            if (user.IsAdmin)
                return BadRequest("Admin felhasználót nem lehet törölni.");

            _context.PostInterests.RemoveRange(user.Interests);
            _context.Comments.RemoveRange(user.Comments);
            _context.GroupMembers.RemoveRange(user.GroupMemberships);
            _context.Users.Remove(user);

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Felhasználó törölve: {user.Username}" });
        }

        // DELETE api/Admin/posts/{postId}?adminId=1
        [HttpDelete("posts/{postId}")]
        public async Task<IActionResult> DeletePost(int postId, [FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound("Poszt nem található.");

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Poszt törölve." });
        }

        // DELETE api/Admin/comments/{commentId}?adminId=1
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId, [FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null)
                return NotFound("Komment nem található.");

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Komment törölve." });
        }

        // DELETE api/Admin/groups/{groupId}?adminId=1
        [HttpDelete("groups/{groupId}")]
        public async Task<IActionResult> DeleteGroup(int groupId, [FromQuery] int adminId)
        {
            if (await GetAdminUser(adminId) == null)
                return Unauthorized("Nincs admin jogosultságod.");

            var group = await _context.Groups.FindAsync(groupId);
            if (group == null)
                return NotFound("Csoport nem található.");

            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Csoport törölve." });
        }
    }
}
