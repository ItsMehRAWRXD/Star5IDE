using System.ComponentModel.DataAnnotations;

namespace AIDesktopHelper.Api.Models
{
    public class FileMetadata
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string FileId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        public long FileSize { get; set; }
        
        [StringLength(100)]
        public string ContentType { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string OwnerId { get; set; } = string.Empty;
        
        public string EncryptionAlgorithm { get; set; } = "AES256";
        public string? Description { get; set; }
        public string? Tags { get; set; }
        
        public bool IsPublic { get; set; } = false;
        public bool IsEncrypted { get; set; } = true;
        
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastAccessed { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        
        // Navigation properties
        public virtual User Owner { get; set; } = null!;
        public virtual ICollection<AIAnalysis> Analyses { get; set; } = new List<AIAnalysis>();
    }
}
