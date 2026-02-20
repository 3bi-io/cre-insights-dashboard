/**
 * Apply AI Embed Widget Loader
 * 
 * Usage:
 * <div id="apply-widget"></div>
 * <script 
 *   src="https://applyai.jobs/widget.js" 
 *   data-token="your-token-here"
 *   data-container="apply-widget"
 *   async
 * ></script>
 * 
 * Events emitted to parent window:
 * - ats_widget_ready: Widget initialized successfully
 * - ats_widget_resize: Iframe height changed { height: number }
 * - ats_widget_error: Error occurred { error: string }
 * - ats_application_submitted: Form submitted { applicationId: string }
 */
(function() {
  'use strict';

  // Find the script tag that loaded this file
  var script = document.currentScript;
  if (!script) {
    // Fallback for older browsers
    var scripts = document.getElementsByTagName('script');
    script = scripts[scripts.length - 1];
  }

  // Read configuration from data attributes
  var token = script.getAttribute('data-token');
  var containerId = script.getAttribute('data-container') || 'apply-widget';
  var baseUrl = script.getAttribute('data-base-url') || 'https://applyai.jobs';
  var apiUrl = script.getAttribute('data-api-url') || 'https://auwhcdpppldjlcaxzsme.supabase.co';
  var minHeight = parseInt(script.getAttribute('data-min-height') || '600', 10);

  // Validate token
  if (!token) {
    console.error('[Apply AI Widget] Missing required data-token attribute');
    dispatchEvent('ats_widget_error', { error: 'Missing token' });
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var container = document.getElementById(containerId);
    
    if (!container) {
      console.error('[Apply AI Widget] Container element not found:', containerId);
      dispatchEvent('ats_widget_error', { error: 'Container not found: ' + containerId });
      return;
    }

    // Show loading state
    container.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;min-height:' + minHeight + 'px;font-family:system-ui,-apple-system,sans-serif;color:#666;"><div style="text-align:center;"><div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:ats-spin 1s linear infinite;margin:0 auto 16px;"></div><div>Loading application form...</div></div></div><style>@keyframes ats-spin{to{transform:rotate(360deg)}}</style>';

    // Resolve the token
    var resolveUrl = apiUrl + '/functions/v1/resolve-embed-token?token=' + encodeURIComponent(token);
    
    fetch(resolveUrl)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (!data.success || !data.url) {
          throw new Error(data.error || 'Failed to resolve token');
        }

        // Create the iframe
        var iframe = document.createElement('iframe');
        iframe.id = 'ats-embed-frame-' + token.substring(0, 8);
        iframe.src = baseUrl + data.url;
        iframe.style.cssText = 'width:100%;min-height:' + minHeight + 'px;border:none;display:block;';
        iframe.setAttribute('allow', 'camera;microphone');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('title', data.jobTitle ? 'Apply for ' + data.jobTitle : 'Job Application Form');

        // Clear loading state and append iframe
        container.innerHTML = '';
        container.appendChild(iframe);

        // Set up message listener for resize and form events
        window.addEventListener('message', function(event) {
          // Verify origin for security
          if (event.origin !== baseUrl) {
            return;
          }

          var eventData = event.data;
          if (!eventData || typeof eventData !== 'object') {
            return;
          }

          switch (eventData.type) {
            case 'resize':
              if (eventData.height && typeof eventData.height === 'number') {
                iframe.style.height = Math.max(eventData.height, minHeight) + 'px';
                dispatchEvent('ats_widget_resize', { height: eventData.height });
              }
              break;

            case 'application_submitted':
              dispatchEvent('ats_application_submitted', {
                applicationId: eventData.applicationId,
                organizationName: eventData.organizationName
              });
              break;

            case 'form_ready':
              dispatchEvent('ats_widget_ready', {
                clientName: data.clientName,
                jobTitle: data.jobTitle
              });
              break;
          }
        });

        // Also dispatch ready event when iframe loads
        iframe.addEventListener('load', function() {
          dispatchEvent('ats_widget_ready', {
            clientName: data.clientName,
            jobTitle: data.jobTitle
          });
        });

      })
      .catch(function(error) {
        console.error('[Apply AI Widget] Failed to load:', error);
        container.innerHTML = '<div style="padding:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif;color:#dc2626;background:#fef2f2;border-radius:8px;"><strong>Unable to load application form</strong><p style="margin:8px 0 0;color:#666;">Please try refreshing the page or contact support.</p></div>';
        dispatchEvent('ats_widget_error', { error: error.message || 'Unknown error' });
      });
  }

  function dispatchEvent(eventName, detail) {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
    } catch (e) {
      // Fallback for older browsers
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, true, true, detail);
      window.dispatchEvent(event);
    }
  }

})();
