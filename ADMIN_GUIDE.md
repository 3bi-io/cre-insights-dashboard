# ATS.me Administrator Guide

Complete guide for system administrators managing ATS.me.

## 🔐 Admin Access

### Becoming an Administrator

The first user to sign up automatically becomes an admin. Additional admins can be added:

1. Go to Settings → Team
2. Find the user
3. Click Edit → Change role to "Admin"
4. Confirm the change

### Admin Dashboard

Access admin-specific features:
- Navigate to Settings
- Admin-only sections will be visible:
  - Organization Settings
  - Team Management
  - Billing & Usage
  - Integrations
  - Security Settings
  - System Logs

## 👥 User Management

### Adding Users

1. **Via Invitation**
   ```
   Settings → Team → Invite Member
   - Enter email address
   - Select role
   - Send invitation
   ```

2. **Bulk Import**
   ```
   Settings → Team → Import Users
   - Download CSV template
   - Fill in user details
   - Upload CSV file
   ```

### User Roles

Configure granular permissions:

| Role | Description | Use Case |
|------|-------------|----------|
| **Admin** | Full system access | System administrators |
| **Hiring Manager** | Manage jobs & hiring | Department heads |
| **Recruiter** | Process applications | HR team members |
| **Interviewer** | Conduct interviews | Technical team members |
| **Viewer** | Read-only access | Executives, stakeholders |

### Managing Existing Users

**Edit User:**
1. Settings → Team
2. Find user
3. Click Edit
4. Modify details:
   - Name
   - Email
   - Role
   - Department
   - Active status
5. Save changes

**Deactivate User:**
1. Find user in team list
2. Click Edit
3. Toggle "Active" to off
4. User can't log in but data is preserved

**Delete User:**
1. Find user in team list
2. Click Delete
3. Confirm deletion
4. ⚠️ This action cannot be undone

### Password Reset

Help users reset their password:
1. Settings → Team
2. Find user
3. Click "Send Password Reset"
4. User receives reset email

## 🏢 Organization Settings

### Company Profile

Configure your organization's information:

```
Settings → Organization → Profile
- Company name
- Industry
- Company size
- Website
- Logo (recommended: 200x200px PNG)
- Address
- Phone number
```

### Branding

Customize the look and feel:

**Colors:**
- Primary color
- Secondary color
- Accent color
- All colors will be applied to buttons, links, and UI elements

**Email Templates:**
- Application received
- Status updates
- Interview invitations
- Offer letters
- Rejection notifications

**Customization:**
1. Settings → Organization → Branding
2. Click "Edit Email Template"
3. Modify template (supports variables):
   - `{{candidate_name}}`
   - `{{job_title}}`
   - `{{company_name}}`
   - `{{interview_date}}`
4. Preview changes
5. Save template

### Departments

Organize your team:

1. Settings → Organization → Departments
2. Click "Add Department"
3. Enter:
   - Department name
   - Description
   - Department head (assign user)
4. Save

Assign users to departments in their profile.

## 🔗 Integrations

### Available Integrations

#### Email Service (Recommended)

Configure SMTP for custom email sending:

```
Settings → Integrations → Email
- SMTP Host
- SMTP Port
- Username
- Password
- From Email
- From Name
```

Test the configuration before saving.

#### Calendar Integration

Sync interviews with calendars:

**Google Calendar:**
1. Settings → Integrations → Calendar
2. Click "Connect Google Calendar"
3. Authorize access
4. Interviews will sync automatically

**Outlook/Microsoft:**
1. Settings → Integrations → Calendar
2. Click "Connect Microsoft Calendar"
3. Authorize access

#### Job Board Posting

Auto-post jobs to job boards:

**LinkedIn:**
1. Settings → Integrations → LinkedIn
2. Enter LinkedIn API credentials
3. Enable auto-posting

**Indeed:**
1. Settings → Integrations → Indeed
2. Enter Indeed employer account details
3. Enable auto-posting

### Webhook Configuration

Send data to external systems:

