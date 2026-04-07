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

const nowTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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
  const [saving, setSaving] = useState(false);

  const [diesel, setDiesel] = useState("");
  const [adblue, setAdblue] = useState("");
  const [oil, setOil] = useState("");

  const [locationsList, setLocationsList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [tractorsList, setTractorsList] = useState<any[]>([]);
  const [implementsList, setImplementsList] = useState<any[]>([]);

  const [screenState, setScreenState] = useState<"form" | "saved" | "goodbye">(
    "form"
  );

  useEffect(() => {
    const saved = localStorage.getItem("employee");
    if (saved) {
      setEmployee(saved);
    }
  }, []);

  useEffect(() => {
  const saved = localStorage.getItem("stundenzettel_state");

  if (saved) {
    const parsed = JSON.parse(saved);

    setEmployee(parsed.employee || null);
    setDate(parsed.date || todayString());
    setStatus(parsed.status || "arbeit");

    setDayStart(parsed.dayStart || "");
    setDayEnd(parsed.dayEnd || "");

    setPause1Start(parsed.pause1Start || "");
    setPause1End(parsed.pause1End || "");
    setPause2Start(parsed.pause2Start || "");
    setPause2End(parsed.pause2End || "");
    setPause3Start(parsed.pause3Start || "");
    setPause3End(parsed.pause3End || "");

    setNotes(parsed.notes || "");

    setDiesel(parsed.diesel || "");
    setAdblue(parsed.adblue || "");
    setOil(parsed.oil || "");

    setEntries(parsed.entries || []);
    setCurrentEntry(parsed.currentEntry || emptyEntry());
  }
}, []);

useEffect(() => {
  const dataToSave = {
    employee,
    date,
    status,
    dayStart,
    dayEnd,
    pause1Start,
    pause1End,
    pause2Start,
    pause2End,
    pause3Start,
    pause3End,
    notes,
    diesel,
    adblue,
    oil,
    entries,
    currentEntry,
  };

  localStorage.setItem("stundenzettel_state", JSON.stringify(dataToSave));
}, [
  employee,
  date,
  status,
  dayStart,
  dayEnd,
  pause1Start,
  pause1End,
  pause2Start,
  pause2End,
  pause3Start,
  pause3End,
  notes,
  diesel,
  adblue,
  oil,
  entries,
  currentEntry,
]);

  useEffect(() => {
    if (!entryMessage) return;
    const timer = setTimeout(() => setEntryMessage(""), 2200);
    return () => clearTimeout(timer);
  }, [entryMessage]);

  useEffect(() => {
    if (screenState !== "saved") return;
    const timer = setTimeout(() => setScreenState("goodbye"), 2000);
    return () => clearTimeout(timer);
  }, [screenState]);

  useEffect(() => {
    const loadData = async () => {
    const { data: locations } = await supabase.from("locations").select("*");
    const { data: activities } = await supabase.from("activities").select("*");
    const { data: tractors } = await supabase.from("tractors").select("*");
    const { data: implementsData } = await supabase.from("implements").select("*");

    setLocationsList(locations || []);
    setActivitiesList(activities || []);
    setTractorsList(tractors || []);
    setImplementsList(implementsData || []);
  };

  loadData();
}, []);

  const handleLogin = () => {
    if (!inputName.trim()) return;
    localStorage.setItem("employee", inputName.trim());
    setEmployee(inputName.trim());
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

  const calculateWorkTime = (finalDayEnd?: string) => {
    if (!dayStart || !(finalDayEnd || dayEnd)) return "0.00";

    const start = new Date(`1970-01-01T${dayStart}`);
    const end = new Date(`1970-01-01T${finalDayEnd || dayEnd}`);

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
      return;
    }
  };

  const workButtonLabel = () => {
    if (!dayStart) return "Arbeitsbeginn";
    if (!dayEnd) return "Arbeitsende";
    return "Arbeitstag erfasst";
  };

  const handlePauseButton = () => {
    const current = nowTime();

    if (!pause1Start) return setPause1Start(current);
    if (!pause1End) return setPause1End(current);

    if (!pause2Start) return setPause2Start(current);
    if (!pause2End) return setPause2End(current);

    if (!pause3Start) return setPause3Start(current);
    if (!pause3End) return setPause3End(current);
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
    if (!dayStart) {
      alert("Bitte zuerst Arbeitsbeginn drücken.");
      return;
    }

    if (!dayEnd) {
      alert("Bitte zuerst Arbeitsende drücken.");
      return;
    }

    setSaving(true);

    try {
      const finalDayEnd = dayEnd;
      const pauseMinutes = calculatePauseMinutes();
      const workHours = calculateWorkTime(finalDayEnd);

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
            day_end: finalDayEnd || null,
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
        setSaving(false);
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
            setSaving(false);
            return;
          }
        }
      }

      if (navigator.vibrate) {
        navigator.vibrate(60);
      }

      resetForm();
      setSaving(false);
      setScreenState("saved");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern.");
      setSaving(false);
      localStorage.removeItem("stundenzettel_state");
    }
  };

  const compactButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    fontSize: 17,
    fontWeight: 700,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.15)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
    color: "#0f172a",
    boxShadow:
      "0 10px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
    transition: "transform 0.08s ease, box-shadow 0.15s ease, opacity 0.15s ease",
    WebkitTapHighlightColor: "transparent",
    backdropFilter: "blur(10px)",
  };

  const inlineLabelInputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 36,
    fontSize: 14,
    padding: "6px 8px",
    borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.10)",
    textAlign: "right",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "inset 0 1px 3px rgba(15,23,42,0.08)",
    outline: "none",
  };

  const pressIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(0.98)";
  };

  const pressOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };

  const topBar = useMemo(
    () => ({
      marginBottom: 6,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    }),
    []
  );

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
          background:
            "linear-gradient(180deg, #ecfdf5 0%, #f8fafc 100%)",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(22,163,74,0.18)",
            borderRadius: 24,
            padding: 30,
            textAlign: "center",
            boxShadow: "0 18px 44px rgba(15,23,42,0.10)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div style={{ fontSize: 58, marginBottom: 12 }}>✅</div>
          <h1 style={{ margin: "0 0 10px 0", fontSize: 28, color: "#14532d" }}>
            Daten wurden erfolgreich gespeichert
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "#166534" }}>
            Ich wünsch dir einen schönen Feierabend
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
          background:
            "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 30,
            textAlign: "center",
            boxShadow: "0 18px 44px rgba(15,23,42,0.10)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 10 }}>🌙</div>
          <h1 style={{ margin: "0 0 10px 0", fontSize: 26, color: "#0f172a" }}>
            Feierabend
          </h1>
          <p style={{ margin: "0 0 20px 0", fontSize: 18, lineHeight: 1.5, color: "#334155" }}>
            Ich wünsch dir einen schönen Feierabend.
          </p>
          <button
            onClick={() => setScreenState("form")}
            onMouseDown={pressIn}
            onMouseUp={pressOut}
            onMouseLeave={pressOut}
            style={{
              ...compactButtonStyle,
              background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "1px solid #1d4ed8",
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
          minHeight: "100vh",
          padding: 18,
          maxWidth: 520,
          margin: "0 auto",
          fontFamily: "Arial, sans-serif",
          background:
            "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 20,
            background: "rgba(255,255,255,0.94)",
            display: "grid",
            gap: 12,
            boxShadow: "0 18px 40px rgba(15,23,42,0.10)",
            backdropFilter: "blur(14px)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>
            Mitarbeiter Anmeldung
          </h2>

          <input
            type="text"
            placeholder="Vor- und Nachname eingeben"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            style={{
              minHeight: 48,
              fontSize: 16,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)",
              outline: "none",
            }}
          />

          <button
            onClick={handleLogin}
            onMouseDown={pressIn}
            onMouseUp={pressOut}
            onMouseLeave={pressOut}
            style={{
              width: "100%",
              minHeight: 50,
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 16,
              border: "1px solid #1d4ed8",
              background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
              color: "white",
              boxShadow: "0 12px 28px rgba(37,99,235,0.26)",
              transition: "transform 0.08s ease",
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
        minHeight: "100vh",
        padding: 14,
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
      }}
    >
      <div style={topBar}>
        <div style={{ fontSize: 16, fontWeight: 400, color: "#475569" }}>
          {firstNameOnly(employee)}
        </div>
        <div style={{ fontSize: 16, color: "#475569" }}>{germanDate(date)}</div>
      </div>

      {entryMessage && (
        <div
          style={{
            marginBottom: 10,
            padding: 10,
            border: "1px solid rgba(15,23,42,0.08)",
            background: "rgba(255,255,255,0.88)",
            borderRadius: 14,
            fontSize: 14,
            color: "#334155",
            boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
          }}
        >
          {entryMessage}
        </div>
      )}

      <div
        style={{
          marginBottom: 10,
          padding: 12,
          borderRadius: 18,
          background: "rgba(255,255,255,0.90)",
          border: "1px solid rgba(15,23,42,0.06)",
          boxShadow: "0 14px 30px rgba(15,23,42,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontWeight: 600, color: "#334155" }}>Status: </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              marginLeft: 8,
              minHeight: 38,
              minWidth: 160,
              fontSize: 16,
              borderRadius: 10,
              border: "1px solid rgba(15,23,42,0.10)",
              background: "white",
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
            marginBottom: 10,
          }}
        >
          <button
            onClick={handleWorkButton}
            onMouseDown={pressIn}
            onMouseUp={pressOut}
            onMouseLeave={pressOut}
            style={{
              ...compactButtonStyle,
              opacity: !!dayStart && !!dayEnd ? 0.55 : 1,
            }}
          >
            {workButtonLabel()}
          </button>

          <button
            onClick={handlePauseButton}
            disabled={!!pause3Start && !!pause3End}
            onMouseDown={pressIn}
            onMouseUp={pressOut}
            onMouseLeave={pressOut}
            style={{
              ...compactButtonStyle,
              opacity: !!pause3Start && !!pause3End ? 0.55 : 1,
            }}
          >
            {pauseButtonLabel()}
          </button>

          <button
            onClick={() => setShowNotes((prev) => !prev)}
            onMouseDown={pressIn}
            onMouseUp={pressOut}
            onMouseLeave={pressOut}
            style={compactButtonStyle}
          >
            Besonderheiten
          </button>
        </div>

        {showNotes && (
          <div
            style={{
              marginBottom: 10,
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 16,
              padding: 10,
              display: "grid",
              gap: 8,
              background: "rgba(248,250,252,0.92)",
            }}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hier Besonderheiten eintragen..."
              style={{
                width: "100%",
                minHeight: 96,
                fontSize: 15,
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(15,23,42,0.12)",
                resize: "vertical",
                background: "white",
                boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)",
                outline: "none",
              }}
            />

            <button
              onClick={() => setShowNotes(false)}
              onMouseDown={pressIn}
              onMouseUp={pressOut}
              onMouseLeave={pressOut}
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
                marginBottom: 10,
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: 16,
                padding: 10,
                display: "grid",
                gap: 8,
                background: "rgba(248,250,252,0.92)",
              }}
            >
              <select
                value={currentEntry.location}
                onChange={(e) => updateCurrentEntry("location", e.target.value)}
                style={{ minHeight: 42, fontSize: 16, borderRadius: 10 }}
              >
                <select value={currentEntry.location} onChange={(e) => updateCurrentEntry("location", e.target.value)}>
  <option value="">Ort</option>
  {locationsList.map((item) => (
    <option key={item.id} value={item.name}>
      {item.name}
    </option>
  ))}
