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
    contact: "ATS.me <contact@notifications.3bi.io>",
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
 * Generate preheader text (hidden preview text shown in email clients)
 * Uses spacing characters to prevent body text from appearing in preview
 */
export const getPreheaderText = (text: string): string => {
  // Hidden preheader with spacing to prevent body text from appearing
  const spacers = '&#847; &zwnj; &nbsp; &#8199; &#65279; '.repeat(30);
  return `
    <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
      ${text}
    </div>
    <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
      ${spacers}
    </div>
  `;
};

/**
 * Get email logo with proper alt text for accessibility
 */
export const getEmailLogo = (
  altText: string = 'ATS.me - Modern Applicant Tracking System',
  width: number = 120
): string => {
  return `
    <img 
      src="${EMAIL_CONFIG.brand.logo}" 
      alt="${altText}" 
      width="${width}" 
      height="auto"
      style="display: block; margin: 0 auto 16px; border-radius: 8px;"
      role="img"
    />
  `;
};

/**
 * Generate unsubscribe section for CAN-SPAM compliance
 * Required for marketing emails, optional for transactional
 */
/**
 * Generate unsubscribe URL with token
 */
export const getUnsubscribeUrl = (token: string): string => {
  return `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/email-unsubscribe?token=${token}`;
};

export const getUnsubscribeSection = (options?: {
  unsubscribeUrl?: string;
  unsubscribeToken?: string;
  emailType?: 'transactional' | 'marketing';
  preferencesUrl?: string;
}): string => {
  const isMarketing = options?.emailType === 'marketing';
  const unsubscribeUrl = options?.unsubscribeToken 
    ? getUnsubscribeUrl(options.unsubscribeToken)
    : options?.unsubscribeUrl || `${EMAIL_CONFIG.brand.website}/unsubscribe`;
  const preferencesUrl = options?.unsubscribeToken
    ? getUnsubscribeUrl(options.unsubscribeToken)
    : options?.preferencesUrl || `${EMAIL_CONFIG.brand.website}/email-preferences`;
  
  return `
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 11px;">
      ${isMarketing ? `
        <p style="margin: 0 0 8px 0;">
          <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
            Unsubscribe from these emails
          </a>
          &nbsp;|&nbsp;
          <a href="${preferencesUrl}" style="color: #6b7280; text-decoration: underline;">
            Manage email preferences
          </a>
        </p>
      ` : ''}
      <p style="margin: 0;">
        ${EMAIL_CONFIG.footer.address} • 
        <a href="${EMAIL_CONFIG.brand.website}" style="color: #6b7280; text-decoration: none;">
          ${EMAIL_CONFIG.brand.website.replace('https://', '')}
        </a>
      </p>
    </div>
  `;
};

/**
 * Generate standard email footer HTML
 * Updated to support unsubscribe links and marketing email compliance
 */
export const getEmailFooter = (options?: {
  companyName?: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  emailType?: 'transactional' | 'marketing';
}): string => {
  const company = options?.companyName || EMAIL_CONFIG.brand.name;
  
  return `
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
      <p style="margin: 5px 0;">© ${EMAIL_CONFIG.brand.year} ${company}. All rights reserved.</p>
      <p style="margin: 5px 0; color: #9ca3af;">
        Powered by <a href="${EMAIL_CONFIG.brand.website}" style="color: #3b82f6; text-decoration: none;">ATS.me</a>
      </p>
      ${options?.showUnsubscribe ? getUnsubscribeSection({
        unsubscribeUrl: options.unsubscribeUrl,
        emailType: options.emailType
      }) : `
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">
          ${EMAIL_CONFIG.footer.unsubscribeText}
        </p>
      `}
    </div>
  `;
};

/**
 * Generate email header with gradient and optional logo
 * Updated to include logo with alt text for accessibility
 */
export const getEmailHeader = (
  title: string, 
  options?: {
    gradient?: string;
    showLogo?: boolean;
    logoAlt?: string;
  }
): string => {
  const gradient = options?.gradient || '#667eea 0%, #764ba2 100%';
  
  return `
    <div style="background: linear-gradient(135deg, ${gradient}); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      ${options?.showLogo ? `
        <img 
          src="${EMAIL_CONFIG.brand.logo}" 
          alt="${options.logoAlt || 'ATS.me - Modern Applicant Tracking System'}" 
          width="80" 
          height="auto"
          style="display: block; margin: 0 auto 16px; border-radius: 8px;"
          role="img"
        />
      ` : ''}
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

/**
 * Preheader text templates for different email types
 */
export const PREHEADER_TEMPLATES = {
  // Application emails
  application_received: (jobTitle: string) => 
    `Thanks for applying! We've received your application for ${jobTitle} and will review it shortly.`,
  status_update: (status: string) => 
    `Your application status has been updated to "${status}". Check inside for details.`,
  interview_invitation: (jobTitle: string) => 
    `Great news! You've been selected for an interview for ${jobTitle}.`,
  offer: (jobTitle: string) => 
    `Congratulations! We're excited to offer you the ${jobTitle} position.`,
  rejection: () => 
    `Thank you for your interest. We have an update on your application.`,
  
  // Auth emails
  welcome: (orgName: string) => 
    `Welcome aboard! Your ${orgName} account is ready. Here's how to get started.`,
  invite: (inviterName: string | undefined, orgName: string, role: string) => 
    inviterName 
      ? `${inviterName} invited you to join ${orgName} as a ${role}.`
      : `You've been invited to join ${orgName} as a ${role}.`,
  magic_link: () => 
    `Click to sign in securely. This link expires in 1 hour.`,
  password_reset: () => 
    `Use this secure link to reset your password. Expires in 24 hours.`,
  email_confirm: () => 
    `One click to verify your email and access your account.`,
  email_change: () => 
    `Verify your new email address to complete the change.`,
  
  // Screening emails
  background_check: (applicantName: string) => 
    `A background check has been requested for ${applicantName}.`,
  employment_application: (orgName: string) => 
    `Please complete your employment application for ${orgName}.`,
  drug_screening: (applicantName: string) => 
    `A drug screening has been requested for ${applicantName}.`
} as const;
