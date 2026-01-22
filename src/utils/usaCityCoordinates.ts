/**
 * US City Coordinates Lookup Table
 * Contains lat/lng coordinates for major US cities for map visualization
 */

export interface CityCoordinate {
  lat: number;
  lng: number;
  city: string;
  state: string;
  stateCode: string;
}

// State centroids as fallback for unknown cities
export const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'AL': { lat: 32.806671, lng: -86.791130 },
  'AK': { lat: 61.370716, lng: -152.404419 },
  'AZ': { lat: 33.729759, lng: -111.431221 },
  'AR': { lat: 34.969704, lng: -92.373123 },
  'CA': { lat: 36.116203, lng: -119.681564 },
  'CO': { lat: 39.059811, lng: -105.311104 },
  'CT': { lat: 41.597782, lng: -72.755371 },
  'DE': { lat: 39.318523, lng: -75.507141 },
  'FL': { lat: 27.766279, lng: -81.686783 },
  'GA': { lat: 33.040619, lng: -83.643074 },
  'HI': { lat: 21.094318, lng: -157.498337 },
  'ID': { lat: 44.240459, lng: -114.478828 },
  'IL': { lat: 40.349457, lng: -88.986137 },
  'IN': { lat: 39.849426, lng: -86.258278 },
  'IA': { lat: 42.011539, lng: -93.210526 },
  'KS': { lat: 38.526600, lng: -96.726486 },
  'KY': { lat: 37.668140, lng: -84.670067 },
  'LA': { lat: 31.169546, lng: -91.867805 },
  'ME': { lat: 44.693947, lng: -69.381927 },
  'MD': { lat: 39.063946, lng: -76.802101 },
  'MA': { lat: 42.230171, lng: -71.530106 },
  'MI': { lat: 43.326618, lng: -84.536095 },
  'MN': { lat: 45.694454, lng: -93.900192 },
  'MS': { lat: 32.741646, lng: -89.678696 },
  'MO': { lat: 38.456085, lng: -92.288368 },
  'MT': { lat: 46.921925, lng: -110.454353 },
  'NE': { lat: 41.125370, lng: -98.268082 },
  'NV': { lat: 38.313515, lng: -117.055374 },
  'NH': { lat: 43.452492, lng: -71.563896 },
  'NJ': { lat: 40.298904, lng: -74.521011 },
  'NM': { lat: 34.840515, lng: -106.248482 },
  'NY': { lat: 42.165726, lng: -74.948051 },
  'NC': { lat: 35.630066, lng: -79.806419 },
  'ND': { lat: 47.528912, lng: -99.784012 },
  'OH': { lat: 40.388783, lng: -82.764915 },
  'OK': { lat: 35.565342, lng: -96.928917 },
  'OR': { lat: 44.572021, lng: -122.070938 },
  'PA': { lat: 40.590752, lng: -77.209755 },
  'RI': { lat: 41.680893, lng: -71.511780 },
  'SC': { lat: 33.856892, lng: -80.945007 },
  'SD': { lat: 44.299782, lng: -99.438828 },
  'TN': { lat: 35.747845, lng: -86.692345 },
  'TX': { lat: 31.054487, lng: -97.563461 },
  'UT': { lat: 40.150032, lng: -111.862434 },
  'VT': { lat: 44.045876, lng: -72.710686 },
  'VA': { lat: 37.769337, lng: -78.169968 },
  'WA': { lat: 47.400902, lng: -121.490494 },
  'WV': { lat: 38.491226, lng: -80.954453 },
  'WI': { lat: 44.268543, lng: -89.616508 },
  'WY': { lat: 42.755966, lng: -107.302490 },
  'DC': { lat: 38.897438, lng: -77.026817 },
};

// State name to code mapping
export const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'district of columbia': 'DC',
};

