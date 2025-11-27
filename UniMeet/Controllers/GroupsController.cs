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

        // Helper: ellenőrzi, hogy a user admin vagy a csoport tulajdonosa-e
        private async Task<bool> CanModerateGroup(int groupId, int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;
            if (user.IsAdmin) return true;

            var group = await _context.Groups.FindAsync(groupId);
            if (group == null) return false;

            return group.CreatorUserId == userId;
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
            var user = await _context.Users.FindAsync(userId);
            var isAdmin = user?.IsAdmin ?? false;

            var groups = await _context.Groups
                .Include(g => g.Members)
                .Include(g => g.JoinRequests)
                .Select(g => new GroupSummaryDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    Description = g.IsPrivate && !g.Members.Any(m => m.UserId == userId) && g.CreatorUserId != userId && !isAdmin
                        ? "🔒 Privát csoport - csatlakozz a tartalom megtekintéséhez"
                        : g.Description,
                    ImageUrl = g.ImageUrl,
                    MembersCount = g.Members.Count,
                    IsMember = g.Members.Any(m => m.UserId == userId),
                    IsPrivate = g.IsPrivate,
                    CreatorUserId = g.CreatorUserId,
                    IsOwner = g.CreatorUserId == userId || isAdmin,
                    HasPendingRequest = g.JoinRequests.Any(r => r.UserId == userId && r.Status == JoinRequestStatus.Pending),
                    PendingRequestsCount = (g.CreatorUserId == userId || isAdmin) 
                        ? g.JoinRequests.Count(r => r.Status == JoinRequestStatus.Pending) 
                        : 0
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpPost("{groupId}/join")]
        public async Task<IActionResult> JoinGroup(int groupId, [FromBody] int userId)
        {
            // Ellenőrizzük, hogy a user nincs-e bannolva
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("Felhasználó nem található");
            if (user.IsBanned) return BadRequest("Bannolt felhasználó nem csatlakozhat csoporthoz.");

            var group = await _context.Groups
                .Include(g => g.Members)
                .Include(g => g.JoinRequests)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null) return NotFound("Csoport nem található.");

            if (group.Members.Any(m => m.UserId == userId))
                return BadRequest("Már tag vagy ebben a csoportban.");

            // Privát csoport esetén csatlakozási kérelem
            if (group.IsPrivate)
            {
                // Ellenőrizzük, van-e már függőben lévő kérelem
                var existingRequest = group.JoinRequests.FirstOrDefault(r => r.UserId == userId && r.Status == JoinRequestStatus.Pending);
                if (existingRequest != null)
                    return BadRequest("Már van függőben lévő csatlakozási kérelmed.");

                var joinRequest = new GroupJoinRequest
                {
                    GroupId = groupId,
                    UserId = userId,
                    Status = JoinRequestStatus.Pending,
                    DateRequested = DateTime.UtcNow
                };
                _context.GroupJoinRequests.Add(joinRequest);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Csatlakozási kérelem elküldve. Várd meg a tulajdonos jóváhagyását.", isPending = true });
            }

            // Publikus csoport - azonnal csatlakozhat
            _context.GroupMembers.Add(new GroupMember { GroupId = groupId, UserId = userId });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Sikeresen csatlakoztál a csoporthoz.", isPending = false });
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

        // =====================================
        // CSOPORT MODERÁLÁS (tulajdonos/admin)
        // =====================================

        // GET api/Groups/{groupId}/members?moderatorId=1
        [HttpGet("{groupId}/members")]
        public async Task<IActionResult> GetGroupMembers(int groupId, [FromQuery] int moderatorId)
        {
            if (!await CanModerateGroup(groupId, moderatorId))
                return Unauthorized("Nincs jogosultságod a csoport moderálásához.");

            var members = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId)
                .Include(gm => gm.User)
                .Select(gm => new
                {
                    gm.Id,
                    gm.UserId,
                    Username = gm.User.Username,
                    ProfileImageUrl = gm.User.ProfileImageUrl,
                    gm.Role,
                    gm.DateJoined,
                    IsCreator = gm.Group.CreatorUserId == gm.UserId
                })
                .ToListAsync();

            return Ok(members);
        }

        // DELETE api/Groups/{groupId}/members/{userId}?moderatorId=1 - Tag kirúgása
        [HttpDelete("{groupId}/members/{userId}")]
        public async Task<IActionResult> KickMember(int groupId, int userId, [FromQuery] int moderatorId)
        {
            if (!await CanModerateGroup(groupId, moderatorId))
                return Unauthorized("Nincs jogosultságod a csoport moderálásához.");

            var group = await _context.Groups.FindAsync(groupId);
            if (group == null) return NotFound("Csoport nem található.");

            // A csoport tulajdonosát nem lehet kirúgni
            if (group.CreatorUserId == userId)
                return BadRequest("A csoport tulajdonosát nem lehet kirúgni.");

            var membership = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId);

            if (membership == null) return NotFound("A felhasználó nem tagja a csoportnak.");

            _context.GroupMembers.Remove(membership);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag sikeresen eltávolítva a csoportból." });
        }

        // GET api/Groups/{groupId}/posts?moderatorId=1 - Csoport posztjai (moderáláshoz)
        [HttpGet("{groupId}/posts")]
        public async Task<IActionResult> GetGroupPosts(int groupId, [FromQuery] int moderatorId)
        {
            if (!await CanModerateGroup(groupId, moderatorId))
                return Unauthorized("Nincs jogosultságod a csoport moderálásához.");

            var posts = await _context.Posts
                .Where(p => p.GroupId == groupId)
                .Include(p => p.User)
                .Include(p => p.Comments)
                .OrderByDescending(p => p.DateCreated)
                .Select(p => new
                {
                    p.Id,
                    p.Content,
                    p.ImageUrl,
                    p.DateCreated,
                    AuthorId = p.UserId,
                    AuthorUsername = p.User.Username,
                    CommentsCount = p.Comments.Count
                })
                .ToListAsync();

            return Ok(posts);
        }

        // DELETE api/Groups/{groupId}/posts/{postId}?moderatorId=1 - Poszt törlése a csoportból
        [HttpDelete("{groupId}/posts/{postId}")]
        public async Task<IActionResult> DeleteGroupPost(int groupId, int postId, [FromQuery] int moderatorId)
        {
            if (!await CanModerateGroup(groupId, moderatorId))
                return Unauthorized("Nincs jogosultságod a csoport moderálásához.");

            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && p.GroupId == groupId);
            if (post == null) return NotFound("Poszt nem található ebben a csoportban.");

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Poszt törölve a csoportból." });
        }

        // DELETE api/Groups/{groupId}/comments/{commentId}?moderatorId=1 - Komment törlése
        [HttpDelete("{groupId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteGroupComment(int groupId, int commentId, [FromQuery] int moderatorId)
        {
            if (!await CanModerateGroup(groupId, moderatorId))
                return Unauthorized("Nincs jogosultságod a csoport moderálásához.");

            var comment = await _context.Comments
                .Include(c => c.Post)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.Post.GroupId == groupId);

            if (comment == null) return NotFound("Komment nem található ebben a csoportban.");

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Komment törölve." });
        }

        // =====================================
        // CSATLAKOZÁSI KÉRELMEK (privát csoportok)
        // =====================================

        // GET api/Groups/{groupId}/join-requests?ownerId=1
        [HttpGet("{groupId}/join-requests")]
        public async Task<IActionResult> GetJoinRequests(int groupId, [FromQuery] int ownerId)
        {
            if (!await CanModerateGroup(groupId, ownerId))
                return Unauthorized("Csak a tulajdonos vagy admin láthatja a csatlakozási kérelmeket.");

            var requests = await _context.GroupJoinRequests
                .Where(r => r.GroupId == groupId && r.Status == JoinRequestStatus.Pending)
                .Include(r => r.User)
                .Select(r => new JoinRequestResponseDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Username = r.User.Username,
                    ProfileImageUrl = r.User.ProfileImageUrl,
                    DateRequested = r.DateRequested
                })
                .ToListAsync();

            return Ok(requests);
        }

        // PUT api/Groups/{groupId}/join-requests/{requestId}?ownerId=1
        [HttpPut("{groupId}/join-requests/{requestId}")]
        public async Task<IActionResult> HandleJoinRequest(int groupId, int requestId, [FromQuery] int ownerId, [FromBody] HandleJoinRequestDto dto)
        {
            if (!await CanModerateGroup(groupId, ownerId))
                return Unauthorized("Csak a tulajdonos vagy admin kezelheti a csatlakozási kérelmeket.");

            var request = await _context.GroupJoinRequests.FindAsync(requestId);
            if (request == null || request.GroupId != groupId)
                return NotFound("Kérelem nem található.");

            if (request.Status != JoinRequestStatus.Pending)
                return BadRequest("Ez a kérelem már el lett bírálva.");

            if (dto.Approve)
            {
                // Jóváhagyás - tag hozzáadása
                var membership = new GroupMember
                {
                    GroupId = groupId,
                    UserId = request.UserId,
                    DateJoined = DateTime.UtcNow
                };
                _context.GroupMembers.Add(membership);
                request.Status = JoinRequestStatus.Approved;
            }
            else
            {
                // Elutasítás
                request.Status = JoinRequestStatus.Rejected;
            }

            request.DateHandled = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = dto.Approve ? "Kérelem jóváhagyva, a felhasználó most már tag." : "Kérelem elutasítva." });
        }

        // DELETE api/Groups/{groupId}/join-requests/{requestId}?userId=1 - Kérelem visszavonása (user által)
        [HttpDelete("{groupId}/join-requests/{requestId}")]
        public async Task<IActionResult> CancelJoinRequest(int groupId, int requestId, [FromQuery] int userId)
        {
            var request = await _context.GroupJoinRequests.FindAsync(requestId);
            if (request == null || request.GroupId != groupId)
                return NotFound("Kérelem nem található.");

            if (request.UserId != userId)
                return Unauthorized("Csak a saját kérelmedet vonhatod vissza.");

            if (request.Status != JoinRequestStatus.Pending)
                return BadRequest("Ez a kérelem már el lett bírálva.");

            _context.GroupJoinRequests.Remove(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Csatlakozási kérelem visszavonva." });
        }
    }
}