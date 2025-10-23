# Spradley Setup Guide

Welcome to Spradley, your AI-powered employee feedback platform! This guide will help you get started with your first survey deployment.

## 🚀 Quick Start

### Step 1: First Admin Setup

1. **Sign Up**: Navigate to `/auth` and create your account using email and password
2. **Automatic Admin Assignment**: The first user to sign up is automatically assigned as an HR Admin
3. **Sign In**: Use your credentials to access the HR Dashboard

### Step 2: Configure Survey Defaults (Optional)

Before creating surveys, you can customize default settings:

1. Go to **Settings** → **Survey Defaults**
2. Configure:
   - **First Message**: The AI's opening greeting to employees
   - **Consent Message**: Privacy notice shown before surveys
   - **Anonymization Level**: Choose "Anonymous" or "Identified"
   - **Data Retention**: Days to keep response data (default: 60)

These defaults will be applied to all new surveys but can be customized per survey.

### Step 3: Create Your First Survey

1. Navigate to **Dashboard** → **Create New Survey**
2. Follow the wizard:

   **Details Tab**:
   - Enter survey title and description
   - Customize the first AI message (optional)

   **Themes Tab**:
   - Select conversation themes (e.g., "Work-Life Balance", "Team Dynamics")
   - Add custom themes if needed

   **Targeting Tab**:
   - Choose target audience:
     - **All Employees**: Survey everyone
     - **By Department**: Target specific departments
     - **Manual Selection**: Choose individual employees

   **Schedule Tab**:
   - **Immediate**: Deploy now
   - **Scheduled**: Set a future date and time
   - Set end date (optional)

   **Consent Tab**:
   - Review consent message
   - Set anonymization level
   - Configure data retention period

   **Preview Tab**:
   - Test the AI conversation flow
   - Ensure themes and settings are correct

3. Click **Deploy Survey**

### Step 4: Employee Participation

Employees will:
1. Sign in to their account
2. See assigned surveys on their dashboard
3. Give consent to participate
4. Select their initial mood
5. Have an AI-guided conversation
6. Submit their final mood
7. Complete the session

### Step 5: View Analytics

Monitor feedback in real-time:

1. Go to **Analytics**
2. Filter by:
   - Survey
   - Sentiment (positive/neutral/negative)
   - Theme
   - Date range

3. View:
   - **Overview**: Key metrics and sentiment distribution
   - **Participation**: Assignment and completion rates
   - **Sentiment**: Mood trends and improvements
   - **Themes**: Insights by conversation topic
   - **Responses**: Individual anonymized responses
   - **Urgent Flags**: Critical issues requiring attention

4. Export reports as CSV or PDF

### Step 6: Take Action

1. Navigate to **Commitments**
2. Create action items based on feedback
3. Mark commitments as visible to employees
4. Share updates via **Share Update** button
5. Employees see commitments on their dashboard

## 👥 User Management

### Adding HR Analysts

HR Admins can grant analytics-only access:

1. Go to **Settings** → **User Management**
2. Click **Add User**
3. Enter employee email
4. Assign "HR Analyst" role
5. Analysts can view analytics but cannot create surveys

### Deactivating Users

1. Go to **Settings** → **User Management**
2. Find the user
3. Toggle "Active" status to deactivate

## 🔒 Security & Privacy

### Anonymization

- **Anonymous Mode**: HR cannot see which employee gave which response
- **Identified Mode**: Responses are linked to employees for targeted support

### Data Retention

- Automatically deletes old data per configured retention period
- View deletion logs in **Settings** → **Data Retention**
- Manually trigger cleanup if needed

### Audit Logs

- All sensitive actions are logged
- View in **Settings** → **Audit Logs**
- Filter by action type, date, or user

### Consent Management

- Employees explicitly consent before each survey
- Consent history is tracked and can be revoked
- View consent records in **Settings** → **Consent History**

## 📊 Best Practices

### Survey Design

1. **Choose Relevant Themes**: Select 3-5 themes that matter most
2. **Clear Messaging**: Customize the first message to set expectations
3. **Respect Privacy**: Use anonymous mode for sensitive topics
4. **Regular Cadence**: Deploy surveys quarterly to track trends

### Driving Participation

1. **Communicate Purpose**: Explain why feedback matters
2. **Show Action**: Share updates and commitments regularly
3. **Keep it Brief**: AI adapts to employee engagement
4. **Build Trust**: Honor anonymization promises

### Acting on Feedback

1. **Review Promptly**: Check analytics weekly
2. **Address Urgency**: Respond to flagged issues within 48 hours
3. **Create Commitments**: Turn insights into visible action
4. **Close the Loop**: Share outcomes with employees

## 🆘 Troubleshooting

### Employees Can't See Surveys

- Verify the survey is deployed (status: "Active")
- Check employee targeting settings
- Ensure employee account is active

### Analytics Not Showing

- Confirm employees have completed surveys
- Check applied filters in analytics
- Verify your role has analytics access

### Deployment Failed

- Ensure at least one theme is selected
- Verify at least one employee is targeted
- Check that all required fields are filled

## 📞 Support

For technical issues or questions:
- Review documentation in the app
- Check audit logs for error details
- Contact your system administrator

## 🎯 Next Steps

- ✅ Create your first survey
- ✅ Invite employees to participate
- ✅ Monitor analytics and urgency flags
- ✅ Share action commitments
- ✅ Build a culture of continuous feedback

Welcome to Spradley! 🎉
