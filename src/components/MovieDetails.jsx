import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MovieDetails.css";
import heliofilmLogo from "../../assets/heliofilm_logo.png";
import profilePlaceholder from "../../assets/profile.jpg";

// Shimmer Skeleton for Movie Details page
function DetailSkeleton() {
  return (
    <div className="main-container">
      {/* Top Navbar */}
      <header className="navbar-wrapper">
        <nav className="navbar-content">
          <Link to="/" className="logo">
            <img src={heliofilmLogo} alt="Heliofilm Cinema" />
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Browse</Link>
          </div>
        </nav>
      </header>

      {/* Hero Backdrop Shimmer */}
      <div className="backdrop-banner-wrapper skeleton-shimmer" style={{ height: "45vh" }}></div>

      {/* Details Grid Shimmer */}
      <div className="movie-details-panel">
        <div className="poster-container skeleton-detail-poster skeleton-shimmer"></div>
        <div className="movie-details-subpanel">
          <div className="skeleton-line skeleton-line-title skeleton-shimmer"></div>
          <div className="skeleton-line skeleton-line-meta skeleton-shimmer"></div>
          <div className="skeleton-line skeleton-line-tagline skeleton-shimmer" style={{ marginTop: "1rem" }}></div>
          <div className="skeleton-line skeleton-line-overview-1 skeleton-shimmer" style={{ marginTop: "1.5rem" }}></div>
          <div className="skeleton-line skeleton-line-overview-2 skeleton-shimmer"></div>
          <div className="skeleton-line skeleton-line-overview-3 skeleton-shimmer"></div>
        </div>
      </div>

      {/* Cast Row Shimmer */}
      <div className="movie-details-cast-container">
        <div className="skeleton-line skeleton-shimmer" style={{ width: "120px", height: "22px", marginBottom: "1.2rem" }}></div>
        <div className="scrolling-wrapper">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div className="skeleton-cast-card" key={idx}>
              <div className="skeleton-profile-pic skeleton-shimmer"></div>
              <div className="skeleton-line skeleton-shimmer" style={{ width: "80%", height: "10px" }}></div>
              <div className="skeleton-line skeleton-shimmer" style={{ width: "60%", height: "10px" }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [navActive, setNavActive] = useState("browse");

  const backendURL = "http://localhost:5000";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [])

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch details, crew, and images in parallel
    Promise.all([
      axios.get(`${backendURL}/api/movie/${id}`),
      axios.get(`${backendURL}/api/movie/${id}/credits`),
      axios.get(`${backendURL}/api/movie/${id}/images`)
    ])
      .then(([movieRes, creditsRes, imagesRes]) => {
        setMovie(movieRes.data);
        setCredits(creditsRes.data);
        setImages(imagesRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching detailed movie dataset:", err);
        setError("Failed to load details for this title. Please check your network or return to browsing.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !movie) {
    return (
      <div className="main-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", color: "var(--brand-orange)", marginBottom: "1rem" }}>Detailed Screening Unavailable</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", maxWidth: "400px", textAlign: "center" }}>{error || "We couldn't retrieve information for this selection."}</p>
        <Link to="/" className="btn btn-primary">
          Back to Browse
        </Link>
      </div>
    );
  }

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "";
  const formattedRuntime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : "";

  const englishLogo = images?.logos?.find((logo) => logo.iso_639_1 === "en")?.file_path;

  const directors = credits?.crew
    ?.filter((c) => c.job === "Director")
    .map((d) => d.name) || [];

  const topCast = credits?.cast?.slice(0, 15) || [];
  const topCrew = credits?.crew?.filter(c => ["Producer", "Screenplay", "Writer", "Editor", "Director of Photography", "Original Music Composer"].includes(c.job)).slice(0, 10) || [];

  return (
    <div className="main-container">
      {/* Top Navbar */}
      <header className="navbar-wrapper">
        <nav className="navbar-content">
          <a href="/" className="logo">
            <img src={heliofilmLogo} alt="Heliofilm" />
          </a>

          <div className="nav-links">
            <span
              className={`nav-link prevent-select ${!searchQuery && navActive === "browse" ? "active" : ""}`}
              onClick={() => { setSearchQuery(""); setNavActive("browse"); }}
            >
              Browse
            </span>
            <span
              className={`nav-link prevent-select ${!searchQuery && navActive === "illuminate" ? "active" : ""}`}
              onClick={() => { setSearchQuery(""); setNavActive("illuminate"); }}
            >
              Illuminate
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

      {/* Backdrop Backdrop blur behind layout */}
      <div className="backdrop-banner-wrapper">
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
      </div>

      {/* Details Area */}
      <div className="movie-details-panel">
        <Link to="/" className="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Browse
        </Link>

        <div className="poster-container">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
          />
        </div>

        <div className="movie-details-subpanel">
          {englishLogo ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${englishLogo}`}
              alt={movie.title}
              className="movie-details-logo"
            />
          ) : (
            <h1>{movie.title}</h1>
          )}

          <div className="movie-meta-row">
            <span className="rating">
              ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
            </span>
            {releaseYear && <span>{releaseYear}</span>}
            {formattedRuntime && <span>{formattedRuntime}</span>}
            {directors.length > 0 && <span>Directed by {directors.join(", ")}</span>}
          </div>

          <div className="movie-meta-row" style={{ marginTop: "-0.5rem" }}>
            {movie.genres?.map(g => (
              <span className="badge" key={g.id}>{g.name}</span>
            ))}
          </div>

          {movie.tagline && (
            <blockquote className="movie-tagline">&ldquo;{movie.tagline}&rdquo;</blockquote>
          )}

          <div className="movie-overview-section">
            <h3>Synopsis</h3>
            <p>{movie.overview || "No synopsis available for this screening."}</p>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {topCast.length > 0 && (
        <div className="movie-details-cast-container">
          <h2 className="section-title">Cast Members</h2>
          <div className="scrolling-wrapper">
            {topCast.map((c) => (
              <div className="cast-card" key={c.credit_id}>
                <img
                  className="profile-pic"
                  src={
                    c.profile_path
                      ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                      : profilePlaceholder
                  }
                  alt={c.name}
                  loading="lazy"
                />
                <div className="cast-info">
                  <span className="cast-character">{c.character}</span>
                  <span className="cast-name">{c.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew Section */}
      {topCrew.length > 0 && (
        <div className="movie-details-cast-container" style={{ marginTop: "1rem" }}>
          <h2 className="section-title">Featured Production Crew</h2>
          <div className="scrolling-wrapper">
            {topCrew.map((c) => (
              <div className="cast-card" key={c.credit_id}>
                <img
                  className="profile-pic"
                  src={
                    c.profile_path
                      ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                      : profilePlaceholder
                  }
                  alt={c.name}
                  loading="lazy"
                />
                <div className="cast-info">
                  <span className="cast-character">{c.job}</span>
                  <span className="cast-name">{c.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
