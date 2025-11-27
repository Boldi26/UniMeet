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

        // Profil adatok
        public string? ProfileImageUrl { get; set; } // Base64 string
        public string? Faculty { get; set; }
        public string? Major { get; set; }
        public string? Bio { get; set; }

        // Admin és moderációs mezők
        public bool IsAdmin { get; set; } = false;
        public bool IsBanned { get; set; } = false;
        public string? BanReason { get; set; }
        public DateTime? BannedUntil { get; set; } // null = végtelen ban

        // Kapcsolatok
        [JsonIgnore]
        public List<Post> Posts { get; set; } = new();
        [JsonIgnore]
        public List<Comment> Comments { get; set; } = new();
        [JsonIgnore]
        public List<PostInterest> Interests { get; set; } = new();

        // Csoport tagságok
        [JsonIgnore]
        public List<GroupMember> GroupMemberships { get; set; } = new();
        
        // Jelentések (amiket a user küldött)
        [JsonIgnore]
        public List<Report> SentReports { get; set; } = new();
        
        // Jelentések (amik a userről szólnak)
        [JsonIgnore]
        public List<Report> ReceivedReports { get; set; } = new();
    }
}
