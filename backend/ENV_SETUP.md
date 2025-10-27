# Environment Variables Setup

## Required Variables

Create a `.env` file in the `backend` directory with these required variables:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/safestay
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
FRONTEND_URL=http://localhost:3000
```

## Optional Service Integrations

The following services are **optional**. If you don't provide credentials, the app will still work but without those features:

### Twilio (SMS Notifications) - Optional
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```
**Effect if not configured**: SMS sending will be skipped (logged instead)

### Email (Email Notifications) - Optional
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
```
**Effect if not configured**: Email sending will be skipped (logged instead)

### Cloudinary (Image Uploads) - Optional
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
**Effect if not configured**: Image uploads will fail gracefully

### Razorpay (Payment Processing) - Optional
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
**Effect if not configured**: Payment processing will be disabled

## Quick Start Setup

1. Copy the variables above
2. Create a `.env` file in the `backend` directory
3. Fill in the **Required Variables** with appropriate values
4. Leave optional services empty if you don't need them
5. Start the server: `npm start`

## Notes

- All optional services are now configured to handle missing credentials gracefully
- The app will log messages when optional services are not configured
- You can add credentials later without breaking existing functionality

