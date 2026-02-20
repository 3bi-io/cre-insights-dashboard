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

// Voice Apply Demo - Full inbound application conversation (~5:24)
// Complete candidate intake with qualification screening
export const voiceApplyTranscript: TranscriptEntry[] = [
  { startTime: 0, endTime: 3, speaker: 'agent', text: "Hi there, I'm an AI recruiting assistant." },
  { startTime: 3, endTime: 5, speaker: 'agent', text: "Welcome to Apply AI." },
  { startTime: 5, endTime: 14, speaker: 'agent', text: "I'm here to help you explore various opportunities with Apply AI, one of America's fastest growing AI recruiting solutions." },
  { startTime: 14, endTime: 17, speaker: 'agent', text: "Are you ready to get started with your application?" },
  { startTime: 17, endTime: 18, speaker: 'applicant', text: "Yes." },
  { startTime: 18, endTime: 21, speaker: 'agent', text: "Great! Let's get started." },
  { startTime: 21, endTime: 24, speaker: 'agent', text: "First, what is your first name?" },
  { startTime: 24, endTime: 26, speaker: 'applicant', text: "Cody." },
  { startTime: 26, endTime: 29, speaker: 'agent', text: "Nice to meet you, Cody." },
  { startTime: 29, endTime: 32, speaker: 'agent', text: "And what is your last name?" },
  { startTime: 32, endTime: 34, speaker: 'applicant', text: "Forbes." },
  { startTime: 34, endTime: 38, speaker: 'agent', text: "Perfect, Cody Forbes. Got it." },
  { startTime: 38, endTime: 43, speaker: 'agent', text: "Now, what's the best phone number to reach you at?" },
  { startTime: 43, endTime: 50, speaker: 'applicant', text: "It's 214-555-0147." },
  { startTime: 50, endTime: 55, speaker: 'agent', text: "Great, I've got 214-555-0147." },
  { startTime: 55, endTime: 59, speaker: 'agent', text: "And what's your email address?" },
  { startTime: 59, endTime: 66, speaker: 'applicant', text: "cody.forbes@email.com" },
  { startTime: 66, endTime: 72, speaker: 'agent', text: "Perfect. And what's your zip code?" },
  { startTime: 72, endTime: 75, speaker: 'applicant', text: "76086" },
  { startTime: 75, endTime: 80, speaker: 'agent', text: "Got it, 76086. That's in the Weatherford, Texas area." },
  { startTime: 80, endTime: 87, speaker: 'agent', text: "Now I'll ask you a few quick qualification questions to match you with the right opportunities." },
  { startTime: 87, endTime: 92, speaker: 'agent', text: "Are you at least 21 years of age?" },
  { startTime: 92, endTime: 94, speaker: 'applicant', text: "Yes, I am." },
  { startTime: 94, endTime: 100, speaker: 'agent', text: "Great! Do you currently hold a valid CDL?" },
  { startTime: 100, endTime: 102, speaker: 'applicant', text: "Yes." },
  { startTime: 102, endTime: 107, speaker: 'agent', text: "What class is your CDL? Class A, B, or C?" },
  { startTime: 107, endTime: 109, speaker: 'applicant', text: "Class A." },
  { startTime: 109, endTime: 116, speaker: 'agent', text: "Excellent! Class A is perfect for our long-haul opportunities." },
  { startTime: 116, endTime: 122, speaker: 'agent', text: "How many years of commercial driving experience do you have?" },
  { startTime: 122, endTime: 126, speaker: 'applicant', text: "I have about one year of experience." },
  { startTime: 126, endTime: 133, speaker: 'agent', text: "One year of experience, got it. That qualifies you for several of our entry-level positions." },
  { startTime: 133, endTime: 140, speaker: 'agent', text: "Are you able to pass a DOT drug test and physical?" },
  { startTime: 140, endTime: 142, speaker: 'applicant', text: "Yes, absolutely." },
  { startTime: 142, endTime: 148, speaker: 'agent', text: "Perfect. And have you served in the United States military?" },
  { startTime: 148, endTime: 150, speaker: 'applicant', text: "Yes, I'm a veteran." },
  { startTime: 150, endTime: 158, speaker: 'agent', text: "Thank you for your service, Cody. We have several carriers with veteran-friendly programs and benefits." },
  { startTime: 158, endTime: 167, speaker: 'agent', text: "Do you have any accidents or moving violations on your driving record in the past 3 years?" },
  { startTime: 167, endTime: 170, speaker: 'applicant', text: "No, I have a clean record." },
  { startTime: 170, endTime: 176, speaker: 'agent', text: "A clean record is fantastic. That opens up more opportunities for you." },
  { startTime: 176, endTime: 183, speaker: 'agent', text: "What type of driving are you most interested in? Local, regional, or over-the-road?" },
  { startTime: 183, endTime: 187, speaker: 'applicant', text: "I'm open to regional or OTR." },
  { startTime: 187, endTime: 195, speaker: 'agent', text: "Great flexibility. Both regional and OTR have excellent earning potential." },
  { startTime: 195, endTime: 203, speaker: 'agent', text: "Do you have any endorsements on your CDL, such as Hazmat, Tanker, or Doubles/Triples?" },
  { startTime: 203, endTime: 207, speaker: 'applicant', text: "I have Hazmat and Tanker endorsements." },
  { startTime: 207, endTime: 216, speaker: 'agent', text: "Excellent! Hazmat and Tanker endorsements significantly increase your earning potential and open premium routes." },
  { startTime: 216, endTime: 226, speaker: 'agent', text: "Just for fun, and to make sure you're paying attention - have you ever seen a UFO while driving?" },
  { startTime: 226, endTime: 232, speaker: 'applicant', text: "Ha! No, I can't say that I have." },
  { startTime: 232, endTime: 240, speaker: 'agent', text: "Ha, fair enough! Just keeping things interesting. Thanks for having a sense of humor." },
  { startTime: 240, endTime: 248, speaker: 'agent', text: "Alright, Cody. I have all the information I need to match you with some great opportunities." },
  { startTime: 248, endTime: 258, speaker: 'agent', text: "Based on your qualifications - Class A CDL, one year experience, clean record, Hazmat and Tanker endorsements, and veteran status..." },
  { startTime: 258, endTime: 266, speaker: 'agent', text: "...you're an excellent candidate for several of our partner carriers." },
  { startTime: 266, endTime: 276, speaker: 'agent', text: "A recruiter will review your information and reach out to you within the next 24 to 48 hours with specific job matches." },
  { startTime: 276, endTime: 284, speaker: 'agent', text: "They'll contact you at 214-555-0147 or via email at cody.forbes@email.com." },
  { startTime: 284, endTime: 292, speaker: 'agent', text: "Is there anything else you'd like to know about the process or any questions I can answer for you?" },
  { startTime: 292, endTime: 298, speaker: 'applicant', text: "No, I think that covers everything. Thank you." },
  { startTime: 298, endTime: 306, speaker: 'agent', text: "You're welcome, Cody! We appreciate you taking the time to apply with Apply AI." },
  { startTime: 306, endTime: 314, speaker: 'agent', text: "Thank you for your service, and we look forward to helping you find your next driving opportunity." },
  { startTime: 314, endTime: 318, speaker: 'agent', text: "Have a great day!" },
  { startTime: 318, endTime: 320, speaker: 'applicant', text: "You too, thanks!" },
  { startTime: 320, endTime: 324, speaker: 'agent', text: "Goodbye!" },
];
