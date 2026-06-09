import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MovieDetails from "../src/components/MovieDetails";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/movie/:id" element={<MovieDetails />} />
    </Routes>
  </BrowserRouter>,
);
