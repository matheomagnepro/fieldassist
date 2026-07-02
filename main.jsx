import { useState, useEffect, useRef } from "react";

// ── PALETTE ──────────────────────────────────────────────
const C = {
  bg: "#0A1628",
  surface: "#0F2040",
  card: "#162A4A",
  border: "#1E3A5F",
  accent: "#E8610A",
  accentHover: "#FF7520",
  blue: "#2563EB",
  blueLight: "#3B82F6",
  text: "#F0F4F8",
  textMuted: "#8BA3BC",
  textDim: "#4A6580",
  success: "#10B981",
  warning: "#F59E0B",
};

// ── STORAGE ───────────────────────────────────────────────
const DB_KEY = "fieldassist-db";
const loadDB = () => {
  try {
    const s = localStorage.getItem(DB_KEY);
    return s ? JSON.parse(s) : { pieces: [], clients: [], catalogues: [] };
  } catch { return { pieces: [], clients: [], catalogues: [] }; }
};
const saveDB = (db) => {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {}
};

// ── CLAUDE API ────────────────────────────────────────────
const callClaude = async (systemPrompt, userMessage) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const userContent = typeof userMessage === "string" ? userMessage : userMessage.find?.(b => b.type === "text")?.text || "";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

// ── ICONS ─────────────────────────────────────────────────
const Icon = ({ name, size = 24, color = C.text }) => {
  const icons = {
    truck: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    mic: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    file: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return icons[name] || null;
};

// ── BUTTON ────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => {
  const base = {
    border: "none", borderRadius: 10, cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit", fontWeight: 600, fontSize: 14, transition: "all 0.15s",
    display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
    opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { background: C.accent, color: "#fff", padding: "10px 20px" },
    secondary: { background: C.card, color: C.text, padding: "10px 20px", border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.textMuted, padding: "8px 12px" },
    danger: { background: "#7F1D1D", color: "#FCA5A5", padding: "8px 14px" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

// ── INPUT ─────────────────────────────────────────────────
const Input = ({ value, onChange, placeholder, multiline, rows = 3, style = {} }) => {
  const base = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
    color: C.text, padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", ...style,
  };
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize: undefined }} />;
};

// ── TAG ───────────────────────────────────────────────────
const Tag = ({ children, color = C.blue }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
    {children}
  </span>
);

