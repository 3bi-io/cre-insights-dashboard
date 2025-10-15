# Tenstreet Integration Review - Complete Feature List

## ✅ Available to All Administrators (Super Admins & Org Admins)

### 1. **Tenstreet Credentials Management**
- **Location**: Applications page → Settings
- **Access**: Super Admins (all organizations) + Org Admins (their organization only)
- **Features**:
  - Set Tenstreet API credentials (Client ID, Password)
  - Configure account name and company details
  - Choose environment mode (Production, Test, Development)
  - Test API connection before saving
  - Store credentials securely at organization level

### 2. **Application Management & Tenstreet Integration**
- **Location**: Applications page
- **Access**: Super Admins + Org Admins + Job Owners
- **Features**:
  - View all applications with modern, engaging UI
  - Post individual applications to Tenstreet ATS
  - Field mapping configuration for data transfer
  - Real-time status updates
  - Bulk operations support

### 3. **Tenstreet Post to ATS Dialog**
- **Location**: Application Card → "Post to Tenstreet" button
- **Access**: Super Admins + Org Admins + Job Owners
- **Features**:
  - Review application data before posting
  - Edit applicant information (name, email, phone, DOB)
  - Custom field mapping management
  - Save and load mapping configurations
  - Comprehensive field support:
    - PersonName (prefix, given name, middle name, family name, affix)
    - PostalAddress (city, state, zip, address lines)
    - GovernmentID (SSN, driver's license)
    - Contact Data (email, phones)
    - Date of Birth
    - Custom questions mapping
    - Display fields mapping

### 4. **Field Mapping Configuration**
- **Location**: Post to Tenstreet dialog → "Field Mapping Settings"
- **Access**: Super Admins + Org Admins
- **Features**:
  - Map application fields to Tenstreet XML format
  - Save multiple mapping configurations
  - Load saved mappings for reuse
  - Configure custom questions
  - Configure display fields
  - Default mapping template

### 5. **Tenstreet Integration Dashboard**
- **Location**: `/admin/tenstreet`
- **Access**: Super Admins + Org Admins (with tenstreet_access feature)
- **Features**:
  - **API Configuration Tab**: Full credentials and settings management
  - **Name Mapping Tab**: PersonName field configuration
  - **Address & Contact Tab**: Postal address and contact info mapping
  - **Identification Tab**: Government ID and DOB mapping
  - **Custom Questions Tab**: Add/remove custom questions with dynamic mapping
  - **Display Fields Tab**: Configure display prompts and values
  - Test connection functionality
  - Save configuration across all tabs

### 6. **Tenstreet API Explorer**
- **Location**: `/admin/tenstreet-explorer`
- **Access**: Super Admins + Org Admins (with tenstreet_access feature)
- **Features**:
  - Discover available Tenstreet API services
  - Test individual API endpoints
  - Search applicants by email, phone, last name
  - Retrieve applicant data by driver ID
  - View raw XML responses
  - View parsed JSON data
  - Test connectivity with live API

### 7. **Screening Requests Management**
- **Location**: Applications page → Application Card → "Screening Requests" button
- **Access**: Super Admins + Org Admins
- **Features**:
  - Send background check requests
  - Send employment application requests
  - Send drug screening requests
  - Track request status (pending, sent, completed, failed, expired)
  - Upload and manage documents
  - Link documents to specific screening requests
  - Document storage with secure access

### 8. **SMS Communication**
- **Location**: Applications page → Application Card → SMS button
- **Access**: Super Admins + Org Admins + Recruiters
- **Features**:
  - Sleek modern messaging interface
  - Send/receive SMS with applicants
  - Message history tracking
  - Status indicators (sent, delivered, failed)
  - Twilio integration
  - Conversation threading

## 🔒 Access Control & Security

### Row Level Security (RLS) Policies:

1. **Tenstreet Credentials** (`tenstreet_credentials` table):
   - Super admins: Full access to all organizations' credentials
   - Org admins: Can view/edit only their organization's credentials
   - Job owners: No access

2. **Screening Requests** (`screening_requests` table):
   - Super admins: Full access to all requests
   - Org admins: Can manage requests for applications in their organization
   - Job owners: Can view requests for their job listings

3. **Application Documents** (`application_documents` table):
   - Super admins: Full access to all documents
   - Org admins: Can manage documents for applications in their organization
   - Job owners: Can view documents for their applications

4. **Field Mappings** (`tenstreet_field_mappings` table):
   - Users can manage their own field mappings
   - Mappings are user-specific, not organization-wide

### Organization Features:

- Tenstreet access controlled by `organization_features` table
- Feature key: `tenstreet_access`
- Super admins bypass all feature checks
- Org admins must have feature enabled for their organization

## 📊 Database Tables

### Core Tables:
1. `tenstreet_credentials` - API credentials per organization
2. `tenstreet_field_mappings` - User-specific field mappings
3. `screening_requests` - Background check/drug screening requests
4. `application_documents` - Document storage metadata
5. `applications` - Application data with Tenstreet sync status

### Storage Buckets:
1. `application-documents` - Secure document storage (50MB limit, PDF/images only)

## 🔄 Edge Functions

1. **tenstreet-integration** - Main integration handler
   - Actions: send_application, test_connection, sync_applicant
   - XML payload generation
   - Tenstreet API communication

2. **tenstreet-explorer** - API exploration tool
   - Service discovery
   - Endpoint testing
   - Applicant search and retrieval

3. **send-screening-request** - Screening automation
   - Send email notifications
   - Track request lifecycle
   - Link to documents

4. **send-sms** - SMS communication
   - Twilio integration
   - Message tracking
   - Status updates

## 🎯 Integration Points

### From Applications Page:
- Post to Tenstreet button on each application card
- Screening Requests dialog
- SMS conversation dialog
- Application details view

### From Admin Menu:
- Tenstreet Integration page (`/admin/tenstreet`)
- Tenstreet Explorer page (`/admin/tenstreet-explorer`)
- Organization features management

### From Organization Dashboard:
- Feature status display
- Tenstreet access indicator
- Quick links to integration pages

## 📝 Configuration Requirements

### For Full Functionality:
1. ✅ Tenstreet credentials configured (Client ID, Password)
2. ✅ Organization feature `tenstreet_access` enabled
3. ✅ Field mappings configured (or use defaults)
4. ✅ Twilio credentials for SMS (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
5. ✅ Supabase edge functions deployed

### Optional Configurations:
- Custom question mappings
- Display field mappings
- Saved mapping templates
- Screening request providers

## 🚀 User Workflows

### Posting an Application to Tenstreet:
1. Navigate to Applications page
2. Find the application
3. Click "Post to Tenstreet" button
4. Review/edit applicant data
5. Configure field mappings (optional)
6. Click "Post to Tenstreet"
7. Receive success/failure notification

### Managing Screening Requests:
1. Open application card
2. Click "Screening Requests" button
3. Choose request type (background check, drug screening, employment app)
4. Enter recipient email (or use applicant's email)
5. Add provider name and notes
6. Send request
7. Track status in Request History tab
8. Upload documents when received

### Exploring Tenstreet API:
1. Go to `/admin/tenstreet-explorer`
2. Click "Discover Services" to see available endpoints
3. Test individual services
4. Search for applicants
5. Retrieve applicant data
6. View raw XML and parsed responses

## ✨ All Features Confirmed Available

✅ **Tenstreet Credentials Management** - Super Admins & Org Admins
✅ **Field Mapping Configuration** - All Admins
✅ **Application Posting** - All Admins & Job Owners
✅ **Tenstreet Integration Dashboard** - All Admins
✅ **API Explorer** - All Admins
✅ **Screening Requests** - All Admins
✅ **Document Management** - All Admins
✅ **SMS Communication** - All Admins & Recruiters
✅ **Test Connection** - All Admins
✅ **Custom Questions Mapping** - All Admins
✅ **Display Fields Mapping** - All Admins
✅ **Saved Mapping Templates** - All Users

---

**Last Updated**: 2025-10-15
**Status**: ✅ All features accessible to appropriate admin levels
