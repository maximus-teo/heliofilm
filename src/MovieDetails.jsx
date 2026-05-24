import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [images, setImages] = useState(null);
  const backendURL = "http://localhost:5000";

  useEffect(() => {
    axios
      .get(`${backendURL}/api/movie/${id}`)
      .then((res) => setMovie(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    axios
      .get(`${backendURL}/api/movie/${id}/credits`)
      .then((res) => setCredits(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    axios
      .get(`${backendURL}/api/movie/${id}/images`)
      .then((res) => setImages(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!movie) return <p>Loading...</p>;

  const dateObject = new Date(movie.release_date);
  const formattedDate = dateObject.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedRuntime = `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`;
  const englishLogo = images?.logos?.find((logo) => logo.iso_639_1 === "en");

  const directorNames = [];
  credits?.crew
    ?.filter((c) => c.job === "Director")
    .map((d) => directorNames.push(d.name));

  return (
    <div
      style={{ alignItems: "center", display: "flex", flexDirection: "column" }}
    >
      <nav style={{ zIndex: "999" }}>
        <a href="/" className="logo">
          Heliofilm
          <span style={{ position: "relative", top: "-5px", left: "5px" }}>
            🎥🔥
          </span>
        </a>
        <a>Popular</a>
        <a>Upcoming</a>
      </nav>

      <img
        src={`https://image.tmdb.org/t/p/w1920${movie.backdrop_path}`}
        alt={movie.title}
        className="backbackdrop"
        style={{ zIndex: "-999" }}
      />

      <div style={{ marginTop: "-60%", justifyItems: "center" }}>
        <img
          src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
          alt={movie.title}
          className="backdrop"
          style={{ zIndex: "-99" }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "50px",
            zIndex: "999",
            marginTop: "-100px",
          }}
        >
          <img
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title}
            style={{ boxShadow: "0px 0px 20px rgb(0,0,0,0.7)" }}
          />
          <div
            style={{
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {englishLogo && (
              <img
                src={`https://image.tmdb.org/t/p/w500${englishLogo.file_path}`}
                alt={movie.title}
                className="movie-logo"
              />
            )}
            <h1 style={{ maxWidth: "600px" }}>{movie.title}</h1>
            <p>
              {formattedDate} | {formattedRuntime} | Directed by{" "}
              {directorNames.join(", ")}
            </p>
            <strong style={{ maxWidth: "600px" }}>
              {movie.tagline.toUpperCase()}
            </strong>
            <p style={{ maxWidth: "600px" }}>{movie.overview}</p>
          </div>
        </div>
        <div style={{ padding: "1rem", justifyItems: "center" }}>
          <h2>Cast</h2>
          <div className="scrolling-wrapper" style={{ width: "80vw" }}>
            {credits?.cast?.length > 0 &&
              credits.cast.map((c) => (
                <div key={c.credit_id}>
                  <img
                    className="profile-pic"
                    src={
                      c.profile_path
                        ? `https://image.tmdb.org/t/p/w154${c.profile_path}`
                        : `/assets/profile.jpg`
                    }
                    alt={c.name}
                    style={{ marginBottom: "10px" }}
                  />
                  <strong>{c.character}</strong>
                  <p>{c.name}</p>
                </div>
              ))}
          </div>

          <h2>Crew</h2>
          <div className="scrolling-wrapper" style={{ width: "80vw" }}>
            {credits?.crew?.length > 0 &&
              credits.crew.map((c) => (
                <div key={c.credit_id}>
                  <img
                    className="profile-pic"
                    src={
                      c.profile_path
                        ? `https://image.tmdb.org/t/p/w154${c.profile_path}`
                        : `/assets/profile.jpg`
                    }
                    alt={c.name}
                    style={{ marginBottom: "10px" }}
                  />
                  <strong>{c.job}</strong>
                  <p>{c.name}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
