import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface SendEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string; // Client name for applicant-facing branded emails
  clientLogoUrl?: string; // Client logo URL for branded email headers
  type: 'application_received' | 'status_update' | 'interview_invitation' | 'offer' | 'rejection';
  additionalData?: {
    status?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewType?: string;
    interviewLink?: string;
    rejectionReason?: string;
  };
}

export const sendApplicationEmail = async (params: SendEmailParams): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-application-email', {
      body: {
        to: params.to,
        subject: getEmailSubject(params.type, params.jobTitle),
        candidateName: params.candidateName,
        jobTitle: params.jobTitle,
        companyName: params.companyName || 'Company', // Use client name for branded emails
        clientLogoUrl: params.clientLogoUrl, // Client logo for branded email headers
        type: params.type,
        additionalData: params.additionalData,
      },
    });

    if (error) {
      logger.error('Error sending email:', error);
      throw error;
    }

    logger.debug('Email sent successfully', { data });
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

const getEmailSubject = (type: string, jobTitle: string): string => {
  switch (type) {
    case 'application_received':
      return `Application Received - ${jobTitle}`;
    case 'status_update':
      return `Application Status Update - ${jobTitle}`;
    case 'interview_invitation':
      return `Interview Invitation - ${jobTitle}`;
    case 'offer':
      return `Job Offer - ${jobTitle}`;
    case 'rejection':
      return `Application Update - ${jobTitle}`;
    default:
      return `Update on Your Application - ${jobTitle}`;
  }
};

// Helper function to send email when application is received
export const sendApplicationReceivedEmail = async (
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName?: string // Client name for applicant-facing branded emails
) => {
  return sendApplicationEmail({
    to: candidateEmail,
    candidateName,
    jobTitle,
    companyName: companyName || 'Company',
    type: 'application_received',
  });
};

// Helper function to send email when status is updated
export const sendStatusUpdateEmail = async (
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  status: string,
  companyName?: string // Client name for applicant-facing branded emails
) => {
  return sendApplicationEmail({
    to: candidateEmail,
    candidateName,
    jobTitle,
    companyName: companyName || 'Company',
    type: 'status_update',
    additionalData: { status },
  });
};

// Helper function to send interview invitation
export const sendInterviewInvitationEmail = async (
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  interviewDetails: {
    date: string;
    time: string;
    type: string;
    link?: string;
  },
  companyName?: string // Client name for applicant-facing branded emails
) => {
  return sendApplicationEmail({
    to: candidateEmail,
    candidateName,
    jobTitle,
    companyName: companyName || 'Company',
    type: 'interview_invitation',
    additionalData: {
      interviewDate: interviewDetails.date,
      interviewTime: interviewDetails.time,
      interviewType: interviewDetails.type,
      interviewLink: interviewDetails.link,
    },
  });
};

// Helper function to send job offer
export const sendOfferEmail = async (
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName?: string // Client name for applicant-facing branded emails
) => {
  return sendApplicationEmail({
    to: candidateEmail,
    candidateName,
    jobTitle,
    companyName: companyName || 'Company',
    type: 'offer',
  });
};

// Helper function to send rejection email
export const sendRejectionEmail = async (
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  reason?: string,
  companyName?: string // Client name for applicant-facing branded emails
) => {
  return sendApplicationEmail({
    to: candidateEmail,
    candidateName,
    jobTitle,
    companyName: companyName || 'Company',
    type: 'rejection',
    additionalData: { rejectionReason: reason },
  });
};
