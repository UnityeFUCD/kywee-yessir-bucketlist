// Netlify Function: Medal API Proxy
// This proxies requests to Medal's API to avoid CORS issues

const MEDAL_API_KEY = "pub_mH37O0i89YbBWg5ErufcIfmimCYZr9q9";
const MEDAL_USERNAME = "Unitye";

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

  try {
    const limit = event.queryStringParameters?.limit || 12;
    
    // Try with userId parameter (Medal expects numeric ID or username)
    // The API endpoint for latest clips by user
    const apiUrl = `https://developers.medal.tv/v1/latest?userId=${encodeURIComponent(MEDAL_USERNAME)}&limit=${limit}`;
    
    console.log("Fetching Medal clips from:", apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': MEDAL_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log("Medal API response status:", response.status);
    console.log("Medal API response:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("Medal API error:", response.status, responseText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: "Medal API error", 
          status: response.status,
          details: responseText,
          attemptedUrl: apiUrl
        })
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Invalid JSON response", raw: responseText.substring(0, 200) })
      };
    }
    
    // Log what we got
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