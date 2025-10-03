# Application Feed XML Specification

## Overview

This document defines the XML feed specification for submitting job applications to the IntelliATS Applicant Tracking System. The feed allows external systems, partners, and job boards to submit candidate applications directly to the `applications` table in Supabase.

**Version:** 1.0  
**Last Updated:** 2025-10-03  
**Support Contact:** support@intelliats.com

---

## Submission Endpoint

**Primary Endpoint:**
```
POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application
```

**Alternative Endpoint (Zapier Webhook):**
```
POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/zapier-webhook
```

**Authentication:**
- Header: `Authorization: Bearer [SUPABASE_ANON_KEY]`
- Content-Type: `application/xml` or `application/json`

---

## XSD Schema Definition

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  
  <xs:element name="application">
    <xs:complexType>
      <xs:sequence>
        <!-- Core Required Fields -->
        <xs:element name="job_listing_id" type="xs:string" minOccurs="0"/>
        <xs:element name="job_id" type="xs:string" minOccurs="0"/>
        <xs:element name="applicant_email" type="xs:string" minOccurs="1"/>
        <xs:element name="first_name" type="xs:string" minOccurs="1"/>
        <xs:element name="last_name" type="xs:string" minOccurs="1"/>
        <xs:element name="status" type="statusType" minOccurs="0"/>
        <xs:element name="source" type="xs:string" minOccurs="0"/>
        
        <!-- Personal Information -->
        <xs:element name="full_name" type="xs:string" minOccurs="0"/>
        <xs:element name="prefix" type="xs:string" minOccurs="0"/>
        <xs:element name="middle_name" type="xs:string" minOccurs="0"/>
        <xs:element name="suffix" type="xs:string" minOccurs="0"/>
        <xs:element name="phone" type="xs:string" minOccurs="0"/>
        <xs:element name="secondary_phone" type="xs:string" minOccurs="0"/>
        <xs:element name="date_of_birth" type="xs:date" minOccurs="0"/>
        <xs:element name="age" type="xs:string" minOccurs="0"/>
        <xs:element name="over_21" type="yesNoType" minOccurs="0"/>
        
        <!-- Address Information -->
        <xs:element name="address_1" type="xs:string" minOccurs="0"/>
        <xs:element name="address_2" type="xs:string" minOccurs="0"/>
        <xs:element name="city" type="xs:string" minOccurs="0"/>
        <xs:element name="state" type="xs:string" minOccurs="0"/>
        <xs:element name="zip" type="xs:string" minOccurs="0"/>
        <xs:element name="country" type="xs:string" minOccurs="0"/>
        
        <!-- CDL Information -->
        <xs:element name="cdl" type="yesNoType" minOccurs="0"/>
        <xs:element name="cdl_class" type="cdlClassType" minOccurs="0"/>
        <xs:element name="cdl_state" type="xs:string" minOccurs="0"/>
        <xs:element name="cdl_expiration_date" type="xs:date" minOccurs="0"/>
        <xs:element name="cdl_endorsements" type="endorsementsType" minOccurs="0"/>
        
        <!-- Experience & Qualifications -->
        <xs:element name="exp" type="xs:string" minOccurs="0"/>
        <xs:element name="months" type="xs:string" minOccurs="0"/>
        <xs:element name="driving_experience_years" type="xs:integer" minOccurs="0"/>
        <xs:element name="education_level" type="educationType" minOccurs="0"/>
        <xs:element name="accident_history" type="xs:string" minOccurs="0"/>
        <xs:element name="violation_history" type="xs:string" minOccurs="0"/>
        
        <!-- Background & Screening -->
        <xs:element name="drug" type="yesNoType" minOccurs="0"/>
        <xs:element name="can_pass_drug_test" type="yesNoType" minOccurs="0"/>
        <xs:element name="can_pass_physical" type="yesNoType" minOccurs="0"/>
        <xs:element name="background_check_consent" type="yesNoType" minOccurs="0"/>
        <xs:element name="convicted_felony" type="yesNoType" minOccurs="0"/>
        <xs:element name="felony_details" type="xs:string" minOccurs="0"/>
        
        <!-- Work Authorization & Availability -->
        <xs:element name="work_authorization" type="workAuthType" minOccurs="0"/>
        <xs:element name="can_work_nights" type="yesNoType" minOccurs="0"/>
        <xs:element name="can_work_weekends" type="yesNoType" minOccurs="0"/>
        <xs:element name="willing_to_relocate" type="yesNoType" minOccurs="0"/>
        <xs:element name="preferred_start_date" type="xs:date" minOccurs="0"/>
        <xs:element name="preferred_contact_method" type="contactMethodType" minOccurs="0"/>
        
        <!-- Military Service -->
        <xs:element name="veteran" type="yesNoType" minOccurs="0"/>
        <xs:element name="military_service" type="yesNoType" minOccurs="0"/>
        <xs:element name="military_branch" type="militaryBranchType" minOccurs="0"/>
        <xs:element name="military_start_date" type="xs:date" minOccurs="0"/>
        <xs:element name="military_end_date" type="xs:date" minOccurs="0"/>
        
        <!-- Emergency Contact -->
        <xs:element name="emergency_contact_name" type="xs:string" minOccurs="0"/>
        <xs:element name="emergency_contact_phone" type="xs:string" minOccurs="0"/>
        <xs:element name="emergency_contact_relationship" type="xs:string" minOccurs="0"/>
        
        <!-- Medical & Certifications -->
        <xs:element name="dot_physical_date" type="xs:date" minOccurs="0"/>
        <xs:element name="medical_card_expiration" type="xs:date" minOccurs="0"/>
        <xs:element name="hazmat_endorsement" type="yesNoType" minOccurs="0"/>
        <xs:element name="twic_card" type="yesNoType" minOccurs="0"/>
        <xs:element name="passport_card" type="yesNoType" minOccurs="0"/>
        
        <!-- Consent & Legal -->
        <xs:element name="consent" type="yesNoType" minOccurs="0"/>
        <xs:element name="consent_to_sms" type="yesNoType" minOccurs="0"/>
        <xs:element name="consent_to_email" type="yesNoType" minOccurs="0"/>
        <xs:element name="privacy" type="yesNoType" minOccurs="0"/>
        <xs:element name="agree_privacy_policy" type="yesNoType" minOccurs="0"/>
        
        <!-- Sensitive Information (PII) -->
        <xs:element name="ssn" type="xs:string" minOccurs="0"/>
        <xs:element name="government_id_type" type="xs:string" minOccurs="0"/>
        <xs:element name="government_id" type="xs:string" minOccurs="0"/>
        <xs:element name="driver_id" type="xs:string" minOccurs="0"/>
        
        <!-- Additional Information -->
        <xs:element name="notes" type="xs:string" minOccurs="0"/>
        <xs:element name="referral_source" type="xs:string" minOccurs="0"/>
        <xs:element name="how_did_you_hear" type="xs:string" minOccurs="0"/>
        <xs:element name="salary_expectations" type="xs:string" minOccurs="0"/>
        
        <!-- Meta/Facebook Lead Data -->
        <xs:element name="ad_id" type="xs:string" minOccurs="0"/>
        <xs:element name="adset_id" type="xs:string" minOccurs="0"/>
        <xs:element name="campaign_id" type="xs:string" minOccurs="0"/>
        
        <!-- JSONB Fields (use CDATA for complex structures) -->
        <xs:element name="employment_history" type="xs:string" minOccurs="0"/>
        <xs:element name="custom_questions" type="xs:string" minOccurs="0"/>
        <xs:element name="display_fields" type="xs:string" minOccurs="0"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  
  <!-- Simple Type Definitions -->
  <xs:simpleType name="statusType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="pending"/>
      <xs:enumeration value="reviewed"/>
      <xs:enumeration value="interviewing"/>
      <xs:enumeration value="hired"/>
      <xs:enumeration value="rejected"/>
      <xs:enumeration value="withdrawn"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="yesNoType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="Yes"/>
      <xs:enumeration value="No"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="cdlClassType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="A"/>
      <xs:enumeration value="B"/>
      <xs:enumeration value="C"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="endorsementsType">
    <xs:restriction base="xs:string">
      <xs:pattern value="(H|N|P|S|T|X)(,(H|N|P|S|T|X))*"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="educationType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="High School"/>
      <xs:enumeration value="Some College"/>
      <xs:enumeration value="Associate"/>
      <xs:enumeration value="Bachelor"/>
      <xs:enumeration value="Graduate"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="workAuthType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="US Citizen"/>
      <xs:enumeration value="Permanent Resident"/>
      <xs:enumeration value="Work Visa"/>
      <xs:enumeration value="Requires Sponsorship"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="contactMethodType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="Phone"/>
      <xs:enumeration value="Email"/>
      <xs:enumeration value="SMS"/>
      <xs:enumeration value="Any"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="militaryBranchType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="Army"/>
      <xs:enumeration value="Navy"/>
      <xs:enumeration value="Air Force"/>
      <xs:enumeration value="Marines"/>
      <xs:enumeration value="Coast Guard"/>
      <xs:enumeration value="Space Force"/>
      <xs:enumeration value="National Guard"/>
    </xs:restriction>
  </xs:simpleType>
  
