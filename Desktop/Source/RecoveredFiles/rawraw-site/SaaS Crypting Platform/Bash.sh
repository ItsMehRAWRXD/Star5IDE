#!/bin/bash
# setup.sh

echo "🚀 Setting up Crypting SaaS Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Create environment file
cat > .env << EOL
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
API_KEY=$(openssl rand -hex 24)
EOL

echo "✅ Environment file created"

# Build and start containers
docker-compose up --build -d

echo "🎉 Setup complete! Services are starting..."
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📝 Admin credentials will be printed after initial setup"