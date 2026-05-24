/*
- Home page (source posters from popular movies)
- Search function: search bar and search page
- Popular, upcoming, genres
*/

import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { Link } from "react-router-dom";

export default function App() {
  const [moviesPopular, setMoviesPopular] = useState([]);
  const [moviesUpcoming, setMoviesUpcoming] = useState([]);
  const [images, setImages] = useState(null);
  const [id, setId] = useState(null);
  const [logoPath, setLogoPath] = useState([]);

  const backendURL = "http://localhost:5000";

  useEffect(() => {
    axios
      .get(`${backendURL}/api/popular`)
      .then((res) => setMoviesPopular(res.data.results))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${backendURL}/api/upcoming`)
      .then((res) => setMoviesUpcoming(res.data.results))
      .catch((err) => console.error(err));
  }, []);

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prevIndex) => (prevIndex + 1) % moviesPopular.length);
      setId(moviesPopular[slideIndex].id);
      console.log("slideIndex:", slideIndex);
      setLogoPath(
        images?.logos?.find((logo) => logo.iso_639_1 === "en").file_path,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [moviesPopular]);

  useEffect(() => {
    axios
      .get(`${backendURL}/api/movie/${id}/images`)
      .then((res) => setImages(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  function getMovieDate(movie) {
    const dateObject = new Date(movie.release_date);
    return dateObject.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function getMovieRuntime(movie) {
    console.log(movie.runtime);
    return `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`;
  }

  function fillPopularLogos() {
    let logoArray = [];
    moviesPopular.map((movie) => {
      console.log("movie name:", movie.title);
      setId(movie.id);
      logoArray.push(
        images?.logos?.find((logo) => logo.iso_639_1 === "en").file_path,
      );
    });
    console.log("logoArray:", logoArray);
    setLogos(logoArray);
  }

  return (
    <div>
      <nav>
        <a href="/" className="logo">
          <img src="assets/heliofilm_logo.png" />
        </a>
        <a>Popular</a>
        <a>Upcoming</a>
        <a>Search</a>
      </nav>
      <div style={{ padding: "1rem" }}>
        <div className="slideshow-container">
          {moviesPopular.map((movie, index) => (
            <div
              className="main-card fade"
              key={movie.id}
              style={{ display: index === slideIndex ? "block" : "none" }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w1920${movie.backdrop_path}`}
                alt={movie.title}
                className="backbackdrop"
                style={{
                  zIndex: "-999",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
              <img
                src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                alt={movie.title}
                className="backdrop"
                style={{ margin: "100px", scale: 1.2 }}
              />
              <div
                style={{
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: "50px",
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${logoPath}`}
                  alt={movie.title}
                  className="movie-logo"
                />
                <h1 style={{ maxWidth: "600px" }}>{movie.title}</h1>
                <p>
                  {getMovieDate(movie)} | {getMovieRuntime(movie)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <br />

        <div style={{ textAlign: "center" }}>
          {moviesPopular.map((movie) => (
            <span className="dot" key={movie.id}></span>
          ))}
        </div>

        <h1>Popular Movies</h1>
        <div className="scrolling-wrapper">
          {moviesPopular.map((movie) => (
            <div className="card" data-title={movie.title} key={movie.id}>
              <Link to={`/movie/${movie.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                  alt={movie.title}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "1rem" }}>
        <h1>Upcoming Movies</h1>
        <div className="scrolling-wrapper">
          {moviesUpcoming.map((movie) => (
            <div className="card" data-title={movie.title} key={movie.id}>
              <Link to={`/movie/${movie.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                  alt={movie.title}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