</xs:schema>
```

---

## Field Specifications

### Core Required Fields

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `job_listing_id` | UUID | Conditional* | Internal job listing UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `job_id` | String | Conditional* | External job identifier | `DRIVER-2024-001` |
| `applicant_email` | String | **Yes** | Applicant's primary email address | `john.smith@example.com` |
| `first_name` | String | **Yes** | Applicant's first/given name | `John` |
| `last_name` | String | **Yes** | Applicant's last/family name | `Smith` |
| `status` | Enum | No | Application status (defaults to "pending") | `pending` |
| `source` | String | No | Application source/origin | `Indeed`, `Meta`, `Direct` |

*Either `job_listing_id` OR `job_id` is required to identify the job position.

### Personal Information

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `full_name` | String | Complete name (alternative to first/last) | `John Michael Smith` |
| `prefix` | String | Name prefix | `Mr.`, `Ms.`, `Dr.` |
| `middle_name` | String | Middle name or initial | `Michael` |
| `suffix` | String | Name suffix | `Jr.`, `Sr.`, `III` |
| `phone` | String | Primary phone number | `+15551234567` |
| `secondary_phone` | String | Alternative contact number | `+15559876543` |
| `date_of_birth` | Date | Date of birth (ISO 8601) | `1990-05-15` |
| `age` | String | Age verification response | `21+` |
| `over_21` | Yes/No | Age verification flag | `Yes` |

### Address Information

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `address_1` | String | Primary street address | `123 Main Street` |
| `address_2` | String | Apartment, suite, etc. | `Apt 4B` |
| `city` | String | City name | `Salt Lake City` |
| `state` | String | State/province (2-letter code) | `UT` |
| `zip` | String | Postal/ZIP code | `84101` |
| `country` | String | Country code (defaults to US) | `US` |

### CDL Information

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `cdl` | Yes/No | Has CDL license | `Yes` |
| `cdl_class` | Enum | CDL class (A, B, C) | `A` |
| `cdl_state` | String | State that issued CDL | `UT` |
| `cdl_expiration_date` | Date | CDL expiration date | `2026-12-31` |
| `cdl_endorsements` | Array | Comma-separated endorsements | `H,N,T` |

**CDL Endorsements:**
- `H` - Hazardous Materials
- `N` - Tank Vehicles
- `P` - Passenger
- `S` - School Bus
- `T` - Double/Triple Trailers
- `X` - Combination Tank/Hazmat

### Experience & Qualifications

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `exp` | String | Experience level description | `2-5 years` |
| `months` | String | Months of CDL-A experience | `36` |
| `driving_experience_years` | Integer | Years of driving experience | `3` |
| `education_level` | Enum | Highest education completed | `High School` |
| `accident_history` | String | Driving accident history | `None in past 3 years` |
| `violation_history` | String | Traffic violation history | `1 speeding ticket (2022)` |

### Background & Screening

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `drug` | Yes/No | Can pass drug test | `Yes` |
| `can_pass_drug_test` | Yes/No | Alternative drug test field | `Yes` |
| `can_pass_physical` | Yes/No | Can pass DOT physical | `Yes` |
| `background_check_consent` | Yes/No | Consent to background check | `Yes` |
| `convicted_felony` | Yes/No | Felony conviction status | `No` |
| `felony_details` | Text | Details of felony if applicable | `` |

### Work Authorization & Availability

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `work_authorization` | Enum | Work authorization status | `US Citizen` |
| `can_work_nights` | Yes/No | Available for night shifts | `Yes` |
| `can_work_weekends` | Yes/No | Available for weekend work | `Yes` |
| `willing_to_relocate` | Yes/No | Willing to relocate | `No` |
| `preferred_start_date` | Date | Preferred start date | `2024-11-01` |
| `preferred_contact_method` | Enum | Preferred contact method | `Phone` |

### Military Service

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `veteran` | Yes/No | Military veteran status | `Yes` |
| `military_service` | Yes/No | Served in military | `Yes` |
| `military_branch` | Enum | Branch of service | `Army` |
| `military_start_date` | Date | Service start date | `2015-06-01` |
| `military_end_date` | Date | Service end date | `2019-06-01` |

### Emergency Contact

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `emergency_contact_name` | String | Emergency contact name | `Jane Smith` |
| `emergency_contact_phone` | String | Emergency contact phone | `+15551234568` |
| `emergency_contact_relationship` | String | Relationship to applicant | `Spouse` |

### Medical & Certifications

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `dot_physical_date` | Date | Date of last DOT physical | `2024-01-15` |
| `medical_card_expiration` | Date | Medical card expiration | `2025-01-15` |
| `hazmat_endorsement` | Yes/No | Has HAZMAT endorsement | `Yes` |
| `twic_card` | Yes/No | Has TWIC card | `No` |
| `passport_card` | Yes/No | Has passport card | `Yes` |

### Consent & Legal

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `consent` | Yes/No | General consent to contact | `Yes` |
| `consent_to_sms` | Yes/No | Consent to SMS messages | `Yes` |
| `consent_to_email` | Yes/No | Consent to email communications | `Yes` |
| `privacy` | Yes/No | Agrees to privacy policy | `Yes` |
| `agree_privacy_policy` | Yes/No | Privacy policy agreement | `Yes` |

### Sensitive Information (PII)

⚠️ **HANDLE WITH EXTREME CARE - PII DATA**

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `ssn` | String | Social Security Number (encrypted) | `***-**-1234` |
| `government_id_type` | String | Type of government ID | `Driver License` |
| `government_id` | String | Government ID number | `D12345678` |
| `driver_id` | String | Driver's license number | `DL123456` |

**Security Requirements:**
- Must be transmitted over HTTPS
- Should be encrypted at rest
- Access logged in `audit_logs` table
- GDPR/CCPA compliance required

### JSONB Complex Fields

#### Employment History
```json
{
  "employment_history": [
    {
      "company": "ABC Trucking",
      "position": "OTR Driver",
      "start_date": "2020-01-01",
      "end_date": "2024-01-01",
      "reason_for_leaving": "Better opportunity",
      "supervisor_name": "Mike Johnson",
      "supervisor_phone": "+15551234567"
    }
  ]
}
```

#### Custom Questions
```json
{
  "custom_questions": {
    "preferred_routes": "West Coast",
    "team_driver_preference": "Solo",
    "pet_policy": "Small dog acceptable"
  }
}
```

---

## XML Feed Examples

### Example 1: Basic Application (Minimum Required)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<application>
  <job_id>DRIVER-2024-001</job_id>
  <applicant_email>john.smith@example.com</applicant_email>
  <first_name>John</first_name>
  <last_name>Smith</last_name>
  <phone>+15551234567</phone>
  <city>Salt Lake City</city>
  <state>UT</state>
  <zip>84101</zip>
  <source>Indeed</source>
</application>
```

