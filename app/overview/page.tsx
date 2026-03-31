"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Report = {
  id: number;
  employee: string | null;
  report_date: string | null;
  status: string | null;
  day_start: string | null;
  day_end: string | null;
  break_minutes: number | null;
  pause1_start: string | null;
  pause1_end: string | null;
  pause2_start: string | null;
  pause2_end: string | null;
  pause3_start: string | null;
  pause3_end: string | null;
  notes: string | null;
  diesel: number | null;
adblue: number | null;
oil: number | null;
};

type Entry = {
  id: number;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  activity: string | null;
  tractor: string | null;
  implement: string | null;
};

type LocationMap = {
  [key: string]: {
    companyName: string | null;
    locationType: string | null;
  };
};

const formatGermanDate = (isoDate: string | null) => {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
};

const formatTime = (time: string | null) => {
  if (!time) return "-";
  return time.slice(0, 5);
};

const calculateNetHours = (
  start: string | null,
  end: string | null,
  breakMinutes: number | null
) => {
  if (!start || !end) return "-";

  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);

  let diff = (e.getTime() - s.getTime()) / (1000 * 60);
  diff = diff - (breakMinutes || 0);

  if (diff < 0) diff = 0;

  return `${(diff / 60).toFixed(2)} h`;
};

const calculateEntryHours = (start: string | null, end: string | null) => {
  if (!start || !end) return "-";

  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);

  let diff = (e.getTime() - s.getTime()) / (1000 * 60);
  if (diff < 0) diff = 0;

  return `${(diff / 60).toFixed(2)} h`;
};

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();

  const [report, setReport] = useState<Report | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locationMap, setLocationMap] = useState<LocationMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetchData();
  }, [params?.id]);

  const fetchData = async () => {
    setLoading(true);
    const reportId = Number(params.id);

    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError) {
      console.error("DETAIL REPORT ERROR:", reportError);
      setLoading(false);
      return;
    }

    setReport(reportData);

    const { data: entryData, error: entryError } = await supabase
      .from("report_entries")
      .select("*")
      .eq("daily_report_id", reportId)
      .order("id", { ascending: true });

    if (entryError) {
      console.error("DETAIL ENTRIES ERROR:", entryError);
      setLoading(false);
      return;
    }

    const entriesResult = entryData || [];
    setEntries(entriesResult);

    const { data: locationData, error: locationError } = await supabase
      .from("locations")
      .select(`
        name,
        location_type,
        companies (
          name
        )
      `);

    if (locationError) {
      console.error("LOCATION MAP ERROR:", locationError);
      setLoading(false);
      return;
    }

    const mapped: LocationMap = {};

    (locationData || []).forEach((item: any) => {
      mapped[item.name] = {
        companyName: item.companies?.name || null,
        locationType: item.location_type || null,
      };
    });

    setLocationMap(mapped);
    setLoading(false);
  };

  if (loading) {
    return (
      <main style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
        Lade Detailansicht...
      </main>
    );
  }

  if (!report) {
    return (
      <main style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
        Kein Tageszettel gefunden.
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 1300,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>Detailansicht Tageszettel</h1>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fafafa",
        }}
      >
        <div><strong>Mitarbeiter:</strong> {report.employee || "-"}</div>
        <div><strong>Datum:</strong> {formatGermanDate(report.report_date)}</div>
        <div><strong>Status:</strong> {report.status || "-"}</div>
        <div><strong>Arbeitsbeginn:</strong> {formatTime(report.day_start)}</div>
        <div><strong>Arbeitsende:</strong> {formatTime(report.day_end)}</div>
        <div>
          <strong>Pause gesamt:</strong>{" "}
          {report.break_minutes != null ? `${report.break_minutes} min` : "-"}
        </div>
        <div>
          <strong>Nettoarbeitszeit:</strong>{" "}
          {calculateNetHours(report.day_start, report.day_end, report.break_minutes)}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fafafa",
        }}
      >
        <h2 style={{ margin: 0 }}>Pausen</h2>
        <div>
          <strong>Pause 1:</strong> {formatTime(report.pause1_start)} - {formatTime(report.pause1_end)}
        </div>
        <div>
          <strong>Pause 2:</strong> {formatTime(report.pause2_start)} - {formatTime(report.pause2_end)}
        </div>
        <div>
          <strong>Pause 3:</strong> {formatTime(report.pause3_start)} - {formatTime(report.pause3_end)}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fafafa",
        }}
      >
        <h2 style={{ margin: 0 }}>Besonderheiten</h2>
        <div>{report.notes || "-"}</div>
      </div>

      <h2 style={{ marginBottom: 12 }}>Tätigkeiten</h2>

      {entries.length === 0 ? (
        <div>Keine Tätigkeiten vorhanden.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
            }}
          >
            <thead>
              <tr style={{ background: "#f4f4f4" }}>
                <th style={thStyle}>Schlag / Stall</th>
                <th style={thStyle}>Typ</th>
                <th style={thStyle}>Betrieb</th>
                <th style={thStyle}>Beginn</th>
                <th style={thStyle}>Ende</th>
                <th style={thStyle}>Dauer</th>
                <th style={thStyle}>Tätigkeit</th>
                <th style={thStyle}>Traktor</th>
                <th style={thStyle}>Gerät</th>
                <th style={thStyle}>Diesel</th>
<th style={thStyle}>AdBlue</th>
<th style={thStyle}>Öl</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const locationInfo = entry.location
                  ? locationMap[entry.location]
                  : null;

                return (
                  <tr key={entry.id}>
                    <td style={tdStyle}>{entry.location || "-"}</td>
                    <td style={tdStyle}>{locationInfo?.locationType || "-"}</td>
                    <td style={tdStyle}>{locationInfo?.companyName || "-"}</td>
                    <td style={tdStyle}>{formatTime(entry.start_time)}</td>
                    <td style={tdStyle}>{formatTime(entry.end_time)}</td>
                    <td style={tdStyle}>
                      {calculateEntryHours(entry.start_time, entry.end_time)}
                    </td>
                    <td style={tdStyle}>{entry.activity || "-"}</td>
                    <td style={tdStyle}>{entry.tractor || "-"}</td>
                    <td style={tdStyle}>{entry.implement || "-"}</td>
                    <td style={tdStyle}>
  {report.diesel != null ? `${report.diesel} L` : "-"}
</td>
<td style={tdStyle}>
  {report.adblue != null ? `${report.adblue} L` : "-"}
</td>
<td style={tdStyle}>
  {report.oil != null ? `${report.oil} L` : "-"}
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 10,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 10,
  whiteSpace: "nowrap",
  verticalAlign: "top",
};