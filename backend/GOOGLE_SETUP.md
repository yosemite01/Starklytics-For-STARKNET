# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Express + MongoDB backend.

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### Step 2: Enable Google+ API
1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" if available

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the OAuth consent screen if prompted:
   - Add your app name
   - Add your email address
   - Add authorized domains (your domain)

### Step 4: Configure Authorized Origins and Redirect URIs
For **Web application**:

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:5000
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/google/callback
https://yourdomain.com/auth/google/callback
```

### Step 5: Get Your Credentials
1. After creating, you'll get:
   - **Client ID** (starts with something like `123456789-xxx.apps.googleusercontent.com`)
   - **Client Secret** (a long string)

## 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 3. Frontend Integration

### For React/Next.js Frontend

Install the Google Identity Services library:

```bash
npm install @google-cloud/identity
# or use the CDN version
```

#### Example React Component

```jsx
import { useEffect, useState } from 'react';

const GoogleLogin = ({ onSuccess, onError }) => {
  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        width: 300,
      }
    );
  };

  const handleCredentialResponse = async (response) => {
    try {
      // Send the Google ID token to your backend
      const backendResponse = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential,
          role: 'analyst', // Optional: specify role
        }),
      });

      const data = await backendResponse.json();

      if (data.success) {
        // Store tokens and redirect
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        onSuccess(data.data.user);
      } else {
        onError(data.message);
      }
    } catch (error) {
      onError('Authentication failed');
    }
  };

  return (
    <div>
      <div id="google-signin-button"></div>
    </div>
  );
};

export default GoogleLogin;
```

#### Alternative: Using react-google-login (Deprecated but still works)

```bash
npm install react-google-login
```

```jsx
import GoogleLogin from 'react-google-login';

const MyGoogleLogin = ({ onSuccess, onError }) => {
  const handleGoogleSuccess = async (response) => {
    try {
      const backendResponse = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.tokenId,
          role: 'analyst',
        }),
      });

      const data = await backendResponse.json();
      
      if (data.success) {
        onSuccess(data.data.user);
      } else {
        onError(data.message);
      }
    } catch (error) {
      onError('Authentication failed');
    }
  };

  return (
    <GoogleLogin
      clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
      buttonText="Sign in with Google"
      onSuccess={handleGoogleSuccess}
      onFailure={onError}
      cookiePolicy={'single_host_origin'}
    />
  );
};
```

### For Vanilla JavaScript Frontend

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <div id="g_id_onload"
         data-client_id="YOUR_GOOGLE_CLIENT_ID"
         data-callback="handleCredentialResponse">
    </div>
    <div class="g_id_signin" data-type="standard"></div>

    <script>
        async function handleCredentialResponse(response) {
            try {
                const backendResponse = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: response.credential
                    }),
                });

                const data = await backendResponse.json();
                
                if (data.success) {
                    // Store tokens and redirect
                    localStorage.setItem('accessToken', data.data.accessToken);
                    localStorage.setItem('refreshToken', data.data.refreshToken);
                    window.location.href = '/dashboard';
                } else {
                    alert('Authentication failed: ' + data.message);
                }
            } catch (error) {
                alert('Authentication failed');
            }
        }
    </script>
</body>
</html>
```

## 4. API Endpoints

### New Endpoints Added

#### POST /api/auth/google
Authenticate with Google ID token.

**Request:**
```json
{
  "token": "google_id_token_here",
  "role": "analyst"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@gmail.com",
      "role": "analyst",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "authProvider": "google",
      "profilePicture": "https://...",
      "isEmailVerified": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### GET /api/auth/google/config
Get Google OAuth configuration for frontend.

**Response:**
```json
{
  "success": true,
  "data": {
    "googleClientId": "your-google-client-id"
  }
}
```

#### POST /api/auth/link-google
Link Google account to existing user (requires authentication).

**Request:**
```json
{
  "token": "google_id_token_here"
}
```

#### POST /api/auth/unlink-google
Unlink Google account from user (requires authentication).

**Request:**
```json
{
  "password": "current_password"
}
```

## 5. Testing

### Test Google Authentication

1. **Get Google Client ID for frontend:**
   ```bash
   curl http://localhost:5000/api/auth/google/config
   ```

2. **Test with a valid Google ID token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{
       "token": "your_google_id_token_here",
       "role": "analyst"
     }'
   ```

### Test Account Linking

1. **Link Google account:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/link-google \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_access_token" \
     -d '{
       "token": "your_google_id_token_here"
     }'
   ```

2. **Unlink Google account:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/unlink-google \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_access_token" \
     -d '{
       "password": "your_current_password"
     }'
   ```

## 6. Security Considerations

### Backend Security
- Google ID tokens are verified using Google's public keys
- Tokens are validated for audience (your client ID)
- User information is extracted from verified tokens only

### Frontend Security  
- Never expose your Google Client Secret to the frontend
- Use HTTPS in production
- Store JWT tokens securely (consider httpOnly cookies)

### Database Security
- Google IDs are indexed for fast lookups
- Passwords are optional for Google OAuth users
- Email verification is automatic for Google users

## 7. Production Deployment

### Environment Variables
```env
NODE_ENV=production
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
```

### Google Cloud Console Production Settings
1. Update authorized JavaScript origins to your production domain
2. Update redirect URIs to your production URLs
3. Consider setting up a separate Google project for production

### CORS Configuration
Make sure your CORS settings allow your frontend domain:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000'],
  credentials: true
}));
```

## 8. Troubleshooting

### Common Issues

**"Invalid client ID"**
- Check that GOOGLE_CLIENT_ID is correctly set
- Verify the client ID matches your Google Cloud Console

**"Invalid token"**
- Token might be expired (Google ID tokens expire after 1 hour)
- Token might be for wrong audience (different client ID)

**"User already exists"**
- A user with the same email already exists
- Use account linking feature instead

**CORS Errors**
- Make sure your frontend domain is in authorized JavaScript origins
- Check CORS configuration in your Express app

### Debug Mode
Enable debug logging to see detailed Google authentication logs:

```bash
LOG_LEVEL=debug npm run dev
```

This will show detailed logs for token verification and user creation/linking processes.