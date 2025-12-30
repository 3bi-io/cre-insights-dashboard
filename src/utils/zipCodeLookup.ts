// Utility to lookup city and state from zip code
export interface ZipCodeData {
  city: string;
  state: string;
  stateAbbr: string;
}

// Module-level cache for failed lookups to avoid repeated requests
const failedLookups = new Set<string>();

// Free zip code lookup using Zippopotam.us API with retry logic
export const lookupZipCode = async (zipCode: string): Promise<ZipCodeData | null> => {
  if (!zipCode || zipCode.length < 5) {
    return null;
  }

  // Clean zip code - take first 5 digits
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  
  if (cleanZip.length !== 5) {
    return null;
  }

  if (failedLookups.has(cleanZip)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Cache failed lookups to prevent repeated attempts
        failedLookups.add(cleanZip);
      }
      return null;
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        city: place['place name'],
        state: place['state'],
        stateAbbr: place['state abbreviation']
      };
    }
    
    return null;
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      console.warn(`Zip code lookup timed out for ${cleanZip}`);
    } else {
      console.warn(`Zip code lookup failed for ${cleanZip}:`, err.message);
    }
    failedLookups.add(cleanZip);
    return null;
  }
};

// Format city and state consistently as "City, ST"
export const formatCityState = (city: string, state: string): string => {
  if (!city && !state) return '';
  if (!city) return state;
  if (!state) return city;
  
  // Use state abbreviation if it's longer than 2 characters
  const stateDisplay = state.length > 2 ? state.substring(0, 2).toUpperCase() : state.toUpperCase();
  
  return `${city}, ${stateDisplay}`;
};