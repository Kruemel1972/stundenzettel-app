"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getsupabase } from "../../../lib/supabase";

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

type LocationRow = {
  name: string;
  location_type: string | null;
  company_id: number | null;
};

type CompanyRow = {
  id: number;
  name: string;
};

type EmployeeRow = {
  name: string;
  hourly_rate: number | null;
};

type TractorRow = {
  name: string;
  cost_per_hour: number | null;
};

type ImplementRow = {
  name: string;
  cost_per_hour: number | null;
};

type ActivityRow = {
  name: string;
  billing_type: string | null;
};

type LocationMap = {
  [key: string]: {
    companyName: string | null;
    locationType: string | null;
  };
};

type CostMaps = {
  employeeRate: number;
  tractorMap: Record<string, number>;
  implementMap: Record<string, number>;
  activityBillingMap: Record<string, string>;
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
  diff -= breakMinutes || 0;

  if (diff < 0) diff = 0;

  return `${(diff / 60).toFixed(2)} h`;
};

const entryHours = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;

  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);

  let diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);

  if (diff < 0) diff = 0;

  return diff;
};

export default function ReportDetailPage() {
  const supabase = getSupabase();
  const params = useParams<{ id: string }>();

  const [report, setReport] = useState<Report | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locationMap, setLocationMap] = useState<LocationMap>({});
  const [costMaps, setCostMaps] = useState<CostMaps>({
    employeeRate: 0,
    tractorMap: {},
    implementMap: {},
    activityBillingMap: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const reportId = Number(params.id);

      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (reportError || !reportData) {
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
        setEntries([]);
      } else {
        setEntries((entryData as Entry[]) || []);
      }

      const { data: locationsData } = await supabase
        .from("locations")
        .select("name, location_type, company_id");

      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name");

      const { data: employeesData } = await supabase
        .from("employees")
        .select("name, hourly_rate");

      const { data: tractorsData } = await supabase
        .from("tractors")
        .select("name, cost_per_hour");

      const { data: implementsData } = await supabase
        .from("implements")
        .select("name, cost_per_hour");

      const { data: activitiesData } = await supabase
        .from("activities")
        .select("name, billing_type");

      const companyById: Record<number, string> = {};
      (companiesData as CompanyRow[] | null)?.forEach((company) => {
        companyById[company.id] = company.name;
      });

      const mappedLocations: LocationMap = {};
      (locationsData as LocationRow[] | null)?.forEach((loc) => {
        mappedLocations[loc.name] = {
          companyName: loc.company_id ? companyById[loc.company_id] || null : null,
          locationType: loc.location_type || null,
        };
      });
      setLocationMap(mappedLocations);

      const employeeRate =
        (employeesData as EmployeeRow[] | null)?.find(
          (employee) => employee.name === reportData.employee
        )?.hourly_rate || 0;

      const tractorMap: Record<string, number> = {};
      (tractorsData as TractorRow[] | null)?.forEach((tractor) => {
        tractorMap[tractor.name] = Number(tractor.cost_per_hour || 0);
      });

      const implementMap: Record<string, number> = {};
      (implementsData as ImplementRow[] | null)?.forEach((implement) => {
        implementMap[implement.name] = Number(implement.cost_per_hour || 0);
      });

      const activityBillingMap: Record<string, string> = {};
      (activitiesData as ActivityRow[] | null)?.forEach((activity) => {
        activityBillingMap[activity.name] = activity.billing_type || "";
      });

      setCostMaps({
        employeeRate: Number(employeeRate || 0),
        tractorMap,
        implementMap,
        activityBillingMap,
      });
    } catch (error) {
      console.error("DETAIL PAGE UNEXPECTED ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const entryCosts = useMemo(() => {
    return entries.map((entry) => {
      const hours = entryHours(entry.start_time, entry.end_time);
      const billingType = entry.activity
        ? costMaps.activityBillingMap[entry.activity] || ""
        : "";

      const employeeCost =
        billingType === "hour" ? hours * costMaps.employeeRate : 0;

      const tractorCost =
        billingType === "hour"
          ? hours * (costMaps.tractorMap[entry.tractor || ""] || 0)
          : 0;

      const implementCost =
        billingType === "hour"
          ? hours * (costMaps.implementMap[entry.implement || ""] || 0)
          : 0;

      const total = employeeCost + tractorCost + implementCost;

      return {
        entryId: entry.id,
        hours,
        billingType,
        employeeCost,
        tractorCost,
        implementCost,
        total,
      };
    });
  }, [entries, costMaps]);

  const totalDayCost = useMemo(() => {
    return entryCosts.reduce((sum, item) => sum + item.total, 0);
  }, [entryCosts]);

  const totalByCompany = useMemo(() => {
    const sums: Record<string, number> = {};

    entries.forEach((entry) => {
      const info = entry.location ? locationMap[entry.location] : null;
      const companyName = info?.companyName || "Nicht zugeordnet";
      const cost = entryCosts.find((c) => c.entryId === entry.id)?.total || 0;

      sums[companyName] = (sums[companyName] || 0) + cost;
    });

    return sums;
  }, [entries, entryCosts, locationMap]);

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
        maxWidth: 1400,
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
          {calculateNetHours(
            report.day_start,
            report.day_end,
            report.break_minutes
          )}
        </div>
        <div>
          <strong>Diesel:</strong>{" "}
          {report.diesel != null ? `${report.diesel} L` : "-"}
        </div>
        <div>
          <strong>AdBlue:</strong>{" "}
          {report.adblue != null ? `${report.adblue} L` : "-"}
        </div>
        <div>
          <strong>Öl:</strong>{" "}
          {report.oil != null ? `${report.oil} L` : "-"}
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
          <strong>Pause 1:</strong> {formatTime(report.pause1_start)} -{" "}
          {formatTime(report.pause1_end)}
        </div>
        <div>
          <strong>Pause 2:</strong> {formatTime(report.pause2_start)} -{" "}
          {formatTime(report.pause2_end)}
        </div>
        <div>
          <strong>Pause 3:</strong> {formatTime(report.pause3_start)} -{" "}
          {formatTime(report.pause3_end)}
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
        <h2 style={{ margin: 0 }}>Kostenübersicht</h2>
        <div>
          <strong>Mitarbeiterkostensatz:</strong>{" "}
          {costMaps.employeeRate.toFixed(2)} € / h
        </div>
        <div>
          <strong>Gesamtkosten Tageszettel:</strong> {totalDayCost.toFixed(2)} €
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>Kosten je Betrieb:</strong>
          <div style={{ marginTop: 8 }}>
            {Object.keys(totalByCompany).length === 0 ? (
              <div>-</div>
            ) : (
              Object.entries(totalByCompany).map(([company, total]) => (
                <div key={company}>
                  {company}: {total.toFixed(2)} €
                </div>
              ))
            )}
          </div>
        </div>
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
                <th style={thStyle}>Abrechnung</th>
                <th style={thStyle}>Traktor</th>
                <th style={thStyle}>Gerät</th>
                <th style={thStyle}>Kosten</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const info = entry.location ? locationMap[entry.location] : null;
                const cost = entryCosts.find((c) => c.entryId === entry.id);

                return (
                  <tr key={entry.id}>
                    <td style={tdStyle}>{entry.location || "-"}</td>
                    <td style={tdStyle}>{info?.locationType || "-"}</td>
                    <td style={tdStyle}>{info?.companyName || "-"}</td>
                    <td style={tdStyle}>{formatTime(entry.start_time)}</td>
                    <td style={tdStyle}>{formatTime(entry.end_time)}</td>
                    <td style={tdStyle}>
                      {cost ? `${cost.hours.toFixed(2)} h` : "-"}
                    </td>
                    <td style={tdStyle}>{entry.activity || "-"}</td>
                    <td style={tdStyle}>
                      {cost?.billingType === "hour"
                        ? "Stunde"
                        : cost?.billingType === "hectare"
                        ? "Hektar"
                        : "-"}
                    </td>
                    <td style={tdStyle}>{entry.tractor || "-"}</td>
                    <td style={tdStyle}>{entry.implement || "-"}</td>
                    <td style={tdStyle}>
                      {cost ? `${cost.total.toFixed(2)} €` : "-"}
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