</select>

              <select
                value={currentEntry.activity}
                onChange={(e) => updateCurrentEntry("activity", e.target.value)}
                style={{ minHeight: 42, fontSize: 16, borderRadius: 10 }}
              ><select value={currentEntry.activity} onChange={(e) => updateCurrentEntry("activity", e.target.value)}>
                <option value="">Tätigkeit</option>
                {activitiesList.map((item) => (
                <option key={item.id} value={item.name}>
                {item.name}
                </option>
              ))}
            </select>
                

              <select
                value={currentEntry.tractor}
                onChange={(e) => updateCurrentEntry("tractor", e.target.value)}
                style={{ minHeight: 42, fontSize: 16, borderRadius: 10 }}
              >
                <select value={currentEntry.tractor} onChange={(e) => updateCurrentEntry("tractor", e.target.value)}>
  <option value="">Traktor</option>
  {tractorsList.map((item) => (
    <option key={item.id} value={item.name}>
      {item.name}
    </option>
  ))}
</select>

              <select
                value={currentEntry.implement}
                onChange={(e) => updateCurrentEntry("implement", e.target.value)}
                style={{ minHeight: 42, fontSize: 16, borderRadius: 10 }}
              >
                <select value={currentEntry.implement} onChange={(e) => updateCurrentEntry("implement", e.target.value)}>
  <option value="">Gerät</option>
  {implementsList.map((item) => (
    <option key={item.id} value={item.name}>
      {item.name}
    </option>
  ))}
