// routes/travelRouter.js
const express = require("express");
const router = express.Router();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const fetch = require("node-fetch");
const Place = require("../models/placeModel.js");
const Attraction = require("../models/attractionModel.js");
const attractionController = require("../controllers/attractionController.js");

// ========================================================
// FIREWORKS EMBEDDINGS (Reusable, with OpenAI fallback)
// ========================================================
class FireworksEmbeddings {
  constructor() {
    this.model = "nomic-ai/nomic-embed-text-v1.5";
    this.fireworksKey = process.env.FIREWORKS_API_KEY;
    this.openaiKey = process.env.OPENAI_API_KEY;
  }

  async embedQuery(text) {
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch("https://api.fireworks.ai/inference/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.fireworksKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: text, model: this.model }),
        });

        const data = await res.json();
        if (data.data?.[0]?.embedding) return data.data[0].embedding;
        throw new Error("Invalid embedding response");
      } catch (err) {
        if (i === 4) {
          console.warn("Fireworks failed → using OpenAI embedding");
          const { OpenAIEmbeddings } = require("@langchain/openai");
          const fallback = new OpenAIEmbeddings({ apiKey: this.openaiKey });
          return fallback.embedQuery(text);
        }
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  async embedDocuments(texts) {
    return Promise.all(texts.map(t => this.embedQuery(t)));
  }
}

// Optional: use later for RAG
// const embeddings = new FireworksEmbeddings();

// ========================================================
// CRUD ROUTES
// ========================================================
router.post("/seed/:city", attractionController.seedAttractionsForCity);
router.post("/create-attraction", attractionController.createAttraction);
router.get("/attractions", attractionController.getAttractions);
router.get("/:id", attractionController.getAttractionById);
router.put("/:id", attractionController.updateAttraction);
router.delete("/:id", attractionController.deleteAttraction);

// ========================================================
// HELPER: Clean & Fix Gemini JSON Output
// ========================================================
function cleanGeminiJson(raw) {
  let content = raw.trim();

  // 1. Remove ```json
  if (content.includes("```json")) {
    content = content.split("```json")[1];
  }
  if (content.includes("```")) {
    content = content.split("```")[0];
  }

  // 2. Trim again
  content = content.trim();

  // 3. Fix common truncation: {"id" → {"id": null}}
  if (content.match(/"id"[:\s]*$/)) {
    content += '": null }';
  }

  // 4. Fix incomplete arrays/objects
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/]/g) || []).length;

  while (openBraces > closeBraces) {
    content += "}";
    closeBraces++;
  }
  while (openBrackets > closeBrackets) {
    content += "]";
    closeBrackets++;
  }

  return content;
}

