using Microsoft.EntityFrameworkCore;
using AIDesktopHelper.Api.Models;

namespace AIDesktopHelper.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<FileMetadata> FileMetadata { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<AIAnalysis> AIAnalyses { get; set; }
        public DbSet<SecurityAudit> SecurityAudits { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Username).IsUnique();
            });

            // FileMetadata configuration
            modelBuilder.Entity<FileMetadata>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.OwnerId).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.FileId).IsUnique();
            });

            // Conversation configuration
            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Title).HasMaxLength(200);
            });

            // AIAnalysis configuration
            modelBuilder.Entity<AIAnalysis>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AnalysisType).IsRequired().HasMaxLength(50);
            });

            // SecurityAudit configuration
            modelBuilder.Entity<SecurityAudit>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.IpAddress).HasMaxLength(45);
            });
        }
    }
}