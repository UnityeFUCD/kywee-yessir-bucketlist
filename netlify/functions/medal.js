// Netlify Function: Medal API Proxy
// This proxies requests to Medal's API to avoid CORS issues

const MEDAL_API_KEY = "pub_mH37O0i89YbBWg5ErufcIfmimCYZr9q9";
const MEDAL_USER_ID = "372736732"; // Numeric ID from profile URL

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Validate userId is numeric
  if (!/^\d+$/.test(MEDAL_USER_ID)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid userId - must be numeric" })
    };
  }

  try {
    const limit = event.queryStringParameters?.limit || 12;
    const apiUrl = `https://developers.medal.tv/v1/latest?userId=${MEDAL_USER_ID}&limit=${limit}`;
    
    console.log("Fetching Medal clips from:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': MEDAL_API_KEY,
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Avoid caching issues
    });

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    
    console.log("Medal API status:", response.status);
    console.log("Medal API content-type:", contentType);
    console.log("Medal API response (first 300 chars):", responseText.substring(0, 300));

    // Check if response is actually JSON
    if (!contentType.includes('application/json')) {
      console.error("Medal API returned non-JSON:", contentType);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          error: "Medal API returned non-JSON response",
          contentType: contentType,
          preview: responseText.substring(0, 300)
        })
      };
    }

    if (!response.ok) {
      console.error("Medal API error:", response.status, responseText.substring(0, 300));
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: "Medal API error", 
          status: response.status,
          details: responseText.substring(0, 300)
        })
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Invalid JSON response from Medal", 
          preview: responseText.substring(0, 200) 
        })
      };
    }
    
    console.log("Medal clips found:", data.contentObjects?.length || 0);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("Medal proxy error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};