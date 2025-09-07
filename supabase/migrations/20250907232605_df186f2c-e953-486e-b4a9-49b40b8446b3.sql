-- Ensure CR England organization exists and has default features
DO $$
DECLARE
    cr_england_id uuid;
BEGIN
    -- Check if CR England organization exists
    SELECT id INTO cr_england_id FROM public.organizations WHERE slug = 'cr-england';
    
    -- If CR England doesn't exist, create it
    IF cr_england_id IS NULL THEN
        INSERT INTO public.organizations (slug, name, settings, subscription_status)
        VALUES (
            'cr-england',
            'C.R. England',
            jsonb_build_object(
                'features', jsonb_build_object(
                    'tenstreet_access', true,
                    'openai_access', true,
                    'anthropic_access', true,
                    'meta_integration', true,
                    'voice_agent', true,
                    'advanced_analytics', true,
                    'elevenlabs_access', true
                )
            ),
            'active'
        )
        RETURNING id INTO cr_england_id;
    ELSE
        -- Update CR England with default features if not already set
        UPDATE public.organizations 
        SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
            'features', COALESCE(settings->'features', '{}'::jsonb) || jsonb_build_object(
                'tenstreet_access', true,
                'openai_access', true,
                'anthropic_access', true,
                'meta_integration', true,
                'voice_agent', true,
                'advanced_analytics', true,
                'elevenlabs_access', true
            )
        )
        WHERE id = cr_england_id;
    END IF;
    
    -- Ensure other organizations have default settings structure
    UPDATE public.organizations 
    SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
        'features', COALESCE(settings->'features', '{}'::jsonb) || jsonb_build_object(
            'tenstreet_access', false,
            'openai_access', false,
            'anthropic_access', false,
            'meta_integration', true,
            'voice_agent', false,
            'advanced_analytics', true,
            'elevenlabs_access', false
        )
    )
    WHERE slug != 'cr-england' AND (settings->'features' IS NULL OR settings->'features' = '{}'::jsonb);
END $$;