// ══════════════════════════════════════════════════════════
// ÉCRAN D'ACCUEIL
// ══════════════════════════════════════════════════════════
const Home = ({ onNav }) => {
  const modules = [
    { id: "pieces", icon: "search", label: "Pièces", sub: "Recherche catalogue", color: C.accent },
    { id: "clients", icon: "users", label: "Clients", sub: "Fiches & historique", color: "#2563EB" },
    { id: "synthese", icon: "mic", label: "Synthèse", sub: "Dictée vocale", color: "#7C3AED" },
    { id: "email", icon: "mail", label: "Emails", sub: "Rédaction rapide", color: "#059669" },
    { id: "devis", icon: "file", label: "Devis", sub: "Préparer les réfs", color: "#D97706" },
    { id: "base", icon: "book", label: "Ma Base", sub: "Pièces découvertes", color: "#DC2626" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "32px 24px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, #C44D00)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px ${C.accent}44`,
          }}>
            <Icon name="send" size={26} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>FieldAssist</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>Ton assistant commercial terrain</div>
          </div>
        </div>
      </div>

      {/* Grid modules */}
      <div style={{ flex: 1, padding: "28px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {modules.map(m => (
          <button key={m.id} onClick={() => onNav(m.id)} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: "24px 16px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
            transition: "all 0.2s", textAlign: "center",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: m.color + "18", border: `1.5px solid ${m.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `inset 0 1px 0 ${m.color}22`,
            }}>
              <Icon name={m.icon} size={28} color={m.color} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m.label}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{m.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 24px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.textDim }}>Version 1.0 — Données sauvegardées localement</div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MODULE PIÈCES
// ══════════════════════════════════════════════════════════
const Pieces = ({ onBack, db, pdfData, pdfName, onPdfLoad }) => {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const handlePDF = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPdfLoad(reader.result.split(",")[1], file.name);
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input;
    setInput("");
    setMsgs(m => [...m, { role: "user", content: q }]);
    setLoading(true);

    const dbContext = db.pieces.length > 0
      ? `\nBase perso: ${db.pieces.map(p => `[${p.ref}] ${p.nom} | ${p.marque} | ${p.notes || ""}`).join(" | ")}`
      : "";

    const system = `Tu es un assistant commercial terrain polyvalent. Réponds en français.
Pour chaque pièce trouvée, indique TOUJOURS : Référence, Désignation, Application, Catalogue source, Page du catalogue.
Si tu utilises la base perso, précise-le.${dbContext}`;

    try {
      let userContent = q;
      if (pdfData) {
        userContent = [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfData } },
          { type: "text", text: q },
        ];
      }
      const reply = await callClaude(system, userContent);
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Erreur de connexion." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Icon name="back" color={C.textMuted} />
        </button>
        <Icon name="search" size={20} color={C.accent} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>Recherche Pièces</div>
          {pdfName && <div style={{ fontSize: 11, color: C.success }}>📄 {pdfName}</div>}
        </div>
        <button onClick={() => fileRef.current.click()} style={{
          background: pdfData ? C.success + "22" : C.card, border: `1px solid ${pdfData ? C.success : C.border}`,
          borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: pdfData ? C.success : C.textMuted, fontSize: 12, fontWeight: 600,
        }}>
          {pdfData ? "✓ PDF" : "+ PDF"}
        </button>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePDF} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", color: C.textMuted, fontSize: 13, lineHeight: 2 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, color: C.text, marginBottom: 8 }}>Recherchez une pièce</div>
            <div>Par référence, description ou modèle de véhicule</div>
            <div style={{ marginTop: 16, padding: "10px 16px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 13 }}
              onClick={() => setInput("Filtre huile pour Volvo FH 2019")}>
              💡 Filtre huile pour Volvo FH 2019
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: 14,
              background: m.role === "user" ? `linear-gradient(135deg, ${C.accent}, #C44D00)` : C.card,
              border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
              color: C.text, fontSize: 13, lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 5, padding: "10px 14px", background: C.card, borderRadius: 14, width: "fit-content", border: `1px solid ${C.border}` }}>
            {[0, 1, 2].map(j => (
              <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: `pulse 1s ${j * 0.2}s infinite` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Référence, description, marque/modèle..."
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          background: loading || !input.trim() ? C.border : C.accent,
          border: "none", borderRadius: 10, width: 42, height: 42, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="send" size={18} color="#fff" />
        </button>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }`}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MODULE CLIENTS
// ══════════════════════════════════════════════════════════
const Clients = ({ onBack, db, setDB }) => {
  const [view, setView] = useState("list"); // list | detail | new
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nom: "", entreprise: "", tel: "", vehicules: "", notes: "" });
  const [noteInput, setNoteInput] = useState("");

  const clients = db.clients || [];

  const saveClient = () => {
    if (!form.nom) return;
    const newC = { ...form, id: Date.now(), passages: [], createdAt: new Date().toLocaleDateString("fr-FR") };
    const updated = { ...db, clients: [...clients, newC] };
    setDB(updated); saveDB(updated);
    setView("list"); setForm({ nom: "", entreprise: "", tel: "", vehicules: "", notes: "" });
  };

  const addPassage = (clientId) => {
    if (!noteInput.trim()) return;
    const passage = { date: new Date().toLocaleDateString("fr-FR"), note: noteInput, id: Date.now() };
    const updated = {
      ...db, clients: clients.map(c =>
        c.id === clientId ? { ...c, passages: [...(c.passages || []), passage] } : c
      )
    };
    setDB(updated); saveDB(updated); setNoteInput("");
    setSelected(updated.clients.find(c => c.id === clientId));
  };

  const deleteClient = (id) => {
    const updated = { ...db, clients: clients.filter(c => c.id !== id) };
    setDB(updated); saveDB(updated); setView("list");
  };

  if (view === "new") return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <Icon name="users" size={20} color="#2563EB" />
        <div style={{ fontWeight: 700, color: C.text }}>Nouveau client</div>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {[["nom", "Nom *"], ["entreprise", "Entreprise"], ["tel", "Téléphone"], ["vehicules", "Véhicules (plaques/VIN)"]].map(([k, label]) => (
          <div key={k}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{label}</div>
            <Input value={form[k]} onChange={v => setForm(f => ({ ...f, [k]: v }))} placeholder={label} />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Notes</div>
          <Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Informations utiles..." multiline rows={3} />
        </div>
        <Btn onClick={saveClient} disabled={!form.nom}>Enregistrer le client</Btn>
      </div>
    </div>
  );

  if (view === "detail" && selected) return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: C.text }}>{selected.nom}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{selected.entreprise}</div>
        </div>
        <button onClick={() => deleteClient(selected.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Icon name="trash" size={18} color="#EF4444" />
        </button>
      </div>
      <div style={{ padding: 20 }}>
        {/* Infos */}
        <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          {selected.tel && <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>📞 {selected.tel}</div>}
          {selected.vehicules && <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>🚛 {selected.vehicules}</div>}
          {selected.notes && <div style={{ color: C.text, fontSize: 13 }}>{selected.notes}</div>}
        </div>

        {/* Passages */}
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 12 }}>Historique des passages</div>
        {(selected.passages || []).length === 0
          ? <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>Aucun passage enregistré</div>
          : (selected.passages || []).map(p => (
            <div key={p.id} style={{ background: C.card, borderRadius: 10, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.accent, marginBottom: 4 }}>{p.date}</div>
              <div style={{ fontSize: 13, color: C.text }}>{p.note}</div>
            </div>
          ))
        }

        {/* Ajouter passage */}
        <div style={{ marginTop: 8 }}>
          <Input value={noteInput} onChange={setNoteInput} placeholder="Note de passage..." multiline rows={3} />
          <div style={{ marginTop: 8 }}>
            <Btn onClick={() => addPassage(selected.id)} disabled={!noteInput.trim()}>+ Ajouter ce passage</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <Icon name="users" size={20} color="#2563EB" />
        <div style={{ flex: 1, fontWeight: 700, color: C.text }}>Clients ({clients.length})</div>
        <button onClick={() => setView("new")} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600 }}>+ Nouveau</button>
      </div>
      <div style={{ padding: 16 }}>
        {clients.length === 0
          ? <div style={{ textAlign: "center", marginTop: 60, color: C.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div>Aucun client enregistré</div>
            <div style={{ marginTop: 16 }}><Btn onClick={() => setView("new")}>Ajouter un client</Btn></div>
          </div>
          : clients.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setView("detail"); }} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: "14px 16px", marginBottom: 10, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#2563EB22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="users" size={20} color="#2563EB" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.text }}>{c.nom}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{c.entreprise || "—"}</div>
              </div>
              <Tag color="#2563EB">{(c.passages || []).length} passage{(c.passages || []).length !== 1 ? "s" : ""}</Tag>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MODULE SYNTHÈSE VOCALE
// ══════════════════════════════════════════════════════════
const Synthese = ({ onBack }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult("");
    const system = `Tu es un assistant commercial terrain polyvalent.
À partir de notes brutes dictées en voiture, génère une synthèse client professionnelle, claire et structurée.
Format : Date | Client | Ce qui a été commandé (avec références si mentionnées) | Points clés | Prochain passage prévu.
Sois concis mais complet. Réponds uniquement avec la synthèse, pas d'explication.`;
    const reply = await callClaude(system, input);
    setResult(reply); setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <Icon name="mic" size={20} color="#7C3AED" />
        <div style={{ fontWeight: 700, color: C.text }}>Synthèse de passage</div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          Dicte tes notes brutes de visite client. Je les transforme en synthèse professionnelle à copier dans votre logiciel.
        </div>
        <Input
          value={input} onChange={setInput}
          placeholder="Ex: Vu Michel chez Transport Dupont, commande 4 filtres huile Volvo FH, s'intéresse aux disques DAF au prochain passage dans 6 semaines..."
          multiline rows={6}
        />
        <div style={{ marginTop: 12 }}>
          <Btn onClick={generate} disabled={loading || !input.trim()}>
            {loading ? "Génération..." : "✨ Générer la synthèse"}
          </Btn>
        </div>

        {result && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: C.text }}>Synthèse générée</div>
              <Btn onClick={copy} variant="secondary" style={{ padding: "6px 12px" }}>
                {copied ? <><Icon name="check" size={14} color={C.success} /> Copié</> : <><Icon name="copy" size={14} /> Copier</>}
              </Btn>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, color: C.text, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MODULE EMAIL
// ══════════════════════════════════════════════════════════
const Email = ({ onBack }) => {
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!context.trim()) return;
    setLoading(true); setResult("");
    const system = `Tu es un assistant commercial terrain. Rédige un email professionnel, concis et efficace en français.
Objet + corps du mail. Ton : professionnel mais humain. Signature : [Prénom] | Commercial Pièces Poids Lourds.`;
    const reply = await callClaude(system, `Rédige un email avec ces informations : ${context}`);
    setResult(reply); setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <Icon name="mail" size={20} color="#059669" />
        <div style={{ fontWeight: 700, color: C.text }}>Rédaction Email</div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          Décris en quelques mots ce que tu veux envoyer. Je rédige l'email complet.
        </div>
        <Input
          value={context} onChange={setContext}
          placeholder="Ex: Mail pour Transport Martin, devis disques frein DAF CF, délai 3 jours, remercier pour accueil..."
          multiline rows={4}
        />
        <div style={{ marginTop: 12 }}>
          <Btn onClick={generate} disabled={loading || !context.trim()}>
            {loading ? "Rédaction..." : "✉️ Rédiger l'email"}
          </Btn>
        </div>
        {result && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: C.text }}>Email généré</div>
              <Btn onClick={copy} variant="secondary" style={{ padding: "6px 12px" }}>
                {copied ? <><Icon name="check" size={14} color={C.success} /> Copié</> : <><Icon name="copy" size={14} /> Copier</>}
              </Btn>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, color: C.text, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MODULE DEVIS
// ══════════════════════════════════════════════════════════
const Devis = ({ onBack, pdfData }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult("");
    const system = `Tu es un assistant commercial expert. Prépare une liste structurée de références pour un devis.
Format pour chaque ligne : Référence | Désignation | Catalogue | Page | Qté suggérée.
Sois précis. Si le PDF est fourni, cherche dedans en priorité.`;

    let userContent = input;
    if (pdfData) {
      userContent = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfData } },
        { type: "text", text: `Prépare les références pour ce devis : ${input}` },
      ];
    }
    const reply = await callClaude(system, userContent);
    setResult(reply); setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <Icon name="file" size={20} color="#D97706" />
        <div style={{ fontWeight: 700, color: C.text }}>Préparation Devis</div>
      </div>
      <div style={{ padding: 20 }}>
        {!pdfData && <div style={{ background: "#D9770622", border: `1px solid ${C.warning}44`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: C.warning }}>
          ⚠️ Aucun catalogue chargé. Va dans Recherche Pièces pour charger un PDF.
        </div>}
        <Input value={input} onChange={setInput}
          placeholder="Ex: Devis pour Transport Dupont — 4 filtres huile Volvo FH + 2 disques frein DAF LF..."
          multiline rows={4} />
        <div style={{ marginTop: 12 }}>
          <Btn onClick={generate} disabled={loading || !input.trim()}>
            {loading ? "Recherche..." : "📋 Préparer les références"}
          </Btn>
        </div>
        {result && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: C.text }}>Références prêtes</div>
              <Btn onClick={copy} variant="secondary" style={{ padding: "6px 12px" }}>
                {copied ? <><Icon name="check" size={14} color={C.success} /> Copié</> : <><Icon name="copy" size={14} /> Copier</>}
              </Btn>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, color: C.text, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MODULE BASE PERSO