1. Settings → Integrations → Client Webhooks
2. Click "Add Webhook"
3. Configure:
   - **URL endpoint** - HTTPS URL to receive webhook data
   - **Source Filter** - Select which application sources trigger this webhook:
     - Direct Application
     - ElevenLabs (Voice Apply)
     - Facebook Lead Gen
     - Tenstreet Import
   - **Event Types**:
     - `created` - New application submitted
     - `updated` - Application data changed
     - `status_changed` - Status workflow change
   - **Secret Key** (optional) - For signature verification
4. Test webhook
5. Save

**Webhook Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256=<signature> (if secret key configured)
X-Webhook-Event: application.created
```

**Example webhook payload:**
```json
{
  "event": "application.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "applicationId": "uuid",
    "jobId": "uuid",
    "jobListingId": "uuid",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "phone": "+15551234567",
    "status": "pending",
    "source": "Direct Application",
    "cdl": "Yes",
    "experience": "24 months",
    "city": "Dallas",
    "state": "TX"
  }
}
```

**Bulk Export:**
- Settings → Integrations → Client Webhooks
- Click "Bulk Export" on any webhook
- Sends all matching applications (by source filter) to the webhook
- Rate limited: 5 exports per hour per user

### Voice Agent Configuration (ElevenLabs)

Configure AI voice agents for automated applicant screening and follow-ups:

1. Settings → Voice Agents
2. Click "Add Voice Agent"
3. Configure:
   - **Agent Name** - Descriptive name (e.g., "Outbound Recruiter")
   - **ElevenLabs Agent ID** - From your ElevenLabs dashboard
   - **Phone Number** - Assigned phone number for calls
   - **Agent Type**:
     - `outbound` - Makes calls to applicants
     - `inbound` - Receives incoming calls
   - **Outbound Enabled** - Enable automatic outbound calls
   - **Active Status** - Enable/disable the agent

**Setting Up ElevenLabs:**
1. Create account at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to Conversational AI → Agents
3. Create a new agent with your custom persona
4. Copy the Agent ID
5. Add ELEVENLABS_API_KEY to project secrets

**Automatic Outbound Calls:**
When configured, voice agents automatically call new applicants:
- Triggered when application is submitted via /apply
- Requires: `is_active = true`, `outbound_enabled = true`, phone number configured
- Calls are logged to `outbound_calls` table

**Voice Apply (Inbound):**
Enable candidates to complete applications via voice:
- Link voice agent to job listings
- Candidates click "Voice Apply" on job page
- Agent guides them through application questions
- Transcript saved to application record

**Managing Transcripts:**
- View call transcripts in application details
- Transcripts synced from ElevenLabs automatically
- Audio recordings available (if enabled in ElevenLabs)

### Super Admin Features

Super Admins have elevated privileges for cross-organization management:

**Cross-Organization Visibility:**
- View applications across all organizations
- Access all job listings regardless of organization
- Manage users across organizations

**Global Dashboard:**
- System-wide analytics
- All organization metrics
- Recent audit activity

**How to Assign Super Admin:**
1. Settings → Administrators
2. Select user
3. Set role to "super_admin"
4. Save changes

**Note:** Super Admin should be limited to trusted personnel only.
```

## 🔒 Security Settings

### Authentication

Configure authentication policies:

**Password Policy:**
```
Settings → Security → Authentication
- Minimum length: 8-32 characters
- Require uppercase
- Require numbers
- Require special characters
- Password expiration: 30-365 days
```

**Multi-Factor Authentication (MFA):**
1. Settings → Security → MFA
2. Enable MFA requirement for:
   - All users
   - Admins only
   - Optional
3. Choose MFA methods:
   - Authenticator app (recommended)
   - SMS
   - Email

**Session Management:**
- Session timeout: 15 minutes to 24 hours
- Remember me duration: 7-30 days
- Concurrent session limit: 1-5 sessions

### Access Control

**IP Allowlist:**
Restrict access to specific IP addresses:

1. Settings → Security → IP Allowlist
2. Click "Add IP"
3. Enter IP address or CIDR range
4. Add description
5. Save

⚠️ Be careful not to lock yourself out!

**Two-Factor Authentication:**
Require 2FA for specific roles:
- Enable for all admins
- Enable for hiring managers
- Make optional for others

### Data Retention

Configure how long data is kept:

```
Settings → Security → Data Retention
- Applications: 90 days to 7 years
- Candidate data: 1 year to indefinitely
- Logs: 30 days to 1 year
- Analytics: 1 year to indefinitely
```

