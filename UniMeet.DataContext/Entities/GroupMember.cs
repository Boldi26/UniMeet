using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Entities
{
    public class GroupMember
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int GroupId { get; set; }
        public Group Group { get; set; } = null!;

        public string Role { get; set; } = "Member"; // "Admin", "Member"
        public DateTime DateJoined { get; set; } = DateTime.UtcNow;
    }
}
