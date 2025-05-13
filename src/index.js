import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
// Temporarily disabled StrictMode to prevent double rendering in development
// Note: In production, this double-rendering doesn't happen
root.render(<App />);
