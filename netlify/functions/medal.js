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
    
    const response = await fetch(
      `https://developers.medal.tv/v1/latest?userName=${encodeURIComponent(MEDAL_USERNAME)}&limit=${limit}`,
      {
        headers: {
          'Authorization': MEDAL_API_KEY
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medal API error:", response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "Medal API error", details: errorText })
      };
    }

    const data = await response.json();
    
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