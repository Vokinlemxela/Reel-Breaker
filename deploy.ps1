Write-Host "Deploying Reel Breaker with Docker Compose..." -ForegroundColor Cyan

# Stop and remove existing containers
Write-Host "Stopping existing containers..."
docker-compose down

# Build specific images
Write-Host "Building Docker environment..."
docker-compose build

# Start it all up detached
Write-Host "Starting the application..."
docker-compose up -d

Write-Host "Deployment completed successfully! The app is running on http://localhost:8080" -ForegroundColor Green
