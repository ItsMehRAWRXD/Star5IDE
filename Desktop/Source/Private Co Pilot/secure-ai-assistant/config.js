// AI Desktop Helper - Site Access Configuration
class SitePermissions {
    constructor() {
        this.config = {
            // Default behavior: block all sites not explicitly allowed
            defaultBehavior: 'block',
            
            // Allowed sites for AI helpers
            allowedSites: [
                // AI APIs
                'https://api.openai.com',
                'https://api.anthropic.com',
                'https://api.cohere.ai',
                'https://api.huggingface.co',
                
                // Development APIs
                'https://api.github.com',
                'https://registry.npmjs.org',
                'https://pypi.org',
                'https://crates.io',
                
                // Documentation
                'https://developer.mozilla.org',
                'https://docs.microsoft.com',
                'https://docs.python.org',
                'https://nodejs.org',
                'https://reactjs.org',
                'https://vuejs.org',
                'https://angular.io',
                
                // Cloud Services
                'https://api.digitalocean.com',
                'https://api.aws.amazon.com',
                'https://api.cloud.google.com',
                'https://api.heroku.com',
                'https://api.netlify.com',
                'https://api.vercel.com',
                
                // Security APIs
                'https://api.stripe.com',
                'https://api.auth0.com',
                'https://api.firebase.google.com',
                'https://api.sendgrid.com',
                
                // Data APIs
                'https://api.mongodb.com',
                'https://api.redis.io',
                'https://api.elastic.co'
            ],
            
            // Blocked sites
            blockedSites: [
                // Malicious sites
                '*.malware.com',
                '*.phishing.com',
                '*.scam.com',
                '*.virus.com',
                
                // Advertising
                '*.doubleclick.net',
                '*.googleadservices.com',
                '*.googlesyndication.com',
                '*.facebook.com/tr',
                
                // Social Media
                'https://facebook.com',
                'https://twitter.com',
                'https://instagram.com',
                'https://tiktok.com',
                'https://snapchat.com',
                
                // Entertainment
                'https://youtube.com',
                'https://netflix.com',
                'https://spotify.com',
                'https://twitch.tv',
                'https://discord.com',
                
                // Gambling
                '*.bet',
                '*.casino',
                '*.poker',
                '*.lottery',
                
                // Adult Content
                '*.porn',
                '*.adult',
                '*.xxx'
            ],
            
            // Restricted sites (require special permission)
            restrictedSites: [
                // Financial
                'https://api.bankofamerica.com',
                'https://api.wellsfargo.com',
                'https://api.chase.com',
                'https://api.citi.com',
                
                // Government
                'https://api.irs.gov',
                'https://api.ssa.gov',
                'https://api.fda.gov',
                'https://api.cdc.gov',
                
                // Healthcare
                'https://api.healthcare.gov'
            ],
            
            // Rules
            rules: {
                allowLocalhost: true,
                allowPrivateIPs: false,
                requireHTTPS: true,
                logAllRequests: true,
                rateLimiting: {
                    enabled: true,
                    requestsPerMinute: 60,
                    burstLimit: 10
                }
            },
            
            // Monitoring
            monitoring: {
                logBlockedRequests: true,
                alertOnSuspiciousActivity: true,
                dailyReport: true,
                retentionDays: 30
            }
        };
    }
    
    // Check if a site is allowed
    isAllowed(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // Check blocked sites first
            if (this.isBlocked(url)) {
                return false;
            }
            
            // Check restricted sites
            if (this.isRestricted(url)) {
                return false; // Require special permission
            }
            
            // Check allowed sites
            if (this.config.allowedSites.includes(url)) {
                return true;
            }
            
            // Check localhost
            if (this.config.rules.allowLocalhost && 
                (hostname === 'localhost' || hostname === '127.0.0.1')) {
                return true;
            }
            
            // Check private IPs
            if (this.config.rules.allowPrivateIPs && this.isPrivateIP(hostname)) {
                return true;
            }
            
            // Default behavior
            return this.config.defaultBehavior === 'allow';
            
        } catch (error) {
            console.error('Error checking URL:', error);
            return false;
        }
    }
    
    // Check if a site is blocked
    isBlocked(url) {
        return this.config.blockedSites.some(blockedSite => {
            if (blockedSite.startsWith('*.')) {
                const domain = blockedSite.substring(2);
                return url.includes(domain);
            }
            return url === blockedSite;
        });
    }
    
    // Check if a site is restricted
    isRestricted(url) {
        return this.config.restrictedSites.includes(url);
    }
    
    // Check if IP is private
    isPrivateIP(hostname) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./
        ];
        
        return privateRanges.some(range => range.test(hostname));
    }
    
    // Log request
    logRequest(url, allowed, reason = '') {
        if (this.config.rules.logAllRequests) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                url: url,
                allowed: allowed,
                reason: reason
            };
            
            console.log('Site Access:', logEntry);
            
            // Store in chrome storage for monitoring
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['siteAccessLogs'], (result) => {
                    const logs = result.siteAccessLogs || [];
                    logs.push(logEntry);
                    
                    // Keep only last 1000 entries
                    if (logs.length > 1000) {
                        logs.splice(0, logs.length - 1000);
                    }
                    
                    chrome.storage.local.set({ siteAccessLogs: logs });
                });
            }
        }
    }
    
    // Get configuration
    getConfig() {
        return this.config;
    }
    
    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SitePermissions;
} else if (typeof window !== 'undefined') {
    window.SitePermissions = SitePermissions;
}
