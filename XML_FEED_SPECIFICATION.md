# Job Feed XML Specification

## Overview
This document defines the XML schema and requirements for submitting job listings to the Intel ATS platform via XML feeds.

## XML Schema Definition (XSD)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="jobs">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="job" maxOccurs="unbounded">
          <xs:complexType>
            <xs:all>
              <xs:element name="job_id" type="xs:string" minOccurs="1"/>
              <xs:element name="job_title" type="xs:string" minOccurs="1"/>
              <xs:element name="job_summary" type="xs:string" minOccurs="0"/>
              <xs:element name="city" type="xs:string" minOccurs="0"/>
              <xs:element name="state" type="xs:string" minOccurs="0"/>
              <xs:element name="dest_city" type="xs:string" minOccurs="0"/>
              <xs:element name="dest_state" type="xs:string" minOccurs="0"/>
              <xs:element name="salary_min" type="xs:decimal" minOccurs="0"/>
              <xs:element name="salary_max" type="xs:decimal" minOccurs="0"/>
              <xs:element name="salary_type" type="salaryTypeEnum" minOccurs="0"/>
              <xs:element name="radius" type="xs:integer" minOccurs="0"/>
              <xs:element name="client" type="xs:string" minOccurs="0"/>
              <xs:element name="url" type="xs:anyURI" minOccurs="0"/>
              <xs:element name="apply_url" type="xs:anyURI" minOccurs="0"/>
              <xs:element name="job_type" type="jobTypeEnum" minOccurs="0"/>
            </xs:all>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  
  <xs:simpleType name="salaryTypeEnum">
    <xs:restriction base="xs:string">
      <xs:enumeration value="hourly"/>
      <xs:enumeration value="yearly"/>
      <xs:enumeration value="weekly"/>
      <xs:enumeration value="daily"/>
      <xs:enumeration value="contract"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:simpleType name="jobTypeEnum">
    <xs:restriction base="xs:string">
      <xs:enumeration value="full-time"/>
      <xs:enumeration value="part-time"/>
      <xs:enumeration value="contract"/>
      <xs:enumeration value="temporary"/>
      <xs:enumeration value="seasonal"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>
```

## Field Specifications

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `job_id` | String | Unique identifier for the job posting | `"CDL-A-12345"` |
| `job_title` | String | Title of the job position | `"CDL-A OTR Driver"` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `job_summary` | String | Detailed description of the job | `"Seeking experienced CDL-A drivers for OTR routes..."` |
| `city` | String | Origin city for the position | `"Springfield"` |
| `state` | String | Origin state (2-letter abbreviation) | `"IL"` |
| `dest_city` | String | Destination city (for route-based jobs) | `"Dallas"` |
| `dest_state` | String | Destination state (2-letter abbreviation) | `"TX"` |
| `salary_min` | Decimal | Minimum salary/wage | `55000.00` |
| `salary_max` | Decimal | Maximum salary/wage | `75000.00` |
| `salary_type` | Enum | Type of compensation | `"yearly"` |
| `radius` | Integer | Search radius in miles from origin | `50` |
| `client` | String | Company/client name | `"ABC Logistics"` |
| `url` | URL | Link to full job posting | `"https://example.com/jobs/12345"` |
| `apply_url` | URL | Direct application link | `"https://example.com/apply/12345"` |
| `job_type` | Enum | Employment type | `"full-time"` |

### Enumeration Values

**salary_type**:
- `hourly` - Hourly wage
- `yearly` - Annual salary
- `weekly` - Weekly pay
- `daily` - Daily rate
- `contract` - Contract-based compensation

**job_type**:
- `full-time` - Full-time employment
- `part-time` - Part-time employment
- `contract` - Contract position
- `temporary` - Temporary position
- `seasonal` - Seasonal work

## XML Feed Examples

### Example 1: Basic Trucking Job Feed

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <job_id>CDL-A-OTR-001</job_id>
    <job_title>CDL-A OTR Driver</job_title>
    <job_summary>We are seeking experienced CDL-A drivers for over-the-road routes. Great pay, excellent benefits, and new equipment. Home time every 2-3 weeks.</job_summary>
    <city>Springfield</city>
    <state>IL</state>
    <salary_min>55000</salary_min>
    <salary_max>75000</salary_max>
    <salary_type>yearly</salary_type>
    <client>Prime Transportation</client>
    <url>https://example.com/jobs/cdl-a-otr-001</url>
    <apply_url>https://example.com/apply/cdl-a-otr-001</apply_url>
    <job_type>full-time</job_type>
  </job>
  
  <job>
    <job_id>CDL-A-REGIONAL-002</job_id>
    <job_title>CDL-A Regional Driver</job_title>
    <job_summary>Regional routes with home time every weekend. Dedicated lanes available. Must have 1 year OTR experience.</job_summary>
    <city>Chicago</city>
    <state>IL</state>
    <salary_min>0.55</salary_min>
    <salary_max>0.65</salary_max>
    <salary_type>hourly</salary_type>
    <radius>250</radius>
    <client>Midwest Freight</client>
    <url>https://example.com/jobs/cdl-a-regional-002</url>
    <job_type>full-time</job_type>
  </job>
</jobs>
```