</select>

              <button
                onClick={handleEntryTimeButton}
                disabled={!!currentEntry.start && !!currentEntry.end}
                onMouseDown={pressIn}
                onMouseUp={pressOut}
                onMouseLeave={pressOut}
                style={{
                  ...compactButtonStyle,
                  opacity: !!currentEntry.start && !!currentEntry.end ? 0.55 : 1,
                }}
              >
                {entryTimeButtonLabel()}
              </button>

              <button
                onClick={addCurrentEntry}
                onMouseDown={pressIn}
                onMouseUp={pressOut}
                onMouseLeave={pressOut}
                style={compactButtonStyle}
              >
                Tätigkeit hinzufügen
              </button>
            </div>

            <div
              style={{
                marginBottom: 10,
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: 16,
                padding: 8,
                display: "grid",
                gap: 6,
                background: "rgba(248,250,252,0.92)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Diesel
                </label>
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
                  gridTemplateColumns: "72px 1fr",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  AdBlue
                </label>
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
                  gridTemplateColumns: "72px 1fr",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Öl
                </label>
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
  disabled={!dayEnd || saving}
  onMouseDown={pressIn}
  onMouseUp={pressOut}
  onMouseLeave={pressOut}
  style={{
    ...compactButtonStyle,
    minHeight: 48,
    background:
      !dayEnd || saving
        ? "linear-gradient(180deg, #cbd5e1, #94a3b8)"
        : "linear-gradient(180deg, #2563eb, #1d4ed8)",
    border:
      !dayEnd || saving
        ? "1px solid #94a3b8"
        : "1px solid #1d4ed8",
    color: "white",
    opacity: !dayEnd || saving ? 0.85 : 1,
    boxShadow:
      !dayEnd || saving
        ? "0 8px 18px rgba(148,163,184,0.22)"
        : "0 14px 28px rgba(37,99,235,0.26)",
  }}
>
  {saving ? "Speichert..." : "Speichern"}
</button>
      </div>
    </main>
  );
}