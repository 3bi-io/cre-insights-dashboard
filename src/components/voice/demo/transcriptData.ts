export interface TranscriptEntry {
  startTime: number;
  endTime: number;
  speaker: 'agent' | 'applicant';
  text: string;
}

// Live call transcript - direct conversation with applicant (~60 seconds)
export const liveCallTranscript: TranscriptEntry[] = [
  { startTime: 0, endTime: 3, speaker: 'agent', text: 'Hello, Cody.' },
  { startTime: 3, endTime: 10, speaker: 'agent', text: "This is a follow-up call from our company about your application for the driving position. Is now a good time to chat?" },
  { startTime: 10, endTime: 11, speaker: 'applicant', text: 'Yes.' },
  { startTime: 11, endTime: 15, speaker: 'agent', text: "Excellent. I'm glad we could connect." },
  { startTime: 15, endTime: 26, speaker: 'agent', text: "I see here that you're Cody Forbes from Weatherford, Texas, and you have a Class A CDL with one year of experience. You're also willing to pass a drug test, and you're a veteran. Does all that sound correct?" },
  { startTime: 28, endTime: 29, speaker: 'applicant', text: 'Yes.' },
  { startTime: 29, endTime: 38, speaker: 'agent', text: "Great. Thanks for confirming that, Cody. We appreciate your service as a veteran, and we're always looking for dedicated drivers like yourself." },
  { startTime: 38, endTime: 44, speaker: 'agent', text: 'Do you have any questions for me about the driving position at our company?' },
  { startTime: 44, endTime: 47, speaker: 'applicant', text: "I don't believe so." },
  { startTime: 47, endTime: 55, speaker: 'agent', text: 'Great news, Cody. Everything looks good. A recruiter from our company will review your application and reach out soon about the driving position.' },
  { startTime: 55, endTime: 60, speaker: 'agent', text: "Thanks for your time, Cody. We're excited about your interest in our company. Talk soon." },
];

// Voicemail scenario transcript - AI agent reaches applicant's AI voicemail (~2 min)
// Note: 'applicant' represents Cody's AI voicemail, 'agent' represents our outbound AI
export const voicemailTranscript: TranscriptEntry[] = [
  { startTime: 0, endTime: 3, speaker: 'applicant', text: "Hello, you have reached an AI assistant for Cody." },
  { startTime: 3, endTime: 8, speaker: 'agent', text: "Company calling about your application for the driving position. Is now a good time to chat?" },
  { startTime: 8, endTime: 28, speaker: 'applicant', text: "Thank you for reaching out about Cody's application for the driving position. Cody isn't available to take your call right now, but I'd be happy to take a message or help schedule a time for you two to connect. Would you like to leave a message, or would you prefer to set up a call for another time?" },
  { startTime: 28, endTime: 48, speaker: 'agent', text: "I understand Cody isn't available right now. I can definitely leave a message for him. Could you please let him know that I called regarding his application for the driving position at Day and Ross and that he can call us back at 1-800-546-0030 at his convenience." },
  { startTime: 48, endTime: 68, speaker: 'applicant', text: "Absolutely, I'll make sure Cody gets your message. I'll let him know you called about his application for the driving position at Day and Ross, and that he can return your call at one eight hundred five four six zero zero three zero whenever it's convenient for him. Is there anything else you'd like me to include in the message?" },
  { startTime: 68, endTime: 80, speaker: 'agent', text: "That's perfect. Thank you so much. Please also let him know that we're really excited about his interest in Day & Ross, and that we appreciate his service as a veteran." },
  { startTime: 80, endTime: 100, speaker: 'applicant', text: "Of course, I'll add that to the message. I'll let Cody know that you're excited about his interest in Day and Ross and that you appreciate his service as a veteran. Thank you for sharing that. Is there anything else you'd like me to pass along?" },
  { startTime: 100, endTime: 110, speaker: 'agent', text: "Nope, that's everything. Thank you so much for your help! I appreciate you taking the time to pass along the message to Cody." },
  { startTime: 110, endTime: 121, speaker: 'applicant', text: "You're very welcome! I'll make sure Cody receives your message just as you shared it. Thank you for calling. We appreciate your call. Have a wonderful day!" },
];