// Major US cities with coordinates (top 300+ cities by population)
export const US_CITIES: CityCoordinate[] = [
  // Top 50 cities by population
  { city: 'New York', state: 'New York', stateCode: 'NY', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'California', stateCode: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'Illinois', stateCode: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'Texas', stateCode: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', state: 'Texas', stateCode: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'San Diego', state: 'California', stateCode: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Dallas', state: 'Texas', stateCode: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'San Jose', state: 'California', stateCode: 'CA', lat: 37.3382, lng: -121.8863 },
  { city: 'Austin', state: 'Texas', stateCode: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Jacksonville', state: 'Florida', stateCode: 'FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Fort Worth', state: 'Texas', stateCode: 'TX', lat: 32.7555, lng: -97.3308 },
  { city: 'Columbus', state: 'Ohio', stateCode: 'OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Charlotte', state: 'North Carolina', stateCode: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'San Francisco', state: 'California', stateCode: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'Indianapolis', state: 'Indiana', stateCode: 'IN', lat: 39.7684, lng: -86.1581 },
  { city: 'Seattle', state: 'Washington', stateCode: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', state: 'Colorado', stateCode: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Washington', state: 'District of Columbia', stateCode: 'DC', lat: 38.9072, lng: -77.0369 },
  { city: 'Boston', state: 'Massachusetts', stateCode: 'MA', lat: 42.3601, lng: -71.0589 },
  { city: 'El Paso', state: 'Texas', stateCode: 'TX', lat: 31.7619, lng: -106.4850 },
  { city: 'Nashville', state: 'Tennessee', stateCode: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Detroit', state: 'Michigan', stateCode: 'MI', lat: 42.3314, lng: -83.0458 },
  { city: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK', lat: 35.4676, lng: -97.5164 },
  { city: 'Portland', state: 'Oregon', stateCode: 'OR', lat: 45.5152, lng: -122.6784 },
  { city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', lat: 36.1699, lng: -115.1398 },
  { city: 'Memphis', state: 'Tennessee', stateCode: 'TN', lat: 35.1495, lng: -90.0490 },
  { city: 'Louisville', state: 'Kentucky', stateCode: 'KY', lat: 38.2527, lng: -85.7585 },
  { city: 'Baltimore', state: 'Maryland', stateCode: 'MD', lat: 39.2904, lng: -76.6122 },
  { city: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', lat: 43.0389, lng: -87.9065 },
  { city: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', lat: 35.0844, lng: -106.6504 },
  { city: 'Tucson', state: 'Arizona', stateCode: 'AZ', lat: 32.2226, lng: -110.9747 },
  { city: 'Fresno', state: 'California', stateCode: 'CA', lat: 36.7378, lng: -119.7871 },
  { city: 'Mesa', state: 'Arizona', stateCode: 'AZ', lat: 33.4152, lng: -111.8315 },
  { city: 'Sacramento', state: 'California', stateCode: 'CA', lat: 38.5816, lng: -121.4944 },
  { city: 'Atlanta', state: 'Georgia', stateCode: 'GA', lat: 33.7490, lng: -84.3880 },
  { city: 'Kansas City', state: 'Missouri', stateCode: 'MO', lat: 39.0997, lng: -94.5786 },
  { city: 'Colorado Springs', state: 'Colorado', stateCode: 'CO', lat: 38.8339, lng: -104.8214 },
  { city: 'Omaha', state: 'Nebraska', stateCode: 'NE', lat: 41.2565, lng: -95.9345 },
  { city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', lat: 35.7796, lng: -78.6382 },
  { city: 'Miami', state: 'Florida', stateCode: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Long Beach', state: 'California', stateCode: 'CA', lat: 33.7701, lng: -118.1937 },
  { city: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', lat: 36.8529, lng: -75.9780 },
  { city: 'Oakland', state: 'California', stateCode: 'CA', lat: 37.8044, lng: -122.2712 },
  { city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', lat: 44.9778, lng: -93.2650 },
  { city: 'Tulsa', state: 'Oklahoma', stateCode: 'OK', lat: 36.1540, lng: -95.9928 },
  { city: 'Tampa', state: 'Florida', stateCode: 'FL', lat: 27.9506, lng: -82.4572 },
  { city: 'Arlington', state: 'Texas', stateCode: 'TX', lat: 32.7357, lng: -97.1081 },
  { city: 'New Orleans', state: 'Louisiana', stateCode: 'LA', lat: 29.9511, lng: -90.0715 },
  
  // Additional major cities (51-150)
  { city: 'Wichita', state: 'Kansas', stateCode: 'KS', lat: 37.6872, lng: -97.3301 },
  { city: 'Cleveland', state: 'Ohio', stateCode: 'OH', lat: 41.4993, lng: -81.6944 },
  { city: 'Bakersfield', state: 'California', stateCode: 'CA', lat: 35.3733, lng: -119.0187 },
  { city: 'Aurora', state: 'Colorado', stateCode: 'CO', lat: 39.7294, lng: -104.8319 },
  { city: 'Anaheim', state: 'California', stateCode: 'CA', lat: 33.8366, lng: -117.9143 },
  { city: 'Honolulu', state: 'Hawaii', stateCode: 'HI', lat: 21.3069, lng: -157.8583 },
  { city: 'Santa Ana', state: 'California', stateCode: 'CA', lat: 33.7455, lng: -117.8677 },
  { city: 'Riverside', state: 'California', stateCode: 'CA', lat: 33.9533, lng: -117.3962 },
  { city: 'Corpus Christi', state: 'Texas', stateCode: 'TX', lat: 27.8006, lng: -97.3964 },
  { city: 'Lexington', state: 'Kentucky', stateCode: 'KY', lat: 38.0406, lng: -84.5037 },
  { city: 'Henderson', state: 'Nevada', stateCode: 'NV', lat: 36.0395, lng: -114.9817 },
  { city: 'Stockton', state: 'California', stateCode: 'CA', lat: 37.9577, lng: -121.2908 },
  { city: 'Saint Paul', state: 'Minnesota', stateCode: 'MN', lat: 44.9537, lng: -93.0900 },
  { city: 'Cincinnati', state: 'Ohio', stateCode: 'OH', lat: 39.1031, lng: -84.5120 },
  { city: 'St. Louis', state: 'Missouri', stateCode: 'MO', lat: 38.6270, lng: -90.1994 },
  { city: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA', lat: 40.4406, lng: -79.9959 },
  { city: 'Greensboro', state: 'North Carolina', stateCode: 'NC', lat: 36.0726, lng: -79.7920 },
  { city: 'Lincoln', state: 'Nebraska', stateCode: 'NE', lat: 40.8258, lng: -96.6852 },
  { city: 'Anchorage', state: 'Alaska', stateCode: 'AK', lat: 61.2181, lng: -149.9003 },
  { city: 'Plano', state: 'Texas', stateCode: 'TX', lat: 33.0198, lng: -96.6989 },
  { city: 'Orlando', state: 'Florida', stateCode: 'FL', lat: 28.5383, lng: -81.3792 },
  { city: 'Irvine', state: 'California', stateCode: 'CA', lat: 33.6846, lng: -117.8265 },
  { city: 'Newark', state: 'New Jersey', stateCode: 'NJ', lat: 40.7357, lng: -74.1724 },
  { city: 'Durham', state: 'North Carolina', stateCode: 'NC', lat: 35.9940, lng: -78.8986 },
  { city: 'Chula Vista', state: 'California', stateCode: 'CA', lat: 32.6401, lng: -117.0842 },
  { city: 'Toledo', state: 'Ohio', stateCode: 'OH', lat: 41.6528, lng: -83.5379 },
  { city: 'Fort Wayne', state: 'Indiana', stateCode: 'IN', lat: 41.0793, lng: -85.1394 },
  { city: 'St. Petersburg', state: 'Florida', stateCode: 'FL', lat: 27.7676, lng: -82.6403 },
  { city: 'Laredo', state: 'Texas', stateCode: 'TX', lat: 27.5306, lng: -99.4803 },
  { city: 'Jersey City', state: 'New Jersey', stateCode: 'NJ', lat: 40.7282, lng: -74.0776 },
  { city: 'Chandler', state: 'Arizona', stateCode: 'AZ', lat: 33.3062, lng: -111.8413 },
  { city: 'Madison', state: 'Wisconsin', stateCode: 'WI', lat: 43.0731, lng: -89.4012 },
  { city: 'Lubbock', state: 'Texas', stateCode: 'TX', lat: 33.5779, lng: -101.8552 },
  { city: 'Scottsdale', state: 'Arizona', stateCode: 'AZ', lat: 33.4942, lng: -111.9261 },
  { city: 'Reno', state: 'Nevada', stateCode: 'NV', lat: 39.5296, lng: -119.8138 },
  { city: 'Buffalo', state: 'New York', stateCode: 'NY', lat: 42.8864, lng: -78.8784 },
  { city: 'Gilbert', state: 'Arizona', stateCode: 'AZ', lat: 33.3528, lng: -111.7890 },
  { city: 'Glendale', state: 'Arizona', stateCode: 'AZ', lat: 33.5387, lng: -112.1860 },
  { city: 'North Las Vegas', state: 'Nevada', stateCode: 'NV', lat: 36.1989, lng: -115.1175 },
  { city: 'Winston-Salem', state: 'North Carolina', stateCode: 'NC', lat: 36.0999, lng: -80.2442 },
  { city: 'Chesapeake', state: 'Virginia', stateCode: 'VA', lat: 36.7682, lng: -76.2875 },
  { city: 'Norfolk', state: 'Virginia', stateCode: 'VA', lat: 36.8508, lng: -76.2859 },
  { city: 'Fremont', state: 'California', stateCode: 'CA', lat: 37.5485, lng: -121.9886 },
  { city: 'Garland', state: 'Texas', stateCode: 'TX', lat: 32.9126, lng: -96.6389 },
  { city: 'Irving', state: 'Texas', stateCode: 'TX', lat: 32.8140, lng: -96.9489 },
  { city: 'Hialeah', state: 'Florida', stateCode: 'FL', lat: 25.8576, lng: -80.2781 },
  { city: 'Richmond', state: 'Virginia', stateCode: 'VA', lat: 37.5407, lng: -77.4360 },
  { city: 'Boise', state: 'Idaho', stateCode: 'ID', lat: 43.6150, lng: -116.2023 },
  { city: 'Spokane', state: 'Washington', stateCode: 'WA', lat: 47.6588, lng: -117.4260 },
  { city: 'Baton Rouge', state: 'Louisiana', stateCode: 'LA', lat: 30.4515, lng: -91.1871 },
  
  // More cities (151-300+)
  { city: 'Tacoma', state: 'Washington', stateCode: 'WA', lat: 47.2529, lng: -122.4443 },
  { city: 'San Bernardino', state: 'California', stateCode: 'CA', lat: 34.1083, lng: -117.2898 },
  { city: 'Modesto', state: 'California', stateCode: 'CA', lat: 37.6391, lng: -120.9969 },
  { city: 'Fontana', state: 'California', stateCode: 'CA', lat: 34.0922, lng: -117.4350 },
  { city: 'Des Moines', state: 'Iowa', stateCode: 'IA', lat: 41.5868, lng: -93.6250 },
  { city: 'Moreno Valley', state: 'California', stateCode: 'CA', lat: 33.9425, lng: -117.2297 },
  { city: 'Santa Clarita', state: 'California', stateCode: 'CA', lat: 34.3917, lng: -118.5426 },
  { city: 'Fayetteville', state: 'North Carolina', stateCode: 'NC', lat: 35.0527, lng: -78.8784 },
  { city: 'Birmingham', state: 'Alabama', stateCode: 'AL', lat: 33.5207, lng: -86.8025 },
  { city: 'Oxnard', state: 'California', stateCode: 'CA', lat: 34.1975, lng: -119.1771 },
  { city: 'Rochester', state: 'New York', stateCode: 'NY', lat: 43.1566, lng: -77.6088 },
  { city: 'Port St. Lucie', state: 'Florida', stateCode: 'FL', lat: 27.2730, lng: -80.3582 },
  { city: 'Grand Rapids', state: 'Michigan', stateCode: 'MI', lat: 42.9634, lng: -85.6681 },
  { city: 'Huntsville', state: 'Alabama', stateCode: 'AL', lat: 34.7304, lng: -86.5861 },
  { city: 'Salt Lake City', state: 'Utah', stateCode: 'UT', lat: 40.7608, lng: -111.8910 },
  { city: 'Frisco', state: 'Texas', stateCode: 'TX', lat: 33.1507, lng: -96.8236 },
  { city: 'Yonkers', state: 'New York', stateCode: 'NY', lat: 40.9312, lng: -73.8987 },
  { city: 'Amarillo', state: 'Texas', stateCode: 'TX', lat: 35.2220, lng: -101.8313 },
  { city: 'Glendale', state: 'California', stateCode: 'CA', lat: 34.1425, lng: -118.2551 },
  { city: 'Huntington Beach', state: 'California', stateCode: 'CA', lat: 33.6595, lng: -117.9988 },
  { city: 'McKinney', state: 'Texas', stateCode: 'TX', lat: 33.1972, lng: -96.6397 },
  { city: 'Montgomery', state: 'Alabama', stateCode: 'AL', lat: 32.3792, lng: -86.3077 },
  { city: 'Augusta', state: 'Georgia', stateCode: 'GA', lat: 33.4735, lng: -82.0105 },
  { city: 'Aurora', state: 'Illinois', stateCode: 'IL', lat: 41.7606, lng: -88.3201 },
  { city: 'Akron', state: 'Ohio', stateCode: 'OH', lat: 41.0814, lng: -81.5190 },
  { city: 'Little Rock', state: 'Arkansas', stateCode: 'AR', lat: 34.7465, lng: -92.2896 },
  { city: 'Tempe', state: 'Arizona', stateCode: 'AZ', lat: 33.4255, lng: -111.9400 },
  { city: 'Columbus', state: 'Georgia', stateCode: 'GA', lat: 32.4610, lng: -84.9877 },
  { city: 'Overland Park', state: 'Kansas', stateCode: 'KS', lat: 38.9822, lng: -94.6708 },
  { city: 'Grand Prairie', state: 'Texas', stateCode: 'TX', lat: 32.7460, lng: -96.9978 },
  { city: 'Tallahassee', state: 'Florida', stateCode: 'FL', lat: 30.4383, lng: -84.2807 },
  { city: 'Cape Coral', state: 'Florida', stateCode: 'FL', lat: 26.5629, lng: -81.9495 },
  { city: 'Mobile', state: 'Alabama', stateCode: 'AL', lat: 30.6954, lng: -88.0399 },
  { city: 'Knoxville', state: 'Tennessee', stateCode: 'TN', lat: 35.9606, lng: -83.9207 },
  { city: 'Shreveport', state: 'Louisiana', stateCode: 'LA', lat: 32.5252, lng: -93.7502 },
  { city: 'Worcester', state: 'Massachusetts', stateCode: 'MA', lat: 42.2626, lng: -71.8023 },
  { city: 'Ontario', state: 'California', stateCode: 'CA', lat: 34.0633, lng: -117.6509 },
  { city: 'Providence', state: 'Rhode Island', stateCode: 'RI', lat: 41.8240, lng: -71.4128 },
  { city: 'Peoria', state: 'Arizona', stateCode: 'AZ', lat: 33.5806, lng: -112.2374 },
  { city: 'Vancouver', state: 'Washington', stateCode: 'WA', lat: 45.6387, lng: -122.6615 },
  { city: 'Sioux Falls', state: 'South Dakota', stateCode: 'SD', lat: 43.5446, lng: -96.7311 },
  { city: 'Chattanooga', state: 'Tennessee', stateCode: 'TN', lat: 35.0456, lng: -85.3097 },
  { city: 'Brownsville', state: 'Texas', stateCode: 'TX', lat: 25.9017, lng: -97.4975 },
  { city: 'Fort Lauderdale', state: 'Florida', stateCode: 'FL', lat: 26.1224, lng: -80.1373 },
  { city: 'Elk Grove', state: 'California', stateCode: 'CA', lat: 38.4088, lng: -121.3716 },
  { city: 'Eugene', state: 'Oregon', stateCode: 'OR', lat: 44.0521, lng: -123.0868 },
  { city: 'Salem', state: 'Oregon', stateCode: 'OR', lat: 44.9429, lng: -123.0351 },
  { city: 'Cary', state: 'North Carolina', stateCode: 'NC', lat: 35.7915, lng: -78.7811 },
  { city: 'Fort Collins', state: 'Colorado', stateCode: 'CO', lat: 40.5853, lng: -105.0844 },
  { city: 'Corona', state: 'California', stateCode: 'CA', lat: 33.8753, lng: -117.5664 },
  { city: 'Springfield', state: 'Missouri', stateCode: 'MO', lat: 37.2090, lng: -93.2923 },
  { city: 'Pembroke Pines', state: 'Florida', stateCode: 'FL', lat: 26.0128, lng: -80.2239 },
  { city: 'Lancaster', state: 'California', stateCode: 'CA', lat: 34.6868, lng: -118.1542 },
  { city: 'Palmdale', state: 'California', stateCode: 'CA', lat: 34.5794, lng: -118.1165 },
  { city: 'Salinas', state: 'California', stateCode: 'CA', lat: 36.6777, lng: -121.6555 },
  { city: 'Pomona', state: 'California', stateCode: 'CA', lat: 34.0551, lng: -117.7500 },
  { city: 'Hayward', state: 'California', stateCode: 'CA', lat: 37.6688, lng: -122.0808 },
  { city: 'Escondido', state: 'California', stateCode: 'CA', lat: 33.1192, lng: -117.0864 },
  { city: 'Sunnyvale', state: 'California', stateCode: 'CA', lat: 37.3688, lng: -122.0363 },
  { city: 'Alexandria', state: 'Virginia', stateCode: 'VA', lat: 38.8048, lng: -77.0469 },
  { city: 'Kansas City', state: 'Kansas', stateCode: 'KS', lat: 39.1141, lng: -94.6275 },
  { city: 'Hollywood', state: 'Florida', stateCode: 'FL', lat: 26.0112, lng: -80.1495 },
  { city: 'Clarksville', state: 'Tennessee', stateCode: 'TN', lat: 36.5298, lng: -87.3595 },
  { city: 'Torrance', state: 'California', stateCode: 'CA', lat: 33.8358, lng: -118.3406 },
  { city: 'Rockford', state: 'Illinois', stateCode: 'IL', lat: 42.2711, lng: -89.0940 },
  { city: 'Naperville', state: 'Illinois', stateCode: 'IL', lat: 41.7508, lng: -88.1535 },
  { city: 'Joliet', state: 'Illinois', stateCode: 'IL', lat: 41.5250, lng: -88.0817 },
  { city: 'Paterson', state: 'New Jersey', stateCode: 'NJ', lat: 40.9168, lng: -74.1718 },
  { city: 'Savannah', state: 'Georgia', stateCode: 'GA', lat: 32.0809, lng: -81.0912 },
  { city: 'Bridgeport', state: 'Connecticut', stateCode: 'CT', lat: 41.1792, lng: -73.1894 },
  { city: 'Mesquite', state: 'Texas', stateCode: 'TX', lat: 32.7668, lng: -96.5992 },
  { city: 'Killeen', state: 'Texas', stateCode: 'TX', lat: 31.1171, lng: -97.7278 },
  { city: 'Syracuse', state: 'New York', stateCode: 'NY', lat: 43.0481, lng: -76.1474 },
  { city: 'McAllen', state: 'Texas', stateCode: 'TX', lat: 26.2034, lng: -98.2300 },
  { city: 'Pasadena', state: 'Texas', stateCode: 'TX', lat: 29.6911, lng: -95.2091 },
  { city: 'Bellevue', state: 'Washington', stateCode: 'WA', lat: 47.6101, lng: -122.2015 },
  { city: 'Fullerton', state: 'California', stateCode: 'CA', lat: 33.8703, lng: -117.9242 },
  { city: 'Orange', state: 'California', stateCode: 'CA', lat: 33.7879, lng: -117.8531 },
  { city: 'Dayton', state: 'Ohio', stateCode: 'OH', lat: 39.7589, lng: -84.1916 },
  { city: 'Miramar', state: 'Florida', stateCode: 'FL', lat: 25.9873, lng: -80.2322 },
  { city: 'Thornton', state: 'Colorado', stateCode: 'CO', lat: 39.8680, lng: -104.9719 },
  { city: 'West Valley City', state: 'Utah', stateCode: 'UT', lat: 40.6916, lng: -112.0011 },
  { city: 'Olathe', state: 'Kansas', stateCode: 'KS', lat: 38.8814, lng: -94.8191 },
  { city: 'Hampton', state: 'Virginia', stateCode: 'VA', lat: 37.0299, lng: -76.3452 },
  { city: 'Warren', state: 'Michigan', stateCode: 'MI', lat: 42.5145, lng: -83.0147 },
  { city: 'Midland', state: 'Texas', stateCode: 'TX', lat: 31.9973, lng: -102.0779 },
  { city: 'Waco', state: 'Texas', stateCode: 'TX', lat: 31.5493, lng: -97.1467 },
  { city: 'Sterling Heights', state: 'Michigan', stateCode: 'MI', lat: 42.5803, lng: -83.0302 },
  { city: 'Visalia', state: 'California', stateCode: 'CA', lat: 36.3302, lng: -119.2921 },
  { city: 'Gainesville', state: 'Florida', stateCode: 'FL', lat: 29.6516, lng: -82.3248 },
  { city: 'Carrollton', state: 'Texas', stateCode: 'TX', lat: 32.9537, lng: -96.8903 },
  { city: 'Coral Springs', state: 'Florida', stateCode: 'FL', lat: 26.2712, lng: -80.2706 },
  { city: 'Cedar Rapids', state: 'Iowa', stateCode: 'IA', lat: 41.9779, lng: -91.6656 },
  { city: 'New Haven', state: 'Connecticut', stateCode: 'CT', lat: 41.3083, lng: -72.9279 },
  { city: 'Stamford', state: 'Connecticut', stateCode: 'CT', lat: 41.0534, lng: -73.5387 },
  { city: 'Elizabeth', state: 'New Jersey', stateCode: 'NJ', lat: 40.6640, lng: -74.2107 },
  { city: 'Concord', state: 'California', stateCode: 'CA', lat: 37.9780, lng: -122.0311 },
  { city: 'Thousand Oaks', state: 'California', stateCode: 'CA', lat: 34.1706, lng: -118.8376 },
  { city: 'Abilene', state: 'Texas', stateCode: 'TX', lat: 32.4487, lng: -99.7331 },
  { city: 'Simi Valley', state: 'California', stateCode: 'CA', lat: 34.2694, lng: -118.7815 },
  { city: 'Topeka', state: 'Kansas', stateCode: 'KS', lat: 39.0473, lng: -95.6752 },
  { city: 'Columbia', state: 'South Carolina', stateCode: 'SC', lat: 34.0007, lng: -81.0348 },
  { city: 'Hartford', state: 'Connecticut', stateCode: 'CT', lat: 41.7658, lng: -72.6734 },
  { city: 'Kent', state: 'Washington', stateCode: 'WA', lat: 47.3809, lng: -122.2348 },
  { city: 'Victorville', state: 'California', stateCode: 'CA', lat: 34.5362, lng: -117.2928 },
  { city: 'Lakeland', state: 'Florida', stateCode: 'FL', lat: 28.0395, lng: -81.9498 },
  { city: 'Ann Arbor', state: 'Michigan', stateCode: 'MI', lat: 42.2808, lng: -83.7430 },
  { city: 'El Monte', state: 'California', stateCode: 'CA', lat: 34.0686, lng: -118.0276 },
  { city: 'Fargo', state: 'North Dakota', stateCode: 'ND', lat: 46.8772, lng: -96.7898 },
  { city: 'Denton', state: 'Texas', stateCode: 'TX', lat: 33.2148, lng: -97.1331 },
  { city: 'Provo', state: 'Utah', stateCode: 'UT', lat: 40.2338, lng: -111.6585 },
  { city: 'Pearland', state: 'Texas', stateCode: 'TX', lat: 29.5636, lng: -95.2860 },
  { city: 'Downey', state: 'California', stateCode: 'CA', lat: 33.9401, lng: -118.1332 },
  { city: 'Wilmington', state: 'North Carolina', stateCode: 'NC', lat: 34.2257, lng: -77.9447 },
  { city: 'Norman', state: 'Oklahoma', stateCode: 'OK', lat: 35.2226, lng: -97.4395 },
  { city: 'Berkeley', state: 'California', stateCode: 'CA', lat: 37.8716, lng: -122.2727 },
  { city: 'Round Rock', state: 'Texas', stateCode: 'TX', lat: 30.5083, lng: -97.6789 },
  { city: 'Arvada', state: 'Colorado', stateCode: 'CO', lat: 39.8028, lng: -105.0875 },
  { city: 'Clearwater', state: 'Florida', stateCode: 'FL', lat: 27.9659, lng: -82.8001 },
  { city: 'El Cajon', state: 'California', stateCode: 'CA', lat: 32.7948, lng: -116.9625 },
  { city: 'Richardson', state: 'Texas', stateCode: 'TX', lat: 32.9483, lng: -96.7299 },
  { city: 'Pueblo', state: 'Colorado', stateCode: 'CO', lat: 38.2544, lng: -104.6091 },
  { city: 'West Jordan', state: 'Utah', stateCode: 'UT', lat: 40.6097, lng: -111.9391 },
  { city: 'Billings', state: 'Montana', stateCode: 'MT', lat: 45.7833, lng: -108.5007 },
  { city: 'Miami Gardens', state: 'Florida', stateCode: 'FL', lat: 25.9420, lng: -80.2456 },
  { city: 'Broken Arrow', state: 'Oklahoma', stateCode: 'OK', lat: 36.0609, lng: -95.7975 },
  { city: 'Inglewood', state: 'California', stateCode: 'CA', lat: 33.9617, lng: -118.3531 },
  { city: 'Fairfield', state: 'California', stateCode: 'CA', lat: 38.2494, lng: -122.0400 },
  { city: 'Elgin', state: 'Illinois', stateCode: 'IL', lat: 42.0354, lng: -88.2826 },
  { city: 'Murfreesboro', state: 'Tennessee', stateCode: 'TN', lat: 35.8456, lng: -86.3903 },
  { city: 'Carlsbad', state: 'California', stateCode: 'CA', lat: 33.1581, lng: -117.3506 },
  { city: 'Costa Mesa', state: 'California', stateCode: 'CA', lat: 33.6412, lng: -117.9187 },
  { city: 'Temecula', state: 'California', stateCode: 'CA', lat: 33.4936, lng: -117.1484 },
  { city: 'South Bend', state: 'Indiana', stateCode: 'IN', lat: 41.6834, lng: -86.2520 },
  { city: 'Odessa', state: 'Texas', stateCode: 'TX', lat: 31.8457, lng: -102.3676 },
  { city: 'High Point', state: 'North Carolina', stateCode: 'NC', lat: 35.9557, lng: -80.0053 },
  { city: 'Waterbury', state: 'Connecticut', stateCode: 'CT', lat: 41.5582, lng: -73.0515 },
  { city: 'Everett', state: 'Washington', stateCode: 'WA', lat: 47.9790, lng: -122.2021 },
  { city: 'Westminster', state: 'Colorado', stateCode: 'CO', lat: 39.8367, lng: -105.0372 },
  { city: 'San Buenaventura', state: 'California', stateCode: 'CA', lat: 34.2746, lng: -119.2290 },
  { city: 'Ventura', state: 'California', stateCode: 'CA', lat: 34.2746, lng: -119.2290 },
  { city: 'West Covina', state: 'California', stateCode: 'CA', lat: 34.0686, lng: -117.9394 },
  { city: 'Antioch', state: 'California', stateCode: 'CA', lat: 38.0049, lng: -121.8058 },
  { city: 'Lowell', state: 'Massachusetts', stateCode: 'MA', lat: 42.6334, lng: -71.3162 },
  { city: 'Manchester', state: 'New Hampshire', stateCode: 'NH', lat: 42.9956, lng: -71.4548 },
  { city: 'Centennial', state: 'Colorado', stateCode: 'CO', lat: 39.5807, lng: -104.8772 },
  { city: 'Peoria', state: 'Illinois', stateCode: 'IL', lat: 40.6936, lng: -89.5890 },
  { city: 'Lewisville', state: 'Texas', stateCode: 'TX', lat: 33.0462, lng: -96.9942 },
  { city: 'Surprise', state: 'Arizona', stateCode: 'AZ', lat: 33.6292, lng: -112.3679 },
  { city: 'Murrieta', state: 'California', stateCode: 'CA', lat: 33.5539, lng: -117.2139 },
  { city: 'League City', state: 'Texas', stateCode: 'TX', lat: 29.5075, lng: -95.0949 },
  { city: 'Palm Bay', state: 'Florida', stateCode: 'FL', lat: 28.0345, lng: -80.5887 },
  { city: 'Goodyear', state: 'Arizona', stateCode: 'AZ', lat: 33.4353, lng: -112.3583 },
  { city: 'Menifee', state: 'California', stateCode: 'CA', lat: 33.6971, lng: -117.1850 },
  { city: 'Buckeye', state: 'Arizona', stateCode: 'AZ', lat: 33.3703, lng: -112.5838 },
];

// Create lookup maps for fast access
const cityLookupMap = new Map<string, CityCoordinate>();
const stateLookupMap = new Map<string, CityCoordinate[]>();

// Build lookup maps
US_CITIES.forEach(city => {
  // Key by lowercase "city, state" and "city, stateCode"
  const key1 = `${city.city.toLowerCase()}, ${city.state.toLowerCase()}`;
  const key2 = `${city.city.toLowerCase()}, ${city.stateCode.toLowerCase()}`;
  cityLookupMap.set(key1, city);
  cityLookupMap.set(key2, city);
  
  // Also index by just city name for approximate matching
  const cityKey = city.city.toLowerCase();
  if (!cityLookupMap.has(cityKey)) {
    cityLookupMap.set(cityKey, city);
  }
  
  // Group by state
  const stateKey = city.stateCode.toLowerCase();
  if (!stateLookupMap.has(stateKey)) {
    stateLookupMap.set(stateKey, []);
  }
  stateLookupMap.get(stateKey)!.push(city);
});

/**
 * Normalize state input to state code
 */
export function normalizeStateCode(stateInput: string): string | null {
  const normalized = stateInput.trim().toLowerCase();
  
  // Check if it's already a state code
  if (normalized.length === 2 && STATE_CENTROIDS[normalized.toUpperCase()]) {
    return normalized.toUpperCase();
  }
  
  // Look up by state name
  return STATE_NAME_TO_CODE[normalized] || null;
}

/**
 * Get coordinates for a city/state combination
 * Returns null if city cannot be found
 */
export function getCityCoordinates(city: string, state: string): CityCoordinate | null {
  const normalizedCity = city.trim().toLowerCase();
  const normalizedState = state.trim().toLowerCase();
  
  // Try exact match with state
  const exactKey = `${normalizedCity}, ${normalizedState}`;
  if (cityLookupMap.has(exactKey)) {
    return cityLookupMap.get(exactKey)!;
  }
  
  // Try with state code
  const stateCode = normalizeStateCode(state);
  if (stateCode) {
    const codeKey = `${normalizedCity}, ${stateCode.toLowerCase()}`;
    if (cityLookupMap.has(codeKey)) {
      return cityLookupMap.get(codeKey)!;
    }
  }
  
  // Try just city name
  if (cityLookupMap.has(normalizedCity)) {
    return cityLookupMap.get(normalizedCity)!;
  }
  
  return null;
}

/**
 * Get state centroid as fallback
 */
export function getStateCentroid(state: string): { lat: number; lng: number } | null {
  const stateCode = normalizeStateCode(state);
  if (stateCode && STATE_CENTROIDS[stateCode]) {
    return STATE_CENTROIDS[stateCode];
  }
  return null;
}

/**
 * Get coordinates with fallback to state centroid
 */
export function getLocationCoordinates(
  city: string | null | undefined,
  state: string | null | undefined
): { lat: number; lng: number; isExact: boolean } | null {
  // Try city first
  if (city && state) {
    const coords = getCityCoordinates(city, state);
    if (coords) {
      return { lat: coords.lat, lng: coords.lng, isExact: true };
    }
  }
  
  // Fall back to state centroid
  if (state) {
    const centroid = getStateCentroid(state);
    if (centroid) {
      return { ...centroid, isExact: false };
    }
  }
  
  return null;
}

/**
 * Get all cities in a state
 */
export function getCitiesInState(state: string): CityCoordinate[] {
  const stateCode = normalizeStateCode(state);
  if (stateCode) {
    return stateLookupMap.get(stateCode.toLowerCase()) || [];
  }
  return [];
}

/**
 * Search cities by name (partial match)
 */
export function searchCities(query: string, limit = 10): CityCoordinate[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  
  const results: CityCoordinate[] = [];
  const seen = new Set<string>();
  
  for (const city of US_CITIES) {
    if (city.city.toLowerCase().includes(normalizedQuery)) {
      const key = `${city.city}-${city.stateCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(city);
        if (results.length >= limit) break;
      }
    }
  }
  
  return results;
}