### Example 2: Complete CDL Driver Application

```xml
<?xml version="1.0" encoding="UTF-8"?>
<application>
  <!-- Core Information -->
  <job_listing_id>550e8400-e29b-41d4-a716-446655440000</job_listing_id>
  <applicant_email>john.driver@example.com</applicant_email>
  <first_name>John</first_name>
  <middle_name>Michael</middle_name>
  <last_name>Driver</last_name>
  <phone>+15551234567</phone>
  <secondary_phone>+15559876543</secondary_phone>
  <date_of_birth>1985-03-15</date_of_birth>
  <over_21>Yes</over_21>
  <status>pending</status>
  <source>Company Website</source>
  
  <!-- Address -->
  <address_1>456 Trucker Lane</address_1>
  <city>Provo</city>
  <state>UT</state>
  <zip>84601</zip>
  <country>US</country>
  
  <!-- CDL Information -->
  <cdl>Yes</cdl>
  <cdl_class>A</cdl_class>
  <cdl_state>UT</cdl_state>
  <cdl_expiration_date>2026-12-31</cdl_expiration_date>
  <cdl_endorsements>H,N,T</cdl_endorsements>
  
  <!-- Experience -->
  <exp>5+ years</exp>
  <months>72</months>
  <driving_experience_years>6</driving_experience_years>
  <education_level>High School</education_level>
  <accident_history>None in past 3 years</accident_history>
  <violation_history>Clean record</violation_history>
  
  <!-- Background -->
  <can_pass_drug_test>Yes</can_pass_drug_test>
  <can_pass_physical>Yes</can_pass_physical>
  <background_check_consent>Yes</background_check_consent>
  <convicted_felony>No</convicted_felony>
  
  <!-- Work Authorization -->
  <work_authorization>US Citizen</work_authorization>
  <can_work_nights>Yes</can_work_nights>
  <can_work_weekends>Yes</can_work_weekends>
  <willing_to_relocate>No</willing_to_relocate>
  <preferred_start_date>2024-11-15</preferred_start_date>
  <preferred_contact_method>Phone</preferred_contact_method>
  
  <!-- Medical Certifications -->
  <dot_physical_date>2024-01-15</dot_physical_date>
  <medical_card_expiration>2025-01-15</medical_card_expiration>
  <hazmat_endorsement>Yes</hazmat_endorsement>
  <twic_card>No</twic_card>
  
  <!-- Emergency Contact -->
  <emergency_contact_name>Jane Driver</emergency_contact_name>
  <emergency_contact_phone>+15551234568</emergency_contact_phone>
  <emergency_contact_relationship>Spouse</emergency_contact_relationship>
  
  <!-- Consent -->
  <consent_to_sms>Yes</consent_to_sms>
  <consent_to_email>Yes</consent_to_email>
  <agree_privacy_policy>Yes</agree_privacy_policy>
  
  <!-- Additional Info -->
  <notes>Looking for OTR position with home time every 2 weeks</notes>
  <referral_source>Job Board</referral_source>
  <salary_expectations>$65,000-$75,000</salary_expectations>
  
  <!-- Employment History (JSONB) -->
  <employment_history><![CDATA[
    [
      {
        "company": "Swift Transportation",
        "position": "OTR Driver",
        "start_date": "2018-03-01",
        "end_date": "2024-09-30",
        "reason_for_leaving": "Seeking better home time",
        "supervisor_name": "Mike Johnson",
        "supervisor_phone": "+15553334444"
      }
    ]
  ]]></employment_history>
</application>
```

