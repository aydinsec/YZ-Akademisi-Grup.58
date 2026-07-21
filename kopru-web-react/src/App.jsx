import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Home from "./pages/Home.jsx";
import Focus from "./pages/Focus.jsx";
import Tasks from "./pages/Tasks.jsx";
import Stats from "./pages/Stats.jsx";
import Catches from "./pages/Catches.jsx";
import Settings from "./pages/Settings.jsx";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <div id="app">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main>
        <Topbar currentPage={currentPage} />

        <div style={{ padding: "0" }}>
          {currentPage === "home" && <Home setCurrentPage={setCurrentPage} />}
          {currentPage === "focus" && <Focus />}
          {currentPage === "tasks" && <Tasks />}
          {currentPage === "stats" && <Stats />}
          {currentPage === "catches" && <Catches />}
          {currentPage === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default App;
