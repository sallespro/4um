# Use node:22-bookworm-slim as the base image
FROM node:22-bookworm-slim

# Set working directory
WORKDIR /app

# Define build arguments for VITE env vars
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables for build time
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
