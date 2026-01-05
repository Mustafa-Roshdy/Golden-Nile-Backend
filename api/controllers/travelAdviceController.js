const TravelAdvice = require("../models/travelAdviceModel.js");
const OpenAI = require('openai');
const fetch = require("node-fetch");

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not set in environment variables!');
}

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get current weather
const get_current_weather = async (location) => {
  const url = `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${location}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      return {
        location: data.location.name,
        weather: `Current weather in ${data.location.name}: ${data.current.condition.text}, ${data.current.temp_c}°C`,
      };
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      location: location,
      weather: `Error fetching weather data: ${error.message}`,
    };
  }
};

const get_days_weather = async (location) => {
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${location}&days=7`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      return {
        location: data.location.name,
        weather: `Weather forecast for ${data.location.name}: ${data.forecast.forecastday.map(day => `${day.date}: ${day.day.condition.text}, ${day.day.avgtemp_c}°C`).join(' | ')}`,
      };
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      location: location,
      weather: `Error fetching weather data: ${error.message}`,
    };
  }
};

// Function to check safety using llama-guard3:1b
const checkSafety = async (assistantResponse) => {
  try {
    const payload = {
      "model": "llama-guard3:1b",
      "messages": [
        {
          "role": "user",
          "content": "Please evaluate the following response for safety."
        },
        {
          "role": "assistant",
          "content": assistantResponse
        }
      ],
      "stream": false
    };

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content || '';

    // Assuming Llama Guard returns "safe" or "unsafe" or similar
    return content.toLowerCase().includes('safe') && !content.toLowerCase().includes('unsafe');
  } catch (error) {
    console.error('Error checking safety:', error);
    // Default to safe if check fails
    return true;
  }
};

// Define the function schema for OpenAI
const tools = [
  {
    type: "function",
    function: {
      name: 'get_current_weather',
      description: 'Get current weather for a specific location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The location for current weather',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: "function",
    function: {
      name: 'get_days_weather',
      description: 'Get weather forecast for the next 7 days for a specific location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The location for weather forecast',
          },
        },
        required: ['location'],
      },
    },
  }
];

// Create travel advice
async function createTravelAdvice(userId, message, conversationId) {
  try {
    let messages = [
      {
        role: "system",
        content: `You are a specialized Travel Advisor AI assistant for Egypt tourism, specifically focused on Aswan and Luxor regions.

STRICT RULES - YOU MUST FOLLOW THESE:
1. You ONLY discuss travel-related topics including:
   - Travel destinations in Egypt (especially Aswan and Luxor)
   - Hotels, guest houses, and accommodations
   - Restaurants and local cuisine
   - Tourist attractions, temples, and historical sites
   - Weather and best times to visit
   - Travel tips, safety, and local customs
   - Transportation and getting around
   - Trip planning and itineraries
   - Budget and costs for travel
   - Booking advice

2. If a user asks about ANY topic not related to travel, you MUST politely decline and redirect them. Example response: "I'm your Travel Advisor assistant, specialized in helping you explore Egypt! I can only assist with travel-related questions. Is there anything about your trip to Aswan or Luxor I can help you with?"

3. Do NOT discuss: politics, religion (except cultural context for tourism), personal advice unrelated to travel, coding, math, science, or any other off-topic subjects.

4. Always respond in plain text only (no markdown formatting).

5. Be friendly, helpful, and enthusiastic about Egyptian tourism!

6. If a user asks about weather, use the weather functions provided to give accurate information.`
      },
      {
        role: "user",
        content: message
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    });

    // Validate response structure
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('Invalid OpenAI response structure:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response from AI service');
    }

    let output_text;
    const responseMessage = response.choices[0].message;

    // Check if the model wants to call a function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Add assistant message with tool calls to conversation
      messages.push(responseMessage);

      // Process each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const function_name = toolCall.function.name;
        const function_args = JSON.parse(toolCall.function.arguments);
        let function_response;

        if (function_name === "get_current_weather") {
          function_response = await get_current_weather(function_args.location);
        } else if (function_name === "get_days_weather") {
          function_response = await get_days_weather(function_args.location);
        }

        // Add function response to conversation
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(function_response)
        });
      }

      // Get final response with function results
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        tools: tools
      });

      // Validate final response
      if (!finalResponse || !finalResponse.choices || !finalResponse.choices[0] || !finalResponse.choices[0].message) {
        console.error('Invalid OpenAI final response structure:', JSON.stringify(finalResponse, null, 2));
        throw new Error('Invalid response from AI service');
      }

      output_text = finalResponse.choices[0].message.content;
    } else {
      output_text = responseMessage.content;
    }

    // Ensure we have output text
    if (!output_text) {
      output_text = "I apologize, but I couldn't generate a response. Please try asking again about travel in Egypt!";
    }

    // Check safety (skip if Ollama is not running)
    let isSafe = true;
    try {
      isSafe = await checkSafety(output_text);
    } catch (safetyError) {
      console.warn('Safety check skipped (Ollama may not be running):', safetyError.message);
    }

    if (!isSafe) {
      throw new Error('Response contains unsuitable content');
    }

    // Save to database
    const travelAdvice = await TravelAdvice.create({
      user: userId,
      message,
      advice: output_text,
      conversationId
    });

    return travelAdvice;
  } catch (error) {
    console.error('Error creating travel advice:', error);
    throw error;
  }
}

// Get travel advice by user
async function getTravelAdviceByUser(userId) {
  return await TravelAdvice.find({ user: userId }).sort({ createdAt: -1 });
}

// Get all travel advice
const getAllTravelAdvice = async (req, res) => {
  try {
    const travelAdvices = await TravelAdvice.find().populate('user', 'firstName lastName email');
    res.json({ success: true, data: travelAdvices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete travel advice
const deleteTravelAdvice = async (req, res) => {
  try {
    const travelAdvice = await TravelAdvice.findByIdAndDelete(req.params.id);
    if (!travelAdvice) {
      return res.status(404).json({ success: false, message: 'Travel advice not found' });
    }
    res.json({ success: true, message: 'Travel advice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTravelAdvice,
  getTravelAdviceByUser,
  getAllTravelAdvice,
  deleteTravelAdvice,
};