### Example 3: Military Veteran Application

```xml
<?xml version="1.0" encoding="UTF-8"?>
<application>
  <job_id>DRIVER-VET-2024-005</job_id>
  <applicant_email>veteran.driver@example.com</applicant_email>
  <first_name>Robert</first_name>
  <last_name>Johnson</last_name>
  <phone>+15552223333</phone>
  <city>Ogden</city>
  <state>UT</state>
  <zip>84401</zip>
  
  <!-- CDL Info -->
  <cdl>Yes</cdl>
  <cdl_class>A</cdl_class>
  <exp>3-5 years</exp>
  <months>48</months>
  
  <!-- Military Service -->
  <veteran>Yes</veteran>
  <military_service>Yes</military_service>
  <military_branch>Army</military_branch>
  <military_start_date>2012-06-01</military_start_date>
  <military_end_date>2020-06-01</military_end_date>
  
  <!-- Background -->
  <can_pass_drug_test>Yes</can_pass_drug_test>
  <background_check_consent>Yes</background_check_consent>
  <work_authorization>US Citizen</work_authorization>
  
  <!-- Consent -->
  <consent_to_sms>Yes</consent_to_sms>
  <agree_privacy_policy>Yes</agree_privacy_policy>
  
  <source>Military Job Board</source>
  <notes>Honorable discharge. Seeking stable employment with veteran-friendly company.</notes>
</application>
```

