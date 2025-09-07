# SaaS Backend

A complete Node.js/Express backend for a SaaS platform with authentication, subscription management, and Stripe integration.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Subscription Management**: Stripe integration for subscription plans
- **User Management**: User profiles, roles, and preferences
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Email Service**: SendGrid integration for transactional emails
- **MongoDB**: Mongoose ODM for data persistence

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── app.js          # Main application file
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Stripe account for payment processing
- SendGrid account for email services

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/saas-app
   JWT_SECRET=your-super-secret-jwt-key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   SENDGRID_API_KEY=your_sendgrid_key
   SENDGRID_USERNAME=your_sendgrid_username
   EMAIL_FROM=noreply@yourcompany.com
   FRONTEND_URL=http://localhost:3001
   ```

4. Start MongoDB:
   ```bash
   mongod
   ```

5. Run the application:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Subscriptions
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout session
- `GET /api/subscriptions/plans` - Get available subscription plans
- `POST /api/subscriptions/webhook` - Stripe webhook handler

## Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "company": {
      "name": "Example Corp",
      "size": "10-50",
      "industry": "Technology"
    }
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Profile (with JWT token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

Run the test suite:
```bash
npm test
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Express-rate-limit for API protection
- **Security Headers**: Helmet for security middleware
- **CORS**: Configurable cross-origin resource sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
