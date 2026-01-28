# Firebase Setup Guide

Complete guide to set up Firebase for authentication and authorization.

## Prerequisites

- Firebase project created
- Firebase Console access
- npm or yarn installed
- Node.js 18+ installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name (e.g., "dash-nest")
4. Accept terms and click "Continue"
5. Leave Google Analytics disabled for now (can enable later)
6. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider:
   - Click "Email/Password"
   - Toggle both switches ON
   - Click "Save"
4. (Optional) Enable other providers:
   - Google
   - GitHub
   - Microsoft
   - etc.

## Step 3: Get Credentials

### Service Account Key (Server-Side)

1. Go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click "Generate New Private Key"
4. Save the JSON file securely
5. Copy the JSON content (you'll need it for `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`)

### API Key (Client-Side)

1. Go to **Project Settings**
2. Go to **General** tab
3. Under "Your apps", click "Web"
4. Create a new web app if not exists
5. Copy the **API Key** (you'll need it for `FIREBASE_API_KEY`)

Example API Key appears in the SDK config:
```javascript
const firebaseConfig = {
  apiKey: "AIz...", // <- This one
  authDomain: "...",
  projectId: "...",
  // ...
};
```

## Step 4: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account","project_id":"dash-nest","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@dash-nest.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

FIREBASE_API_KEY='AIzaSyD...'

# Application
PORT=3000
NODE_ENV=development
```

### ⚠️ Important Security Notes

**For FIREBASE_SERVICE_ACCOUNT_KEY_JSON:**
- This is sensitive - never commit to version control
- Add `.env` to `.gitignore`
- Use `.env.example` for documentation
- In production, use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)

**Proper .env.example format:**
```bash
# Firebase Configuration
# Get from Firebase Console → Project Settings → Service Accounts
FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account","project_id":"your-project-id",...}'

# Get from Firebase Console → Project Settings → General → API Key
FIREBASE_API_KEY='AIzaSy...'

# Application
PORT=3000
NODE_ENV=development
```

## Step 5: Install Dependencies

```bash
npm install firebase-admin
```

The package.json should already include:
- `@nestjs/config` - for environment variables
- `@nestjs/core` - core NestJS
- Other required dependencies

## Step 6: Verify Setup

### Test Service Account

```bash
# From project root
node -e "
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
console.log('✓ Valid JSON');
console.log('✓ Project ID:', serviceAccount.project_id);
console.log('✓ Service Account Email:', serviceAccount.client_email);
"
```

### Test Firebase Admin SDK

```typescript
// test-firebase.ts
import * as admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  projectId: serviceAccount.project_id,
});

const auth = app.auth();

auth.getUser('test-uid').then(() => {
  console.log('✓ Firebase Admin SDK connected successfully');
}).catch((error) => {
  console.error('✗ Connection failed:', error.message);
}).finally(() => {
  app.delete();
});
```

## Step 7: Start Development

```bash
npm run start:dev
```

You should see no Firebase-related errors:
```
[Nest] 12345 - 01/28/2026, 3:45:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 - 01/28/2026, 3:45:01 PM     LOG [InstanceLoader] FirebaseAdminService dependencies initialized
[Nest] 12345 - 01/28/2026, 3:45:01 PM     LOG [InstanceLoader] FirebaseAuthService dependencies initialized
[Nest] 12345 - 01/28/2026, 3:45:02 PM     LOG [NestApplication] Nest application successfully started
```

## Test API Endpoints

### Sign Up

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "displayName": "Test User"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User signed up successfully",
  "data": {
    "uid": "firebase-uid-here",
    "email": "test@example.com",
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4YzY2OTA0YmUwOWQ5YTI3NTM4YThjMjQ4MDBiZTA4NzYxOTI3YzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZGFzaC1uZXN0IiwiYXVkIjoiZGFzaC1uZXN0IiwiYXV0aF90aW1lIjoxNzA0MzU2OTUwLCJ1c2VyX2lkIjoiVmQ0cFhjdmdZZEZZVkpZbVJXRW1KOHJSRjAyIiwic3ViIjoiVmQ0cFhjdmdZZEZZVkpZbVJXRW1KOHJSRjAyIiwiaWF0IjoxNzA0MzU2OTUwLCJleHAiOjE3MDQzNjA1NTB9.signature",
    "refreshToken": "refresh-token-here"
  }
}
```

