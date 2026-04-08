"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { exportStundenzettelExcel } from "../../lib/exportExcel";

type Item = {
  id: string;
  name: string;
  cost_per_hour?: number | null;
};

<button onClick={handleExcelExport} style={buttonStyle}>
  Excel Export
</button>

export default function AdminPage() {
  const handleExcelExport = async () => {
  const { data: reports, error: reportsError } = await supabase
    .from("daily_reports")
    .select("*")
    .order("report_date", { ascending: true });

  const { data: entries, error: entriesError } = await supabase
    .from("report_entries")
    .select("*")
    .order("daily_report_id", { ascending: true });

  if (reportsError || entriesError) {
    console.error(reportsError, entriesError);
    alert("Fehler beim Export.");
    return;
  }

  exportStundenzettelExcel(reports || [], entries || []);
};

  const supabase = getSupabase();

  const [tab, setTab] = useState("activities");

  const [data, setData] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from(tab)
      .select("*")
      .order("name", { ascending: true });

    if (error) console.error(error);
    else setData(data || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const addItem = async () => {
    if (!newName.trim()) return;

    const payload: any = { name: newName.trim() };

    if (tab === "tractors" || tab === "implements") {
      payload.cost_per_hour = newCost
        ? Number(newCost.replace(",", "."))
        : null;
    }

    const { error } = await supabase.from(tab).insert([payload]);

    if (error) {
      console.error(error);
      return;
    }

    setNewName("");
    setNewCost("");
    loadData();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;

    const { error } = await supabase.from(tab).delete().eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    loadData();
  };

  return (
    <main style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Admin – Stammdaten</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("activities")}>Tätigkeiten</button>
        <button onClick={() => setTab("locations")}>Orte</button>
        <button onClick={() => setTab("tractors")}>Traktoren</button>
        <button onClick={() => setTab("implements")}>Geräte</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />

        {(tab === "tractors" || tab === "implements") && (
          <input
            placeholder="Kosten / Stunde"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
          />
        )}

        <button onClick={addItem}>Hinzufügen</button>
      </div>

      {loading ? (
        <p>Lade...</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Name</th>
              {(tab === "tractors" || tab === "implements") && (
                <th>Kosten/h</th>
              )}
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                {(tab === "tractors" || tab === "implements") && (
                  <td>{item.cost_per_hour ?? "-"}</td>
                )}
                <td>
                  <button onClick={() => deleteItem(item.id)}>
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}