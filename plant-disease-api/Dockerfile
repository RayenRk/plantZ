# Use the latest Node.js Alpine image (stable version)
FROM node:20-alpine

# Set the working directory for the app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Install OpenSSL for Prisma to work (since Alpine is minimal)
RUN apk update && apk add --no-cache openssl

# Copy the rest of the application code
COPY . .

# Install development dependencies (including Prisma)
RUN npm install --only=development

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Remove development dependencies after build to keep the image size minimal
RUN npm prune --production

# Expose the port your application runs on
EXPOSE 3000

# Set the environment variables (default fallback)
ENV NODE_ENV=production

# Run the application
CMD ["npm", "start"]
