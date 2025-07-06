# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Payload Configuration
PAYLOAD_SECRET=your-secret-key-here

# Database Configuration  
DATABASE_URI=mongodb://localhost:27017/billie-crm

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Event Processing
ENABLE_EVENT_PROCESSING=true

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Environment Variable Details

### PAYLOAD_SECRET
- **Required**: Yes
- **Description**: Secret key used by Payload CMS for encryption and security
- **Example**: `your-secret-key-here`
- **Note**: Generate a secure random string for production

### DATABASE_URI
- **Required**: Yes
- **Description**: MongoDB connection string
- **Example**: `mongodb://localhost:27017/billie-crm`
- **Note**: Update with your MongoDB credentials and database name

### REDIS_URL
- **Required**: Yes
- **Description**: Redis connection URL for stream processing and real-time updates
- **Example**: `redis://localhost:6379`
- **Note**: Update with your Redis credentials if authentication is required

### ENABLE_EVENT_PROCESSING
- **Required**: No
- **Default**: `false`
- **Description**: Enables Redis stream event processing
- **Example**: `true`
- **Note**: Set to `true` to enable the event processing worker

### NEXT_PUBLIC_APP_URL
- **Required**: No
- **Default**: `http://localhost:3000`
- **Description**: Base URL for the application
- **Example**: `http://localhost:3000`
- **Note**: Update with your production domain

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start MongoDB and Redis locally (using Docker):
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   docker run -d -p 6379:6379 --name redis redis:latest
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. Generate Payload types:
   ```bash
   pnpm generate:types
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Production Setup

For production deployment, ensure:

1. Use strong, randomly generated secrets
2. Use managed database services (MongoDB Atlas, Redis Cloud)
3. Enable SSL/TLS for database connections
4. Set appropriate CORS origins
5. Use environment-specific configuration

## Security Notes

- Never commit `.env.local` or any files containing secrets to version control
- Use strong, unique passwords for all services
- Enable authentication on Redis in production
- Use MongoDB authentication in production
- Regularly rotate secrets and passwords 