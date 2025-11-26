using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Dtos
{
    public class CreatePostDto
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool CommentsEnabled { get; set; } = true;
        public bool InterestEnabled { get; set; } = true;
        public string? ImageUrl { get; set; } // Base64
        public int? GroupId { get; set; } // Ha csoportba posztol
    }

    public class PostDetailResponse
    {
        public int PostId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string AuthorUsername { get; set; } = string.Empty;
        public string? AuthorImageUrl { get; set; } // Profilkép a poszt mellett
        public DateTime DateCreated { get; set; }
        public int InterestedCount { get; set; }
        public int CommentsCount { get; set; }
        public bool CommentsEnabled { get; set; }
        public bool InterestEnabled { get; set; }
        public string? ImageUrl { get; set; } // Poszt képe
        public string? GroupName { get; set; } // Ha csoportból jött
        public List<CommentResponse> Comments { get; set; } = new();
    }
}
