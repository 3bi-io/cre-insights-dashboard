 /**
  * ZIP Code Lookup Utility for Edge Functions
  * Uses Zippopotam.us API to resolve city/state from ZIP code
  */
 
 export interface ZipLookupResult {
   city: string;
   state: string;
 }
 
 /**
  * Lookup city and state from a US ZIP code
  * @param zipCode - 5-digit US ZIP code
  * @param fallback - Optional fallback values if lookup fails
  * @returns City and state, or fallback values
  */
 export async function lookupCityState(
   zipCode: string | undefined | null,
   fallback?: { city?: string; state?: string }
 ): Promise<ZipLookupResult> {
   const defaultResult = {
     city: fallback?.city || '',
     state: fallback?.state || '',
   };
 
   if (!zipCode || zipCode.length < 5) {
     return defaultResult;
   }
 
   // Clean ZIP: extract first 5 digits
   const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
 
   if (cleanZip.length !== 5) {
     return defaultResult;
   }
 
   try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
 
     const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
       signal: controller.signal,
       headers: { Accept: 'application/json' },
     });
 
     clearTimeout(timeoutId);
 
     if (!response.ok) {
       return defaultResult;
     }
 
     const data = await response.json();
 
     if (data.places && data.places.length > 0) {
       const place = data.places[0];
       return {
         city: place['place name'] || defaultResult.city,
         state: place['state abbreviation'] || defaultResult.state,
       };
     }
 
     return defaultResult;
   } catch {
     // Timeout or network error - return fallback
     return defaultResult;
   }
 }