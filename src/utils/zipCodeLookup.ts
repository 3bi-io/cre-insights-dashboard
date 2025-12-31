// Utility to lookup city and state from zip code
export interface ZipCodeData {
  city: string;
  state: string;
  stateAbbr: string;
}

// localStorage cache settings
const FAILED_CACHE_KEY = 'zipcode_failed_lookups';
const SUCCESS_CACHE_KEY = 'zipcode_success_lookups';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  data?: ZipCodeData;
}

// Get failed lookups from localStorage with TTL filtering
const getFailedLookups = (): Set<string> => {
  try {
    const cached = localStorage.getItem(FAILED_CACHE_KEY);
    if (!cached) return new Set();
    const parsed: Record<string, number> = JSON.parse(cached);
    const now = Date.now();
    // Filter out expired entries
    const validEntries = Object.entries(parsed)
      .filter(([_, timestamp]) => (now - timestamp) < CACHE_TTL)
      .map(([zip]) => zip);
    return new Set(validEntries);
  } catch {
    return new Set();
  }
};

// Add a failed lookup to localStorage
const addFailedLookup = (zip: string): void => {
  try {
    const cached = localStorage.getItem(FAILED_CACHE_KEY);
    const existing: Record<string, number> = cached ? JSON.parse(cached) : {};
    existing[zip] = Date.now();
    localStorage.setItem(FAILED_CACHE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore localStorage errors
  }
};

// Get successful lookups from localStorage
const getSuccessCache = (): Map<string, ZipCodeData> => {
  try {
    const cached = localStorage.getItem(SUCCESS_CACHE_KEY);
    if (!cached) return new Map();
    const parsed: Record<string, CacheEntry> = JSON.parse(cached);
    const now = Date.now();
    const result = new Map<string, ZipCodeData>();
    for (const [zip, entry] of Object.entries(parsed)) {
      if ((now - entry.timestamp) < CACHE_TTL && entry.data) {
        result.set(zip, entry.data);
      }
    }
    return result;
  } catch {
    return new Map();
  }
};

// Add a successful lookup to localStorage
const addSuccessCache = (zip: string, data: ZipCodeData): void => {
  try {
    const cached = localStorage.getItem(SUCCESS_CACHE_KEY);
    const existing: Record<string, CacheEntry> = cached ? JSON.parse(cached) : {};
    existing[zip] = { timestamp: Date.now(), data };
    localStorage.setItem(SUCCESS_CACHE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore localStorage errors
  }
};

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

  // Check success cache first
  const successCache = getSuccessCache();
  if (successCache.has(cleanZip)) {
    return successCache.get(cleanZip)!;
  }

  // Check if this ZIP has previously failed
  const failedLookups = getFailedLookups();
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
        addFailedLookup(cleanZip);
      }
      return null;
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      const result: ZipCodeData = {
        city: place['place name'],
        state: place['state'],
        stateAbbr: place['state abbreviation']
      };
      // Cache successful lookup
      addSuccessCache(cleanZip, result);
      return result;
    }
    
    return null;
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      console.warn(`Zip code lookup timed out for ${cleanZip}`);
    } else {
      console.warn(`Zip code lookup failed for ${cleanZip}:`, err.message);
    }
    addFailedLookup(cleanZip);
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
