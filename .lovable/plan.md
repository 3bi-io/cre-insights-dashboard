
# Features Page Priority Reorder

## Current State

The features page (`FeaturesPage.tsx`) and its content file (`features.content.ts`) display features in this current order:

### Primary Features (Core AI section) — current order:
1. Instant AI Callbacks
2. 24/7 AI Voice Agents
3. Visual Kanban Pipeline
4. Talent Pool Management
5. Voice Apply Technology
6. AI-Powered Analytics

### Secondary Features (Capabilities grid) — current order:
1. Activity Timeline
2. Communication Hub
3. Automated Workflows
4. Enterprise Security
5. Team Collaboration
6. Multi-Platform Distribution
7. AI Writing Assistant
8. Performance Insights
9. Mobile-First Design

### Scroll-Spy Nav sections — current order:
1. Social Beacon
2. Core AI
3. Capabilities
4. Comparison
5. Integrations

### Landing Page FeaturesSection (`FeaturesSection.tsx`) — current order:
1. Voice Apply Technology
2. AI-Powered Analytics
3. Automated Screening & Workflows
4. Compliance & Security
5. Advanced Reporting & Insights
6. Full Lifecycle Management
7. Multi-Channel Distribution

---

## Recommended Priority Order

Based on the platform's 2026 positioning strategy (Voice Apply, AI Voice Agents, Social Beacon, API-first), the refactor roadmap (Candidate Experience → Recruiter Command Center → Analytics), and what differentiates ATS.me from legacy ATS platforms in competitive contexts, the optimal order is:

### Primary Features — recommended order:

| # | Feature | Reason |
|---|---|---|
| 1 | **Voice Apply Technology** | The #1 differentiator. 80% faster applications is a hard metric that stops scrolling. Opens with candidate impact. |
| 2 | **Instant AI Callbacks** | Pairs directly with Voice Apply — the employer-side response to candidate applications. Reinforces speed story. |
| 3 | **24/7 AI Voice Agents** | Extends the AI voice narrative. Inbound + outbound coverage completes the loop. |
| 4 | **AI-Powered Analytics** | Moves decision-making story forward. Recruiters and executives both care about ROI data after understanding the AI tools. |
| 5 | **Visual Kanban Pipeline** | Grounds the experience in familiar recruiter workflow. Good bridge between AI excitement and practical tooling. |
| 6 | **Talent Pool Management** | Longest-term value feature. Best placed last so it's the "and we even do this" feature. |

**Key change:** Voice Apply is moved to #1 because it is named in the platform's top four technology pillars and directly speaks to the candidate experience (which is Phase 1 of the refactor roadmap). Currently it is buried at #5, which is the weakest position in a 6-item list.

### Secondary Features — recommended order:

| # | Feature | Reason |
|---|---|---|
| 1 | **Multi-Platform Distribution** | Directly tied to the API-first pillar. Recruiters see immediate job posting ROI. |
| 2 | **Automated Workflows** | High-volume hiring audiences (trucking, CDL) need to see time savings immediately. |
| 3 | **AI Writing Assistant** | Natural follow-on from distribution — write great JDs and push them everywhere. |
| 4 | **Team Collaboration** | Supports the enterprise and multi-recruiter use case. |
| 5 | **Communication Hub** | Unified comms is a key ATS differentiator vs spreadsheets. |
| 6 | **Activity Timeline** | Deep operational tool — better after the high-value features. |
| 7 | **Performance Insights** | Recruiter productivity metrics suit managers reviewing the platform. |
| 8 | **Enterprise Security** | Important but rarely a lead. Trust is built, not led with. |
| 9 | **Mobile-First Design** | Good closing note — reassures users but not a primary buying signal. |

### Landing Page FeaturesSection — recommended order:

| # | Feature | Reason |
|---|---|---|
| 1 | **Voice Apply Technology** | Must match the full features page — lead with the brand flagship. |
| 2 | **Automated Screening & Workflows** | Immediate time savings — highest pain point for busy recruiters. |
| 3 | **AI-Powered Analytics** | Data-driven hiring is the second buying signal for managers. |
| 4 | **Multi-Channel Distribution** | Ties to the API-first pillar and Tenstreet/job board integrations. |
| 5 | **Full Lifecycle Management** | Demonstrates breadth — "we replace your whole stack." |
| 6 | **Advanced Reporting & Insights** | Supports the Analytics pillar for executive buyers. |
| 7 | **Compliance & Security** | Trust-builder — best placed last as a reassuring closer. |

### Scroll-Spy Nav — no change needed
The current section order (Social Beacon → Core AI → Capabilities → Comparison → Integrations) follows a logical narrative arc: flagship product → core tools → full capabilities → proof → ecosystem. This order is sound and should be kept.

---

## Technical Changes Required

All changes are in two content files only:

1. **`src/features/landing/content/features.content.ts`**
   - Reorder the `primaryFeatures` array (move Voice Apply to index 0, Instant Callbacks to 1, etc.)
   - Reorder the `secondaryFeatures` array (move Multi-Platform Distribution to index 0, etc.)
   - Reorder the legacy `features` array in the same file (used by landing page FeaturesSection)

2. **`src/components/landing/FeaturesSection.tsx`**
   - Reorder the inline `features` array to match the recommended landing page order above.

No component logic, routing, styling, or schema changes are needed. The page renders features in array order, so reordering the arrays is all that is required.