### Example 4: Meta/Facebook Lead Application

```xml
<?xml version="1.0" encoding="UTF-8"?>
<application>
  <job_id>DRIVER-2024-010</job_id>
  <applicant_email>sarah.lead@example.com</applicant_email>
  <first_name>Sarah</first_name>
  <last_name>Martinez</last_name>
  <phone>+15554445555</phone>
  <city>Sandy</city>
  <state>UT</state>
  <zip>84070</zip>
  
  <!-- CDL Status -->
  <cdl>Yes</cdl>
  <cdl_class>A</cdl_class>
  <exp>1-2 years</exp>
  <months>18</months>
  
  <!-- Meta Campaign Data -->
  <ad_id>6789012345</ad_id>
  <adset_id>1234567890</adset_id>
  <campaign_id>9876543210</campaign_id>
  <source>Meta</source>
  
  <!-- Basic Screening -->
  <can_pass_drug_test>Yes</can_pass_drug_test>
  <over_21>Yes</over_21>
  <work_authorization>Permanent Resident</work_authorization>
  
  <!-- Consent -->
  <consent_to_sms>Yes</consent_to_sms>
  <consent_to_email>Yes</consent_to_email>
  <agree_privacy_policy>Yes</agree_privacy_policy>
  
  <preferred_start_date>2024-12-01</preferred_start_date>
</application>
```

