import { useEffect } from "react";

/* Ortak modal kabuğu — overlay'e tıklayınca ve ESC ile kapanır */
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>
          {title}
          <button className="x" onClick={onClose} aria-label="Kapat">
            <svg width="18" height="18"><use href="#i-x" /></svg>
          </button>
        </h3>
        {children}
      </div>
    </div>
  );
}
