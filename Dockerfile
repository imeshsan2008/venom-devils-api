# Use official slim Node.js base image
FROM node:20-slim

# Set environment variables to avoid prompts during install
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y \
        curl \
        python3 \
        python3-pip \
        ffmpeg \
        && pip install --break-system-packages yt-dlp \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy app files
COPY . .



# Expose port (you can change this to whatever your app listens on)
EXPOSE 8000

# Run the app
CMD ["npm", "start"]