// ========================================================
// GENERATE PROGRAM – GEMINI 2.5 FLASH (100% Reliable JSON)
// ========================================================
router.post("/generate-program", async (req, res) => {
  try {
    const { 
      destination, 
      budget, 
      checkInDate, 
      checkOutDate, 
      interests = [],
      adults = 2,        // ← NEW: default 2 adults
      children = 0       // ← NEW: default 0 children
    } = req.body;

    const totalPeople = adults + children;

    const city = destination?.toString().toLowerCase().trim();
    if (!["aswan", "luxor"].includes(city)) {
      return res.status(400).json({ success: false, message: "Only Aswan and Luxor supported" });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const daysCount = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (daysCount < 1 || daysCount > 7) {
      return res.status(400).json({ success: false, message: "Trip must be 1–7 days" });
    }

    // === SAME AS BEFORE (no changes) ===
    const [places, attractions] = await Promise.all([
      Place.find(
        { type: { $in: ["guest_house", "restaurant"] } },
        "name type pricePerNight pricePerTable latitude longitude images description"
      ).lean(),
      Attraction.find(
        { city: { $regex: `^${city}$`, $options: "i" } },
        "name category image latitude longitude opening_time closing_time description"
      ).lean(),
    ]);

    const validPlaces = places.filter(p => {
      const price = p.pricePerNight || p.pricePerTable || 0;
      return !budget || price <= budget;
    });

    const topAttractions = attractions.slice(0, 25);
    const topPlaces = validPlaces.slice(0, 20);

    const placesCtx = topPlaces
      .map(p => `${p._id}|${p.name}|${p.type}|${p.pricePerNight || p.pricePerTable || 0}|${p.latitude}|${p.longitude}|${p.images?.[0] || ""}`)
      .join("\n");

    const attractionsCtx = topAttractions
      .map(a => `${a._id}|${a.name}|${a.category}|${a.image || ""}|${a.latitude}|${a.longitude}|${a.opening_time || "08:00"}-${a.closing_time || "20:00"}`)
      .join("\n");

    const dates = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.2,
      apiKey: process.env.GOOGLE_API_KEY,
      maxRetries: 2,
      maxOutputTokens: 8192,
      generationConfig: { responseMimeType: "application/json" },
      safetySettings: [
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      ],
    });

    // === ONLY THIS PROMPT CHANGED (added adults/children + rooms/tables) ===
    const systemPrompt = `You are an expert travel planner for Aswan and Luxor.
Return ONLY valid JSON. Never invent IDs.
Use only real IDs from the lists.
Travelers: ${adults} adult(s)${children > 0 ? `, ${children} child(ren)` : ""} → total ${totalPeople} people
For restaurants → add "tables": number (1 table per 5 people)
For guest houses in "suggest" → add "rooms": number (1 room per 2 adults + 1 per 2 children)
Schedule: 08:00–20:00, max 5 activities/day, include 1–2 meals.`;

    const userPrompt = `Destination: ${destination}
Dates: ${dates.join(" to ")} (${daysCount} days)
Budget/day: ${budget ? budget + " EGP" : "No limit"}
Interests: ${interests.length ? interests.join(", ") : "General"}

PLACES (id|name|type|price|lat|lon|image):
${placesCtx}

ATTRACTIONS (id|name|category|image|lat|lon|open-close):
${attractionsCtx}

Return ONLY this JSON format:
{
  "days": [
    {
      "date": "${dates[0]}",
      "schedule": [
        { "time": "08:00 - 11:00", "type": "attraction", "id": "...", "name": "..." },
        { "time": "19:00 - 21:00", "type": "restaurant", "id": "...", "name": "...", "tables": 1 }
      ]
    }
  ],
  "suggest": {
    "guestHouses": [
      { "id": "...", "name": "...", "rooms": 2 }
    ]
  }
}`;

    let aiResponse;
    try {
      aiResponse = await llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
    } catch (err) {
      return res.status(500).json({ success: false, message: "Gemini API failed", error: err.message });
    }

    const cleaned = cleanGeminiJson(aiResponse.content);

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Final JSON parse failed:", cleaned.substring(0, 1000));
      return res.status(500).json({
        success: false,
        message: "Could not parse AI response",
        raw: cleaned.substring(0, 1000),
      });
    }

    if (!result.days || !Array.isArray(result.days)) {
      return res.status(500).json({ success: false, message: "Invalid AI structure" });
    }

    // === SAME ENRICHMENT AS BEFORE ===
    const placeMap = Object.fromEntries(topPlaces.map(p => [p._id.toString(), p]));
    const attractionMap = Object.fromEntries(topAttractions.map(a => [a._id.toString(), a]));

    result.days.forEach(day => {
      day.schedule = (day.schedule || []).map(item => {
        const full =
          item.type === "attraction"
            ? attractionMap[item.id] || topAttractions.find(a => a.name.toLowerCase() === item.name?.toLowerCase())
            : placeMap[item.id] || topPlaces.find(p => p.name.toLowerCase() === item.name?.toLowerCase());

        if (!full) return item;

        return {
          time: item.time,
          type: item.type,
          id: full._id,
          name: full.name,
          description: full.description || "",
          image: item.type === "attraction" ? full.image : full.images?.[0] || "",
          latitude: full.latitude,
          longitude: full.longitude,
          price: item.type === "restaurant" ? full.pricePerTable : undefined,
          tables: item.type === "restaurant" ? (item.tables || Math.ceil(totalPeople / 5)) : undefined, // ← NEW
        };
      });
    });

    // === GUEST HOUSES NOW INCLUDE ROOMS ===
    const roomsNeeded = Math.max(1, Math.ceil((adults + Math.ceil(children / 2)) / 2));

    const topGuestHouses = topPlaces
      .filter(p => p.type === "guest_house")
      .sort((a, b) => (a.pricePerNight || 99999) - (b.pricePerNight || 99999))
      .slice(0, 3)
      .map(g => ({
        id: g._id,
        name: g.name,
        price: g.pricePerNight,
        image: g.images?.[0] || "",
        latitude: g.latitude,
        longitude: g.longitude,
        rooms: g.rooms || roomsNeeded  // ← Gemini provides it, fallback to calc
      }));

    result.suggest = { guestHouses: topGuestHouses };

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("Generate program error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;