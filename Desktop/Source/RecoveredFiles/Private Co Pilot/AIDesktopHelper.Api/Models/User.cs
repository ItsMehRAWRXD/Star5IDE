using System.ComponentModel.DataAnnotations;

namespace AIDesktopHelper.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        
        public bool IsActive { get; set; } = true;
        public bool IsEmailVerified { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastLoginAt { get; set; }
        public DateTime? EmailVerifiedAt { get; set; }
        
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
        
        // Navigation properties
        public virtual ICollection<FileMetadata> Files { get; set; } = new List<FileMetadata>();
        public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
        public virtual ICollection<SecurityAudit> SecurityAudits { get; set; } = new List<SecurityAudit>();
    }
}