// ══════════════════════════════════════════════════════════
const Base = ({ onBack, db, setDB }) => {
  const [form, setForm] = useState({ ref: "", nom: "", marque: "", catalogue: "", page: "", notes: "" });
  const [adding, setAdding] = useState(false);

  const pieces = db.pieces || [];

  const add = () => {
    if (!form.ref || !form.nom) return;
    const p = { ...form, id: Date.now(), date: new Date().toLocaleDateString("fr-FR") };
    const updated = { ...db, pieces: [...pieces, p] };
    setDB(updated); saveDB(updated);
    setForm({ ref: "", nom: "", marque: "", catalogue: "", page: "", notes: "" });
    setAdding(false);
  };

  const remove = (id) => {
    const updated = { ...db, pieces: pieces.filter(p => p.id !== id) };
    setDB(updated); saveDB(updated);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="back" color={C.textMuted} /></button>
        <Icon name="book" size={20} color="#DC2626" />
        <div style={{ flex: 1, fontWeight: 700, color: C.text }}>Ma Base ({pieces.length})</div>
        <button onClick={() => setAdding(!adding)} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600 }}>+ Ajouter</button>
      </div>
      <div style={{ padding: 16 }}>
        {adding && (
          <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: C.text, marginBottom: 12 }}>Nouvelle pièce découverte terrain</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["ref", "Référence *"], ["nom", "Désignation *"], ["marque", "Marque/Compatibilité"], ["catalogue", "Catalogue source"], ["page", "Page"], ["notes", "Notes"]].map(([k, label]) => (
                <div key={k} style={{ gridColumn: k === "notes" ? "1/-1" : undefined }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{label}</div>
                  <Input value={form[k]} onChange={v => setForm(f => ({ ...f, [k]: v }))} placeholder={label} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}><Btn onClick={add} disabled={!form.ref || !form.nom}>Enregistrer</Btn></div>
          </div>
        )}

        {pieces.length === 0 && !adding
          ? <div style={{ textAlign: "center", marginTop: 60, color: C.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div>Ta base est vide pour l'instant.</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Ajoute les pièces découvertes sur le terrain !</div>
          </div>
          : pieces.map(p => (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.accent, fontSize: 14 }}>{p.ref}</span>
                    {p.catalogue && <Tag color={C.textDim}>{p.catalogue}{p.page ? ` p.${p.page}` : ""}</Tag>}
                  </div>
                  <div style={{ color: C.text, fontSize: 13 }}>{p.nom}</div>
                  {p.marque && <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{p.marque}</div>}
                  {p.notes && <div style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>{p.notes}</div>}
                </div>
                <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Icon name="trash" size={16} color="#EF4444" />
                </button>
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>Ajouté le {p.date}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [db, setDB] = useState(loadDB);
  const [pdfData, setPdfData] = useState(null);
  const [pdfName, setPdfName] = useState(null);

  const nav = (p) => setPage(p);
  const back = () => setPage("home");

  const props = { onBack: back, db, setDB };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg }}>
      {page === "home" && <Home onNav={nav} />}
      {page === "pieces" && <Pieces {...props} pdfData={pdfData} pdfName={pdfName} onPdfLoad={(d, n) => { setPdfData(d); setPdfName(n); }} />}
      {page === "clients" && <Clients {...props} />}
      {page === "synthese" && <Synthese {...props} />}
      {page === "email" && <Email {...props} />}
      {page === "devis" && <Devis {...props} pdfData={pdfData} />}
      {page === "base" && <Base {...props} />}
    </div>
  );
}