---

## Data Standards & Validation

### Date Formatting
- **Format:** ISO 8601 (`YYYY-MM-DD`)
- **Examples:** `2024-10-15`, `1990-05-20`
- **Validation:** Must be valid date, not in future for birth dates

### Phone Number Formatting
- **Format:** E.164 international format (`+1XXXXXXXXXX`)
- **Examples:** `+15551234567`, `+18005551212`
- **Auto-normalization:** System automatically normalizes to +1 format
- **Accepted inputs:** `(555) 123-4567`, `555-123-4567`, `5551234567`

### Boolean Values
- **Accepted:** `Yes`, `No` (case-insensitive)
- **Alternative:** `true`, `false` (JSON format)
- **Invalid:** `Y`, `N`, `1`, `0`

### Status Values
Must be one of:
- `pending` (default)
- `reviewed`
- `interviewing`
- `hired`
- `rejected`
- `withdrawn`

### CDL Endorsements
- **Format:** Comma-separated uppercase letters
- **Valid codes:** `H`, `N`, `P`, `S`, `T`, `X`
- **Example:** `H,N,T`

### JSONB Fields
- Must be valid JSON
- Use CDATA section in XML: `<![CDATA[{ "key": "value" }]]>`
- Will be stored as JSONB in PostgreSQL

---

## Integration Guidelines

### Authentication

**Required Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Use the Supabase anon key provided by IntelliATS support.

### Single Application Submission

**Request:**
```bash
curl -X POST https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/xml" \
  -d @application.xml
```

**Response (Success):**
```json
{
  "success": true,
  "application_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Application submitted successfully"
}
```

**Response (Error):**
```json
{
  "error": "Validation failed",
  "details": {
    "applicant_email": "Invalid email format",
    "cdl_class": "Must be A, B, or C"
  }
}
```

### Batch Submission

For bulk uploads, wrap multiple applications:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<applications>
  <application>
    <!-- Application 1 -->
  </application>
  <application>
    <!-- Application 2 -->
  </application>
  <!-- ... more applications ... -->
</applications>
```

**Best Practices:**
- Maximum 100 applications per batch
- Include `<batch_id>` for tracking
- Monitor response for partial failures

### Error Handling

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 200 | Success | Application created |
| 400 | Bad Request | Fix validation errors |
| 401 | Unauthorized | Check authentication |
| 404 | Not Found | Invalid job_listing_id |
| 409 | Conflict | Duplicate application |
| 500 | Server Error | Retry with exponential backoff |

### Rate Limiting

- **Limit:** 100 requests per minute
- **Burst:** 10 requests per second
- **Header:** `X-RateLimit-Remaining`

### Duplicate Detection

System checks for duplicates based on:
- `applicant_email` + `job_listing_id` combination
- Within 30-day window

**Behavior:**
- Returns 409 if duplicate found
- Include `force_update=true` to override

---

## Data Quality Standards

### Required Data Quality
- Email addresses must be valid and deliverable
- Phone numbers must be complete (10 digits minimum)
- Dates must be logical (birth date before current date, etc.)
- CDL information must be consistent (class + endorsements)

### Recommended Data
For best candidate matching and processing:
- Complete address information
- Detailed experience history
- Valid CDL endorsements and expiration
- Medical certification dates
- Emergency contact information

### Data Validation
- All fields are validated server-side
- Invalid data returns detailed error messages
- Phone numbers are auto-normalized
- City/state lookup by ZIP code (if missing)

---

## Testing & Validation

### Testing Checklist

- [ ] Validate XML against XSD schema
- [ ] Test with minimum required fields
- [ ] Test with complete application data
- [ ] Verify phone number normalization
- [ ] Test date format handling
- [ ] Validate JSONB field parsing
- [ ] Test duplicate detection
- [ ] Verify error handling
- [ ] Check authentication
- [ ] Test batch submission

### Test Endpoints

**Staging:**
```
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application?test=true
```

**Validation Only (no database insert):**
```
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application?validate_only=true
```

### Sample Test Application

```xml
<?xml version="1.0" encoding="UTF-8"?>
<application>
  <job_id>TEST-JOB-001</job_id>
  <applicant_email>test.applicant@example.com</applicant_email>
  <first_name>Test</first_name>
  <last_name>Applicant</last_name>
  <phone>+15555555555</phone>
  <city>Test City</city>
  <state>UT</state>
  <zip>84000</zip>
  <cdl>Yes</cdl>
  <source>API Test</source>
