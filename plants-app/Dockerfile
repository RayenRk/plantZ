# Use the official Node.js image with the latest Alpine version
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Copy the .env file (ensure it's available in the container)
COPY .env ./

# Install dependencies (production dependencies by default)
RUN npm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the app for production (creates the 'dist' directory)
RUN npm run build

# Install a lightweight web server (e.g., serve) to serve the production build
RUN npm install -g serve

# Expose the port that Vite uses during development (5173)
EXPOSE 5173

# Start the app using 'serve' to serve the production build
CMD ["serve", "-s", "dist", "-l", "5173"]
