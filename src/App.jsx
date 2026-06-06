import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { Link } from "react-router-dom";

// Shimmer Skeleton for Movie Poster Card
function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster skeleton-shimmer"></div>
      <div className="skeleton-text skeleton-text-title skeleton-shimmer"></div>
      <div className="skeleton-text skeleton-text-sub skeleton-shimmer"></div>
    </div>
  );
}

// Shimmer Skeleton for Hero Banner Section
function HeroSkeleton() {
  return (
    <div className="skeleton-hero">
      <div className="skeleton-hero-content">
        <div className="skeleton-hero-left">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div className="skeleton-text skeleton-shimmer" style={{ width: "60px", height: "20px" }}></div>
            <div className="skeleton-text skeleton-shimmer" style={{ width: "80px", height: "20px" }}></div>
          </div>
          <div className="skeleton-text skeleton-shimmer" style={{ width: "90%", height: "48px", marginTop: "1rem" }}></div>
          <div className="skeleton-text skeleton-shimmer" style={{ width: "40%", height: "18px" }}></div>
          <div className="skeleton-text skeleton-shimmer" style={{ width: "100%", height: "60px", marginTop: "1rem" }}></div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <div className="skeleton-text skeleton-shimmer" style={{ width: "130px", height: "40px", borderRadius: "8px" }}></div>
            <div className="skeleton-text skeleton-shimmer" style={{ width: "130px", height: "40px", borderRadius: "8px" }}></div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
}

export default function App() {
  const [moviesPopular, setMoviesPopular] = useState([]);
  const [moviesUpcoming, setMoviesUpcoming] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [error, setError] = useState(null);

  // Active slide detail cache
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeDetails, setActiveDetails] = useState(null);
  const [activeImages, setActiveImages] = useState(null);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const backendURL = "http://localhost:5000";

  // Fetch Popular Movies
  useEffect(() => {
    setLoadingPopular(true);
    axios
      .get(`${backendURL}/api/popular`)
      .then((res) => {
        const englishMovies = (res.data.results || []).filter(
          (movie) => movie.original_language === "en" && movie.backdrop_path && movie.poster_path
        );
        setMoviesPopular(englishMovies);
        setLoadingPopular(false);
      })
      .catch((err) => {
        console.error("Error fetching popular movies:", err);
        setError("Failed to communicate with TMDB cinema services. Please ensure the backend server is running.");
        setLoadingPopular(false);
      });
  }, []);

  // Fetch Upcoming Movies
  useEffect(() => {
    setLoadingUpcoming(true);
    axios
      .get(`${backendURL}/api/upcoming`)
      .then((res) => {
        const englishMovies = (res.data.results || []).filter(
          (movie) => movie.original_language === "en" && movie.backdrop_path && movie.poster_path
        );
        setMoviesUpcoming(englishMovies);
        setLoadingUpcoming(false);
      })
      .catch((err) => {
        console.error("Error fetching upcoming movies:", err);
        setLoadingUpcoming(false);
      });
  }, []);

  // Sync current slide's detail and images from TMDB
  const currentMovieId = moviesPopular[slideIndex]?.id;

  useEffect(() => {
    if (!currentMovieId) return;

    // Fetch details & images in parallel for active slide
    Promise.all([
      axios.get(`${backendURL}/api/movie/${currentMovieId}`),
      axios.get(`${backendURL}/api/movie/${currentMovieId}/images`)
    ])
      .then(([detailsRes, imagesRes]) => {
        setActiveDetails(detailsRes.data);
        setActiveImages(imagesRes.data);
      })
      .catch((err) => {
        console.error("Error fetching slide details:", err);
      });
  }, [currentMovieId]);

  // Autoplay Slider Cycle (Pauses when user hovers to interact)
  useEffect(() => {
    if (!moviesPopular.length || isAutoplayPaused) return;

    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % moviesPopular.length);
    }, 7000); // 7 seconds interval for premium, slow transitions

    return () => clearInterval(interval);
  }, [moviesPopular.length, isAutoplayPaused]);

  // Manual Controls
  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev - 1 + moviesPopular.length) % moviesPopular.length);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev + 1) % moviesPopular.length);
  };

  // Helper date parsing
  function formatReleaseYear(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).getFullYear();
  }

  // Local Search Filtering
  const filteredPopular = moviesPopular.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUpcoming = moviesUpcoming.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine results removing duplicates
  const allResults = [];
  const seenIds = new Set();
  [...filteredPopular, ...filteredUpcoming].forEach((m) => {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id);
      allResults.push(m);
    }
  });

  const activeEnglishLogo = activeImages?.logos?.find(
    (logo) => logo.iso_639_1 === "en"
  )?.file_path;

  const activeGenres = activeDetails?.genres?.slice(0, 3).map((g) => g.name) || [];
  const activeRuntime = activeDetails?.runtime
    ? `${Math.floor(activeDetails.runtime / 60)}h ${activeDetails.runtime % 60}m`
    : "";

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar-wrapper">
        <nav className="navbar-content">
          <a href="/" className="logo">
            <img src="assets/heliofilm_logo.png" alt="Heliofilm Cinema" />
          </a>

          <div className="nav-links">
            <span
              className={`nav-link ${!searchQuery ? "active" : ""}`}
              onClick={() => setSearchQuery("")}
            >
              Browse
            </span>
            <div className="nav-search">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </nav>
      </header>

      {error ? (
        <div className="error-banner">
          <h3>Cinema Service Unavailable</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      ) : searchQuery ? (
        /* Search Results Mode */
        <section className="search-results-section">
          <div className="section-header">
            <h2 className="section-title">Search Results for &ldquo;{searchQuery}&rdquo;</h2>
          </div>

          {allResults.length > 0 ? (
            <div className="results-grid">
              {allResults.map((movie) => (
                <div className="card-item" key={movie.id}>
                  <Link to={`/movie/${movie.id}`}>
                    <div className="card-poster-wrapper">
                      <img
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                      />
                      <div className="card-poster-overlay">
                        <span className="card-poster-rating">
                          ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="card-details">
                    <h4 className="card-title">{movie.title}</h4>
                    <div className="card-meta">
                      <span>{formatReleaseYear(movie.release_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <h3>No Cinema Matches</h3>
              <p>We couldn&apos;t find any movies matching your query. Check spelling or try a different term.</p>
            </div>
          )}
        </section>
      ) : (
        /* Standard Browse Mode */
        <>
          {/* Hero Slider */}
          {loadingPopular ? (
            <HeroSkeleton />
          ) : moviesPopular.length > 0 ? (
            <div
              className="slideshow-container"
              onMouseEnter={() => setIsAutoplayPaused(true)}
              onMouseLeave={() => setIsAutoplayPaused(false)}
            >
              {moviesPopular.map((movie, index) => (
                <div
                  className={`main-card ${index === slideIndex ? "active-slide" : ""}`}
                  key={movie.id}
                >
                  <div className="backdrop-wrapper">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.backdrop_path}`}
                      alt=""
                      className="backbackdrop"
                    />
                    <img
                      src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                      alt={movie.title}
                      className="backdrop"
                    />
                    <div className="hero-overlay"></div>
                  </div>

                  <div className="hero-content">
                    <div className="hero-text-panel">
                      <div className="hero-badges">
                        <span className="badge badge-primary">Featured Spotlight</span>
                        {activeGenres.map((genre) => (
                          <span className="badge" key={genre}>{genre}</span>
                        ))}
                      </div>
                      <h1>{movie.title}</h1>
                      <div className="hero-meta">
                        <span className="rating">
                          ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
                        </span>
                        <span>{formatReleaseYear(movie.release_date)}</span>
                        {activeRuntime && <span>{activeRuntime}</span>}
                      </div>

                      {activeDetails?.tagline && (
                        <p className="hero-tagline">&ldquo;{activeDetails.tagline}&rdquo;</p>
                      )}

                      <p className="hero-overview">{movie.overview}</p>

                      <div className="hero-actions">
                        <Link to={`/movie/${movie.id}`} className="btn btn-primary">
                          View Details
                        </Link>
                      </div>
                    </div>

                    <div className="hero-logo-panel">
                      {activeEnglishLogo && (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${activeEnglishLogo}`}
                          alt={movie.title}
                          className="movie-logo"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Slider Manual Controls */}
              <button className="carousel-arrow carousel-arrow-prev" onClick={handlePrevSlide} aria-label="Previous movie">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button className="carousel-arrow carousel-arrow-next" onClick={handleNextSlide} aria-label="Next movie">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Slider Dots */}
              <div className="carousel-dots">
                {moviesPopular.slice(0, 10).map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-dot ${index === slideIndex ? "active-dot" : ""}`}
                    onClick={() => setSlideIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  ></button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Popular List Section */}
          <section className="section-wrapper">
            <div className="section-header">
              <h2 className="section-title">Popular Releases</h2>
            </div>
            <div className="scrolling-wrapper">
              {loadingPopular
                ? Array.from({ length: 6 }).map((_, idx) => <CardSkeleton key={idx} />)
                : moviesPopular.map((movie) => (
                  <div className="card-item" key={movie.id}>
                    <Link to={`/movie/${movie.id}`}>
                      <div className="card-poster-wrapper">
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          alt={movie.title}
                          loading="lazy"
                        />
                        <div className="card-poster-overlay">
                          <span className="card-poster-rating">
                            ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="card-details">
                      <h4 className="card-title">{movie.title}</h4>
                      <div className="card-meta">
                        <span>{formatReleaseYear(movie.release_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* Upcoming List Section */}
          <section className="section-wrapper">
            <div className="section-header">
              <h2 className="section-title">Upcoming Screenings</h2>
            </div>
            <div className="scrolling-wrapper">
              {loadingUpcoming
                ? Array.from({ length: 6 }).map((_, idx) => <CardSkeleton key={idx} />)
                : moviesUpcoming.map((movie) => (
                  <div className="card-item" key={movie.id}>
                    <Link to={`/movie/${movie.id}`}>
                      <div className="card-poster-wrapper">
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          alt={movie.title}
                          loading="lazy"
                        />
                        <div className="card-poster-overlay">
                          <span className="card-poster-rating">
                            ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="card-details">
                      <h4 className="card-title">{movie.title}</h4>
                      <div className="card-meta">
                        <span>{formatReleaseYear(movie.release_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