</application>
```

---

## Security & Compliance

### Data Encryption
- **In Transit:** TLS 1.3 required
- **At Rest:** AES-256 encryption
- **PII Fields:** Additional encryption layer

### PII Handling
Personally Identifiable Information (PII) includes:
- Social Security Number (`ssn`)
- Date of Birth (`date_of_birth`)
- Government ID numbers
- Full address information

**Requirements:**
- Must comply with GDPR, CCPA, and state privacy laws
- Access logged in `audit_logs` table
- Retention policy: 7 years for employment records
- Right to deletion honored within 30 days

### Audit Logging
All application submissions are logged with:
- Timestamp
- Source IP address
- User agent
- Submission endpoint
- Success/failure status

### GDPR Compliance
- Applicants can request data export
- Right to deletion supported
- Consent tracking required
- Data processing agreement available

---

## Support & Resources

### Technical Support
- **Email:** support@intelliats.com
- **API Status:** https://status.intelliats.com
- **Documentation:** https://docs.intelliats.com/api/applications

### Developer Resources
- XSD Schema Validator: Available on request
- Sample XML files: In `/examples` directory
- Postman Collection: Available for download
- SDKs: Coming soon (Python, JavaScript, PHP)

### Change Log
- **v1.0** (2024-10-03): Initial specification release

### Feedback
We welcome feedback on this specification. Please submit suggestions to: api-feedback@intelliats.com

---

## Appendix A: Complete Field Reference

| Field Name | Type | Required | Max Length | Notes |
|------------|------|----------|------------|-------|
| job_listing_id | UUID | Conditional | 36 | Internal UUID or job_id required |
| job_id | String | Conditional | 100 | External identifier or job_listing_id required |
| applicant_email | String | Yes | 255 | Must be valid email format |
| first_name | String | Yes | 100 | - |
| last_name | String | Yes | 100 | - |
| phone | String | Recommended | 20 | Auto-normalized to +1XXXXXXXXXX |
| city | String | Recommended | 100 | Auto-populated from ZIP if missing |
| state | String | Recommended | 2 | 2-letter state code |
| zip | String | Recommended | 10 | US ZIP code format |
| cdl | Yes/No | Recommended | 3 | For driver positions |
| status | Enum | No | 20 | Defaults to 'pending' |
| source | String | No | 100 | Track application origin |

*See full field specifications above for complete details*

---

## Appendix B: Common Integration Patterns

### Pattern 1: Job Board Integration
```xml
<!-- Job board posts with external job_id -->
<application>
  <job_id>EXT-12345</job_id>
  <applicant_email>candidate@example.com</applicant_email>
  <first_name>Jane</first_name>
  <last_name>Doe</last_name>
  <source>Indeed</source>
  <!-- ... -->
</application>
```

### Pattern 2: ATS-to-ATS Sync
```xml
<!-- Full data transfer between systems -->
<application>
  <job_listing_id>550e8400-e29b-41d4-a716-446655440000</job_listing_id>
  <!-- All available fields -->
  <employment_history><![CDATA[{ /* full history */ }]]></employment_history>
</application>
```

### Pattern 3: Mobile App Submission
```xml
<!-- Simplified mobile application -->
<application>
  <job_id>MOBILE-APP-001</job_id>
  <applicant_email>mobile@example.com</applicant_email>
  <first_name>Mobile</first_name>
  <last_name>User</last_name>
  <phone>+15551234567</phone>
  <source>Mobile App</source>
</application>
```

---

**End of Specification**

For questions or clarification, contact: support@intelliats.com