### Sign In

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get Current User (Protected)

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer {idToken}"
```

Response:
```json
{
  "success": true,
  "data": {
    "uid": "Vd4pXcvgYdFYVJYmRWEmJ8rRF02",
    "email": "test@example.com",
    "displayName": "Test User",
    "emailVerified": false,
    "disabled": false,
    "roles": ["user"],
    "attributes": {}
  }
}
```

## Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not valid JSON"

**Cause:** Environment variable not set or malformed

**Fix:**
1. Verify `.env` file exists in project root
2. Check JSON is valid (use online JSON validator)
3. Make sure quotes are properly escaped in shell

```bash
# Test JSON validity
echo "$FIREBASE_SERVICE_ACCOUNT_KEY_JSON" | jq .
```

### Error: "auth/operation-not-allowed"

**Cause:** Email/Password authentication not enabled in Firebase Console

**Fix:**
1. Go to Firebase Console → Authentication
2. Click "Email/Password" provider
3. Toggle both switches ON
4. Click "Save"

### Error: "Invalid API Key"

**Cause:** Wrong or missing FIREBASE_API_KEY

**Fix:**
1. Go to Firebase Console → Project Settings
2. Go to General tab
3. Find "Your apps" section
4. Check Web app's API Key
5. Update FIREBASE_API_KEY in `.env`

### Error: "The service account credential is invalid"

**Cause:** Service account key is malformed or from wrong project

**Fix:**
1. Download fresh service account key from Firebase Console
2. Ensure it's from correct Firebase project
3. Update FIREBASE_SERVICE_ACCOUNT_KEY_JSON

### Email Verification Link Not Sending

**Note:** The email service is not implemented in this guide.

**To implement:**
1. Use Firebase Email Templates (Firebase Console → Authentication → Templates)
2. Or use a third-party email service:
   - SendGrid
   - Mailgun
   - AWS SES
   - Custom SMTP

Example with custom email service:
```typescript
// In auth.service.ts
async sendVerificationEmail(email: string) {
  const link = await this.firebaseAdminService.generateEmailVerificationLink(email);
  
  // Send via your email service
  await this.mailService.send({
    to: email,
    subject: 'Verify your email',
    template: 'email-verification',
    context: { link }
  });
}
```

## Next Steps

1. **Test thoroughly:**
   - Create test accounts
   - Verify token validation
   - Test permission checks

2. **Implement in feature modules:**
   - See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

3. **Set up custom claims sync:**
   - Implement periodic sync on server restart
   - Handle role changes

4. **Enable additional auth methods:**
   - Google OAuth
   - GitHub OAuth
   - Social login

5. **Configure security rules** (if using Firestore):
   - Match Firebase Auth rules
   - Protect sensitive data

6. **Set up monitoring:**
   - Log authentication events
   - Monitor failed login attempts
   - Alert on suspicious activity

## Production Checklist

- [ ] Service account key in secure secrets management
- [ ] Different API keys for dev/prod
- [ ] HTTPS enforced
- [ ] Refresh token rotation implemented
- [ ] Rate limiting on auth endpoints
- [ ] Password requirements configured
- [ ] Email verification required
- [ ] Session timeout configured
- [ ] Audit logging enabled
- [ ] Regular key rotation policy
- [ ] Incident response plan in place
- [ ] Backup authentication method
- [ ] User support documentation written
- [ ] Analytics/monitoring dashboard set up

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [NestJS Security Guide](https://docs.nestjs.com/techniques/security)
- [OWASP Authentication Guide](https://owasp.org/www-project-cheat-sheets/cheatsheets/Authentication_Cheat_Sheet)

---

For integration guide, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
