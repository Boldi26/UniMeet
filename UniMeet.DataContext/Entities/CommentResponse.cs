namespace UniMeet.DataContext.Dtos
{
    public class CommentResponse
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public List<CommentResponse> Replies { get; set; } = new();
    }
}