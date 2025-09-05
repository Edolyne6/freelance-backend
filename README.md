# Freelance Marketplace Backend API

A comprehensive Node.js/TypeScript backend API for a freelance marketplace platform. Built with Express, Prisma ORM, SQLite, and JWT authentication.

## 🚀 Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ User registration and login
- ✅ Password hashing with bcrypt
- ✅ Refresh token system
- ✅ Role-based access control (FREELANCER, CLIENT, ADMIN)
- ✅ Password reset functionality
- ✅ Email verification system (ready)

### Database & ORM
- ✅ Prisma ORM with SQLite
- ✅ Database migrations
- ✅ Comprehensive database schema
- ✅ Type-safe database operations
- ✅ Relationship management

### API Features
- ✅ RESTful API design
- ✅ Swagger/OpenAPI documentation
- ✅ Input validation with express-validator
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers with Helmet

### Core Entities
- ✅ Users (Freelancers, Clients, Admins)
- ✅ Tasks/Projects
- ✅ Bids/Proposals
- ✅ Messages
- ✅ Payments
- ✅ Reviews
- ✅ Notifications
- ✅ File management

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Edolyne6/freelance-backend.git
   cd freelance-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the API**
   - API Base URL: `http://localhost:5000/api`
   - API Documentation: `http://localhost:5000/api-docs`
   - Health Check: `http://localhost:5000/health`

## 🚀 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## 📁 Project Structure

```
src/
├── middleware/          # Authentication, error handling, validation
├── routes/             # API route definitions
├── services/           # Business logic and external services
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
└── server.ts           # App entry point

prisma/
├── schema.prisma       # Database schema
├── migrations/         # Database migration files
└── seed.ts            # Database seeding script
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get users list
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Tasks/Projects
- `GET /api/tasks` - Get tasks list with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Bids
- `GET /api/bids` - Get bids list
- `POST /api/bids` - Create new bid
- `GET /api/bids/:id` - Get bid details
- `PUT /api/bids/:id` - Update bid
- `DELETE /api/bids/:id` - Delete bid

## 🗄 Database Schema

### Core Models
- **Users**: Complete user profiles with role-based fields
- **Tasks**: Job postings with skills, budget, and requirements
- **Bids**: Proposals from freelancers
- **Messages**: Communication system
- **Payments**: Transaction management
- **Reviews**: Rating and feedback system
- **Notifications**: System notifications

### Relationships
- Users → Tasks (one-to-many)
- Tasks → Bids (one-to-many)
- Users → Messages (many-to-many)
- Tasks → Payments (one-to-many)
- Users → Reviews (many-to-many)

## 🔧 Configuration

### Environment Variables
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Deployment
For production, update:
- Use PostgreSQL instead of SQLite
- Set strong JWT secrets
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Use environment-specific configurations

## 🛡 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-Origin Resource Sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Prisma ORM protection

## 📖 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:5000/api-docs`

The API follows OpenAPI 3.0 specification with:
- Complete endpoint documentation
- Request/response schemas
- Authentication requirements
- Example requests and responses

## 🧪 Testing

### Manual Testing
- Use the Swagger UI for interactive testing
- Import the OpenAPI spec into Postman/Insomnia
- Use the provided demo endpoints

### Demo Data
The API includes endpoints to create demo users:
- Freelancer: Full profile with skills and portfolio
- Client: Company profile with project needs
- Admin: System administration access

## 🚀 Deployment

### Docker (Recommended)
```bash
docker build -t freelance-backend .
docker run -p 5000:5000 freelance-backend
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Start the server: `npm start`

### Platforms
- **Railway**: Connect GitHub repo for automatic deployments
- **Heroku**: Use Heroku PostgreSQL add-on
- **DigitalOcean App Platform**: Simple container deployment
- **AWS/GCP/Azure**: Container or serverless deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- **Frontend**: [freelance-frontend](https://github.com/Edolyne6/freelance-frontend) - React TypeScript frontend
- **Mobile App**: [Coming Soon]
- **Admin Dashboard**: [Coming Soon]

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: exedolyne@gmail.com

## 🎯 Roadmap

- [ ] Real-time messaging with Socket.IO
- [ ] File upload and management
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notification system
- [ ] Advanced search and filtering
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] API rate limiting per user
- [ ] Automated testing suite
- [ ] Performance monitoring
