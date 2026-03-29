FROM node:18-alpine

WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy rest of the code (excluding .env via .dockerignore)
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]