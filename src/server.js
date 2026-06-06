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
    res.status(500).json({ error: "Failed to fetch data from TMDB" });
  }
});

app.get("/api/upcoming", async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE}/movie/upcoming`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data from TMDB" });
  }
});

app.get("/api/movie/:id", async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE}/movie/${req.params.id}`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
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
    res.status(500).json({ error: "Failed to fetch movie credits" });
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
    res.status(500).json({ error: "Failed to fetch movie images" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
