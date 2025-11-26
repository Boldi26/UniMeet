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

            // *** JAVÍTÁS 1: PostInterest -> User kapcsolat NoAction ***
            // A User törlésekor ne próbálja meg törölni a PostInterest-et ezen az ágon,
            // mert a Post törlése (ami Cascade) már elvégzi ezt.
            modelBuilder.Entity<PostInterest>()
                .HasOne(pi => pi.User)
                .WithMany(u => u.Interests)
                .HasForeignKey(pi => pi.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User törlése -> Posztok törlése (Ez MARAD Cascade)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Posts)
                .WithOne(p => p.User)
                .OnDelete(DeleteBehavior.Cascade);

            // *** JAVÍTÁS 2: Comment -> User kapcsolat NoAction ***
            // User törlése -> Kommentek törlése (Ezt állítjuk át NoAction-re)
            // Így elkerüljük a "multiple cascade paths" hibát.
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // ÚJ: Csoport kapcsolatok
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
        }
    }
}