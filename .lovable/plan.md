

## Field Mapping Review for All Application Sources

### Executive Summary

After a comprehensive review of all field mapping across 5 application sources, I've identified significant data quality gaps and inconsistencies that are impacting recruiter productivity and downstream ATS integration quality.

---

### Current Data Quality by Source (Last 30 Days)

| Source | Total | CDL | Exp | CDL Class | City | Zip | Veteran | Drug |
|--------|-------|-----|-----|-----------|------|-----|---------|------|
| **Direct Application** | 75 | 9% | 8% | 0% | 100% | 100% | 8% | 9% |
| **ZipRecruiter** | 63 | 0% | 0% | 0% | 100% | 100% | 0% | 0% |
| **Indeed** | 50 | 0% | 0% | 0% | 100% | 100% | 0% | 0% |
| **ElevenLabs** | 18 | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| **Embed Form** | 4 | 100% | 100% | 0% | 100% | 100% | 100% | 100% |

**Key Insight**: Only the Embed Form has comprehensive screening data. Voice applications are missing critical location data. Indeed and ZipRecruiter lack all CDL qualification fields.

---

### Source-by-Source Analysis

#### 1. Direct Application (submit-application)

**Status**: Well-mapped, but frontend forms may not be collecting all fields

**Field Mapping Quality**: GOOD

- Supports 50+ fields including extended CDL data
- Proper phone normalization
- UTM tracking (utm_source, utm_medium, utm_campaign)
- Auto zip-to-city lookup
- ATS auto-post integration

**Issues Found**:
| Issue | Severity | Details |
|-------|----------|---------|
| Low CDL capture (9%) | Medium | Frontend forms may not prompt for CDL data |
| No cdl_class capture | Medium | Field exists but always empty |
| Missing cdl_endorsements | Low | Array field never populated |

**Recommendations**:
- Audit frontend Quick Apply form to ensure CDL fields are prominently requested
- Add cdl_class dropdown (A, B, C)
- Add endorsement checkboxes (Hazmat, Tanker, Doubles/Triples)

---

#### 2. ZipRecruiter Webhook (ziprecruiter-webhook)

**Status**: Functional but incomplete field mapping

**Field Mapping Quality**: MINIMAL

Currently maps:
```text
first_name, last_name, email, phone, city, state, zip, source
```

**Missing Critical Fields**:
| Field | ZipRecruiter Equivalent | Impact |
|-------|------------------------|--------|
| cdl | candidate.cdl_license | Cannot qualify drivers |
| exp | candidate.years_experience | Cannot screen experience |
| cdl_class | candidate.cdl_class | Cannot determine license type |
| resume_url | resume.url | Document not linked |
| education_level | candidate.education | Missing qualification data |

**Recommendations**:
1. Expand `parseApplicationData` to capture ZipRecruiter's extended candidate fields
2. Map resume_url to a new `resume_url` column or `notes` field
3. Add cover_letter to notes

**Proposed Updated Mapping**:
```typescript
// Enhanced ZipRecruiter field mapping
return {
  // Existing fields...
  cdl: data.cdl || data.cdl_license || data.has_cdl || '',
  cdl_class: data.cdl_class || data.license_class || '',
  exp: data.years_experience || data.experience_years || data.driving_experience || '',
  education_level: data.education || data.education_level || '',
  work_authorization: data.work_authorization || data.authorization || '',
  veteran: data.veteran_status || data.is_veteran || '',
}
```

---

#### 3. Indeed Applications (inbound-applications)

**Status**: Uses generic inbound webhook - limited structured data

**Field Mapping Quality**: BASIC

Indeed applications arrive via general webhook with these field aliases:
```text
first_name/firstName, last_name/lastName, email, phone, city, state, zip
```

**Missing Fields**: CDL, experience, veteran status, drug screening consent

**Root Cause**: Indeed's standard webhook doesn't include custom screening questions. Their API requires "Indeed Apply" integration with custom questions configured in the Indeed employer dashboard.

**Recommendations**:
1. No code changes needed - this is an Indeed platform limitation
2. Consider Indeed's "Screener Questions" feature in the Indeed employer portal
3. Add intake form CTA for applicants to complete missing data

---

#### 4. ElevenLabs Voice Applications (sync-voice-applications & inbound-applications)

**Status**: Strong data_collection_results mapping but location data missing

**Field Mapping Quality**: TARGETED CDL FIELDS

Currently collects:
| ElevenLabs Field | Mapped To | Capture Rate |
|------------------|-----------|--------------|
| GivenName | first_name | High |
| FamilyName | last_name | High |
| PrimaryPhone | phone | 100% |
| InternetEmailAddress | applicant_email | Medium |
| PostalCode | zip | 0% (issue!) |
| Class_A_CDL | cdl | 0% (issue!) |
| Class_A_CDL_Experience | exp | 0% (issue!) |
| DriverType | driver_type | Low |
| CanPassDrug | drug | Low |
| Veteran_Status | veteran | Low |
| consentGiven | consent | Low |

**Critical Issues**:
1. **Zip code not being captured** - 0% capture rate despite field mapping existing
2. **CDL fields empty** - Either agent not collecting or mapping broken
3. **City/State never populated** - No zip-to-location lookup for voice

**Recommendations**:
1. Add zip-to-city lookup in voice sync (like submit-application has)
2. Audit ElevenLabs agent prompts to ensure CDL questions are asked
3. Add fallback extraction from transcript if data_collection_results empty

