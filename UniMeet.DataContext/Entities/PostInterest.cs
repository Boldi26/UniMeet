namespace UniMeet.DataContext.Entities
{
    public class PostInterest
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public int UserId { get; set; }
        public Post Post { get; set; }
        public User User { get; set; }
    }
}
