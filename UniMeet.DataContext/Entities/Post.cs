using System.Text.RegularExpressions;

namespace UniMeet.DataContext.Entities
{
    public class Post
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        // ÚJ: Beállítások és Média
        public bool CommentsEnabled { get; set; } = true;
        public bool InterestEnabled { get; set; } = true;
        public string? ImageUrl { get; set; } // Base64 string

        // Kapcsolatok
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public List<Comment> Comments { get; set; } = new();
        public List<PostInterest> Interests { get; set; } = new();

        // ÚJ: Opcionális csoport kapcsolat (ha null, akkor publikus poszt)
        public int? GroupId { get; set; }
        public Group? Group { get; set; }
    }
}
