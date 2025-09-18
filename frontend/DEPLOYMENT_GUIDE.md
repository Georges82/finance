# Deployment Guide - Goat Finance Application

## Overview
This guide explains how to deploy the Goat Finance application from localhost development to production environment.

## Environment Configuration

### Backend (FastAPI) Environment Variables

Create a `.env` file in the `GoatFinance` directory:

```env
# Environment
ENVIRONMENT=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration
DATABASE_URL=your_production_database_url

# JWT Configuration
AUTH_SECRET=your_secure_jwt_secret_key
JWT_ALGORITHM_USED=HS256

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### Frontend (Next.js) Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com

# Environment
NODE_ENV=production
```

## Production Deployment Steps

### 1. Backend Deployment

#### Option A: Docker Deployment
```bash
# Build the Docker image
cd GoatFinance
docker build -t goat-finance-api .

# Run the container
docker run -d \
  --name goat-finance-api \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  -e DATABASE_URL=your_production_database_url \
  -e AUTH_SECRET=your_secure_jwt_secret_key \
  goat-finance-api
```

#### Option B: Direct Server Deployment
```bash
# Install dependencies
cd GoatFinance
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=production
export ALLOWED_ORIGINS=https://yourdomain.com
export DATABASE_URL=your_production_database_url
export AUTH_SECRET=your_secure_jwt_secret_key

# Run with production server
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Deployment

#### Option A: Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

#### Option B: Docker Deployment
```bash
# Build the Docker image
docker build -t goat-finance-frontend .

# Run the container
docker run -d \
  --name goat-finance-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com \
  goat-finance-frontend
```

## Security Considerations

### 1. CORS Configuration
- ✅ **Production**: Use specific domain origins
- ✅ **Development**: Use localhost origins
- ❌ **Never**: Use wildcard `*` with `allow_credentials=True`

### 2. Cookie Security
- ✅ **Production**: `secure=True`, `samesite="strict"`
- ✅ **Development**: `secure=False`, `samesite="lax"`
- ✅ **Always**: Use `httponly=True` for sensitive cookies

### 3. Environment Variables
- ✅ **Production**: Use strong, unique secrets
- ✅ **Development**: Use default/weak secrets
- ❌ **Never**: Commit secrets to version control

## Configuration Comparison

| Setting | Development | Production |
|---------|-------------|------------|
| **CORS Origins** | `localhost:3000, localhost:9002` | `https://yourdomain.com` |
| **Cookie Secure** | `False` | `True` |
| **Cookie SameSite** | `lax` | `strict` |
| **API Base URL** | `http://localhost:5010` | `https://api.yourdomain.com` |
| **Environment** | `development` | `production` |

## Testing Production Configuration

### 1. Test CORS
```bash
# Test from your domain
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.yourdomain.com/api/v1/admin/login
```

### 2. Test Authentication
```bash
# Test login endpoint
curl -X POST https://api.yourdomain.com/api/v1/admin/login \
     -H "Content-Type: application/json" \
     -H "Origin: https://yourdomain.com" \
     -d '{"email_or_username":"test@example.com","password":"password123"}'
```

### 3. Test Protected Endpoints
```bash
# Test with authentication cookie
curl -X GET https://api.yourdomain.com/api/v1/admin/get_all_admin \
     -H "Origin: https://yourdomain.com" \
     -H "Cookie: access_token=your_jwt_token"
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` includes your frontend domain
   - Check that `allow_credentials=True` is set
   - Ensure no wildcard `*` with credentials

2. **Cookie Issues**
   - Verify `secure=True` in production (HTTPS required)
   - Check `samesite` attribute matches your setup
   - Ensure domain matches between frontend and backend

3. **Authentication Failures**
   - Verify JWT secret is consistent
   - Check token expiration settings
   - Ensure cookies are being sent with requests

### Debug Commands

```bash
# Check environment variables
echo $ENVIRONMENT
echo $ALLOWED_ORIGINS
echo $NEXT_PUBLIC_API_BASE_URL

# Check backend logs
docker logs goat-finance-api

# Check frontend logs
docker logs goat-finance-frontend

# Test API health
curl https://api.yourdomain.com/
```

## Monitoring and Logging

### 1. Backend Logging
- Application logs are already configured
- Monitor for authentication errors
- Track API request/response times

### 2. Frontend Monitoring
- Use browser developer tools
- Monitor network requests
- Check for CORS and authentication errors

### 3. Production Monitoring
- Set up health checks
- Monitor error rates
- Track user authentication success/failure

## Rollback Plan

### 1. Backend Rollback
```bash
# Stop current container
docker stop goat-finance-api

# Start previous version
docker run -d --name goat-finance-api-previous \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  goat-finance-api:previous-version
```

### 2. Frontend Rollback
```bash
# Revert to previous deployment
vercel --prod --force
```

## Security Checklist

- [ ] Environment variables are secure and unique
- [ ] CORS origins are specific to your domain
- [ ] Cookies are secure in production
- [ ] JWT secrets are strong and unique
- [ ] Database connections are secure
- [ ] HTTPS is enabled in production
- [ ] Error messages don't expose sensitive information
- [ ] Authentication tokens have appropriate expiration
- [ ] Rate limiting is implemented
- [ ] Input validation is in place

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review backend and frontend logs
3. Verify environment variable configuration
4. Test with curl commands
5. Contact the development team

