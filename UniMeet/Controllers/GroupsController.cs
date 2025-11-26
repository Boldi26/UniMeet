using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Dtos;
using UniMeet.DataContext.Entities;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GroupsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
        {
            var group = new Group
            {
                Name = dto.Name,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                IsPrivate = dto.IsPrivate,
                CreatorUserId = dto.CreatorUserId
            };

            _context.Groups.Add(group);
            await _context.SaveChangesAsync();

            // Az alapító automatikusan Admin tag
            _context.GroupMembers.Add(new GroupMember
            {
                GroupId = group.Id,
                UserId = dto.CreatorUserId,
                Role = "Admin"
            });
            await _context.SaveChangesAsync();

            return Ok(group);
        }

        [HttpGet]
        public async Task<ActionResult<List<GroupSummaryDto>>> GetAllGroups([FromQuery] int userId)
        {
            var groups = await _context.Groups
                .Include(g => g.Members)
                .Select(g => new GroupSummaryDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    Description = g.Description,
                    ImageUrl = g.ImageUrl,
                    MembersCount = g.Members.Count,
                    IsMember = g.Members.Any(m => m.UserId == userId),
                    IsPrivate = g.IsPrivate,
                    CreatorUserId = g.CreatorUserId
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpPost("{groupId}/join")]
        public async Task<IActionResult> JoinGroup(int groupId, [FromBody] int userId) // Body-ban várjuk a UserId-t egyszerűség kedvéért
        {
            if (await _context.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId))
                return BadRequest("Already a member");

            _context.GroupMembers.Add(new GroupMember { GroupId = groupId, UserId = userId });
            await _context.SaveChangesAsync();
            return Ok("Joined");
        }

        [HttpDelete("{groupId}/leave")]
        public async Task<IActionResult> LeaveGroup(int groupId, [FromQuery] int userId)
        {
            var membership = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId);

            if (membership == null) return NotFound("Not a member");

            _context.GroupMembers.Remove(membership);
            await _context.SaveChangesAsync();
            return Ok("Left");
        }
    }
}