/**
 * Founders Pass Content
 * Performance-based pricing for early adopters
 */

export const foundersPassContent = {
  badge: 'Limited Time Offer',
  headline: 'Founders Pass',
  tagline: 'Pay only when it works. $0 to start.',
  description:
    'The best end-to-end recruitment solution available today — free to join, free to onboard, and you only pay when candidates apply.',

  pricing: [
    {
      service: 'Per Apply',
      cost: '$1',
      description: 'Every application received on your jobs',
      note: 'Billed per submission — not filtered by qualification criteria, since what counts as "qualified" varies by client and role.',
    },
    {
      service: 'ATS Delivery',
      cost: '$1',
      description: 'Comprehensive workflow delivery to your internal ATS',
      note: 'Automated data transfer to Tenstreet, DriverReach, or any supported system.',
    },
    {
      service: 'Voice Agent',
      cost: '$1',
      badge: 'Optional',
      description: 'AI outbound follow-up and fulfillment calls',
      note: 'Engage candidates with 24/7 AI voice agents for screening and scheduling.',
    },
  ],

  summary: 'All in, $3 per apply for the best end-to-end solution available today.',

  included: [
    'Free signup — no credit card required',
    'Free onboarding with priority support',
    'Bring your own publishers & vendors',
    'Supports inbound and outbound traffic from any third-party source',
    'No marketing spend required — optional marketing services available',
    'No contracts, cancel anytime',
  ],

  steps: [
    {
      step: '1',
      title: 'Sign Up & Onboard',
      description: 'Create your account and configure your company profile — completely free.',
    },
    {
      step: '2',
      title: 'Post Your Jobs',
      description: 'Your listings go live across your chosen channels and publisher network.',
    },
    {
      step: '3',
      title: 'Pay Per Apply',
      description: 'Only pay $1–$3 per application as candidates come in. No minimums.',
    },
  ],

  cta: {
    primary: 'Claim Your Founders Pass',
    primaryPath: '/auth?plan=founders',
    secondary: 'Talk to Us',
    secondaryPath: '/contact?subject=founders-pass',
  },

  urgency: 'Founders Pass is a limited-time offer for early adopters.',
  footer: 'No contracts • Cancel anytime • GDPR compliant',
};
