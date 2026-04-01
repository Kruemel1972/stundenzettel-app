"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabase";

type Entry = {
  location: string;
  start: string;
  end: string;
  activity: string;
  tractor: string;
  implement: string;
};

const emptyEntry = (): Entry => ({
  location: "",
  start: "",
  end: "",
  activity: "",
  tractor: "",
  implement: "",
});

const todayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const germanDate = (isoDate: string) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
};

const firstNameOnly = (fullName: string | null) => {
  if (!fullName) return "";
  return fullName.trim().split(" ")[0] || fullName;
};

export default function Home() {
  const supabase = getSupabase();

  const [employee, setEmployee] = useState<string | null>(null);
  const [inputName, setInputName] = useState("");

  const [date, setDate] = useState(todayString());
  const [status, setStatus] = useState("arbeit");

  const [dayStart, setDayStart] = useState("");
  const [dayEnd, setDayEnd] = useState("");

  const [pause1Start, setPause1Start] = useState("");
  const [pause1End, setPause1End] = useState("");
  const [pause2Start, setPause2Start] = useState("");
  const [pause2End, setPause2End] = useState("");
  const [pause3Start, setPause3Start] = useState("");
  const [pause3End, setPause3End] = useState("");

  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Entry>(emptyEntry());

  const [entryMessage, setEntryMessage] = useState("");

  const [diesel, setDiesel] = useState("");
  const [adblue, setAdblue] = useState("");
  const [oil, setOil] = useState("");

  const [screenState, setScreenState] = useState<"form" | "saved" | "goodbye">(
    "form"
  );
  const [savedSummary, setSavedSummary] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("employee");
    if (saved) {
      setEmployee(saved);
    }
  }, []);

  useEffect(() => {
    if (!entryMessage) return;
    const timer = setTimeout(() => setEntryMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [entryMessage]);

  useEffect(() => {
    if (screenState !== "saved") return;
    const timer = setTimeout(() => {
      setScreenState("goodbye");
    }, 2000);
    return () => clearTimeout(timer);
  }, [screenState]);

  const handleLogin = () => {
    if (!inputName.trim()) return;
    localStorage.setItem("employee", inputName.trim());
    setEmployee(inputName.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem("employee");
    setEmployee(null);
    setInputName("");
  };

  const nowTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const diffMinutes = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(`1970-01-01T${start}`);
    const e = new Date(`1970-01-01T${end}`);
    const diff = (e.getTime() - s.getTime()) / (1000 * 60);
    return diff > 0 ? diff : 0;
  };

  const calculatePauseMinutes = () => {
    return (
      diffMinutes(pause1Start, pause1End) +
      diffMinutes(pause2Start, pause2End) +
      diffMinutes(pause3Start, pause3End)
    );
  };

  const calculateWorkTime = () => {
    if (!dayStart || !dayEnd) return "0.00";

    const start = new Date(`1970-01-01T${dayStart}`);
    const end = new Date(`1970-01-01T${dayEnd}`);

    let diff = (end.getTime() - start.getTime()) / (1000 * 60);
    diff -= calculatePauseMinutes();

    if (diff < 0) diff = 0;

    return (diff / 60).toFixed(2);
  };

  const hasAnyEntryData = (e: Entry) => {
    return Boolean(
      e.location || e.start || e.end || e.activity || e.tractor || e.implement
    );
  };

  const handleWorkButton = () => {
    const current = nowTime();

    if (!dayStart) {
      setDayStart(current);
      return;
    }

    if (!dayEnd) {
      setDayEnd(current);
    }
  };

  const workButtonLabel = () => {
    if (!dayStart) return "Arbeitsbeginn";
    if (!dayEnd) return "Arbeitsende";
    return "Arbeitstag erfasst";
  };

  const handlePauseButton = () => {
    const current = nowTime();

    if (!pause1Start) {
      setPause1Start(current);
      return;
    }
    if (!pause1End) {
      setPause1End(current);
      return;
    }
    if (!pause2Start) {
      setPause2Start(current);
      return;
    }
    if (!pause2End) {
      setPause2End(current);
      return;
    }
    if (!pause3Start) {
      setPause3Start(current);
      return;
    }
    if (!pause3End) {
      setPause3End(current);
    }
  };

  const pauseButtonLabel = () => {
    if (!pause1Start) return "Pause starten";
    if (!pause1End) return "Pause beenden";
    if (!pause2Start) return "Pause starten";
    if (!pause2End) return "Pause beenden";
    if (!pause3Start) return "Pause starten";
    if (!pause3End) return "Pause beenden";
    return "Pausen erfasst";
  };

  const updateCurrentEntry = (field: keyof Entry, value: string) => {
    setCurrentEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleEntryTimeButton = () => {
    const current = nowTime();

    if (!currentEntry.start) {
      setCurrentEntry((prev) => ({ ...prev, start: current }));
      return;
    }

    if (!currentEntry.end) {
      setCurrentEntry((prev) => ({ ...prev, end: current }));
    }
  };

  const entryTimeButtonLabel = () => {
    if (!currentEntry.start) return "Tätigkeit starten";
    if (!currentEntry.end) return "Tätigkeit beenden";
    return "Tätigkeit erfasst";
  };

  const addCurrentEntry = () => {
    if (!hasAnyEntryData(currentEntry)) {
      setEntryMessage("Keine Tätigkeit eingetragen.");
      return;
    }

    setEntries((prev) => [...prev, currentEntry]);

    setCurrentEntry({
      location: currentEntry.location,
      activity: currentEntry.activity,
      tractor: currentEntry.tractor,
      implement: currentEntry.implement,
      start: "",
      end: "",
    });

    setEntryMessage("Tätigkeit hinzugefügt.");
  };

  const resetForm = () => {
    setDate(todayString());
    setStatus("arbeit");
    setDayStart("");
    setDayEnd("");
    setPause1Start("");
    setPause1End("");
    setPause2Start("");
    setPause2End("");
    setPause3Start("");
    setPause3End("");
    setNotes("");
    setShowNotes(false);
    setEntries([]);
    setCurrentEntry(emptyEntry());
    setEntryMessage("");
    setDiesel("");
    setAdblue("");
    setOil("");
  };

  const saveToSupabase = async () => {
    if (!employee) {
      alert("Kein Mitarbeiter angemeldet.");
      return;
    }

    const pauseMinutes = calculatePauseMinutes();
    const workHours = calculateWorkTime();

    const allEntries = hasAnyEntryData(currentEntry)
      ? [...entries, currentEntry]
      : entries;

    const { data: report, error } = await supabase
      .from("daily_reports")
      .insert([
        {
          employee,
          report_date: date || null,
          status,
          day_start: dayStart || null,
          day_end: dayEnd || null,
          pause1_start: pause1Start || null,
          pause1_end: pause1End || null,
          pause2_start: pause2Start || null,
          pause2_end: pause2End || null,
          pause3_start: pause3Start || null,
          pause3_end: pause3End || null,
          break_minutes: pauseMinutes,
          notes: notes || null,
          diesel: diesel ? Number(diesel.replace(",", ".")) : null,
          adblue: adblue ? Number(adblue.replace(",", ".")) : null,
          oil: oil ? Number(oil.replace(",", ".")) : null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("REPORT ERROR:", error);
      alert("Fehler beim Speichern des Tageszettels");
      return;
    }

    if (status === "arbeit") {
      const entryData = allEntries
        .filter(hasAnyEntryData)
        .map((e) => ({
          daily_report_id: report.id,
          location: e.location || null,
          start_time: e.start || null,
          end_time: e.end || null,
          activity: e.activity || null,
          tractor: e.tractor || null,
          implement: e.implement || null,
        }));

      if (entryData.length > 0) {
        const { error: entriesError } = await supabase
          .from("report_entries")
          .insert(entryData);

        if (entriesError) {
          console.error("ENTRIES ERROR:", entriesError);
          alert("Fehler beim Speichern der Einsätze");
          return;
        }
      }
    }

    setSavedSummary(
      `${firstNameOnly(employee)}, deine Daten wurden erfolgreich gespeichert.`
    );

    resetForm();
    setScreenState("saved");
  };

  const compactButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 50,
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 12,
    border: "1px solid #999",
    background: "#f4f4f4",
  };

  const inlineLabelInputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 44,
    fontSize: 16,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ccc",
    textAlign: "right",
  };

  if (screenState === "saved") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Arial, sans-serif",
          background: "#f3fbf5",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "white",
            border: "1px solid #cfe8d5",
            borderRadius: 18,
            padding: 28,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h1 style={{ margin: "0 0 12px 0", fontSize: 28 }}>
            Daten wurden erfolgreich gespeichert
          </h1>
          <p style={{ margin: "0 0 8px 0", fontSize: 17, lineHeight: 1.5 }}>
            {savedSummary}
          </p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2f6f3e" }}>
            Schönen Feierabend!
          </p>
        </div>
      </main>
    );
  }

  if (screenState === "goodbye") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Arial, sans-serif",
          background: "#f8f8f8",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 18,
            padding: 28,
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: "0 0 12px 0", fontSize: 26 }}>Feierabend</h1>
          <p style={{ margin: "0 0 18px 0", fontSize: 17, lineHeight: 1.5 }}>
            Dein Arbeitstag ist abgeschlossen.
          </p>
          <p style={{ margin: "0 0 22px 0", fontSize: 15, color: "#666" }}>
            Du kannst die App jetzt schließen.
          </p>
          <button
            onClick={() => setScreenState("form")}
            style={{
              ...compactButtonStyle,
              background: "#0d6efd",
              border: "1px solid #0d6efd",
              color: "white",
            }}
          >
            Neuer Tag
          </button>
        </div>
      </main>
    );
  }

  if (!employee) {
    return (
      <main
        style={{
          padding: 16,
          maxWidth: 520,
          margin: "0 auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            background: "#fafafa",
            display: "grid",
            gap: 10,
            marginTop: 40,
          }}
        >
          <h2 style={{ margin: 0 }}>Mitarbeiter Anmeldung</h2>

          <input
            type="text"
            placeholder="Vor- und Nachname eingeben"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            style={{
              minHeight: 48,
              fontSize: 16,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              minHeight: 52,
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 12,
              border: "1px solid #0d6efd",
              background: "#0d6efd",
              color: "white",
            }}
          >
            Anmelden
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {firstNameOnly(employee)}
        </div>
        <div style={{ fontSize: 16, color: "#444" }}>{germanDate(date)}</div>
      </div>

      {entryMessage && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: "1px solid #999",
            background: "#f7f7f7",
            borderRadius: 10,
            fontSize: 15,
          }}
        >
          {entryMessage}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600 }}>Status: </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            marginLeft: 8,
            minHeight: 40,
            minWidth: 160,
            fontSize: 16,
          }}
        >
          <option value="arbeit">Arbeit</option>
          <option value="krank">Krank</option>
          <option value="urlaub">Urlaub</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <button
          onClick={handleWorkButton}
          disabled={!!dayStart && !!dayEnd}
          style={compactButtonStyle}
        >
          {workButtonLabel()}
        </button>

        <button
          onClick={handlePauseButton}
          disabled={!!pause3Start && !!pause3End}
          style={compactButtonStyle}
        >
          {pauseButtonLabel()}
        </button>

        <button
          onClick={() => setShowNotes((prev) => !prev)}
          style={compactButtonStyle}
        >
          Besonderheiten
        </button>
      </div>

      {showNotes && (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hier Besonderheiten eintragen..."
            style={{
              width: "100%",
              minHeight: 110,
              fontSize: 16,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />

          <button
            onClick={() => setShowNotes(false)}
            style={compactButtonStyle}
          >
            Fertig
          </button>
        </div>
      )}

      {status === "arbeit" && (
        <>
          <div
            style={{
              marginBottom: 14,
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 8,
            }}
          >
            <select
              value={currentEntry.location}
              onChange={(e) => updateCurrentEntry("location", e.target.value)}
              style={{ minHeight: 44, fontSize: 16 }}
            >
              <option value="">Schlag / Stall</option>
              <option>Putenstall</option>
              <option>Hähnchenstall</option>
              <option>Duxtal</option>
              <option>Königsberg</option>
            </select>

            <select
              value={currentEntry.activity}
              onChange={(e) => updateCurrentEntry("activity", e.target.value)}
              style={{ minHeight: 44, fontSize: 16 }}
            >
              <option value="">Tätigkeit</option>
              <option>Ausmisten</option>
              <option>Düngerstreuen</option>
              <option>Walzen</option>
              <option>Pflanzenschutz</option>
              <option>Einlagerung</option>
              <option>Auslagerung</option>
            </select>

            <select
              value={currentEntry.tractor}
              onChange={(e) => updateCurrentEntry("tractor", e.target.value)}
              style={{ minHeight: 44, fontSize: 16 }}
            >
              <option value="">Traktor</option>
              <option>LD 222</option>
              <option>KG 700</option>
            </select>

            <select
              value={currentEntry.implement}
              onChange={(e) => updateCurrentEntry("implement", e.target.value)}
              style={{ minHeight: 44, fontSize: 16 }}
            >
              <option value="">Gerät</option>
              <option>Spritze</option>
              <option>Walze</option>
              <option>Primera 8XL</option>
              <option>Leeb 8000</option>
              <option>Lexion8900</option>
            </select>

            <button
              onClick={handleEntryTimeButton}
              disabled={!!currentEntry.start && !!currentEntry.end}
              style={compactButtonStyle}
            >
              {entryTimeButtonLabel()}
            </button>

            <button onClick={addCurrentEntry} style={compactButtonStyle}>
              Tätigkeit hinzufügen
            </button>
          </div>

          <div
            style={{
              marginBottom: 14,
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: 10,
              }}
            >
              <label style={{ fontSize: 16, fontWeight: 600 }}>Diesel</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={diesel}
                onChange={(e) => setDiesel(e.target.value)}
                style={inlineLabelInputStyle}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: 10,
              }}
            >
              <label style={{ fontSize: 16, fontWeight: 600 }}>AdBlue</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={adblue}
                onChange={(e) => setAdblue(e.target.value)}
                style={inlineLabelInputStyle}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                alignItems: "center",
                gap: 10,
              }}
            >
              <label style={{ fontSize: 16, fontWeight: 600 }}>Öl</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={oil}
                onChange={(e) => setOil(e.target.value)}
                style={inlineLabelInputStyle}
              />
            </div>
          </div>
        </>
      )}

      <button
        onClick={saveToSupabase}
        style={{
          ...compactButtonStyle,
          background: "#0d6efd",
          border: "1px solid #0d6efd",
          color: "white",
        }}
      >
        Speichern
      </button>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 12,
          width: "100%",
          minHeight: 42,
          fontSize: 15,
          borderRadius: 10,
          border: "1px solid #ccc",
          background: "#fff",
        }}
      >
        Abmelden
      </button>
    </main>
  );
}