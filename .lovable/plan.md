

## OpenWeatherMap Integration for ElevenLabs Voice Agents

### Overview

This plan adds weather lookup capabilities to your ElevenLabs voice agents, allowing applicants to ask about weather conditions during voice conversations. ElevenLabs supports **Server Tools** (webhooks) that agents can call during conversations to fetch real-time data.

---

### How It Works

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        Voice Conversation Flow                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Applicant: "What's the weather like in Dallas?"                       │
│                           │                                             │
│                           ▼                                             │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │              ElevenLabs Voice Agent                         │       │
│   │   - Recognizes weather question                             │       │
│   │   - Converts "Dallas" to coordinates (lat/lon)              │       │
│   │   - Calls configured webhook tool                           │       │
│   └───────────────────────┬─────────────────────────────────────┘       │
│                           │                                             │
│                           ▼                                             │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │        Edge Function: elevenlabs-weather-tool               │       │
│   │   - Receives lat/lon from ElevenLabs                        │       │
│   │   - Calls OpenWeatherMap API                                │       │
│   │   - Returns formatted weather data                          │       │
│   └───────────────────────┬─────────────────────────────────────┘       │
│                           │                                             │
│                           ▼                                             │
│   Agent: "It's currently 72°F in Dallas with partly cloudy skies."     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Steps

#### Step 1: Store API Key as Supabase Secret

Add your OpenWeatherMap API key to Supabase secrets:
- Secret name: `OPENWEATHERMAP_API_KEY`
- This keeps the key secure and accessible only from edge functions

#### Step 2: Create Weather Tool Edge Function

**New file:** `supabase/functions/elevenlabs-weather-tool/index.ts`

This edge function will:
- Accept requests from ElevenLabs agents with latitude/longitude parameters
- Call OpenWeatherMap Current Weather API
- Return structured weather data for the agent to speak

**Key features:**
- Supports both coordinates (lat/lon) and city name lookups
- Returns temperature, conditions, humidity, and wind speed
- Formatted responses optimized for voice output
- Rate limiting to prevent abuse
- Proper error handling with fallback messages

**API endpoint format:**
```
POST /functions/v1/elevenlabs-weather-tool
Body: { "latitude": 32.78, "longitude": -96.80 }
  -or-
Body: { "city": "Dallas, TX" }
```

#### Step 3: Register Function in config.toml

Add the new function to `supabase/config.toml` with JWT verification disabled (ElevenLabs doesn't send auth tokens to webhook tools).

#### Step 4: Configure in ElevenLabs Dashboard

You'll need to configure this webhook tool in the ElevenLabs agent settings:

1. Go to your agent in the ElevenLabs dashboard
2. Navigate to **Tools** section → **Add Tool**
3. Select **Webhook** as Tool Type
4. Configure:
   - **Name:** `get_weather`
   - **Description:** `Gets current weather conditions for a location`
   - **Method:** `POST`
   - **URL:** `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-weather-tool`
5. Add parameters:
   - `latitude` (number): The latitude coordinate
   - `longitude` (number): The longitude coordinate
   - OR `city` (string): City name with optional state/country

#### Step 5: Update Agent System Prompt

Add weather instructions to your agent's system prompt:

```text
You have access to a weather tool. When users ask about weather conditions, 
use the get_weather tool to fetch accurate, real-time data. 

For weather requests:
1. Identify the location the user is asking about
2. Convert the location to coordinates using your geographic knowledge
3. Call get_weather with the latitude and longitude
4. Present the information conversationally, referring to locations by name

Never ask users for coordinates - determine them yourself from location names.
```

---

### Technical Details

#### Edge Function Implementation

```typescript
// supabase/functions/elevenlabs-weather-tool/index.ts

interface WeatherRequest {
  latitude?: number;
  longitude?: number;
  city?: string;
}

interface WeatherResponse {
  location: string;
  temperature: number;
  temperature_unit: string;
  conditions: string;
  humidity: number;
  wind_speed: number;
  wind_unit: string;
  description: string;
}

// Function will:
// 1. Parse lat/lon or city from request
// 2. Call OpenWeatherMap API
// 3. Format response for voice delivery
// 4. Handle errors gracefully
```

#### OpenWeatherMap API Usage

- **Endpoint:** `https://api.openweathermap.org/data/2.5/weather`
- **Parameters:** `lat`, `lon`, `appid`, `units=imperial`
- **Response includes:** temp, conditions, humidity, wind speed

#### Security Considerations

- API key stored securely in Supabase secrets (never exposed to frontend)
- Rate limiting: 60 requests per minute per IP
- JWT verification disabled for ElevenLabs webhook compatibility
- Request validation to prevent abuse

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/elevenlabs-weather-tool/index.ts` | Create | Main weather API edge function |
| `supabase/config.toml` | Modify | Register new function |

---

### After Implementation

Once the code is deployed, you'll need to:

1. **Provide your API key** - I'll securely store your OpenWeatherMap API key
2. **Configure in ElevenLabs** - Add the webhook tool to your agent(s)
3. **Test the integration** - Try asking "What's the weather in Chicago?"

---

### Cost Considerations

**OpenWeatherMap Pricing:**
- **Free tier:** 1,000 calls/day, 60 calls/minute
- Sufficient for typical voice agent usage
- Upgrade available if needed for high-volume deployments

---

### Optional Enhancements (Future)

- Extended forecasts (next 5 days)
- Weather alerts and warnings  
- Historical weather data
- Air quality information
- Clothing/driving recommendations based on conditions

