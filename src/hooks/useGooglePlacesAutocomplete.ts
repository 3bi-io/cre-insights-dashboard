import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlaceResult {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface UseGooglePlacesAutocompleteOptions {
  onPlaceSelect: (place: PlaceResult) => void;
}

let apiKeyPromise: Promise<string> | null = null;
let scriptLoaded = false;
let scriptLoading = false;

async function fetchApiKey(): Promise<string> {
  if (!apiKeyPromise) {
    apiKeyPromise = supabase.functions
      .invoke('get-google-maps-key')
      .then(({ data, error }) => {
        if (error || !data?.apiKey) throw new Error('Failed to fetch Google Maps API key');
        return data.apiKey as string;
      });
  }
  return apiKeyPromise;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (scriptLoaded) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => { scriptLoaded = true; scriptLoading = false; resolve(); };
    script.onerror = () => { scriptLoading = false; reject(new Error('Failed to load Google Maps SDK')); };
    document.head.appendChild(script);
  });
}

function parseAddressComponents(components: any[]): PlaceResult {
  const result: PlaceResult = { address: '', city: '', state: '', zip: '' };
  let streetNumber = '';
  let route = '';

  for (const comp of components) {
    const type = comp.types[0];
    if (type === 'street_number') streetNumber = comp.long_name;
    else if (type === 'route') route = comp.long_name;
    else if (type === 'locality') result.city = comp.long_name;
    else if (type === 'sublocality_level_1' && !result.city) result.city = comp.long_name;
    else if (type === 'administrative_area_level_1') result.state = comp.short_name;
    else if (type === 'postal_code') result.zip = comp.long_name;
  }

  result.address = [streetNumber, route].filter(Boolean).join(' ');
  return result;
}

export function useGooglePlacesAutocomplete({ onPlaceSelect }: UseGooglePlacesAutocompleteOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    let cancelled = false;
    const g = window as any;

    async function init() {
      try {
        const apiKey = await fetchApiKey();
        if (cancelled) return;
        await loadGoogleMapsScript(apiKey);
        if (cancelled || !inputRef.current || !g.google) return;

        const autocomplete = new g.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['address_components'],
          types: ['address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.address_components) {
            const parsed = parseAddressComponents(place.address_components);
            onPlaceSelectRef.current(parsed);
          }
        });

        autocompleteRef.current = autocomplete;
        setIsReady(true);
      } catch (err) {
        console.error('Google Places Autocomplete init failed:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (autocompleteRef.current && g.google) {
        g.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []);

  return { inputRef, isReady };
}
