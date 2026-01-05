const OpenAI = require('openai');
const fetch = require("node-fetch");

// Function to get weather forecast for specific dates
const get_weather_forecast = async (location, date) => {
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${location}&dt=${date}&days=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      const forecast = data.forecast.forecastday[0];
      return {
        date: forecast.date,
        condition: forecast.day.condition.text,
        temp: forecast.day.avgtemp_c,
        maxTemp: forecast.day.maxtemp_c,
        minTemp: forecast.day.mintemp_c,
        hours: forecast.hour, // array of hourly data
        okay: forecast.day.condition.text.toLowerCase().includes('sunny') || forecast.day.condition.text.toLowerCase().includes('clear') ? 'okay' : 'not okay'
      };
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Provide a default hour structure
    const defaultHours = [];
    for (let h = 0; h < 24; h++) {
      defaultHours.push({
        time: `${date} ${h.toString().padStart(2, '0')}:00`,
        temp_c: 20, // default temp
        condition: { text: 'Unknown' }
      });
    }
    return {
      date: date,
      condition: 'Error fetching weather',
      temp: 20,
      maxTemp: 25,
      minTemp: 15,
      hours: defaultHours,
      okay: 'not okay'
    };
  }
};

// Function for web search (get place image and title)
const web_search = async (query) => {
  let title = query;
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Provide a catchy title for a tourist destination.' },
          { role: 'user', content: `For "${query}", provide a catchy title.` }
        ]
      });
      title = response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error getting title:', error);
    }
  }
  const imageUrl = `https://source.unsplash.com/random/?${encodeURIComponent(query)}`;
  return { imageUrl, title };
};

// Function to generate trip programs using OpenAI
const generate_trip_programs = async (destination, interests, budget, date, weather) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const weatherInfo = weather.okay === "okay"
    ? `Weather is good (${weather.temp}°C, ${weather.condition}).`
    : `Weather is bad (${weather.temp}°C, ${weather.condition}). Focus on indoor activities.`;

  const prompt = `
You are a travel expert. Create exactly 5 activities for a travel program in ${destination} on ${date}.
Interests: ${interests}
Budget: $${budget}
${weatherInfo}

Return ONLY valid JSON array like this example:

[
  {
    "title": "Nile River Felucca Adventure",
    "time": "8:00 - 10:00",
    "activity": "Short description here...",
    "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
  }
]

Rules:
- The JSON must be VALID and parseable.
- Time must be in 2-hour blocks (08:00 - 10:00, 10:00 - 12:00, etc.).
- Activities must be specific to ${destination}.
- ALL imageUrl must be UNSPLASH direct links:
  Format: "https://source.unsplash.com/1200x800/?${destination},travel"
- No extra text outside JSON.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return ONLY JSON. No explanation." },
        { role: "user", content: prompt }
      ]
    });

    let content = response.choices[0].message.content.trim();

    // Parse JSON safely
    const activities = JSON.parse(content);

    // Add weather info to each activity
    activities.forEach(a => {
      a.weatherOkay = weather.okay === "okay";
      a.temperature = weather.temp;
      if (!a.weatherOkay) a.reason = weather.condition;
    });

    return activities;

  } catch (err) {
    console.error("Error generating trip programs:", err);
    return [
      {
        title: "Local Walking Tour",
        time: "08:00 - 10:00",
        activity: `Enjoy a simple tour around ${destination}`,
        imageUrl: `https://source.unsplash.com/1200x800/?${destination}`,
        weatherOkay: true
      }
    ];
  }
};



// Main search function
async function searchTrip(budget, destination, checkin, checkout, interests) {
  try {
    // Get place info via web search
    const placeInfo = await web_search(`tourist places in ${destination}`);

    // Calculate dates
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const dates = [];
    for (let d = new Date(checkinDate); d <= checkoutDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // Generate trip programs
    const programs = [];
    let dayCount = 1;
    for (const date of dates) {
      const weather = await get_weather_forecast(destination, date);
      const activities = await generate_trip_programs(destination, interests, budget, date, weather);

      const program = {
        day: dayCount,
        date: date,
        activities: activities
      };
      programs.push(program);
      dayCount++;
    }

    return {
      destination: destination,
      budget: budget,
      checkin: checkin,
      checkout: checkout,
      interests: interests,
      imageUrl: placeInfo.imageUrl,
      title: placeInfo.title,
      programs: programs
    };
  } catch (error) {
    console.error('Error in searchTrip:', error);
    throw error;
  }
}

module.exports = {
  searchTrip
};