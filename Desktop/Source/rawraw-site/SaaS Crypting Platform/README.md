# SaaS Crypting Platform

A Flask-based SaaS platform for file encryption and stub generation using the RawrZ engine.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Docker and Docker Compose
- Git

### Local Development

1. **Clone and navigate to the project:**
   ```bash
   cd "SaaS Crypting Platform"
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example config
   cp env_config.txt .env
   # Edit .env with your actual values
   ```

4. **Run the application:**
   ```bash
   python main.py
   ```

5. **Access the API:**
   - API: http://localhost:5000
   - Health check: http://localhost:5000/

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Or build manually:**
   ```bash
   docker build -t saascryptingplatform .
   docker run -p 5000:5000 saascryptingplatform
   ```

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: Database connection string (SQLite by default)
- `SECRET_KEY`: Flask secret key for sessions
- `JWT_SECRET`: JWT token signing secret
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `FLASK_ENV`: Environment (development/production)
- `MAX_CONTENT_LENGTH`: Maximum file upload size (default: 16MB)

### Database

The platform supports both SQLite (development) and PostgreSQL (production). For production, update the `DATABASE_URL` in your environment variables.

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### File Operations
- `POST /api/v1/crypt` - Upload and encrypt files
- `GET /api/v1/builds` - Get user's build history
- `GET /api/v1/download/<build_id>` - Download encrypted files

### Public
- `GET /` - API status and endpoint information

## 🔐 Security Features

- JWT-based authentication
- Password hashing with Werkzeug
- CORS protection
- File upload validation
- User role management (admin/client)

## 🏗️ Architecture

- **Backend**: Flask with SQLAlchemy ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT tokens
- **File Processing**: RawrZ C++ stub engine integration
- **Deployment**: Docker with Gunicorn

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change the port in `main.py` or Docker compose
   - Kill existing processes: `lsof -ti:5000 | xargs kill -9`

2. **Database errors:**
   - Ensure the `instance/` directory exists
   - Check database permissions
   - Verify connection string format

3. **Upload failures:**
   - Check `uploads/` directory permissions
   - Verify file size limits
   - Ensure CORS is properly configured

### Logs

- **Local**: Check console output
- **Docker**: `docker-compose logs saascryptingplatform`

## 🔄 Development

### Adding New Features

1. Create new routes in `main.py`
2. Add database models if needed
3. Update requirements.txt for new dependencies
4. Test with the API endpoints

### Testing

```bash
# Run tests (when implemented)
python -m pytest

# Manual API testing
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Open an issue on the repository
