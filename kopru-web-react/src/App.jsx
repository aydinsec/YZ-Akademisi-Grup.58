import { useState } from "react";
import { AppProvider, useApp } from "./state/AppContext.jsx";
import Login from "./components/Login.jsx";
import Modal from "./components/Modal.jsx";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Home from "./pages/Home.jsx";
import Focus from "./pages/Focus.jsx";
import Tasks from "./pages/Tasks.jsx";
import Stats from "./pages/Stats.jsx";
import Catches from "./pages/Catches.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import { RAR_LBL } from "./utils/config.js";

/* Seans bitince otomatik yakalanan balığa isim verme penceresi */
function FishNamingModal() {
  const { pendingFish, setPendingFish, get, set, toast } = useApp();
  const [name, setName] = useState("");
  if (!pendingFish) return null;

  const save = () => {
    const a = get("fish", []);
    const f = a.find((x) => x.id === pendingFish.id);
    if (f) { f.name = name.trim(); set("fish", a); }
    toast(name.trim() ? `"${name.trim()}" koleksiyona katıldı 🐟` : "Balık koleksiyona eklendi");
    setName("");
    setPendingFish(null);
  };

  return (
    <Modal title="Seans tamamlandı — yeni balık! 🎣" onClose={() => { setName(""); setPendingFish(null); }}>
      <p style={{ color: "var(--muted)", fontSize: "13.5px", marginBottom: "12px" }}>
        {pendingFish.minutes} dakikalık odak seansın denizden <b>{RAR_LBL[pendingFish.tier]}</b> bir balık getirdi. Ona bir isim ver:
      </p>
      <div className="fish-name-preview"><img src={`assets/fish/${pendingFish.file}`} alt="Yeni balık" /></div>
      <label className="f-label">Balık adı</label>
      <input className="f-input" value={name} placeholder="Ör: Gümüş Pul" autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
      <div className="actions">
        <button className="btn-outline" onClick={() => { setName(""); setPendingFish(null); }}>Sonra</button>
        <button className="btn-navy" onClick={save}>Kaydet</button>
      </div>
    </Modal>
  );
}

function Toast() {
  const { toastMsg } = useApp();
  return (
    <div id="toast" className={toastMsg ? "show" : ""}>
      <svg width="17" height="17"><use href="#i-check-c" /></svg>
      <span>{toastMsg || ""}</span>
    </div>
  );
}

function Shell() {
  const { user } = useApp();
  const [currentPage, setCurrentPage] = useState("home");

  if (!user) return (<><Login /><Toast /></>);

  return (
    <>
      <div id="app">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main>
          <Topbar currentPage={currentPage} />
          {currentPage === "home" && <Home setCurrentPage={setCurrentPage} />}
          {currentPage === "focus" && <Focus />}
          {currentPage === "tasks" && <Tasks />}
          {currentPage === "stats" && <Stats />}
          {currentPage === "catches" && <Catches />}
          {currentPage === "settings" && <Settings />}
          {currentPage === "profile" && <Profile setCurrentPage={setCurrentPage} />}
        </main>
      </div>
      <FishNamingModal />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
