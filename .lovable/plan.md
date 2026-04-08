

# Add AI Voice Interaction Disclosures to Legal Pages & Consent

## Analysis

After reviewing all three files, here are the gaps:

- **Privacy Policy**: No mention of voice interactions, call recordings, transcripts, AI voice agents, or voicemail detection. The platform actively records calls, generates transcripts, uses AI voice agents (ElevenLabs), and performs voicemail detection — none of this is disclosed.
- **Terms of Service**: No mention of AI-powered voice communication, automated calling, recording consent, or AI agent interactions. The service description lists only generic features.
- **ConsentSection**: The summary paragraph mentions "outbound calls" and "AI tools" but does not explicitly state that calls may be conducted by an AI voice agent, that conversations are recorded and transcribed, or that voicemail may be detected and trigger SMS follow-ups.

## Changes

### 1. Privacy Policy — Add "Voice Interaction Data" subsection + update "How We Use"

In the **Information We Collect** section, add a fourth subsection:

**Voice Interaction Data** — When you interact with our AI voice assistant or receive automated calls, we collect audio recordings, transcripts, call metadata (duration, timestamps, call status), and voicemail detection results. These recordings are processed by third-party AI services on our behalf.

In **How We Use Your Information**, add:
- "Conduct AI-assisted voice outreach, including automated calls, voicemail detection, and follow-up communications"
- "Generate and store call transcripts for recruitment quality and compliance purposes"

In **Information Sharing**, add a bullet:
- "With AI and telephony service providers who process voice interactions on our behalf, subject to contractual data protection obligations"

Update `lastUpdated` to `"April 2026"`.

### 2. Terms of Service — Add "AI Voice Communications" section

Insert a new section **5.5** (or renumber as section 5, shifting others) titled **AI Voice Communications**:

- The Service may initiate automated outbound voice calls using AI-powered voice agents to communicate with candidates regarding job applications.
- Voice interactions may be recorded and transcribed for quality assurance, compliance, and recruitment purposes.
- By providing a phone number, you acknowledge that you may receive calls from an AI voice agent and that these interactions may be recorded.
- You may opt out of voice communications at any time by informing us during a call or contacting support.
- Voicemail messages may be detected automatically, and follow-up communications (including SMS) may be sent based on call outcomes.

Update the **Description of Service** to add "AI-powered voice communication and outbound calling" to the feature list.

Update `lastUpdated` to `"April 2026"`.

### 3. ConsentSection — Strengthen AI voice disclosure

Update the SMS consent card description to: "Get updates about your application status and new opportunities via text message. You may also receive automated follow-up texts based on call outcomes."

Update the summary disclosure paragraph to be more explicit:

> "By submitting this form, you agree we may contact you using AI-powered voice agents, automated outbound calls, texts, emails, or other digital means at the contact information you provided. Voice interactions may be recorded and transcribed. Voicemail detection may trigger automated SMS follow-ups. Standard message and data rates may apply. You can opt out at any time."

### Files modified
- `src/pages/public/PrivacyPolicyPage.tsx`
- `src/pages/public/TermsOfServicePage.tsx`
- `src/components/apply/ConsentSection.tsx`

