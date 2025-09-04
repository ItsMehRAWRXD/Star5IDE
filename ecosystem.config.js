// PM2 Ecosystem Configuration File
// This file defines how PM2 should manage your Node.js applications
// Documentation: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'app',
      script: './server.js', // or './dist/server.js' for TypeScript
      cwd: '/home/rawr/apps/app',
      
      // Cluster mode for better performance
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Advanced PM2 features
      watch: false, // Set to true in development
      ignore_watch: ['node_modules', 'logs', '.git', '*.log'],
      
      // Logging
      error_file: '/home/rawr/logs/screenpilot-error.log',
      out_file: '/home/rawr/logs/screenpilot-out.log',
      log_file: '/home/rawr/logs/screenpilot-combined.log',
      time: true, // Add timestamps to logs
      
      // Restart policies
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Graceful start/stop
      wait_ready: true,
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // Auto-restart on file changes (development)
      autorestart: true,
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      
      // Node.js arguments
      node_args: '--max-old-space-size=1024',
      
      // Application arguments
      args: '',
    },
    
    // Add more applications here if needed
    // {
    //   name: 'worker',
    //   script: './worker.js',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   cron_restart: '0 0 * * *', // Restart daily at midnight
    // },
  ],
  
  // Deployment Configuration
  deploy: {
    production: {
      user: 'rawr',
      host: ['YOUR_DROPLET_IP'], // Replace with actual IP
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/YOUR_REPO.git',
      path: '/home/rawr/apps/app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no',
    },
    
    staging: {
      user: 'rawr',
      host: ['YOUR_STAGING_IP'],
      ref: 'origin/develop',
      repo: 'git@github.com:YOUR_USERNAME/YOUR_REPO.git',
      path: '/home/rawr/apps/app-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001,
      },
    },
  },
};

// Alternative minimal configuration for simple apps:
/*
module.exports = {
  apps: [{
    name: 'app',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
*/