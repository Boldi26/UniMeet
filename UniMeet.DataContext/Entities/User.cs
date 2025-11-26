using System.Text.Json.Serialization;

namespace UniMeet.DataContext.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        // ÚJ: Profil adatok
        public string? ProfileImageUrl { get; set; } // Base64 string
        public string? Faculty { get; set; }
        public string? Major { get; set; }
        public string? Bio { get; set; }

        // Kapcsolatok
        [JsonIgnore]
        public List<Post> Posts { get; set; } = new();
        [JsonIgnore]
        public List<Comment> Comments { get; set; } = new();
        [JsonIgnore]
        public List<PostInterest> Interests { get; set; } = new();

        // ÚJ: Csoport tagságok
        [JsonIgnore]
        public List<GroupMember> GroupMemberships { get; set; } = new();
    }
}
