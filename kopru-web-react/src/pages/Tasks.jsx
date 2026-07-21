import { useState } from "react";

function Tasks() {
  // Üst sekmeleri (Görevlerim / Odak Seansları / Alışkanlıklar) yönetmek için state[cite: 1]
  const [activeTab, setActiveTab] = useState("list");

  // Görev filtrelerini (Tümü / Bugün / Yaklaşan / Tamamlandı) yönetmek için state[cite: 1]
  const [filter, setFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);

  // 3 tane geçici örnek görev ekleme
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Yapay zeka model entegrasyonu",
      category: "Yazılım",
      done: false,
      time: "25 dk",
    },
    {
      id: 2,
      title: "Arayüz tasarımlarının React'e taşınması",
      category: "Frontend",
      done: true,
      time: "50 dk",
    },
    {
      id: 3,
      title: "Haftalık raporun hazırlanması",
      category: "Genel",
      done: false,
      time: "15 dk",
    },
  ]);

  // Checkbox'a tıklayınca görevin tamamlandı durumunu değiştiren fonksiyon
  const toggleTaskDone = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <section
      className="page"
      id="page-tasks"
      style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}
    >
      {/* === SOL TARAF: SEKMELER VE GÖREV LİSTESİ === */}
      <div>
        {/* Üst Sekmeler[cite: 1] */}
        <div className="tabs">
          <button
            className={activeTab === "list" ? "active" : ""}
            onClick={() => setActiveTab("list")}
          >
            Görevlerim
          </button>
          <button
            className={activeTab === "sessions" ? "active" : ""}
            onClick={() => setActiveTab("sessions")}
          >
            Odak Seansları
          </button>
          <button
            className={activeTab === "habits" ? "active" : ""}
            onClick={() => setActiveTab("habits")}
          >
            Alışkanlıklar
          </button>
        </div>

        {activeTab === "list" ? (
          /* Görevler Listesi Kartı[cite: 1] */
          <div className="card" id="taskListCard">
            <div className="task-toolbar">
              <button
                className={`pill ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tümü
              </button>
              <button
                className={`pill ${filter === "today" ? "active" : ""}`}
                onClick={() => setFilter("today")}
              >
                Bugün
              </button>
              <button
                className={`pill ${filter === "upcoming" ? "active" : ""}`}
                onClick={() => setFilter("upcoming")}
              >
                Yaklaşan
              </button>
              <button
                className={`pill ${filter === "done" ? "active" : ""}`}
                onClick={() => setFilter("done")}
              >
                Tamamlandı
              </button>

              <button className="btn-navy" id="openAddTask">
                <svg width="15" height="15">
                  <use href="#i-plus" />
                </svg>{" "}
                Yeni Görev Ekle
              </button>
            </div>

            {/* Görev Listesi (Dinamik Render) */}
            <div id="taskGroups" style={{ padding: "8px 20px" }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleTaskDone(t.id)}
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTaskDone(t.id)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--teal)",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        textDecoration: t.done ? "line-through" : "none",
                        color: t.done ? "var(--muted)" : "var(--text)",
                        fontWeight: "600",
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      background: "var(--bg-soft)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      color: "var(--muted)",
                      fontWeight: "700",
                    }}
                  >
                    {t.time} · {t.category}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="show-done"
              onClick={() => setShowDone(!showDone)}
            >
              {showDone ? "Tamamlananları Gizle" : "Tamamlananları Görüntüle"}
              <svg
                width="15"
                height="15"
                style={{
                  transform: showDone ? "rotate(180deg)" : "none",
                  transition: "0.2s",
                }}
              >
                <use href="#i-chev-d" />
              </svg>
            </button>
          </div>
        ) : (
          /* Diğer sekmeler tıklandığında görünecek kart[cite: 1] */
          <div
            className="card"
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <div
              style={{
                fontFamily: "Quicksand",
                fontWeight: "700",
                fontSize: "17px",
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              {activeTab === "sessions" ? "Odak Seansları" : "Alışkanlıklar"}
            </div>
            <div>
              Bu bölüm yakında aktif olacak! Kendi rotanı çizmeye devam et,
              Kaptan. ⚓
            </div>
          </div>
        )}

        {/* Alt Banner[cite: 1] */}
        <div className="banner" style={{ marginTop: "24px" }}>
          <div className="ic">
            <svg width="24" height="24">
              <use href="#i-anchor" />
            </svg>
          </div>
          <div>
            <div className="t">Planla. Odaklan. Tamamla.</div>
            <div className="d">
              Disiplinli küçük adımlar, büyük sonuçlar doğurur.
            </div>
          </div>
          <img className="art" src="assets/img/waves_banner.png" alt="" />
        </div>
      </div>

      {/* === SAĞ TARAF: GÖREV ÖZETİ VE İPUÇLARI === */}
      <div style={{ paddingTop: "42px" }}>
        {/* Görev Özeti Kartı[cite: 1] */}
        <div className="card">
          <div className="card-h">
            <div className="l">Görev Özeti</div>
            <div className="select">
              <select>
                <option>Bugün</option>
                <option>Bu Hafta</option>
                <option>Bu Ay</option>
              </select>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "26px",
              padding: "16px 22px 22px",
            }}
          >
            <div className="donut-wrap" style={{ padding: "0" }}>
              <svg className="donut" width="120" height="120">
                <circle
                  className="bgc"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="11"
                />
                <circle
                  className="fgc"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="11"
                  strokeDasharray="314.16"
                  strokeDashoffset="209.4"
                />
              </svg>
              <div className="donut-c">
                <div className="p" style={{ fontSize: "20px" }}>
                  {tasks.length}
                </div>
                <div className="s">Toplam</div>
              </div>
            </div>
            <div className="sum-legend" style={{ fontSize: "13.5px" }}>
              <div
                className="r"
                style={{
                  margin: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  className="d"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "inline-block",
                  }}
                ></span>
                <b>{tasks.filter((t) => t.done).length}</b>&nbsp;Tamamlandı
              </div>
              <div
                className="r"
                style={{
                  margin: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  className="d"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "var(--navy-deep)",
                    display: "inline-block",
                  }}
                ></span>
                <b>{tasks.filter((t) => !t.done).length}</b>&nbsp;Kalan
              </div>
              <div
                className="r"
                style={{
                  margin: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  className="d"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "var(--red)",
                    display: "inline-block",
                  }}
                ></span>
                <b>0</b>&nbsp;Geciken
              </div>
            </div>
          </div>
        </div>

        {/* Kategorilere Göre Kartı[cite: 1] */}
        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h">
            <div className="l">Kategorilere Göre</div>
          </div>
          <div style={{ padding: "16px 20px", fontSize: "13.5px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "8px 0",
              }}
            >
              <span>💻 Frontend</span>
              <b>1 görev</b>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "8px 0",
              }}
            >
              <span>🤖 Yazılım</span>
              <b>1 görev</b>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "8px 0",
              }}
            >
              <span>📋 Genel</span>
              <b>1 görev</b>
            </div>
          </div>
        </div>

        {/* İpucu Kartı[cite: 1] */}
        <div className="tip-card" style={{ marginTop: "20px" }}>
          <div className="t">Odak İpucu</div>
          <div className="d">
            Büyük hedeflere küçük adımlarla ulaşılır. Bugünkü 25 dakikan,
            yarınki seni inşa eder.
          </div>
          <img src="assets/img/lighthouse_small.png" alt="" />
        </div>
      </div>
    </section>
  );
}

export default Tasks;
