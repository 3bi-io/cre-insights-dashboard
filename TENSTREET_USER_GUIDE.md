# Tenstreet Integration - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Configuration](#configuration)
4. [Core Features](#core-features)
5. [Common Workflows](#common-workflows)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

The Tenstreet integration connects your applicant tracking system with Tenstreet ATS, enabling seamless posting of driver applications, automated background screening, and comprehensive applicant management.

### What Can You Do?

- **Post Applications**: Send applicant data directly to Tenstreet ATS
- **Screen Applicants**: Request and track background checks, drug tests, and MVR
- **Bulk Operations**: Import, export, and sync data in batches
- **Real-Time Tracking**: Monitor screening status and application progress
- **Analytics**: View trends and performance metrics
- **Export Data**: Generate reports in CSV or PDF format

### Who Can Use This?

- **Super Admins**: Full access to all features across organizations
- **Organization Admins**: Manage integration for their organization
- **Job Owners**: Post applications and request screenings for their jobs

---

## Getting Started

### Step 1: Access the Tenstreet Dashboard

1. Click on **Platforms** in the main navigation
2. Find the **Tenstreet Integration** card
3. Click **Open Dashboard** or **Configure** if not set up yet

Alternatively, navigate to **Admin → Tenstreet Integration**

### Step 2: Verify Configuration Status

The dashboard Overview tab shows your connection status:

- 🟢 **Connected**: Integration is active and working
- 🔴 **Not Configured**: Credentials need to be set up
- 🟡 **Partial**: Some configuration is missing

---

## Configuration

### Setting Up Tenstreet Credentials

**Required Credentials:**
- Client ID
- API Key
- Account Code
- Environment (Production or Staging)

**Steps:**
1. Navigate to **Tenstreet Dashboard → Settings Tab**
2. Click **Configure Credentials**
3. Enter your Tenstreet API credentials
4. Select environment (use Staging for testing)
5. Click **Test Connection** to verify
6. If successful, click **Save Credentials**

⚠️ **Important**: Keep your API credentials secure. Never share them publicly.

### Configuring Field Mappings

Field mappings tell the system how to translate your application data to Tenstreet's format.

**Steps:**
1. Navigate to **Admin → Tenstreet Integration**
2. Click the **Field Mappings** tab
3. Use the visual editor to map fields:
   - Left side: Your application fields
   - Right side: Tenstreet XML fields
4. Preview the XML output
5. Click **Save Mappings**

**Default Mappings Included:**
- Personal information (name, contact)
- Employment history
- License information
- Common custom fields

You can customize these based on your specific needs.

---

## Core Features

### 1. Application Posting

**How to Post a Single Application:**

1. Go to **Applications** page
2. Find the applicant you want to post
3. Click the **Actions** button (three dots)
4. Select **Post to Tenstreet**
5. Review the applicant data in the dialog
6. Edit any fields if needed
7. Verify field mapping is correct
8. Click **Post Application**
9. Wait for success confirmation

**What Happens Next:**
- Application data is sent to Tenstreet ATS
- Status is tracked in the application details
- You'll receive a notification on success/failure

### 2. Screening Requests

**Initiating a Background Check:**

1. Open an application's detail page
2. Click **Request Screening**
3. Select screening type:
   - Background Check
   - Drug Screening
   - MVR (Motor Vehicle Record)
   - Employment Verification
4. Attach any required documents
5. Click **Send Request**

**Tracking Status:**

The **XchangeStatusWidget** shows real-time status:
- **Active**: Screening in progress (with count)
- **Completed**: Screening finished (with count)
- **Failed**: Screening encountered an error

Click **View Details** to see full screening history.

**Status Updates:**
- Automatic updates every 30 seconds
- Toast notifications for status changes
- Download completed reports as PDF

### 3. Bulk Operations

Access bulk operations from **Tenstreet Dashboard → Operations Tab**

**Bulk Import:**
1. Click **Import Applications**
2. Configure import parameters
3. Click **Start Import**
4. Monitor progress in real-time
5. Review success/failure counts

**Bulk Export:**
1. Click **Export Data**
2. Select fields to include
3. Choose format (CSV or PDF)
4. Click **Export**
5. Download the generated file

**Bulk Status Update:**
1. Select multiple applications
2. Click **Update Status**
3. Choose new status
4. Confirm action
5. Track progress

### 4. Real-Time Status Monitor

Located in **Tenstreet Dashboard → Overview Tab**

Shows live updates for:
- Pending screening requests
- Active bulk operations
- Recent completions
- Failed requests

**Features:**
- Auto-refresh every 30 seconds
- Color-coded status indicators
- Quick action buttons
- Download completed reports

### 5. Analytics Dashboard

Access from **Tenstreet Dashboard → Analytics Tab**

**Available Charts:**
- **Application Trends**: Volume over time
- **Source Performance**: Which sources convert best
- **Conversion Funnel**: Drop-off points in your process

**Use Cases:**
- Identify peak application periods
- Optimize recruitment sources
- Improve conversion rates

### 6. Quick Actions

Accessible throughout the application:

**From Applications Page:**
- Post to Tenstreet
- Request Screening
- View Tenstreet Status

**From Tenstreet Dashboard:**
- Import Applications
- Export Data
- Test Connection
- Configure Settings

**From Admin Menu:**
- Open Tenstreet Dashboard
- Configure Credentials
- Manage Field Mappings

### 7. Notifications

**Notification Badge:**
- Appears on "ATS Integrations" menu item
- Shows count of items requiring attention:
  - Pending screenings
  - Failed requests
  - Active bulk operations

**Toast Notifications:**
- Screening status changes
- Bulk operation completions
- Connection errors
- Success confirmations

---

## Common Workflows

### Workflow 1: Onboarding a New Driver

1. **Post Application to Tenstreet**
   - Navigate to Applications
   - Find the new applicant
   - Click Actions → Post to Tenstreet
   - Verify data and post

2. **Initiate Background Screening**
   - Open application details
   - Click Request Screening
   - Select Background Check + Drug Test
   - Send request

3. **Monitor Status**
   - Check XchangeStatusWidget for updates
   - Receive notification when completed
   - Download screening report

4. **Review Results**
   - Open completed screening report
   - Verify all checks passed
   - Proceed with hiring process

### Workflow 2: Weekly Application Review

1. **Check Dashboard Metrics**
   - Open Tenstreet Dashboard
   - Review Overview tab statistics
   - Check for any failed requests

2. **Export Data for Analysis**
   - Go to Operations tab
   - Click Export Data
   - Select relevant fields
   - Download as CSV
   - Analyze in spreadsheet

3. **Review Screening Status**
   - Check Real-Time Status Monitor
   - Download any completed reports
   - Follow up on failed requests

### Workflow 3: Bulk Importing Historical Data

1. **Prepare for Import**
   - Verify credentials are configured
   - Test connection
   - Ensure field mappings are correct

2. **Start Import**
   - Go to Operations tab
   - Click Import Applications
   - Select date range (if applicable)
   - Start import

3. **Monitor Progress**
   - Watch BulkOperationProgress widget
   - Note success/failure counts
   - Review errors if any

4. **Verify Imported Data**
   - Go to Applications page
   - Filter by date imported
   - Spot-check data accuracy

### Workflow 4: Configuring for First Time

1. **Set Up Credentials**
   - Obtain API credentials from Tenstreet
   - Navigate to Settings tab
   - Enter credentials
   - Test connection

2. **Configure Field Mappings**
   - Go to Admin → Tenstreet Integration
   - Review default mappings
   - Customize for your forms
   - Save mappings

3. **Test with Sample Application**
   - Find a test application
   - Post to Tenstreet (staging)
   - Verify data appears correctly in Tenstreet
   - Adjust mappings if needed

4. **Enable for Production**
   - Switch to Production environment
   - Test with one real application
   - Monitor for any issues
   - Roll out to team

---

## Troubleshooting

### Connection Issues

**Problem**: Connection test fails

**Solutions:**
1. Verify credentials are entered correctly
2. Check you're using the right environment (Production vs Staging)
3. Ensure your Tenstreet account has API access enabled
4. Contact Tenstreet support if issues persist

**Problem**: "Unauthorized" errors

**Solutions:**
1. Re-enter your API credentials
2. Verify your API key hasn't expired
3. Check your account permissions in Tenstreet

### Application Posting Issues

**Problem**: Application fails to post

**Solutions:**
1. Check that all required fields are mapped
2. Verify field data matches expected types
3. Review error message in toast notification
4. Check edge function logs for details

**Problem**: Data appears incorrect in Tenstreet

**Solutions:**
1. Review field mappings configuration
2. Ensure data types match (dates, numbers, text)
3. Test with sample data
4. Adjust mappings and try again

### Screening Request Issues

**Problem**: Screening request stuck in "Pending"

**Solutions:**
1. Check your internet connection
2. Verify polling is active (check browser console)
3. Refresh the page
4. Contact Tenstreet if stuck for > 24 hours

**Problem**: Cannot download screening report

**Solutions:**
1. Ensure screening status is "Completed"
2. Try refreshing the page
3. Check browser pop-up blocker settings
4. Use Export Data feature as alternative

### Bulk Operation Issues

**Problem**: Bulk operation not starting

**Solutions:**
1. Check bulk_operations table for status
2. Verify you have proper permissions
3. Ensure previous operations completed
4. Try with smaller batch size

**Problem**: High failure rate on bulk import

**Solutions:**
1. Review field mappings
2. Check data quality in source
3. Test with small sample first
4. Review error logs for patterns

### Performance Issues

**Problem**: Dashboard loading slowly

**Solutions:**
1. Clear browser cache
2. Check internet connection speed
3. Try in different browser
4. Report to admin for instance sizing review

**Problem**: Real-time updates delayed

**Solutions:**
1. Check polling interval settings
2. Verify browser tab is active
3. Refresh the page
4. Check system performance

### Getting Help

**In-App Resources:**
- View edge function logs (Admin access)
- Check database query results
- Use browser DevTools for network issues

**Contact Support:**
- Include error messages
- Provide timestamps of issues
- Share application IDs if relevant
- Note what you've already tried

---

## Best Practices

### Data Quality
- Review applicant data before posting
- Keep field mappings up to date
- Test changes in Staging environment first
- Regular audit of posted applications

### Workflow Efficiency
- Use bulk operations for large datasets
- Set up quick actions for common tasks
- Enable notifications for important events
- Regularly review analytics for insights

### Security
- Keep API credentials confidential
- Use role-based access appropriately
- Regularly review user permissions
- Monitor for unauthorized access attempts

### Maintenance
- Test connection weekly
- Review error logs monthly
- Update field mappings when forms change
- Keep documentation current

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Dashboard | `Ctrl/Cmd + Shift + T` |
| Quick Export | `Ctrl/Cmd + E` |
| Refresh Data | `Ctrl/Cmd + R` |
| Search Applications | `Ctrl/Cmd + K` |

---

## Glossary

- **ATS**: Applicant Tracking System
- **RLS**: Row Level Security
- **MVR**: Motor Vehicle Record
- **Xchange**: Tenstreet's screening service
- **Edge Function**: Serverless backend function
- **Field Mapping**: Configuration linking your fields to Tenstreet's
- **Bulk Operation**: Processing multiple records at once

---

**Need More Help?**

- Check TENSTREET_INTEGRATION_COMPLETE.md for technical details
- Review TROUBLESHOOTING.md for advanced debugging
- Contact your system administrator
- Reach out to Tenstreet support

**Document Version:** 1.0  
**Last Updated:** February 2025
