import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());

const TMDB_BASE = "https://api.themoviedb.org/3";

app.get("/api/popular", async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE}/movie/popular`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB - popular movie data" })
  }
});

app.get("/api/upcoming", async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE}/movie/upcoming`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB - upcoming movie data" })
  }
});

app.get("/api/search/movie", async (req, res) => {
  try {
    // 1. Match the exact key 'query' sent from the frontend
    const { query, page } = req.query;

    // Fallback protection if values are missing
    const searchPage = page || 1;

    // 2. Append the API key directly to the URL query parameters
    const tmdbUrl = `${TMDB_BASE}/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${searchPage}`;

    const response = await fetch(tmdbUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB upstream error" });
    }

    // 3. Convert the TMDB response to JSON object data
    const data = await response.json();

    // 4. Send the data payload back to React
    res.json(data);

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ error: "Failed to fetch TMDB - search movie data" });
  }
});

app.get("/api/movie/:id", async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE}/movie/${req.params.id}`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB - movie details" });
  }
});

app.get("/api/movie/:id/credits", async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE}/movie/${req.params.id}/credits`,
      {
        params: { api_key: process.env.TMDB_API_KEY },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB - movie credits" });
  }
});

app.get("/api/movie/:id/images", async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE}/movie/${req.params.id}/images`,
      {
        params: { api_key: process.env.TMDB_API_KEY },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch TMDB - movie images" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