### Audit Logs

Track all system activities:

**Viewing Logs:**
1. Settings → Security → Audit Logs
2. Filter by:
   - User
   - Action type
   - Date range
   - Resource

**Logged Actions:**
- User login/logout
- Application status changes
- Job creation/modification
- User management
- Settings changes
- Data exports

**Exporting Logs:**
1. Apply desired filters
2. Click "Export Logs"
3. Choose format (CSV or JSON)
4. Download

## 💳 Billing & Usage

### Viewing Usage

Monitor your usage:

```
Settings → Billing → Usage
- Active users
- Jobs posted
- Applications received
- AI analyses performed
- Storage used
- API calls made
```

### Billing Information

Manage billing:

**Update Payment Method:**
1. Settings → Billing → Payment Method
2. Click "Update"
3. Enter new card details
4. Save

**View Invoices:**
1. Settings → Billing → Invoices
2. View past invoices
3. Download PDF copies

**Change Plan:**
1. Settings → Billing → Plan
2. View available plans
3. Click "Change Plan"
4. Confirm changes

### Usage Alerts

Set up alerts for usage limits:

1. Settings → Billing → Alerts
2. Click "Add Alert"
3. Configure:
   - Metric (users, storage, AI calls, etc.)
   - Threshold (e.g., 80% of limit)
   - Notification email
4. Save

## 📊 Analytics & Monitoring

### System Health

Monitor system performance:

**Dashboard:**
```
Settings → Admin → System Health
- Uptime
- Response times
- Error rates
- Database performance
- Storage usage
```

**Alerts:**
Set up alerts for:
- High error rates
- Slow response times
- Storage near capacity
- Unusual activity patterns

### Usage Analytics

Track how your team uses the system:

**User Activity:**
- Logins per day
- Most active users
- Feature usage
- Time spent in system

**Application Flow:**
- Average time in each status
- Bottlenecks in process
- Rejection rates by stage
- Most common rejection reasons

**AI Performance:**
- Scoring accuracy
- Analysis completion time
- AI recommendation follow-rate
- Model confidence levels

## 🔧 Database Management

### Database Access

Direct database access (advanced users):

⚠️ **Warning:** Direct database access can break the application if misused.

1. Go to Supabase dashboard
2. Navigate to SQL Editor
3. Run queries carefully
4. Always test on a copy first

### Backups

**Automatic Backups:**
- Daily backups (retained for 7 days)
- Weekly backups (retained for 4 weeks)
- Monthly backups (retained for 12 months)

**Manual Backup:**
1. Settings → Admin → Database
2. Click "Create Backup"
3. Wait for completion
4. Download backup file

**Restore from Backup:**
1. Settings → Admin → Database
2. Click "Restore"
3. Select backup
4. Confirm restoration
5. System will be unavailable during restore (5-30 minutes)

⚠️ Restoring will overwrite current data!

### Database Optimization

Keep the database performant:

**Run Optimization:**
1. Settings → Admin → Database
2. Click "Optimize"
3. System will:
   - Vacuum tables
   - Rebuild indexes
   - Update statistics
4. Best done during low-traffic periods

**Schedule Optimization:**
- Recommended: Weekly
- Configure in Settings → Admin → Maintenance

## 🚨 Incident Response

### Error Monitoring

Track and resolve errors:

**Error Dashboard:**
1. Settings → Admin → Errors
2. View recent errors
3. Group by:
   - Error type
   - Affected users
   - Frequency
   - Impact

**Error Details:**
- Stack trace
- User actions leading to error
- Browser/device information
- Timestamp

**Resolving Errors:**
1. Click on error
2. Review details
3. Mark as:
   - Resolved
   - In Progress
   - Needs Investigation
4. Add notes for team

### System Status

Communicate status to users:

**Set Status:**
1. Settings → Admin → System Status
2. Choose:
   - Operational (green)
   - Degraded Performance (yellow)
   - Partial Outage (orange)
   - Major Outage (red)
   - Maintenance (blue)
3. Add message for users
4. Save

Status appears on login page and in app header.

### Maintenance Mode

Enable for system updates:

1. Settings → Admin → Maintenance
2. Toggle "Maintenance Mode"
3. Set message for users
4. Optionally allow admin access
5. Enable

