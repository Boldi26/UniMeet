using UniMeet.DataContext.Entities;

namespace UniMeet.DataContext.Dtos
{
    // Report létrehozása
    public class CreateReportDto
    {
        public int ReporterUserId { get; set; }
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public int? GroupId { get; set; }
        public int? UserId { get; set; }
        public ReportType Type { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    // Report válasz (listázáshoz)
    public class ReportResponseDto
    {
        public int Id { get; set; }
        public string ReporterUsername { get; set; } = string.Empty;
        
        // Mit jelentettek
        public int? ReportedPostId { get; set; }
        public string? ReportedPostContent { get; set; }
        public string? ReportedPostAuthor { get; set; }
        
        public int? ReportedCommentId { get; set; }
        public string? ReportedCommentContent { get; set; }
        public string? ReportedCommentAuthor { get; set; }
        
        public int? ReportedGroupId { get; set; }
        public string? ReportedGroupName { get; set; }
        
        public int? ReportedUserId { get; set; }
        public string? ReportedUsername { get; set; }
        
        public string Type { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? AdminNote { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? DateResolved { get; set; }
    }

    // Report kezelése (admin által)
    public class HandleReportDto
    {
        public ReportStatus NewStatus { get; set; }
        public string? AdminNote { get; set; }
        public bool DeleteContent { get; set; } = false; // Törölje-e a jelentett tartalmat
        public bool BanUser { get; set; } = false; // Banolja-e a felhasználót
        public string? BanReason { get; set; }
        public int? BanDays { get; set; } // null = végtelen
    }

    // Felhasználó bannolása
    public class BanUserDto
    {
        public string Reason { get; set; } = string.Empty;
        public int? Days { get; set; } // null = végtelen
    }

    // Admin statisztikák
    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int BannedUsers { get; set; }
        public int TotalPosts { get; set; }
        public int TotalGroups { get; set; }
        public int PendingReports { get; set; }
        public int TotalReports { get; set; }
    }
}
