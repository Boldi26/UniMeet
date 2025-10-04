namespace UniMeet.DataContext.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; }

        public int? ParentCommentId { get; set; }
        public Comment ParentComment { get; set; }
        public ICollection<Comment> Replies { get; set; } = new List<Comment>();

        public Post Post { get; set; }
        public User User { get; set; }
        public DateTime DateCreated { get; set; }
    }

}
