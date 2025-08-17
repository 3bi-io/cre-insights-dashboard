// Utility to lookup city and state from zip code
export interface ZipCodeData {
  city: string;
  state: string;
  stateAbbr: string;
}

// Free zip code lookup using Zippopotam.us API
export const lookupZipCode = async (zipCode: string): Promise<ZipCodeData | null> => {
  if (!zipCode || zipCode.length < 5) {
    return null;
  }

  // Clean zip code - take first 5 digits
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  
  if (cleanZip.length !== 5) {
    return null;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
    
    if (!response.ok) {
      console.warn(`Zip code lookup failed for ${cleanZip}: ${response.status}`);
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
  } catch (error) {
    console.error(`Error looking up zip code ${cleanZip}:`, error);
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