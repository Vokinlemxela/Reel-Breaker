#!/bin/bash

echo "Deploying Reel Breaker with Docker Compose..."

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down

# Build specific images
echo "Building Docker environment..."
docker-compose build

# Start it all up detached
echo "Starting the application..."
docker-compose up -d

echo "Deployment completed successfully! The app is running on port 8080."
