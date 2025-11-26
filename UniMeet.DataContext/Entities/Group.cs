using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Entities
{
    public class Group
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; } // Base64
        public bool IsPrivate { get; set; } = false;
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;

        public int CreatorUserId { get; set; } // Tulajdonos

        public List<GroupMember> Members { get; set; } = new();
        public List<Post> Posts { get; set; } = new();
    }
}
