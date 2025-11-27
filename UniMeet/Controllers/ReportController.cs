using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Dtos;
using UniMeet.DataContext.Entities;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportController(AppDbContext context)
        {
            _context = context;
        }

        // POST api/Report - Jelentés létrehozása
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
        {
            // Ellenőrizzük, hogy a felhasználó létezik és nincs bannolva
            var reporter = await _context.Users.FindAsync(dto.ReporterUserId);
            if (reporter == null)
                return NotFound("Felhasználó nem található.");
            
            if (reporter.IsBanned)
                return BadRequest("Bannolt felhasználó nem küldhet jelentést.");

            // Ellenőrizzük, hogy pontosan egy dolog van jelentve
            int reportedItems = 0;
            if (dto.PostId.HasValue) reportedItems++;
            if (dto.CommentId.HasValue) reportedItems++;
            if (dto.GroupId.HasValue) reportedItems++;
            if (dto.UserId.HasValue) reportedItems++;

            if (reportedItems != 1)
                return BadRequest("Pontosan egy elemet kell jelenteni (poszt, komment, csoport vagy felhasználó).");

            // Ellenőrizzük, hogy a jelentett elem létezik
            if (dto.PostId.HasValue && !await _context.Posts.AnyAsync(p => p.Id == dto.PostId))
                return NotFound("A jelentett poszt nem található.");
            
            if (dto.CommentId.HasValue && !await _context.Comments.AnyAsync(c => c.Id == dto.CommentId))
                return NotFound("A jelentett komment nem található.");
            
            if (dto.GroupId.HasValue && !await _context.Groups.AnyAsync(g => g.Id == dto.GroupId))
                return NotFound("A jelentett csoport nem található.");
            
            if (dto.UserId.HasValue && !await _context.Users.AnyAsync(u => u.Id == dto.UserId))
                return NotFound("A jelentett felhasználó nem található.");

            // Ellenőrizzük, hogy nem jelentette-e már ugyanazt
            var existingReport = await _context.Reports
                .FirstOrDefaultAsync(r => 
                    r.ReporterUserId == dto.ReporterUserId &&
                    r.Status == ReportStatus.Pending &&
                    (
                        (dto.PostId.HasValue && r.ReportedPostId == dto.PostId) ||
                        (dto.CommentId.HasValue && r.ReportedCommentId == dto.CommentId) ||
                        (dto.GroupId.HasValue && r.ReportedGroupId == dto.GroupId) ||
                        (dto.UserId.HasValue && r.ReportedUserId == dto.UserId)
                    )
                );

            if (existingReport != null)
                return BadRequest("Már jelentetted ezt a tartalmat, a jelentés feldolgozás alatt van.");

            var report = new Report
            {
                ReporterUserId = dto.ReporterUserId,
                ReportedPostId = dto.PostId,
                ReportedCommentId = dto.CommentId,
                ReportedGroupId = dto.GroupId,
                ReportedUserId = dto.UserId,
                Type = dto.Type,
                Reason = dto.Reason,
                Status = ReportStatus.Pending
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Jelentés sikeresen elküldve. Köszönjük!" });
        }

        // GET api/Report/types - Jelentés típusok lekérése
        [HttpGet("types")]
        public IActionResult GetReportTypes()
        {
            var types = Enum.GetValues<ReportType>()
                .Select(t => new { 
                    value = (int)t, 
                    name = t.ToString(),
                    displayName = GetReportTypeDisplayName(t)
                })
                .ToList();

            return Ok(types);
        }

        private string GetReportTypeDisplayName(ReportType type)
        {
            return type switch
            {
                ReportType.Spam => "Spam",
                ReportType.Harassment => "Zaklatás",
                ReportType.InappropriateContent => "Nem megfelelő tartalom",
                ReportType.HateSpeech => "Gyűlöletbeszéd",
                ReportType.Violence => "Erőszak",
                ReportType.Other => "Egyéb",
                _ => type.ToString()
            };
        }
    }
}
