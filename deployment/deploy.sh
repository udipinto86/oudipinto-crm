#!/bin/bash

# Deploy script for oudipinto-crm

# Variables
APP_NAME="oudipinto-crm"
DEPLOY_PATH="/var/www/oudipinto-crm"
GIT_REPO="https://github.com/udipinto86/oudipinto-crm.git"
PM2_NAME="crm-app"

echo "Starting deployment..."

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js dependencies
echo "Installing dependencies..."
npm install

# Build client
echo "Building client..."
cd client
npm run build
cd ..

# Copy environment file
echo "Setting up environment..."
cp .env.example .env

# Initialize database
echo "Initializing database..."
node deployment/mongo-setup.js

# PM2 process management
echo "Setting up PM2 process..."
pm2 delete $PM2_NAME || true
pm2 start server/index.js --name $PM2_NAME

# Nginx configuration
echo "Configuring Nginx..."
sudo cp deployment/nginx.conf /etc/nginx/sites-available/$APP_NAME
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "Deployment completed successfully!"