"use client";

import { useEffect, useState } from "react";
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

  const [saveMessage, setSaveMessage] = useState("");
  const [entryMessage, setEntryMessage] = useState("");

  const [diesel, setDiesel] = useState("");
  const [adblue, setAdblue] = useState("");
  const [oil, setOil] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("employee");
    if (saved) {
      setEmployee(saved);
    }
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(""), 60000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    if (!entryMessage) return;
    const timer = setTimeout(() => setEntryMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [entryMessage]);

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
    diff = diff - calculatePauseMinutes();

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

    const { data: report, error } = await getSupabase()
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

    setSaveMessage(
      `Gespeichert. ${employee} war ${workHours} Stunden auf Arbeit und hatte ${pauseMinutes} Minuten Pause.`
    );

    resetForm();
  };

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
        <h1 style={{ marginBottom: 16 }}>Stundenzettel</h1>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            background: "#fafafa",
            display: "grid",
            gap: 9,
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
              minHeight: 56,
              fontSize: 20,
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
      <h1 style={{ marginBottom: 16 }}>Stundenzettel</h1>

      <div
        style={{
          marginBottom: 12,
          padding: 14,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 14, }}>{employee}</div>
        <div style={{ marginTop: 4, fontSize: 14 }}>
          Datum: {germanDate(date)}
        </div>

        
      </div>

      {saveMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            border: "1px solid #198754",
            background: "#e9f7ef",
            borderRadius: 10,
            fontSize: 16,
            lineHeight: 1.4,
          }}
        >
          {saveMessage}
        </div>
      )}

      {entryMessage && (
        <div
          style={{
            marginBottom: 16,
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

      <div style={{ marginBottom: 14  }}>
        <label style={{ fontWeight: 600 }}>Status: </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            marginLeft: 8,
            minHeight: 42,
            minWidth: 160,
            fontSize: 16,
          }}
        >
          <option value="arbeit">Arbeit</option>
          <option value="krank">Krank</option>
          <option value="urlaub">Urlaub</option>
        </select>
      </div>

      {status === "arbeit" && (
        <>
          <div
  style={{
    marginBottom: 14,
    border: "1px solid #ccc",
    borderRadius: 10,
    padding: 12,
    display: "grid",
    gap: 6,
  }}
>
  <input
    type="text"
    inputMode="decimal"
    pattern="[0-9]*[.,]?[0-9]*"
    value={diesel}
    onChange={(e) => setDiesel(e.target.value)}
    placeholder="Diesel"
    style={{ minHeight: 44, fontSize: 16, padding: "8px 10px" }}
  />

  <input
    type="text"
    inputMode="decimal"
    pattern="[0-9]*[.,]?[0-9]*"
    value={adblue}
    onChange={(e) => setAdblue(e.target.value)}
    placeholder="AdBlue"
    style={{ minHeight: 44, fontSize: 16, padding: "8px 10px" }}
  />

  <input
    type="text"
    inputMode="decimal"
    pattern="[0-9]*[.,]?[0-9]*"
    value={oil}
    onChange={(e) => setOil(e.target.value)}
    placeholder="Öl"
    style={{ minHeight: 44, fontSize: 16, padding: "8px 10px" }}
  />
</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 9,
              marginBottom: 14,
            }}
          >
            <button
              onClick={handleWorkButton}
              disabled={!!dayStart && !!dayEnd}
              style={{
                width: "100%",
                minHeight: 64,
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 12,
                border: "1px solid #999",
                background: "#f4f4f4",
              }}
            >
              {workButtonLabel()}
            </button>

            <button
              onClick={handlePauseButton}
              disabled={!!pause3Start && !!pause3End}
              style={{
                width: "100%",
                minHeight: 64,
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 12,
                border: "1px solid #999",
                background: "#f4f4f4",
              }}
            >
              {pauseButtonLabel()}
            </button>
          </div>

          <button
            onClick={() => setShowNotes((prev) => !prev)}
            style={{
              width: "100%",
              minHeight: 56,
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 12,
              border: "1px solid #999",
              background: "#f4f4f4",
              marginBottom: 16,
            }}
          >
            Besonderheiten
          </button>

          {showNotes && (
            <div
              style={{
                marginBottom: 14,
                border: "1px solid #ccc",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hier Besonderheiten eintragen..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  fontSize: 16,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              />

              <button
                onClick={() => setShowNotes(false)}
                style={{
                  width: "100%",
                  minHeight: 48,
                  fontSize: 18,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "1px solid #999",
                  background: "#f4f4f4",
                }}
              >
                Fertig
              </button>
            </div>
          )}

          <h2 style={{ marginBottom: 9 }}>Tätigkeit erfassen</h2>

          <div
            style={{
              marginBottom: 16,
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <select
              value={currentEntry.location}
              onChange={(e) => updateCurrentEntry("location", e.target.value)}
              style={{ minHeight: 46, fontSize: 16 }}
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
              style={{ minHeight: 46, fontSize: 16 }}
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
              style={{ minHeight: 46, fontSize: 16 }}
            >
              <option value="">Traktor</option>
              <option>LD 222</option>
              <option>KG 700</option>
            </select>

            <select
              value={currentEntry.implement}
              onChange={(e) => updateCurrentEntry("implement", e.target.value)}
              style={{ minHeight: 46, fontSize: 16 }}
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
              style={{
                width: "100%",
                minHeight: 56,
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 12,
                border: "1px solid #999",
                background: "#f4f4f4",
              }}
            >
              {entryTimeButtonLabel()}
            </button>
          </div>

          <button
            onClick={addCurrentEntry}
            style={{
              width: "100%",
              minHeight: 56,
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 12,
              border: "1px solid #999",
              background: "#f4f4f4",
              marginBottom: 16,
            }}
          >
            Tätigkeit hinzufügen
          </button>
        </>
      )}

      <button
        onClick={saveToSupabase}
        style={{
          width: "100%",
          minHeight: 64,
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 12,
          border: "1px solid #0d6efd",
          background: "#0d6efd",
          color: "white",
        }}
      >
        Speichern
      </button>
    </main>
  );
}