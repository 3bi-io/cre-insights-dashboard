# Troubleshooting Guide

Common issues and solutions for ATS.me.

## 📋 Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Application Errors](#application-errors)
3. [Performance Issues](#performance-issues)
4. [AI & Scoring Issues](#ai--scoring-issues)
5. [Database Issues](#database-issues)
6. [Deployment Issues](#deployment-issues)
7. [PWA & Offline Issues](#pwa--offline-issues)
8. [Browser Compatibility](#browser-compatibility)
9. [Getting Help](#getting-help)

## 🔐 Authentication Issues

### Can't Log In

**Symptoms:**
- Login button doesn't respond
- "Invalid credentials" error
- Redirect loops

**Solutions:**

1. **Clear browser cache and cookies**
   ```
   Chrome: Settings → Privacy → Clear browsing data
   Firefox: Settings → Privacy → Clear Data
   Safari: Settings → Clear History
   ```

2. **Check email verification**
   - Look for verification email in inbox/spam
   - Click the verification link
   - Request new verification if expired

3. **Reset password**
   - Click "Forgot Password"
   - Check email for reset link
   - Create new password

4. **Disable browser extensions**
   - Try logging in with extensions disabled
   - Particularly ad blockers and privacy extensions

5. **Try incognito/private mode**
   - This helps identify cookie/cache issues

**Still not working?**
- Contact your administrator
- Check if your account is active
- Verify you're using the correct email

### Session Expires Too Quickly

**Symptoms:**
- Logged out frequently
- Have to re-login often

**Solutions:**

1. **Enable "Remember Me"**
   - Check the box on login

2. **Check browser settings**
   - Allow cookies for the site
   - Don't block third-party cookies
   - Don't clear cookies on browser close

3. **Ask admin to adjust session timeout**
   - Default is 30 minutes
   - Can be increased to 24 hours

### Two-Factor Authentication Issues

**Symptoms:**
- 2FA code doesn't work
- Lost authenticator device

**Solutions:**

1. **Time sync issues**
   - Ensure device time is correct
   - Authenticator apps rely on accurate time

2. **Use backup codes**
   - Enter backup code instead of 2FA code
   - Found in your 2FA setup email

3. **Contact administrator**
   - They can temporarily disable 2FA
   - Reset 2FA for your account

## 🐛 Application Errors

### White Screen / Blank Page

**Symptoms:**
- Page loads but shows nothing
- Spinner forever
- Completely blank

**Solutions:**

1. **Hard refresh**
   ```
   Windows/Linux: Ctrl + Shift + R
   Mac: Cmd + Shift + R
   ```

2. **Clear cache**
   - Follow browser-specific instructions above

3. **Check console for errors**
   ```
   Open DevTools:
   Windows/Linux: F12 or Ctrl + Shift + I
   Mac: Cmd + Option + I
   
   Look at Console tab for errors
   ```

4. **Check internet connection**
   - Ensure stable connection
   - Try different network

5. **Try different browser**
   - Isolate browser-specific issues

### "Something Went Wrong" Error

**Symptoms:**
- Generic error message
- Error boundary displayed

**Solutions:**

1. **Reload the page**
   - Often temporary issues

2. **Check error details**
   - Click "Show Details" if available
   - Note the error code

3. **Try the action again**
   - May be transient network issue

4. **Report the error**
   - Use in-app error reporting
   - Include what you were doing

### Actions Don't Save

**Symptoms:**
- Changes revert after refresh
- "Save" button doesn't work
- Updates disappear

**Solutions:**

1. **Check for validation errors**
   - Look for red error messages
   - Ensure required fields filled

2. **Check network tab**
   ```
   DevTools → Network tab
   Look for failed requests (red)
   Check response for error details
   ```

3. **Verify permissions**
   - Ensure you have edit access
   - Check with administrator

4. **Check offline status**
   - May need internet connection
   - Changes will sync when online

## 🐌 Performance Issues

### Slow Loading

**Symptoms:**
- Pages take long to load
- Spinners for extended time
- Laggy interactions

**Solutions:**

1. **Check internet speed**
   - Use speed test website
   - Minimum 5 Mbps recommended

2. **Close unused tabs**
   - Browser tabs consume memory
   - Close unnecessary tabs

3. **Disable browser extensions**
   - Extensions can slow browsing
   - Test with extensions disabled

4. **Clear browser cache**
   - Old cache can cause issues

5. **Check system resources**
   ```
   Windows: Task Manager (Ctrl + Shift + Esc)
   Mac: Activity Monitor
   
   Close memory-intensive apps
   ```

6. **Use recommended browsers**
   - Chrome, Firefox, Edge, Safari (latest)
   - Update to latest version

### Application Freezes

**Symptoms:**
- UI becomes unresponsive
- Can't click anything
- Browser hangs

**Solutions:**

1. **Wait a moment**
   - May be processing large data
   - Look for loading indicators

2. **Close and reopen tab**
   - Don't lose data (should auto-save)

3. **Reduce data loaded**
   - Use filters to show less data
   - Load smaller date ranges

4. **Report if persistent**
   - May be a bug
   - Include steps to reproduce

## 🤖 AI & Scoring Issues

### AI Score Not Generated

**Symptoms:**
- Score shows as "N/A"
- "Analyze" button doesn't work
- Analysis stuck on loading

**Solutions:**

1. **Wait longer**
   - Analysis can take 30-60 seconds
   - Don't refresh during analysis

2. **Check application completeness**
   - Resume must be uploaded
   - Required fields filled

3. **Try manual trigger**
   - Click "Reanalyze" button
   - Wait for completion

4. **Check AI service status**
   - Ask administrator
   - May be temporary outage

5. **Check usage limits**
   - May have hit AI analysis limit
   - Contact administrator

### Inaccurate Scores

**Symptoms:**
- Scores don't match expectations
- Obviously qualified candidates score low
- Concerns seem irrelevant

**Solutions:**

1. **Review job description**
   - Ensure requirements are clear
   - Add specific skills needed
   - Update and reanalyze

2. **Check resume format**
   - AI works best with standard formats
   - PDF or DOCX recommended
   - Avoid images-only resumes

3. **Request reanalysis**
   - Click "Reanalyze"
   - May get better results

4. **Provide feedback**
   - Report inaccurate scores
   - Helps improve AI over time

5. **Use as guidance, not gospel**
   - AI is a tool, not final decision
   - Always review manually

## 🗄️ Database Issues

### Data Not Loading

**Symptoms:**
- Empty lists
- "No data found" everywhere
- Missing information

**Solutions:**

1. **Check filters**
   - Clear all filters
   - Reset to default view

2. **Check permissions**
   - Ensure you have access
   - Contact administrator

3. **Refresh the page**
   - May be stale data

4. **Check date range**
   - May be filtering out data
   - Expand date range

5. **Verify data exists**
   - Ask teammate if they see it
   - May genuinely be no data

### Duplicate Entries

**Symptoms:**
- Same application appears twice
- Duplicate candidates

**Solutions:**

1. **Check if genuinely duplicate**
   - May be different applications
   - Check application IDs

2. **Report to administrator**
   - Can merge duplicates
   - Investigate root cause

3. **Don't create manually**
   - Use import features properly
   - Follow data entry guidelines

### Data Sync Issues

**Symptoms:**
- Changes on one device not on another
- Conflicting data

**Solutions:**

1. **Hard refresh both devices**
   - Ctrl/Cmd + Shift + R

2. **Check internet connection**
   - Both devices need connection

3. **Check timestamp**
   - Most recent change wins

4. **Manually sync**
   - Make change on one device
   - Refresh other device

## 🚀 Deployment Issues

### Build Fails

**Symptoms:**
- Deployment errors
- Build process stops
- Error messages in CI/CD

**Solutions:**

1. **Check error message**
   - Read the full error
   - Often indicates specific issue

2. **Verify dependencies**
   ```bash
   # Clear and reinstall
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

3. **Check environment variables**
   - Ensure all required vars set
   - Verify values are correct

4. **Test build locally**
   ```bash
   npm run build
   ```

5. **Check Node version**
   - Must be 18+ or use Bun
   ```bash
   node --version
   ```

### Production Errors Not in Development

**Symptoms:**
- Works locally, fails in production
- Different behavior

**Solutions:**

1. **Enable debug mode temporarily**
   - Check console logs
   - Look for differences

2. **Check environment variables**
   - Production uses different values
   - Verify API endpoints

3. **Check CORS settings**
   - Production domain allowed
   - API configured correctly

4. **Test production build locally**
   ```bash
   npm run build
   npm run preview
   ```

## 📱 PWA & Offline Issues

### Can't Install App

**Symptoms:**
- No install prompt
- Install button missing

**Solutions:**

1. **Check browser support**
   - Chrome, Edge, Safari supported
   - Update to latest version

2. **Check HTTPS**
   - PWA requires HTTPS
   - Doesn't work on HTTP

3. **Visit from browser, not in-app**
   - Can't install from Instagram, etc.
   - Open in Safari/Chrome directly

4. **Manual install**
   **iPhone/iPad:**
   - Safari → Share → Add to Home Screen
   
   **Android:**
   - Chrome → Menu → Add to Home Screen
   
   **Desktop:**
   - Look for install icon in address bar

### Offline Mode Not Working

**Symptoms:**
- App doesn't work offline
- "No internet" error

**Solutions:**

1. **Install as app first**
   - PWA features require installation

2. **Visit pages while online first**
   - Pages must be cached
   - Can't access never-visited pages offline

3. **Check storage**
   - Device may be low on storage
   - Clear cache of other apps

4. **Update service worker**
   - Online once to update
   - Close and reopen app

### Updates Not Applying

**Symptoms:**
- Old version still showing
- New features not available

**Solutions:**

1. **Hard refresh**
   - Ctrl/Cmd + Shift + R

2. **Clear cache**
   - Browser settings → Clear cache

3. **Uninstall and reinstall**
   - Remove app from device
   - Install fresh from browser

4. **Check for update**
   - Settings → About → Check for Update

## 🌐 Browser Compatibility

### Feature Not Working in Browser

**Symptoms:**
- Works in Chrome, not Safari
- Different appearance
- Missing functionality

**Solutions:**

1. **Update browser**
   - Use latest version
   - Check for updates

2. **Try recommended browser**
   - Chrome (recommended)
   - Firefox
   - Edge
   - Safari (on Mac/iOS)

3. **Check known issues**
   | Browser | Known Issues |
   |---------|-------------|
   | Safari < 15 | Some PWA features limited |
   | IE 11 | Not supported |
   | Old Android Browser | Use Chrome instead |

4. **Report browser-specific issues**
   - Include browser version
   - Include OS version
   - Steps to reproduce

### Styling Looks Wrong

**Symptoms:**
- Layout broken
- Colors wrong
- Overlapping elements

**Solutions:**

1. **Clear cache**
   - Old CSS may be cached

2. **Disable browser zoom**
   - Reset to 100%
   - Ctrl/Cmd + 0

3. **Check viewport size**
   - Resize window
   - Test different sizes

4. **Disable custom fonts**
   - Browser extension may interfere

## 🆘 Getting Help

### Before Contacting Support

1. **Check this guide** - Your issue may be covered

2. **Search existing issues** - Others may have had same problem

3. **Gather information:**
   - Browser and version
   - Operating system
   - Steps to reproduce
   - Screenshots if applicable
   - Error messages (full text)
   - Console logs (if technical)

### How to Get Console Logs

```
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Reproduce the issue
4. Right-click in console
5. "Save as..." to save logs
6. Attach to support request
```

### How to Get Network Logs

```
1. Open DevTools (F12)
2. Go to Network tab
3. Reproduce the issue
4. Right-click on failed request (red)
5. Copy → Copy as cURL
6. Include in support request
```

### Support Channels

**Users:**
- In-app chat support
- Email: support@ats.me
- Response time: 24-48 hours

**Administrators:**
- Priority support: admin-support@ats.me
- Phone: (for enterprise plans)
- Response time: 4 hours

**Developers:**
- GitHub Issues
- Discord community
- Email: dev@ats.me

**Community:**
- Discord: [Join our Discord](https://discord.gg/ats-me)
- Forum: community.ats.me
- Stack Overflow: Tag with `ats-me`

### Creating a Good Bug Report

Include:
1. **Clear title** - Describe the issue
2. **Steps to reproduce** - How to trigger it
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - Browser, OS, etc.
6. **Screenshots** - Visual evidence
7. **Logs** - Console/network logs

**Example:**
```markdown
## Title
Can't save application status change

## Steps to Reproduce
1. Open any application
2. Change status to "Interviewed"
3. Click Save
4. Refresh page

## Expected Behavior
Status should persist as "Interviewed"

## Actual Behavior
Status reverts to previous value

## Environment
- Browser: Chrome 120.0
- OS: macOS 14.0
- User role: Recruiter

## Screenshots
[Attach screenshot]

## Console Logs
[Attach console logs]
```

---

## 🎙️ Voice Agent Issues (ElevenLabs)

### Outbound Calls Not Triggering

**Symptoms:**
- New applications don't receive automated calls
- Voice agent appears inactive

**Solutions:**

1. **Verify voice agent is active**
   - Go to Settings > Voice Agents
   - Ensure `is_active = true`
   - Check agent is linked to correct organization

2. **Confirm phone number configured**
   - Voice agent must have a valid phone number
   - Check phone number format (+1XXXXXXXXXX)

3. **Check outbound_enabled flag**
   - Must be `true` for automatic outbound calls
   - Can be toggled in voice agent settings

4. **Verify application source**
   - Some application sources may not trigger calls
   - Check if source is configured for voice follow-up

### Transcripts Not Loading

**Symptoms:**
- Transcript tab shows empty
- "Loading transcripts..." stuck

**Solutions:**

1. **Wait for call completion**
   - Transcripts only available after call ends
   - Allow 1-2 minutes after call

2. **Check conversation ID**
   - Verify conversation exists in database
   - Check `elevenlabs_conversations` table

3. **Verify ElevenLabs API key**
   - Check API key is valid in secrets
   - Test connection in Settings > Integrations

4. **Review edge function logs**
   - Check `elevenlabs-api` function for errors
   - Look for authentication failures

### Voice Apply Not Working

**Symptoms:**
- Microphone button doesn't respond
- Connection drops immediately
- "Permission denied" error

**Solutions:**

1. **Check browser permissions**
   - Microphone access must be granted
   - Check browser permission settings
   - HTTPS required for microphone access

2. **Verify agent ID configuration**
   - Job must have `voiceAgentId` configured
   - Check job settings for voice agent assignment

3. **Network connectivity**
   - WebRTC requires stable internet
   - Check firewall/VPN settings
   - Try different network

4. **Review console logs**
   - Open DevTools (F12)
   - Check for WebSocket errors
   - Look for connection failures

---

## 🔗 Webhook Issues

### Webhooks Not Firing

**Symptoms:**
- No webhook delivery attempts
- Target system not receiving data

**Solutions:**

1. **Check webhook enabled**
   - Go to Settings > Integrations > Client Webhooks
   - Ensure `enabled = true`

2. **Verify source filter**
   - Webhook `source_filter` must include the application source
   - Common sources: "Direct Application", "ElevenLabs", "Facebook Lead Gen"

3. **Check event types**
   - `event_types` must include relevant events
   - Common events: "created", "updated", "status_changed"

4. **Test webhook URL**
   - Use [webhook.site](https://webhook.site) to test
   - Verify endpoint is publicly accessible
   - Check for HTTPS requirement

5. **Review webhook logs**
   - Check `client_webhook_logs` table
   - Look for delivery attempts and errors

### Invalid Payload Errors

**Symptoms:**
- Webhooks fail with validation errors
- Target server rejects payload

**Solutions:**

1. **Validate webhook URL**
   - Must be valid HTTPS URL
   - No localhost or internal IPs

2. **Check secret key**
   - If configured, receiving server must validate signature
   - Signature is in `X-Webhook-Signature` header

3. **Review payload format**
   - Check `client_webhook_logs.request_payload`
   - Verify target server expects JSON

### Rate Limit Errors (429)

**Symptoms:**
- Bulk export fails
- "Too many requests" error

**Solutions:**

1. **Bulk export limit**
   - Limited to 5 requests per hour per user
   - Wait and retry after 1 hour

2. **Target server limits**
   - External servers may have their own limits
   - Implement backoff strategy

3. **Exponential backoff**
   - Wait longer between retries
   - Start with 1 second, double each attempt

---

## 📝 Application Form Issues

### Applications Not Submitting

**Symptoms:**
- Submit button doesn't respond
- Form validation errors
- Network request fails

**Solutions:**

1. **Check required fields**
   - All required fields must be completed
   - Look for red error messages

2. **Verify network connection**
   - Open DevTools Network tab
   - Check for failed requests

3. **Review validation messages**
   - Toast messages indicate missing/invalid fields
   - Fix each validation error

4. **Check organization**
   - Job listing must have valid organization
   - Contact administrator if issues persist

### URL Parameters Not Captured

**Symptoms:**
- Tracking parameters missing in application
- Attribution data lost

**Solutions:**

1. **Verify parameter names**
   - Use exact names: `job_listing_id`, `campaign_id`, `ad_id`, `adset_id`
   - Parameters are case-insensitive

2. **Check URL encoding**
   - Special characters must be properly encoded
   - Use `encodeURIComponent()` if building URLs

---

## 📡 XML Feed Issues

### Feed Not Updating

**Symptoms:**
- New jobs not appearing in feed
- Stale data in job aggregators

**Solutions:**

1. **Check job status**
   - Only `active` jobs appear in feeds
   - Verify job is published and active

2. **Organization filter**
   - ACME organization jobs excluded from public feeds
   - Check organization settings

3. **Cache duration**
   - Feeds cached for 1 hour
   - Wait for cache expiry or contact admin

### Invalid XML Errors

**Symptoms:**
- Feed parsing fails
- Job aggregators reject feed

**Solutions:**

1. **Check job data**
   - Missing required fields cause errors
   - Ensure title, description, location are filled

2. **Special characters**
   - XML special characters must be escaped
   - Check for `&`, `<`, `>` in text

3. **URL format**
   - All URLs must be properly formatted
   - Must be valid https:// URLs

---

**Still stuck?** Don't hesitate to reach out to support. We're here to help!

For more documentation:
- [User Guide](./USER_GUIDE.md)
- [Admin Guide](./ADMIN_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
