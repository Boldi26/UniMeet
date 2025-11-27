using System.Text.Json.Serialization;

namespace UniMeet.DataContext.Entities
{
    public class Report
    {
        public int Id { get; set; }
        
        // Ki jelentette
        public int ReporterUserId { get; set; }
        [JsonIgnore]
        public User? ReporterUser { get; set; }
        
        // Mit jelentett (csak egy lehet kitöltve)
        public int? ReportedPostId { get; set; }
        [JsonIgnore]
        public Post? ReportedPost { get; set; }
        
        public int? ReportedCommentId { get; set; }
        [JsonIgnore]
        public Comment? ReportedComment { get; set; }
        
        public int? ReportedGroupId { get; set; }
        [JsonIgnore]
        public Group? ReportedGroup { get; set; }
        
        public int? ReportedUserId { get; set; }
        [JsonIgnore]
        public User? ReportedUser { get; set; }
        
        // Jelentés típusa
        public ReportType Type { get; set; }
        
        // Indoklás
        public string Reason { get; set; } = string.Empty;
        
        // Státusz
        public ReportStatus Status { get; set; } = ReportStatus.Pending;
        
        // Admin megjegyzés (ha kezelte)
        public string? AdminNote { get; set; }
        
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
        public DateTime? DateResolved { get; set; }
    }
    
    public enum ReportType
    {
        Spam,
        Harassment,
        InappropriateContent,
        HateSpeech,
        Violence,
        Other
    }
    
    public enum ReportStatus
    {
        Pending,      // Függőben
        Reviewed,     // Átnézve, de nem volt intézkedés
        ActionTaken,  // Intézkedés történt
        Dismissed     // Elutasítva
    }
}
