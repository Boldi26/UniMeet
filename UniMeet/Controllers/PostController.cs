using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Dtos;
using UniMeet.DataContext.Entities;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            var post = new Post
            {
                UserId = dto.UserId,
                Content = dto.Content,
                CommentsEnabled = dto.CommentsEnabled,
                InterestEnabled = dto.InterestEnabled,
                ImageUrl = dto.ImageUrl,
                GroupId = dto.GroupId,
                DateCreated = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            return Ok(post);
        }

        // "Feed" logika: Publikus posztok + Követett csoportok posztjai
        [HttpGet("feed")]
        public async Task<ActionResult<List<PostDetailResponse>>> GetFeed([FromQuery] int userId)
        {
            // Lekérjük, mely csoportoknak tagja a felhasználó
            var userGroupIds = await _context.GroupMembers
                .Where(gm => gm.UserId == userId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            var posts = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Group)
                .Include(p => p.Interests)
                // Csak olyan poszt kell, ami (Nincs csoportban) VAGY (A user tagja a csoportnak)
                .Where(p => p.GroupId == null || userGroupIds.Contains(p.GroupId.Value))
                .OrderByDescending(p => p.DateCreated)
                .ToListAsync();

            var response = posts.Select(p => new PostDetailResponse
            {
                PostId = p.Id,
                Content = p.Content,
                AuthorUsername = p.User.Username,
                AuthorImageUrl = p.User.ProfileImageUrl,
                DateCreated = p.DateCreated,
                InterestedCount = p.Interests.Count,
                CommentsCount = _context.Comments.Count(c => c.PostId == p.Id),
                CommentsEnabled = p.CommentsEnabled,
                InterestEnabled = p.InterestEnabled,
                ImageUrl = p.ImageUrl,
                GroupName = p.Group?.Name
            }).ToList();

            return Ok(response);
        }

        // GET api/Post/{postId} - Poszt részletek lekérése
        [HttpGet("{postId}")]
        public async Task<IActionResult> GetPostDetails(int postId)
        {
            var post = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Group)
                .Include(p => p.Interests)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null)
                return NotFound("Poszt nem található.");

            var response = new PostDetailResponse
            {
                PostId = post.Id,
                Content = post.Content,
                AuthorUsername = post.User.Username,
                AuthorImageUrl = post.User.ProfileImageUrl,
                DateCreated = post.DateCreated,
                InterestedCount = post.Interests.Count,
                CommentsCount = post.Comments.Count,
                CommentsEnabled = post.CommentsEnabled,
                InterestEnabled = post.InterestEnabled,
                ImageUrl = post.ImageUrl,
                GroupName = post.Group?.Name,
                Comments = BuildCommentTree(post.Comments)
            };

            return Ok(response);
        }

        // DELETE api/Post/{postId} - Poszt törlése
        [HttpDelete("{postId}")]
        public async Task<IActionResult> DeletePost(int postId)
        {
            var post = await _context.Posts
                .Include(p => p.Comments)
                .Include(p => p.Interests)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null)
                return NotFound("Poszt nem található.");

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Poszt törölve." });
        }

        // ============================================
        // KOMMENTEK
        // ============================================

        // POST api/Post/{postId}/comments - Komment hozzáadása
        [HttpPost("{postId}/comments")]
        public async Task<IActionResult> AddComment(int postId, [FromBody] CreateCommentDto dto)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound("Poszt nem található.");

            if (!post.CommentsEnabled)
                return BadRequest("A kommentelés le van tiltva ennél a posztnál.");

            var comment = new Comment
            {
                PostId = postId,
                UserId = dto.UserId,
                Content = dto.Content,
                ParentCommentId = dto.ParentCommentId,
                DateCreated = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return Ok(comment);
        }

        // DELETE api/Post/comments/{commentId} - Komment törlése
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null)
                return NotFound("Komment nem található.");

            // Töröljük a válaszokat is
            var replies = await _context.Comments
                .Where(c => c.ParentCommentId == commentId)
                .ToListAsync();

            _context.Comments.RemoveRange(replies);
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Komment törölve." });
        }

        // ============================================
        // ÉRDEKLŐDÉS (INTEREST)
        // ============================================

        // POST api/Post/{postId}/interest - Érdeklődés hozzáadása
        [HttpPost("{postId}/interest")]
        public async Task<IActionResult> AddInterest(int postId, [FromBody] InterestDto dto)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound("Poszt nem található.");

            if (!post.InterestEnabled)
                return BadRequest("Az érdeklődés le van tiltva ennél a posztnál.");

            // Ellenőrizzük, hogy már érdeklődik-e
            var existingInterest = await _context.PostInterests
                .FirstOrDefaultAsync(pi => pi.PostId == postId && pi.UserId == dto.UserId);

            if (existingInterest != null)
                return BadRequest("Már érdeklődsz ez iránt a poszt iránt.");

            var interest = new PostInterest
            {
                PostId = postId,
                UserId = dto.UserId
            };

            _context.PostInterests.Add(interest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Érdeklődés hozzáadva." });
        }

        // DELETE api/Post/{postId}/interest/{userId} - Érdeklődés visszavonása
        [HttpDelete("{postId}/interest/{userId}")]
        public async Task<IActionResult> RemoveInterest(int postId, int userId)
        {
            var interest = await _context.PostInterests
                .FirstOrDefaultAsync(pi => pi.PostId == postId && pi.UserId == userId);

            if (interest == null)
                return NotFound("Érdeklődés nem található.");

            _context.PostInterests.Remove(interest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Érdeklődés visszavonva." });
        }

        // ============================================
        // SEGÉDMETÓDUSOK
        // ============================================

        private List<CommentResponse> BuildCommentTree(List<Comment> comments)
        {
            var rootComments = comments
                .Where(c => c.ParentCommentId == null)
                .Select(c => new CommentResponse
                {
                    Id = c.Id,
                    Content = c.Content,
                    Username = c.User.Username,
                    DateCreated = c.DateCreated,
                    Replies = GetReplies(c.Id, comments)
                })
                .ToList();

            return rootComments;
        }

        private List<CommentResponse> GetReplies(int parentId, List<Comment> allComments)
        {
            return allComments
                .Where(c => c.ParentCommentId == parentId)
                .Select(c => new CommentResponse
                {
                    Id = c.Id,
                    Content = c.Content,
                    Username = c.User.Username,
                    DateCreated = c.DateCreated,
                    Replies = GetReplies(c.Id, allComments)
                })
                .ToList();
        }
    }
}