import * as XLSX from "xlsx";

type DailyReport = {
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

type ReportEntry = {
  id: number;
  daily_report_id: number;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  activity: string | null;
  tractor: string | null;
  implement: string | null;
};

const diffHours = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;

  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);

  return diff > 0 ? diff : 0;
};

const weekdayGerman = (isoDate: string | null) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("de-DE", { weekday: "long" });
};

const grossHours = (start: string | null, end: string | null) => {
  return diffHours(start, end);
};

const netHours = (
  start: string | null,
  end: string | null,
  breakMinutes: number | null
) => {
  const gross = diffHours(start, end);
  const breakHours = (breakMinutes || 0) / 60;
  const result = gross - breakHours;
  return result > 0 ? Number(result.toFixed(2)) : 0;
};

export function exportStundenzettelExcel(
  reports: DailyReport[],
  entries: ReportEntry[]
) {
  const lohnData = reports.map((r) => ({
    Tageszettel_ID: r.id,
    Mitarbeiter: r.employee || "",
    Datum: r.report_date || "",
    Wochentag: weekdayGerman(r.report_date),
    Status: r.status || "",
    Arbeitsbeginn: r.day_start || "",
    Arbeitsende: r.day_end || "",
    Pause1_Start: r.pause1_start || "",
    Pause1_Ende: r.pause1_end || "",
    Pause2_Start: r.pause2_start || "",
    Pause2_Ende: r.pause2_end || "",
    Pause3_Start: r.pause3_start || "",
    Pause3_Ende: r.pause3_end || "",
    Pause_gesamt_Minuten: r.break_minutes || 0,
    Bruttostunden: Number(grossHours(r.day_start, r.day_end).toFixed(2)),
    Nettoarbeitszeit: netHours(r.day_start, r.day_end, r.break_minutes),
    Diesel: r.diesel ?? "",
    AdBlue: r.adblue ?? "",
    Oel: r.oil ?? "",
    Besonderheiten: r.notes || "",
  }));

  const reportMap = new Map<number, DailyReport>();
  reports.forEach((r) => reportMap.set(r.id, r));

  const abrechnungData = entries.map((e) => {
    const report = reportMap.get(e.daily_report_id);

    return {
      Tageszettel_ID: e.daily_report_id,
      Mitarbeiter: report?.employee || "",
      Datum: report?.report_date || "",
      Status: report?.status || "",
      Ort: e.location || "",
      Tätigkeit: e.activity || "",
      Traktor: e.tractor || "",
      Gerät: e.implement || "",
      Beginn: e.start_time || "",
      Ende: e.end_time || "",
      Dauer_Stunden: Number(diffHours(e.start_time, e.end_time).toFixed(2)),
      Diesel: report?.diesel ?? "",
      AdBlue: report?.adblue ?? "",
      Oel: report?.oil ?? "",
      Besonderheiten: report?.notes || "",
    };
  });

  const wb = XLSX.utils.book_new();

  const wsLohn = XLSX.utils.json_to_sheet(lohnData);
  const wsAbrechnung = XLSX.utils.json_to_sheet(abrechnungData);

  XLSX.utils.book_append_sheet(wb, wsLohn, "Lohn_Daten");
  XLSX.utils.book_append_sheet(wb, wsAbrechnung, "Abrechnung_Daten");

  XLSX.writeFile(wb, "stundenzettel_export.xlsx");
}