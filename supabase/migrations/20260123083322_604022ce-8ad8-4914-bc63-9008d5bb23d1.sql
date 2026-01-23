-- Insert default response templates for all organizations
DO $$
DECLARE
    org_id UUID;
BEGIN
    FOR org_id IN SELECT id FROM organizations LOOP
        INSERT INTO social_response_templates (organization_id, name, intent_type, template_content, variables, is_active, priority) VALUES
        -- Job Inquiry Templates
        (org_id, 'Job Inquiry - Welcome', 'job_inquiry', 'Thanks for your interest in driving with us! 🚛 We''re actively hiring CDL drivers. Check out our open positions at {apply_url} or reply with any questions about pay, routes, or benefits!', '["apply_url"]'::jsonb, true, 1),
        (org_id, 'Job Inquiry - Casual', 'job_inquiry', 'Hey there! Great to hear you''re interested. We have positions available for Class A drivers with competitive pay and home time. Want me to share more details? Apply here: {apply_url}', '["apply_url"]'::jsonb, true, 2),

        -- Application Status Templates  
        (org_id, 'Application Status - Check In', 'application_status', 'Thanks for checking in on your application! 📋 Our recruiting team reviews applications within 24-48 hours. If you haven''t heard back, feel free to call us at {phone} or reply here with your name and we''ll look into it.', '["phone"]'::jsonb, true, 1),
        (org_id, 'Application Status - Request Info', 'application_status', 'Hi! I''d be happy to help check on your application status. Can you provide your full name and the position you applied for? You can also reach our recruiting team directly at {phone}.', '["phone"]'::jsonb, true, 2),

        -- Salary/Pay Questions
        (org_id, 'Salary Question - Overview', 'salary_question', 'Great question about pay! 💰 Our drivers typically earn {salary_range} based on experience and route type. We also offer sign-on bonuses for experienced drivers. Want more details? Apply at {apply_url} to speak with a recruiter.', '["salary_range", "apply_url"]'::jsonb, true, 1),
        (org_id, 'Salary Question - Industry Compare', 'salary_question', 'Pay varies by position and experience, but our drivers are among the best compensated in the industry. OTR drivers average {salary_range}/year with bonuses. Check out full details: {apply_url}', '["salary_range", "apply_url"]'::jsonb, true, 2),

        -- Benefits Questions
        (org_id, 'Benefits Question - Full Package', 'benefits_question', 'We offer a comprehensive benefits package! 🏥 This includes health/dental/vision insurance, 401(k) with company match, paid time off, and more. Full details at {apply_url} or ask a recruiter directly.', '["apply_url"]'::jsonb, true, 1),
        (org_id, 'Benefits Question - Highlights', 'benefits_question', 'Benefits are a big priority for us! Our package includes medical coverage starting day 1, retirement plans, paid vacation, and performance bonuses. Learn more: {apply_url}', '["apply_url"]'::jsonb, true, 2),

        -- General Questions
        (org_id, 'General - Welcome', 'general', 'Thanks for reaching out! 👋 How can we help you today? Whether you have questions about driving opportunities, our company, or anything else, we''re here to assist.', '[]'::jsonb, true, 1),
        (org_id, 'General - Friendly', 'general', 'Hi there! Thanks for your message. We''d love to help - what questions do you have? Feel free to ask about careers, our fleet, routes, or anything else!', '[]'::jsonb, true, 2),

        -- Support/Help
        (org_id, 'Support - Issue Response', 'support', 'We''re sorry to hear you''re having an issue. 🔧 Our team is here to help! Can you provide more details about what you need assistance with? For urgent matters, call {phone}.', '["phone"]'::jsonb, true, 1),
        (org_id, 'Support - Make It Right', 'support', 'Thanks for letting us know. We want to make this right! Please share more details and we''ll get the right person to help you ASAP. You can also reach us at {phone}.', '["phone"]'::jsonb, true, 2),

        -- Complaints
        (org_id, 'Complaint - Acknowledge', 'complaint', 'We''re sorry to hear about your experience and take your feedback seriously. 🙏 Could you please share more details so we can investigate and make it right? Our team will follow up promptly.', '[]'::jsonb, true, 1),
        (org_id, 'Complaint - Apologize', 'complaint', 'Thank you for bringing this to our attention. We sincerely apologize for any inconvenience. Please DM us your contact info so our team can personally address your concerns.', '[]'::jsonb, true, 2),

        -- Spam (auto-ignore template)
        (org_id, 'Spam - No Response', 'spam', '', '[]'::jsonb, false, 1);
    END LOOP;
END $$;