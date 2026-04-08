"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { exportStundenzettelExcel } from "../../lib/exportExcel";

type SimpleRow = {
  id: string;
  name: string;
};

type CostRow = {
  id: string;
  name: string;
  cost_per_hour: number | null;
};

type TabKey = "activities" | "locations" | "tractors" | "implements";

export default function AdminPage() {
  const supabase = getSupabase();

  const [activeTab, setActiveTab] = useState<TabKey>("activities");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [activities, setActivities] = useState<SimpleRow[]>([]);
  const [locations, setLocations] = useState<SimpleRow[]>([]);
  const [tractors, setTractors] = useState<CostRow[]>([]);
  const [implementsList, setImplementsList] = useState<CostRow[]>([]);

  const [newActivity, setNewActivity] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newTractorName, setNewTractorName] = useState("");
  const [newTractorCost, setNewTractorCost] = useState("");
  const [newImplementName, setNewImplementName] = useState("");
  const [newImplementCost, setNewImplementCost] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!message && !errorMessage) return;
    const timer = setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, errorMessage]);

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage("");

    const [
      { data: activitiesData, error: activitiesError },
      { data: locationsData, error: locationsError },
      { data: tractorsData, error: tractorsError },
      { data: implementsData, error: implementsError },
    ] = await Promise.all([
      supabase.from("activities").select("id, name").order("name", { ascending: true }),
      supabase.from("locations").select("id, name").order("name", { ascending: true }),
      supabase
        .from("tractors")
        .select("id, name, cost_per_hour")
        .order("name", { ascending: true }),
      supabase
        .from("implements")
        .select("id, name, cost_per_hour")
        .order("name", { ascending: true }),
    ]);

    if (activitiesError || locationsError || tractorsError || implementsError) {
      console.error(
        "LOAD ERROR:",
        activitiesError,
        locationsError,
        tractorsError,
        implementsError
      );
      setErrorMessage("Fehler beim Laden der Stammdaten.");
      setLoading(false);
      return;
    }

    setActivities((activitiesData as SimpleRow[]) || []);
    setLocations((locationsData as SimpleRow[]) || []);
    setTractors((tractorsData as CostRow[]) || []);
    setImplementsList((implementsData as CostRow[]) || []);

    setLoading(false);
  };

  const handleExcelExport = async () => {
    setExporting(true);
    setErrorMessage("");

    const { data: reports, error: reportsError } = await supabase
      .from("daily_reports")
      .select("*")
      .order("report_date", { ascending: true });

    const { data: entries, error: entriesError } = await supabase
      .from("report_entries")
      .select("*")
      .order("daily_report_id", { ascending: true });

    if (reportsError || entriesError) {
      console.error("EXPORT ERROR:", reportsError, entriesError);
      setErrorMessage("Fehler beim Excel-Export.");
      setExporting(false);
      return;
    }

    exportStundenzettelExcel(reports || [], entries || []);
    setMessage("Excel-Datei wurde exportiert.");
    setExporting(false);
  };

  const normalizedNumber = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value.replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const addActivity = async () => {
    if (!newActivity.trim()) return;
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("activities")
      .insert([{ name: newActivity.trim() }]);

    if (error) {
      console.error(error);
      setErrorMessage("Tätigkeit konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNewActivity("");
    setMessage("Tätigkeit gespeichert.");
    await loadAll();
    setSaving(false);
  };

  const addLocation = async () => {
    if (!newLocation.trim()) return;
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("locations")
      .insert([{ name: newLocation.trim() }]);

    if (error) {
      console.error(error);
      setErrorMessage("Ort konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNewLocation("");
    setMessage("Ort gespeichert.");
    await loadAll();
    setSaving(false);
  };

  const addTractor = async () => {
    if (!newTractorName.trim()) return;
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("tractors").insert([
      {
        name: newTractorName.trim(),
        cost_per_hour: normalizedNumber(newTractorCost),
      },
    ]);

    if (error) {
      console.error(error);
      setErrorMessage("Traktor konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNewTractorName("");
    setNewTractorCost("");
    setMessage("Traktor gespeichert.");
    await loadAll();
    setSaving(false);
  };

  const addImplement = async () => {
    if (!newImplementName.trim()) return;
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("implements").insert([
      {
        name: newImplementName.trim(),
        cost_per_hour: normalizedNumber(newImplementCost),
      },
    ]);

    if (error) {
      console.error(error);
      setErrorMessage("Gerät konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNewImplementName("");
    setNewImplementCost("");
    setMessage("Gerät gespeichert.");
    await loadAll();
    setSaving(false);
  };

  const deleteSimple = async (
    table: "activities" | "locations",
    id: string,
    label: string
  ) => {
    const ok = window.confirm(`${label} wirklich löschen?`);
    if (!ok) return;

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      console.error(error);
      setErrorMessage(`${label} konnte nicht gelöscht werden.`);
      setSaving(false);
      return;
    }

    setMessage(`${label} gelöscht.`);
    await loadAll();
    setSaving(false);
  };

  const deleteCost = async (
    table: "tractors" | "implements",
    id: string,
    label: string
  ) => {
    const ok = window.confirm(`${label} wirklich löschen?`);
    if (!ok) return;

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      console.error(error);
      setErrorMessage(`${label} konnte nicht gelöscht werden.`);
      setSaving(false);
      return;
    }

    setMessage(`${label} gelöscht.`);
    await loadAll();
    setSaving(false);
  };

  const updateCost = async (
    table: "tractors" | "implements",
    id: string,
    value: string
  ) => {
    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from(table)
      .update({ cost_per_hour: normalizedNumber(value) })
      .eq("id", id);

    if (error) {
      console.error(error);
      setErrorMessage("Kosten konnten nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setMessage("Kosten gespeichert.");
    await loadAll();
    setSaving(false);
  };

  const title = useMemo(() => {
    switch (activeTab) {
      case "activities":
        return "Tätigkeiten";
      case "locations":
        return "Orte / Schläge / Ställe";
      case "tractors":
        return "Traktoren / Maschinen";
      case "implements":
        return "Geräte";
    }
  }, [activeTab]);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    color: "#0f172a",
  };

  const wrapStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 20,
    boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
    padding: 20,
  };

  const inputStyle: React.CSSProperties = {
    minHeight: 42,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.12)",
    fontSize: 15,
    background: "white",
    outline: "none",
  };

  const primaryButtonStyle: React.CSSProperties = {
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #1d4ed8",
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };

  const exportButtonStyle: React.CSSProperties = {
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #16a34a",
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };

  const tabButton = (key: TabKey, label: string) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        minHeight: 44,
        padding: "0 14px",
        borderRadius: 12,
        border:
          activeTab === key
            ? "1px solid #1d4ed8"
            : "1px solid rgba(15,23,42,0.10)",
        background:
          activeTab === key
            ? "linear-gradient(180deg, #2563eb, #1d4ed8)"
            : "white",
        color: activeTab === key ? "white" : "#0f172a",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={wrapStyle}>
          <div style={cardStyle}>Lade Stammdaten...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 30 }}>Admin – Stammdaten</h1>

            <button
              onClick={handleExcelExport}
              style={exportButtonStyle}
              disabled={exporting}
            >
              {exporting ? "Export läuft..." : "Excel Export"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {tabButton("activities", "Tätigkeiten")}
            {tabButton("locations", "Orte")}
            {tabButton("tractors", "Traktoren")}
            {tabButton("implements", "Geräte")}
          </div>
        </div>

        {(message || errorMessage) && (
          <div
            style={{
              ...cardStyle,
              marginBottom: 18,
              border: errorMessage
                ? "1px solid rgba(220,38,38,0.22)"
                : "1px solid rgba(22,163,74,0.22)",
              color: errorMessage ? "#991b1b" : "#166534",
            }}
          >
            {errorMessage || message}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 18 }}>{title}</h2>

          {activeTab === "activities" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 180px",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <input
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Neue Tätigkeit eingeben"
                  style={inputStyle}
                />
                <button
                  onClick={addActivity}
                  style={primaryButtonStyle}
                  disabled={saving}
                >
                  Hinzufügen
                </button>
              </div>

              <SimpleTable
                rows={activities}
                onDelete={(id, name) =>
                  deleteSimple("activities", id, `Tätigkeit "${name}"`)
                }
              />
            </>
          )}

          {activeTab === "locations" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 180px",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Neuen Ort / Schlag / Stall eingeben"
                  style={inputStyle}
                />
                <button
                  onClick={addLocation}
                  style={primaryButtonStyle}
                  disabled={saving}
                >
                  Hinzufügen
                </button>
              </div>

              <SimpleTable
                rows={locations}
                onDelete={(id, name) =>
                  deleteSimple("locations", id, `Ort "${name}"`)
                }
              />
            </>
          )}

          {activeTab === "tractors" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 180px 180px",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <input
                  value={newTractorName}
                  onChange={(e) => setNewTractorName(e.target.value)}
                  placeholder="Neuen Traktor eingeben"
                  style={inputStyle}
                />
                <input
                  value={newTractorCost}
                  onChange={(e) => setNewTractorCost(e.target.value)}
                  placeholder="Kosten/Stunde"
                  inputMode="decimal"
                  style={inputStyle}
                />
                <button
                  onClick={addTractor}
                  style={primaryButtonStyle}
                  disabled={saving}
                >
                  Hinzufügen
                </button>
              </div>

              <CostTable
                rows={tractors}
                onDelete={(id, name) =>
                  deleteCost("tractors", id, `Traktor "${name}"`)
                }
                onSaveCost={(id, value) => updateCost("tractors", id, value)}
              />
            </>
          )}

          {activeTab === "implements" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 180px 180px",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <input
                  value={newImplementName}
                  onChange={(e) => setNewImplementName(e.target.value)}
                  placeholder="Neues Gerät eingeben"
                  style={inputStyle}
                />
                <input
                  value={newImplementCost}
                  onChange={(e) => setNewImplementCost(e.target.value)}
                  placeholder="Kosten/Stunde"
                  inputMode="decimal"
                  style={inputStyle}
                />
                <button
                  onClick={addImplement}
                  style={primaryButtonStyle}
                  disabled={saving}
                >
                  Hinzufügen
                </button>
              </div>

              <CostTable
                rows={implementsList}
                onDelete={(id, name) =>
                  deleteCost("implements", id, `Gerät "${name}"`)
                }
                onSaveCost={(id, value) => updateCost("implements", id, value)}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function SimpleTable({
  rows,
  onDelete,
}: {
  rows: SimpleRow[];
  onDelete: (id: string, name: string) => void;
}) {
  if (rows.length === 0) {
    return <div>Noch keine Einträge vorhanden.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>{row.name}</td>
              <td style={tdStyle}>
                <button
                  onClick={() => onDelete(row.id, row.name)}
                  style={deleteButtonStyle}
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CostTable({
  rows,
  onDelete,
  onSaveCost,
}: {
  rows: CostRow[];
  onDelete: (id: string, name: string) => void;
  onSaveCost: (id: string, value: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    rows.forEach((row) => {
      nextDrafts[row.id] =
        row.cost_per_hour == null ? "" : String(row.cost_per_hour).replace(".", ",");
    });
    setDrafts(nextDrafts);
  }, [rows]);

  if (rows.length === 0) {
    return <div>Noch keine Einträge vorhanden.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Kosten pro Stunde</th>
            <th style={thStyle}>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>{row.name}</td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={drafts[row.id] || ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    inputMode="decimal"
                    style={{
                      minHeight: 36,
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      width: 120,
                    }}
                  />
                  <button
                    onClick={() => onSaveCost(row.id, drafts[row.id] || "")}
                    style={saveSmallButtonStyle}
                  >
                    Speichern
                  </button>
                </div>
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => onDelete(row.id, row.name)}
                  style={deleteButtonStyle}
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
};

const deleteButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #dc2626",
  background: "white",
  color: "#dc2626",
  fontWeight: 700,
  cursor: "pointer",
};

const saveSmallButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};