---

#### 5. CDL Job Cast (fetch-application-feeds → inbound-applications)

**Status**: XML parsing exists but 0 applications in last 30 days

**Field Mapping Quality**: GOOD (when working)

Current XML field extraction:
```typescript
const application = {
  first_name: extractField('firstname') || extractField('first_name'),
  last_name: extractField('lastname') || extractField('last_name'),
  applicant_email: extractField('email'),
  phone: extractField('phone'),
  city: extractField('city'),
  state: extractField('state'),
  zip: extractField('zip') || extractField('zipcode'),
  cdl: extractField('cdl') || extractField('cdl_class'),
  exp: extractField('experience') || extractField('exp'),
  education_level: extractField('education'),
  work_authorization: extractField('work_authorization'),
  source: 'CDL Job Cast',
};
```

**Issue**: The cron job was just created - need to verify feeds are actively returning application data vs just job listings.

---

#### 6. Outbound ATS (xml-post-adapter for Tenstreet)

**Status**: Comprehensive mapping for outbound data

**Field Mapping Quality**: EXCELLENT

Tenstreet XML builder includes:
- PersonalData: Name, DOB, Address, Phone, Email
- Licenses: CDL class, endorsements, expiration, state
- ApplicationData: Source, status tags
- DisplayFields: Custom screening questions

**Issues Found**:
| Issue | Impact |
|-------|--------|
| cdl_endorsements rarely populated from inbound | Tenstreet gets empty endorsements |
| cdl_expiration_date not collected on quick apply | Cannot send license validity |
| employment_history rarely populated | Work history section empty |

---

### Cross-Source Field Matrix

| Field | Direct App | ZipRecruiter | Indeed | ElevenLabs | CDL Job Cast | Tenstreet Out |
|-------|------------|--------------|--------|------------|--------------|---------------|
| first_name | YES | YES | YES | YES | YES | YES |
| last_name | YES | YES | YES | YES | YES | YES |
| email | YES | YES | YES | PARTIAL | YES | YES |
| phone | YES | YES | YES | YES | YES | YES |
| city | YES | YES | YES | NO | YES | YES |
| state | YES | YES | YES | NO | YES | YES |
| zip | YES | YES | YES | NO | YES | YES |
| cdl | PARTIAL | NO | NO | NO | YES | YES |
| cdl_class | NO | NO | NO | NO | YES | YES |
| cdl_endorsements | NO | NO | NO | NO | PARTIAL | YES |
| exp | PARTIAL | NO | NO | NO | YES | YES |
| veteran | PARTIAL | NO | NO | PARTIAL | NO | NO |
| drug | PARTIAL | NO | NO | PARTIAL | NO | NO |
| consent | PARTIAL | NO | NO | PARTIAL | NO | NO |

---

### Priority Improvements

#### High Priority (Immediate Impact)

1. **Fix ElevenLabs location data capture**
   - Add zip-to-city/state lookup after sync
   - Debug why PostalCode from agent is not being saved
   - Add city/state fields to voice agent prompts

2. **Enhance ZipRecruiter webhook mapping**
   - Add CDL, experience, education fields
   - Map resume_url and cover_letter

3. **Audit Quick Apply frontend forms**
   - Ensure CDL questions are always shown
   - Add cdl_class and endorsement selection

#### Medium Priority (Quality Improvement)

4. **Create normalized field extraction utility**
   - Single source of truth for field aliases
   - Reduce duplicate mapping code across webhooks

5. **Add data quality monitoring**
   - Dashboard showing field completion rates by source
   - Alerts when quality drops below threshold

6. **Implement intake form follow-up**
   - For Indeed/ZipRecruiter with missing CDL data
   - SMS/email link to complete screening questions

#### Lower Priority (Enhancement)

7. **CDL Job Cast application sync verification**
   - Confirm feeds return applications (not just jobs)
   - Test end-to-end flow

8. **Add resume parsing integration**
   - Extract work history from resume_url
   - Auto-populate employment_history

---

### Database Schema Observation

The applications table has 77+ columns supporting comprehensive data capture. The issue is not schema - it's source-specific collection gaps:

**Well-utilized columns**: Personal info, location, status, timestamps

**Under-utilized columns**: 
- cdl_class (0% populated)
- cdl_endorsements (0% populated)
- driving_experience_years (rarely used)
- employment_history (rarely populated)
- military fields (rarely captured)

---

### Recommended Implementation Order

1. **Phase 1 - Quick Wins (1-2 days)** ✅ COMPLETED
   - ✅ Created shared `supabase/functions/_shared/zip-lookup.ts` utility
   - ✅ Updated `sync-voice-applications` with zip-to-city lookup + additional CDL fields
   - ✅ Updated `ziprecruiter-webhook` with CDL, exp, education, veteran, military mapping
   - ✅ Added CDL class (A/B/C) and endorsements (H, N, P, T, X, S) to Quick Apply form

2. **Phase 2 - Voice Quality (2-3 days)**
   - Debug ElevenLabs data_collection_results capture
   - Audit agent prompt for complete CDL collection
   - Add transcript fallback extraction

3. **Phase 3 - Data Quality Dashboard (3-5 days)**
   - Create admin view for field completion metrics
   - Add source quality scoring
   - Alert on degraded data quality

4. **Phase 4 - Intake Flow (5-7 days)**
   - Build SMS/email follow-up for incomplete applications
   - Create mini-form for missing screening data
   - Auto-trigger based on source and missing fields

