using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Entities;

namespace UniMeet.DataContext.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<AllowedEmailDomain> AllowedEmailDomains { get; set; }
        public DbSet<PostInterest> PostInterests { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<GroupJoinRequest> GroupJoinRequests { get; set; }
        public DbSet<Report> Reports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // User - Post Interest kapcsolat (Composite Key)
            modelBuilder.Entity<PostInterest>()
                .HasKey(pi => new { pi.PostId, pi.UserId });

            modelBuilder.Entity<PostInterest>()
                .HasOne(pi => pi.Post)
                .WithMany(p => p.Interests)
                .HasForeignKey(pi => pi.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PostInterest>()
                .HasOne(pi => pi.User)
                .WithMany(u => u.Interests)
                .HasForeignKey(pi => pi.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User törlése -> Posztok törlése
            modelBuilder.Entity<User>()
                .HasMany(u => u.Posts)
                .WithOne(p => p.User)
                .OnDelete(DeleteBehavior.Cascade);

            // Comment -> User kapcsolat NoAction
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Csoport kapcsolatok
            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.User)
                .WithMany(u => u.GroupMemberships)
                .HasForeignKey(gm => gm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            // Report kapcsolatok - Mind NoAction a cascade path elkerülése miatt
            modelBuilder.Entity<Report>()
                .HasOne(r => r.ReporterUser)
                .WithMany(u => u.SentReports)
                .HasForeignKey(r => r.ReporterUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.ReportedUser)
                .WithMany(u => u.ReceivedReports)
                .HasForeignKey(r => r.ReportedUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.ReportedPost)
                .WithMany()
                .HasForeignKey(r => r.ReportedPostId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.ReportedComment)
                .WithMany()
                .HasForeignKey(r => r.ReportedCommentId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.ReportedGroup)
                .WithMany()
                .HasForeignKey(r => r.ReportedGroupId)
                .OnDelete(DeleteBehavior.NoAction);

            // GroupJoinRequest kapcsolatok
            modelBuilder.Entity<GroupJoinRequest>()
                .HasOne(r => r.Group)
                .WithMany(g => g.JoinRequests)
                .HasForeignKey(r => r.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GroupJoinRequest>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}