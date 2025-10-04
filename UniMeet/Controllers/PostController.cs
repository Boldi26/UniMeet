using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;
using UniMeet.DataContext.Entities;
using UniMeet.DataContext.Dtos;

namespace UniMeet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("User not found.");

            var post = new Post
            {
                UserId = dto.UserId,
                Content = dto.Content,
                CommentsEnabled = dto.CommentsEnabled,
                InterestEnabled = dto.InterestEnabled,
                DateCreated = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            return Ok(post);
        }

        [HttpPost("{postId}/comments")]
        public async Task<IActionResult> AddComment(int postId, [FromBody] CreateCommentDto dto)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return NotFound("Post not found.");
            if (!post.CommentsEnabled) return BadRequest("Comments are disabled for this post.");

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("User not found.");

            if (dto.ParentCommentId.HasValue)
            {
                var parent = await _context.Comments.FindAsync(dto.ParentCommentId.Value);
                if (parent == null || parent.PostId != postId)
                    return BadRequest("Invalid parent comment.");
            }

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

            return Ok(new { comment.Id, comment.Content, Username = user.Username, comment.ParentCommentId });
        }

        [HttpPost("{postId}/interest")]
        public async Task<IActionResult> AddInterest(int postId, [FromBody] InterestDto dto)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return NotFound("Post not found.");
            if (!post.InterestEnabled) return BadRequest("Interest is disabled for this post.");

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound("User not found.");

            if (await _context.PostInterests.AnyAsync(pi => pi.PostId == postId && pi.UserId == dto.UserId))
                return BadRequest("User already expressed interest.");

            var interest = new PostInterest
            {
                PostId = postId,
                UserId = dto.UserId
            };

            _context.PostInterests.Add(interest);
            await _context.SaveChangesAsync();
            return Ok(dto);
        }

        [HttpGet("{postId}")]
        public async Task<IActionResult> GetPostDetails(int postId)
        {
            var post = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.User)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.Replies)
                .Include(p => p.Interests)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null) return NotFound("Post not found.");

            List<object> BuildCommentTree(IEnumerable<Comment> comments)
            {
                return comments.Select(c => new
                {
                    c.Id,
                    c.Content,
                    Username = c.User.Username,
                    Replies = BuildCommentTree(c.Replies ?? new List<Comment>())
                }).ToList<object>();
            }

            var topLevelComments = post.Comments
                .Where(c => c.ParentCommentId == null)
                .ToList();

            var result = new
            {
                PostId = post.Id,
                Content = post.Content,
                AuthorUsername = post.User.Username,
                InterestedCount = post.Interests.Count,
                CommentsCount = post.Comments.Count,
                Comments = BuildCommentTree(topLevelComments)
            };

            return Ok(result);
        }
        [HttpGet("by-domain")]
        public async Task<IActionResult> GetPostsByDomain([FromQuery] string domain)
        {
            var domainEntity = await _context.AllowedEmailDomains
                .FirstOrDefaultAsync(d => d.Domain.Contains(domain));

            if (domainEntity == null)
                return NotFound("Domain not found.");

            var postIds = await _context.Posts
                .Include(p => p.User)
                .Where(p => p.User.Email.EndsWith("@" + domainEntity.Domain))
                .Select(p => p.Id)
                .ToListAsync();

            return Ok(postIds);
        }
        [HttpDelete("{postId}")]
        public async Task<IActionResult> DeletePost(int postId)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return NotFound("Post not found.");

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null) return NotFound("Comment not found.");

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpDelete("{postId}/interest/{userId}")]
        public async Task<IActionResult> DeleteInterest(int postId, int userId)
        {
            var interest = await _context.PostInterests
                .FirstOrDefaultAsync(pi => pi.PostId == postId && pi.UserId == userId);

            if (interest == null)
                return NotFound("Interest not found.");

            _context.PostInterests.Remove(interest);
            await _context.SaveChangesAsync();
            return NoContent();
        }

    }
}
