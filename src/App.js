import React from "react";
import Calendar from "./components/Calendar";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">My Tasks</h1>
      <Calendar />
    </div>
  );
}

export default App;