When enabled:
- Users see maintenance page
- No data modifications allowed
- Admin can still access (if configured)

## 📤 Data Export & Import

### Bulk Export

Export all data:

1. Settings → Admin → Data Export
2. Select what to export:
   - All applications
   - All jobs
   - All candidates
   - User data
   - Analytics data
3. Choose format:
   - CSV
   - JSON
   - Excel
4. Click "Export"
5. Download when ready

### Bulk Import

Import data from other systems:

1. Settings → Admin → Data Import
2. Select data type:
   - Applications
   - Jobs
   - Candidates
3. Download CSV template
4. Fill template with your data
5. Upload CSV
6. Map fields if needed
7. Validate data
8. Confirm import

**Field Mapping:**
- Match your columns to ATS.me fields
- Required fields must be mapped
- Optional fields can be skipped

### GDPR Data Exports

Handle data subject requests:

**Export User Data:**
1. Settings → Admin → GDPR
2. Enter user email
3. Click "Export User Data"
4. All data related to that user is exported
5. Download ZIP file

Includes:
- Profile information
- Applications
- Interview history
- Notes and comments
- Activity logs

## 🔄 Updates & Maintenance

### System Updates

ATS.me updates automatically:

- Updates deployed during low-traffic periods
- No downtime for most updates
- Notification sent before major updates
- Review changelog after each update

**Update Notifications:**
- Email to admins
- In-app notification
- Change log in Settings → About

### Feature Flags

Enable/disable features:

1. Settings → Admin → Features
2. Toggle features:
   - AI scoring
   - Bias detection
   - Interview scheduling
   - Mobile app
   - PWA features
3. Changes apply immediately

Use to:
- Disable problematic features
- Gradual rollouts
- A/B testing

## 📝 Best Practices

### Security

1. **Regular Audits**
   - Review user access quarterly
   - Check audit logs weekly
   - Monitor failed login attempts
   - Review API usage

2. **Access Control**
   - Use principle of least privilege
   - Remove access for departed employees immediately
   - Require MFA for admins
   - Rotate passwords regularly

3. **Data Protection**
   - Regular backups
   - Test restore procedures
   - Encrypt sensitive data
   - Comply with GDPR/privacy laws

### Performance

1. **Monitor Usage**
   - Track response times
   - Monitor database size
   - Check storage usage
   - Review error rates

2. **Optimize Regularly**
   - Run database optimization weekly
   - Clean up old data per retention policy
   - Review and optimize slow queries
   - Archive old applications

3. **Scale Proactively**
   - Monitor user growth
   - Upgrade plan before hitting limits
   - Add team members as needed
   - Optimize processes before bottlenecks

### User Management

1. **Onboarding**
   - Create user guide for new team members
   - Provide training sessions
   - Set up mentor/buddy system
   - Share best practices

2. **Support**
   - Respond to user questions quickly
   - Create internal knowledge base
   - Gather feedback regularly
   - Act on feature requests

3. **Compliance**
   - Regular compliance audits
   - Update privacy policies
   - Train team on data handling
   - Document processes

## 🆘 Troubleshooting

### Common Issues

**Users Can't Log In:**
1. Check if account is active
2. Verify email address
3. Check IP allowlist (if enabled)
4. Reset password
5. Check MFA settings

**Slow Performance:**
1. Check system health dashboard
2. Run database optimization
3. Clear browser cache (user side)
4. Check for ongoing maintenance
5. Contact support if persistent

**AI Scoring Not Working:**
1. Check AI service status
2. Verify AI feature is enabled
3. Check usage limits
4. Review error logs
5. Reanalyze manually

**Emails Not Sending:**
1. Verify SMTP configuration
2. Check email service status
3. Review email logs
4. Test with different recipient
5. Check spam folders

### Getting Support

**Priority Support (Admin):**
- Email: admin-support@ats.me
- Phone: Available for enterprise plans
- Response time: < 4 hours

**Documentation:**
- Full documentation at docs.ats.me
- Knowledge base articles
- API reference
- Community forum

---

For user documentation, see [USER_GUIDE.md](./USER_GUIDE.md)

For deployment guidance, see [DEPLOYMENT.md](./DEPLOYMENT.md)
