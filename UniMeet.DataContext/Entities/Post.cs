namespace UniMeet.DataContext.Entities
{
    public class Post
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; }
        public bool CommentsEnabled { get; set; } = true;
        public bool InterestEnabled { get; set; } = true;
        public User User { get; set; }
        public ICollection<Comment> Comments { get; set; }
        public ICollection<PostInterest> Interests { get; set; }
        public DateTime DateCreated { get; set; }
    }
}
