using System;

namespace UniMeet.DataContext.Entities
{
    public class GroupJoinRequest
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public int UserId { get; set; }
        public JoinRequestStatus Status { get; set; } = JoinRequestStatus.Pending;
        public DateTime DateRequested { get; set; } = DateTime.UtcNow;
        public DateTime? DateHandled { get; set; }

        // Navigation properties
        public Group Group { get; set; } = null!;
        public User User { get; set; } = null!;
    }

    public enum JoinRequestStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
}
