# ReferralFlow Reflip

A Node.js application that integrates IBM Watsonx AI with Salesforce for intelligent referral management and processing.

## 🚀 Features

- **AI-Powered Referral Analysis**: Leverage IBM Watsonx to analyze and route referrals intelligently
- **Salesforce Integration**: Seamless CRUD operations with Salesforce referral records
- **Automated Routing**: AI-driven specialist recommendations and priority assessment
- **RESTful API**: Clean, well-documented API endpoints
- **Real-time Processing**: Instant analysis and recommendations for incoming referrals

## 📋 Prerequisites

- Node.js 18+ LTS
- IBM Cloud account with Watson Assistant service
- Salesforce account with API access
- Connected App configured in Salesforce

## 🛠️ Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd ReferralFlow_Reflip
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the `.env` file and fill in your credentials:
   
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # IBM Watson Configuration
   IBM_WATSON_API_KEY=your_api_key
   IBM_WATSON_URL=your_service_url
   IBM_WATSON_ASSISTANT_ID=your_assistant_id

   # Salesforce Configuration
   SALESFORCE_CLIENT_ID=your_client_id
   SALESFORCE_CLIENT_SECRET=your_client_secret
   SALESFORCE_USERNAME=your_username
   SALESFORCE_PASSWORD=your_password
   SALESFORCE_SECURITY_TOKEN=your_security_token
   SALESFORCE_LOGIN_URL=https://login.salesforce.com
   ```

## 🏃 Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns server health status.

#### Create Referral with AI Analysis
```http
POST /api/salesforce/referrals
Content-Type: application/json

{
  "Patient_Name__c": "John Doe",
  "Condition__c": "Chest pain",
  "Urgency__c": "urgent",
  "Specialty__c": "Cardiology"
}
```

#### Get Referral by ID
```http
GET /api/salesforce/referrals/:id
```

#### Update Referral
```http
PUT /api/salesforce/referrals/:id
Content-Type: application/json

{
  "Status__c": "In Progress"
}
```

#### Delete Referral
```http
DELETE /api/salesforce/referrals/:id
```

#### Get All Referrals
```http
GET /api/salesforce/referrals?status=Pending
```

#### Analyze Existing Referral
```http
POST /api/salesforce/referrals/:id/analyze
```

#### Search Referrals
```http
GET /api/salesforce/search?q=John
```

#### Test Salesforce Authentication
```http
POST /api/salesforce/auth/test
```

## 🏗️ Project Structure

```
ReferralFlow_Reflip/
├── services/
│   ├── watsonxService.js      # IBM Watsonx AI integration
│   └── salesforceService.js   # Salesforce API integration
├── routes/
│   └── salesforceRoutes.js    # API route definitions
├── .env                        # Environment variables (not in git)
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies
├── server.js                   # Application entry point
└── README.md                   # This file
```

## 🔧 Configuration

### Salesforce Setup

1. **Create a Connected App in Salesforce:**
   - Go to Setup → App Manager → New Connected App
   - Enable OAuth Settings
   - Add OAuth Scopes: `api`, `refresh_token`, `offline_access`
   - Note your Consumer Key (Client ID) and Consumer Secret (Client Secret)

2. **Create Custom Object (if not exists):**
   - Object Name: `Referral__c`
   - Fields:
     - `Patient_Name__c` (Text)
     - `Condition__c` (Text)
     - `Urgency__c` (Picklist: Emergency, Urgent, Routine)
     - `Specialty__c` (Text)
     - `Status__c` (Picklist: Pending, In Progress, Completed)
     - `AI_Recommended_Specialist__c` (Text)
     - `AI_Priority_Level__c` (Number)
     - `AI_Estimated_Wait_Time__c` (Text)
     - `AI_Analysis_Timestamp__c` (DateTime)

### IBM Watson Setup

1. **Create Watson Assistant Service:**
   - Go to IBM Cloud Console
   - Create a Watson Assistant instance
   - Note your API Key and Service URL
   - Create an Assistant and note the Assistant ID

2. **Configure Watson Assistant:**
   - Train your assistant with referral-related intents
   - Set up dialog flows for referral analysis
   - Configure actions for specialist recommendations

## 🔐 Security Notes

- **Never commit `.env` file** - It contains sensitive credentials
- **Use environment variables** for all sensitive data
- **Implement authentication** - Add JWT or OAuth for production
- **Rate limiting** - Consider adding rate limiting middleware
- **Input validation** - Validate all user inputs
- **HTTPS** - Use HTTPS in production

## 🧪 Testing

Test the Salesforce connection:
```bash
curl -X POST http://localhost:3000/api/salesforce/auth/test
```

Test creating a referral:
```bash
curl -X POST http://localhost:3000/api/salesforce/referrals \
  -H "Content-Type: application/json" \
  -d '{
    "Patient_Name__c": "Jane Smith",
    "Condition__c": "Diabetes management",
    "Urgency__c": "routine",
    "Specialty__c": "Endocrinology"
  }'
```

## 📝 Development

### Adding New Routes
1. Create route handler in `routes/salesforceRoutes.js`
2. Import and use in `server.js`

### Adding New Services
1. Create service file in `services/`
2. Export service instance
3. Import in routes as needed

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors:**
- Verify Salesforce credentials in `.env`
- Check security token is appended to password
- Ensure Connected App is properly configured

**Watson API Errors:**
- Verify IBM Cloud credentials
- Check Watson Assistant is deployed
- Ensure API key has proper permissions

**Port Already in Use:**
- Change PORT in `.env` file
- Kill process using the port: `netstat -ano | findstr :3000`

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review IBM Watson documentation
- Review Salesforce API documentation

---

**Built with ❤️ using Node.js, IBM Watsonx, and Salesforce**