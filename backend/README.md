# Express + MongoDB Backend with JWT Authentication and RBAC

A production-ready, modular Express.js backend with MongoDB, JWT authentication, role-based access control, and comprehensive security features.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Role-Based Access Control (RBAC) with admin, creator, and analyst roles
  - Secure password hashing with bcrypt
  - Token refresh mechanism

- **Security**
  - Helmet.js for security headers
  - XSS protection with xss-clean
  - MongoDB injection prevention with express-mongo-sanitize
  - Rate limiting with express-rate-limit
  - Input validation using Zod schemas

- **Database**
  - MongoDB with Mongoose ODM
  - Optimized indexes for performance
  - Data validation and sanitization
  - Aggregation pipelines for statistics

- **API Features**
  - RESTful API design
  - Pagination and filtering
  - Full-text search capabilities
  - Comprehensive error handling
  - Request/response logging

- **Development & Production**
  - Structured logging with Winston
  - Environment-based configuration
  - Graceful server shutdown
  - Health check endpoint
  - Memory-based caching (Redis-ready)

## 📁 Project Structure

```
src/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   └── bountyController.js   # Bounty management logic
├── middlewares/
│   ├── authMiddleware.js     # JWT verification & role checks
│   ├── errorMiddleware.js    # Centralized error handling
│   └── validateMiddleware.js # Zod validation wrapper
├── models/
│   ├── User.js              # User schema with roles
│   └── Bounty.js            # Bounty schema with indexes
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── bountyRoutes.js      # Bounty management routes
├── utils/
│   ├── generateTokens.js    # JWT token generation
│   ├── logger.js            # Winston logger configuration
│   └── rateLimiter.js       # Rate limiting setup
├── validators/
│   ├── authValidator.js     # Zod schemas for auth
│   └── bountyValidator.js   # Zod schemas for bounties
└── server.js                # Application entry point
```

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd express-mongodb-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/bounty-backend
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or start your local MongoDB service
   brew services start mongodb/brew/mongodb-community
   ```

5. **Run the application**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "analyst"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <access-token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

### Bounty Endpoints

#### Create Bounty (Creator/Admin only)
```http
POST /api/bounties
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Fix critical security vulnerability",
  "description": "We need to fix a critical security issue in our authentication system...",
  "reward": {
    "amount": 1000,
    "currency": "USD"
  },
  "category": "security",
  "priority": "critical",
  "tags": ["security", "authentication", "urgent"],
  "requirements": [
    {
      "description": "Identify the vulnerability"
    },
    {
      "description": "Provide a detailed fix"
    }
  ],
  "deadline": "2024-12-31T23:59:59Z",
  "isPublic": true
}
```

#### Get All Bounties (Public)
```http
GET /api/bounties?page=1&limit=10&status=active&category=security&search=authentication
```

#### Get Single Bounty
```http
GET /api/bounties/:id
```

#### Update Bounty
```http
PUT /api/bounties/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "active",
  "priority": "high"
}
```

#### Delete Bounty
```http
DELETE /api/bounties/:id
Authorization: Bearer <access-token>
```

#### Get My Bounties
```http
GET /api/bounties/user/my-bounties?status=active
Authorization: Bearer <access-token>
```

#### Submit to Bounty
```http
POST /api/bounties/:id/submit
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "content": "Here's my solution to the bounty...",
  "attachments": [
    "https://example.com/file1.pdf",
    "https://example.com/screenshot.png"
  ]
}
```

#### Search Bounties
```http
GET /api/bounties/search?q=security&category=bug&minReward=100&maxReward=5000
```

#### Get Bounty Statistics (Admin only)
```http
GET /api/bounties/admin/stats
Authorization: Bearer <access-token>
```

### Health Check
```http
GET /health
```

## 🔐 Role-Based Access Control

The system implements three user roles:

- **Admin**: Full access to all resources and admin-specific endpoints
- **Creator**: Can create, update, and delete bounties; access to all bounties
- **Analyst**: Can view bounties and submit to them; limited access

### Role Permissions

| Action | Admin | Creator | Analyst |
|--------|-------|---------|---------|
| View public bounties | ✅ | ✅ | ✅ |
| Create bounties | ✅ | ✅ | ❌ |
| Update own bounties | ✅ | ✅ | ❌ |
| Update any bounty | ✅ | ❌ | ❌ |
| Delete own bounties | ✅ | ✅ | ❌ |
| Delete any bounty | ✅ | ❌ | ❌ |
| Submit to bounties | ✅ | ✅ | ✅ |
| View statistics | ✅ | ❌ | ❌ |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT access token secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Required |
| `JWT_EXPIRES_IN` | Access token expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |

### Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Create operations**: 20 requests per hour per user/IP
- **Search**: 30 requests per minute per IP

## 📝 Logging

The application uses Winston for structured logging with different log levels:

- **Error**: Application errors and exceptions
- **Warn**: Warning messages and rate limit violations
- **Info**: General application information and user actions
- **Debug**: Detailed debugging information (development only)

Logs are written to:
- Console (formatted for readability in development)
- `logs/combined.log` (all logs)
- `logs/error.log` (error logs only)
- `logs/exceptions.log` (uncaught exceptions)
- `logs/rejections.log` (unhandled promise rejections)

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Use strong, unique JWT secrets
   - Configure production MongoDB URI
   - Set appropriate rate limits

2. **Security**
   - Enable HTTPS
   - Configure CORS for your domain
   - Set up proper firewall rules
   - Use environment-specific secrets

3. **Monitoring**
   - Set up log aggregation (ELK stack, etc.)
   - Configure health check monitoring
   - Set up performance monitoring
   - Configure alerting for errors

4. **Database**
   - Use MongoDB replica set for high availability
   - Set up regular backups
   - Configure database monitoring
   - Optimize indexes for your query patterns

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 5000

USER node

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/bounty-backend
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MongoDB is running
   - Check MONGO_URI in .env file
   - Ensure network connectivity

2. **JWT Token Issues**
   - Verify JWT secrets are set
   - Check token expiration times
   - Ensure tokens are sent in correct format

3. **Rate Limiting**
   - Check rate limit configuration
   - Verify IP address handling
   - Adjust limits for your use case

4. **Validation Errors**
   - Check Zod schema definitions
   - Verify input data format
   - Review error messages for details

### Debug Mode

Set `LOG_LEVEL=debug` in your environment to enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB team for the robust database
- All open-source contributors whose packages make this possible#   S t a r k l y t i c s - F o r - S T A R K N E T - b a c k e n d  
 