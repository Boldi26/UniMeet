namespace UniMeet.DataContext.Dtos
{
    public class HandleJoinRequestDto
    {
        public bool Approve { get; set; }
    }

    public class JoinRequestResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public DateTime DateRequested { get; set; }
    }
}