### Example 2: Route-Specific Job Feed

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <job_id>ROUTE-TX-CA-003</job_id>
    <job_title>Dedicated Lane Driver - TX to CA</job_title>
    <job_summary>Dedicated lane from Dallas to Los Angeles. Consistent freight, great miles, and predictable schedule. 2+ years experience required.</job_summary>
    <city>Dallas</city>
    <state>TX</state>
    <dest_city>Los Angeles</dest_city>
    <dest_state>CA</dest_state>
    <salary_min>1200</salary_min>
    <salary_max>1500</salary_max>
    <salary_type>weekly</salary_type>
    <client>Western Express</client>
    <url>https://example.com/jobs/route-tx-ca-003</url>
    <apply_url>https://example.com/apply/route-tx-ca-003</apply_url>
    <job_type>full-time</job_type>
  </job>
</jobs>
```

### Example 3: Minimal Job Feed

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <job_id>LOCAL-DRIVER-004</job_id>
    <job_title>Local CDL Driver</job_title>
  </job>
  <job>
    <job_id>TEAM-DRIVER-005</job_id>
    <job_title>Team Driver - CDL-A</job_title>
    <job_summary>Team drivers needed for cross-country routes. Top pay for experienced teams.</job_summary>
    <salary_min>80000</salary_min>
    <salary_max>120000</salary_max>
    <salary_type>yearly</salary_type>
  </job>
</jobs>
```

## Feed Submission Guidelines

### Feed URL Requirements
- Must be publicly accessible via HTTPS
- Must return valid XML with `Content-Type: application/xml` or `text/xml`
- Should be updated regularly (recommended: hourly or daily)
- Maximum response time: 30 seconds
- Maximum feed size: 10MB

### Data Quality Standards
1. **Consistency**: Use consistent formatting for states (2-letter codes)
2. **Accuracy**: Ensure salary ranges are realistic and accurate
3. **Completeness**: Include as many optional fields as possible for better matching
4. **Currency**: Keep job listings current; remove filled positions promptly
5. **Uniqueness**: Each `job_id` must be unique within your feed

### Character Encoding
- Use UTF-8 encoding for all XML feeds
- Properly escape special XML characters:
  - `&` → `&amp;`
  - `<` → `&lt;`
  - `>` → `&gt;`
  - `"` → `&quot;`
  - `'` → `&apos;`

### Example with Special Characters

```xml
<job>
  <job_id>SPECIAL-001</job_id>
  <job_title>CDL-A Driver &amp; Trainer</job_title>
  <job_summary>Great company culture &amp; competitive pay. Must have &gt; 3 years experience.</job_summary>
  <client>Smith &amp; Sons Trucking</client>
</job>
```

## Testing Your Feed

Before submitting your feed URL, verify:
1. ✅ XML is well-formed (no syntax errors)
2. ✅ All required fields are present for each job
3. ✅ Enumeration values match allowed values exactly (case-sensitive)
4. ✅ URLs are valid and accessible
5. ✅ Special characters are properly escaped
6. ✅ Feed loads within 30 seconds
7. ✅ Feed size is under 10MB

### XML Validation Tools
- Online: [XML Validator](https://www.xmlvalidation.com/)
- Command line: `xmllint --noout yourfile.xml`

## Error Handling

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Invalid salary_type | Use only: hourly, yearly, weekly, daily, contract |
| Missing job_id | Every job must have a unique job_id |
| Invalid XML structure | Ensure proper opening/closing tags |
| Feed timeout | Optimize feed generation, reduce size, or cache results |
| Special characters breaking XML | Properly escape &, <, >, ", ' characters |

## Support

For questions or assistance with feed implementation:
- Email: support@intelats.com
- Documentation: https://docs.intelats.com/feeds
- Test your feed: https://app.intelats.com/super-admin/feeds

## Changelog

**Version 1.0** (2025-10-03)
- Initial specification release
- Support for basic job fields
- Trucking industry focus
