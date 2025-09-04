// PM2 Ecosystem Configuration
// This file configures PM2 for production deployment
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      // Application name
      name: 'screenpilot-app',
      
      // Script to run
      script: 'app.js', // or 'server.js', 'index.js', etc.
      
      // Application instances (0 = use all CPU cores)
      instances: 0,
      
      // Execution mode
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      // Production environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      // Logging configuration
      log_file: '/home/rawr/logs/combined.log',
      out_file: '/home/rawr/logs/out.log',
      error_file: '/home/rawr/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart configuration
      autorestart: true,
      watch: false, // Set to true for development
      max_memory_restart: '1G',
      
      // Advanced PM2 features
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Merge logs from all instances
      merge_logs: true,
      
      // Time format for logs
      time: true
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'rawr',
      host: 'YOUR_DROPLET_IP', // Replace with your actual IP
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/your-repo.git',
      path: '/home/rawr/apps/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'rawr',
      host: 'YOUR_STAGING_IP', // Replace with your staging IP
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/your-repo.git',
      path: '/home/rawr/apps/staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};