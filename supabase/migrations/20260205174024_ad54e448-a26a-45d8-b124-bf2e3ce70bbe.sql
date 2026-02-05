-- Update Pemberton Truck Lines Inc logo URL
UPDATE public.clients 
SET logo_url = 'https://ats-me.lovable.app/logos/pemberton-truck-lines.png',
    updated_at = now()
WHERE id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';