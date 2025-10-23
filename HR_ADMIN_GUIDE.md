# HR Admin User Guide

This guide is designed for HR Administrators who manage surveys, analyze feedback, and drive organizational improvements using Spradley.

## 📋 Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Creating Surveys](#creating-surveys)
3. [Managing Surveys](#managing-surveys)
4. [Analytics & Insights](#analytics--insights)
5. [Action Commitments](#action-commitments)
6. [User Management](#user-management)
7. [Settings & Configuration](#settings--configuration)
8. [Security & Compliance](#security--compliance)

---

## Dashboard Overview

Your HR Dashboard provides:
- **Active Surveys**: Quick view of deployed surveys
- **Survey Status**: Draft, Active, Completed counts
- **Quick Actions**: Create survey, view analytics, manage users
- **Recent Activity**: Latest employee responses and urgency flags

### Key Metrics
- Total surveys created
- Active participation rate
- Pending responses
- Urgent flags requiring attention

---

## Creating Surveys

### Survey Creation Wizard

Navigate to **Create New Survey** and follow these steps:

#### 1. Survey Details
- **Title**: Clear, descriptive survey name (e.g., "Q1 2025 Employee Wellbeing Check-in")
- **Description**: Purpose and context for HR team (not shown to employees)
- **First Message**: AI's opening greeting - customize to set the right tone

**Best Practice**: Keep the first message warm, empathetic, and clear about confidentiality.

#### 2. Theme Selection
Choose conversation topics from the theme library:
- Work-Life Balance
- Team Dynamics
- Career Development
- Leadership & Management
- Workplace Culture
- Resources & Tools
- Recognition & Appreciation
- Diversity & Inclusion

**Best Practice**: Select 3-5 themes. Too many can overwhelm employees; too few may miss important topics.

#### 3. Employee Targeting
Three targeting options:

**All Employees**
- Automatically includes all active employees
- Updates dynamically as employees join/leave

**By Department**
- Select specific departments
- Useful for targeted feedback initiatives

**Manual Selection**
- Choose individual employees
- Best for pilot programs or specific cohorts

**Best Practice**: Start with department targeting for your first survey to test the process.

#### 4. Schedule Configuration

**Immediate Deployment**
- Survey goes live as soon as you click "Deploy"
- Employees see it immediately on their dashboard

**Scheduled Deployment**
- Set a future start date and time
- Optional end date for closing responses
- Schedule reminders (future feature)

**Best Practice**: Schedule surveys during low-stress periods (avoid year-end, major deadlines).

#### 5. Consent & Privacy Settings

**Anonymization Level**
- **Anonymous**: HR cannot identify individual respondents. Use for sensitive topics.
- **Identified**: Responses linked to employees. Use when follow-up support is needed.

**Consent Message**
- Customize to explain data usage and privacy protections
- Must be clear and compliant with data protection regulations

**Data Retention**
- Default: 60 days
- Range: 30-365 days
- Data auto-deletes after retention period

**Best Practice**: Use anonymous mode for culture and wellbeing surveys. Use identified mode for onboarding or exit feedback.

#### 6. Preview & Test
- Simulate the employee conversation flow
- Test AI responses across different themes
- Verify consent and privacy messaging

**Critical**: Always preview before deploying to ensure the conversation feels natural.

---

## Managing Surveys

### Survey Lifecycle

**Draft**
- Survey is being created
- Can be edited freely
- Not visible to employees

**Active**
- Survey is live and accepting responses
- Employees see it on their dashboard
- Analytics update in real-time

**Completed**
- Survey has passed its end date
- No new responses accepted
- Analytics remain available

### Survey Actions

**Edit Survey** (Draft only)
- Modify themes, targeting, or schedule
- Cannot edit deployed surveys to preserve data integrity

**Deploy Survey**
- Activates the survey
- Creates employee assignments
- Sends notifications (if configured)

**Close Survey**
- Manually end an active survey early
- Moves to "Completed" status

**Archive Survey**
- Remove from active lists
- Analytics and data remain accessible

---

## Analytics & Insights

### Overview Dashboard

Navigate to **Analytics** → **Overview**

**Key Metrics**:
- **Total Responses**: Number of completed conversations
- **Completion Rate**: % of assigned employees who participated
- **Avg Sentiment**: Overall sentiment score (-1 to +1)
- **Urgent Flags**: Critical issues requiring immediate attention

**Charts**:
- **Sentiment Distribution**: Positive, neutral, negative breakdown
- **Participation Funnel**: Assigned vs. completed

### Participation Tab

Track employee engagement:
- Total assigned employees
- Completed surveys
- Pending (not started)
- Completion rate by department

**Actionable Insights**:
- Low completion rates? Consider reminders or shorter surveys
- Department disparities? Investigate barriers to participation

### Sentiment Tab

Understand emotional trends:
- Sentiment breakdown (positive/neutral/negative)
- Average sentiment score
- Mood improvement (initial vs. final mood)

**Actionable Insights**:
- Positive mood improvement = effective conversation
- High negative sentiment = urgent attention needed
- Neutral sentiment = may need deeper probing

### Themes Tab

See which topics matter most:
- Response count per theme
- Average sentiment per theme
- Urgent issues by theme

**Actionable Insights**:
- Themes with low sentiment = priority areas
- High urgency counts = systemic issues
- Compare themes across surveys to track trends

### Responses Tab

View individual anonymized responses:
- Content (paraphrased if anonymous)
- Sentiment score
- Associated theme
- AI analysis

**Best Practice**: Use for qualitative insights. Look for patterns and common language.

### Urgent Flags Tab

Critical issues escalated by AI:
- Employee expressed distress
- Mentioned safety concerns
- Indicated intent to leave

**Actions**:
- Mark as "Reviewed"
- Assign to team member
- Add resolution notes
- Mark as "Resolved"

**Critical**: Address urgent flags within 24-48 hours. If identified mode, follow up directly.

### Filters

Apply filters to drill down:
- **Survey**: Specific survey or all surveys
- **Sentiment**: Positive, neutral, or negative
- **Theme**: Specific conversation topic
- **Date Range**: Custom time period

### Exporting Data

**CSV Export**:
- Participation metrics
- Sentiment data
- Theme insights
- Raw anonymized responses

**PDF Report**:
- Executive summary
- Visual charts
- Key findings
- Recommended actions

**Best Practice**: Export monthly reports for leadership review.

---

## Action Commitments

Convert insights into visible action.

### Creating Commitments

1. Navigate to **Commitments**
2. Click **Add Commitment**
3. Fill in:
   - **Survey**: Which survey prompted this action
   - **Action Description**: What you'll do (be specific)
   - **Due Date**: Target completion date
   - **Visible to Employees**: Toggle ON to build trust

### Managing Commitments

**Status Updates**:
- **Pending**: Not started
- **In Progress**: Work underway
- **Completed**: Action finished

**Visibility**:
- Visible commitments appear on employee dashboards
- Use to demonstrate responsiveness to feedback

**Best Practice**: Make 80% of commitments visible. Show employees their voices matter.

### Sharing Updates

1. Click **Share Update** on a commitment
2. Write update message
3. Select target audience (all participants or specific departments)
4. Publish

Employees see updates on their dashboard under "Survey Updates."

---

## User Management

### Adding HR Analysts

Grant analytics-only access to team members:

1. **Settings** → **User Management**
2. Click **Add User**
3. Enter email address
4. Select role: **HR Analyst**
5. Analyst can view analytics but cannot create/deploy surveys

### Managing User Roles

**HR Admin** (your role):
- Full access to all features
- Create and deploy surveys
- View all analytics
- Manage users and settings

**HR Analyst**:
- View analytics and insights
- Export reports
- View commitments
- Cannot create surveys or manage users

**Employee**:
- Participate in assigned surveys
- View visible commitments
- See survey updates

### Deactivating Users

1. **Settings** → **User Management**
2. Find user in list
3. Toggle "Active" to OFF
4. User cannot sign in but data is preserved

---

## Settings & Configuration

### Survey Defaults

Set organization-wide defaults for new surveys:

1. **Settings** → **Survey Defaults**
2. Configure:
   - **First Message**: Default AI greeting
   - **Consent Message**: Standard privacy notice
   - **Anonymization Level**: Default privacy setting
   - **Data Retention**: Default days to keep data

**Note**: These are defaults only. You can customize per survey.

### Data Retention

Automated data cleanup:

1. **Settings** → **Data Retention**
2. View:
   - Active retention policies per survey
   - Deletion history log
   - Records deleted count

3. Manual cleanup:
   - Click **Trigger Cleanup Now**
   - Confirm action
   - View results in deletion log

**Best Practice**: Run manual cleanup before audits to ensure compliance.

### Audit Logs

Track all sensitive actions:

1. **Settings** → **Audit Logs**
2. View logs for:
   - Survey creation and deployment
   - User role changes
   - Data exports
   - Manual data deletions
   - Settings modifications

3. Filter by:
   - Action type
   - User
   - Date range

4. Export logs for compliance reporting

---

## Security & Compliance

### Data Privacy

**Anonymization**:
- Anonymous surveys cannot be de-anonymized
- Responses are paraphrased by AI to remove identifying details
- Employee-survey links are permanently severed

**Identified Surveys**:
- Employee IDs are stored securely
- Access restricted by role-based permissions
- Audit trail tracks all data access

### Consent Management

Every survey requires explicit employee consent:
- Consent timestamp recorded
- Consent can be revoked (data deleted)
- Consent history viewable in Settings

### Data Retention & Deletion

**Automated Deletion**:
- Data auto-deletes after retention period
- Deletion logs maintained for compliance

**Manual Deletion**:
- HR Admin can trigger immediate cleanup
- Requires confirmation
- Logged in audit trail

### Compliance Features

- **GDPR Compliance**: Right to access, right to erasure
- **Data Encryption**: At rest and in transit
- **Role-Based Access**: Principle of least privilege
- **Audit Logging**: Complete action trail

---

## Best Practices Summary

### Survey Design
✅ Use 3-5 relevant themes
✅ Customize first message for context
✅ Choose appropriate anonymization level
✅ Preview thoroughly before deploying

### Driving Engagement
✅ Communicate purpose clearly
✅ Respect employee time
✅ Share visible commitments
✅ Close the feedback loop

### Analyzing Data
✅ Review analytics weekly
✅ Filter by theme and sentiment
✅ Look for patterns across surveys
✅ Export monthly reports

### Taking Action
✅ Address urgent flags within 48 hours
✅ Create specific, time-bound commitments
✅ Make commitments visible
✅ Share regular updates

### Maintaining Trust
✅ Honor anonymization promises
✅ Act on feedback transparently
✅ Communicate data usage clearly
✅ Respect data retention policies

---

## Quick Reference

### Common Tasks

| Task | Navigation |
|------|-----------|
| Create survey | Dashboard → Create New Survey |
| View analytics | Analytics → Select tab |
| Export report | Analytics → Export CSV/PDF |
| Add commitment | Commitments → Add Commitment |
| Add HR Analyst | Settings → User Management → Add User |
| View audit logs | Settings → Audit Logs |
| Trigger data cleanup | Settings → Data Retention → Trigger Cleanup |

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate to Dashboard | `g` + `d` |
| Create Survey | `c` + `s` |
| View Analytics | `g` + `a` |

---

## Troubleshooting

### Survey Not Deploying
- Check theme selection (minimum 1 required)
- Verify employee targeting (minimum 1 employee)
- Ensure all wizard steps are complete

### Analytics Not Loading
- Verify filters aren't too restrictive
- Check if survey has any responses
- Confirm you have analytics permissions

### Employees Not Seeing Survey
- Confirm survey status is "Active"
- Check employee is in target group
- Verify employee account is active

### Export Failing
- Ensure survey has response data
- Check your browser allows downloads
- Try exporting smaller date ranges

---

**Need Help?**
Contact your system administrator or refer to the Setup Guide for additional support.

---

*Spradley HR Admin Guide v1.0*
