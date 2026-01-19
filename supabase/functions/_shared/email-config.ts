/**
 * Centralized Email Configuration
 * All email-sending functions should use these constants
 * 
 * Verified Domain: notifications.3bi.io
 */

export const EMAIL_CONFIG = {
  // Verified sender addresses
  senders: {
    default: "ATS.me <noreply@notifications.3bi.io>",
    admin: "ATS.me Admin <admin@notifications.3bi.io>",
    notifications: "ATS.me <notifications@notifications.3bi.io>",
    support: "ATS.me Support <support@notifications.3bi.io>",
    invites: "ATS.me <invites@notifications.3bi.io>",
    screening: "ATS.me Screening <screening@notifications.3bi.io>"
  },
  
  // Reply-to addresses
  replyTo: {
    support: "support@3bi.io",
    hr: "hr@3bi.io",
    admin: "admin@3bi.io"
  },
  
  // Brand settings
  brand: {
    name: "ATS.me",
    tagline: "Modern Applicant Tracking System",
    primaryColor: "#3b82f6",
    secondaryColor: "#667eea",
    logo: "https://ats-me.lovable.app/logo.png",
    website: "https://ats-me.lovable.app",
    year: new Date().getFullYear()
  },

  // Email footer
  footer: {
    copyright: `© ${new Date().getFullYear()} ATS.me by 3BI. All rights reserved.`,
    address: "3BI Solutions",
    unsubscribeText: "You received this email because you applied for a position or are a registered user."
  }
} as const;

export type SenderType = keyof typeof EMAIL_CONFIG.senders;

/**
 * Get sender email address by type
 */
export const getSender = (type: SenderType = 'default'): string => {
  return EMAIL_CONFIG.senders[type];
};

/**
 * Get reply-to address by type
 */
export const getReplyTo = (type: keyof typeof EMAIL_CONFIG.replyTo = 'support'): string => {
  return EMAIL_CONFIG.replyTo[type];
};

/**
 * Generate standard email footer HTML
 */
export const getEmailFooter = (companyName?: string): string => {
  const company = companyName || EMAIL_CONFIG.brand.name;
  return `
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
      <p style="margin: 5px 0;">© ${EMAIL_CONFIG.brand.year} ${company}. All rights reserved.</p>
      <p style="margin: 5px 0; color: #9ca3af;">Powered by <a href="${EMAIL_CONFIG.brand.website}" style="color: #3b82f6; text-decoration: none;">ATS.me</a></p>
    </div>
  `;
};

/**
 * Generate email header with gradient
 */
export const getEmailHeader = (title: string, gradient: string = '#667eea 0%, #764ba2 100%'): string => {
  return `
    <div style="background: linear-gradient(135deg, ${gradient}); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    </div>
  `;
};

/**
 * Base email styles
 */
export const baseEmailStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

/**
 * Content container styles
 */
export const contentStyles = `
  background: white;
  padding: 30px;
  border: 1px solid #e1e8ed;
  border-top: none;
  border-radius: 0 0 10px 10px;
`;

/**
 * Button styles for CTAs
 */
export const buttonStyles = `
  display: inline-block;
  padding: 14px 28px;
  background-color: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  margin: 16px 0;
`;
