import * as XLSX from "xlsx";

type DailyReport = {
  id: number;
  employee: string | null;
  report_date: string | null;
  status: string | null;
  day_start: string | null;
  day_end: string | null;
  pause1_start: string | null;
  pause1_end: string | null;
  pause2_start: string | null;
  pause2_end: string | null;
  pause3_start: string | null;
  pause3_end: string | null;
  notes: string | null;
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

function diffMinutes(start: string | null, end: string | null) {
  if (!start || !end) return 0;

  const s = new Date(`1970-01-01T${start}`);
  const e = new Date(`1970-01-01T${end}`);
  const diff = (e.getTime() - s.getTime()) / (1000 * 60);

  return diff > 0 ? diff : 0;
}

function toHours(minutes: number) {
  return Number((minutes / 60).toFixed(2));
}

function grossHours(start: string | null, end: string | null) {
  return toHours(diffMinutes(start, end));
}

function totalPauseMinutes(r: DailyReport) {
  return (
    diffMinutes(r.pause1_start, r.pause1_end) +
    diffMinutes(r.pause2_start, r.pause2_end) +
    diffMinutes(r.pause3_start, r.pause3_end)
  );
}

function netHours(r: DailyReport) {
  const gross = diffMinutes(r.day_start, r.day_end);
  const pause = totalPauseMinutes(r);
  const result = gross - pause;
  return result > 0 ? toHours(result) : 0;
}

function germanWeekday(isoDate: string | null) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("de-DE", { weekday: "long" });
}

function yearFromDate(isoDate: string | null) {
  if (!isoDate) return "";
  return new Date(isoDate).getFullYear();
}

function monthFromDate(isoDate: string | null) {
  if (!isoDate) return "";
  return new Date(isoDate).getMonth() + 1;
}

function monthStart(isoDate: string | null) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function exportStundenzettelExcel(
  reports: DailyReport[],
  _entries: ReportEntry[]
) {
  const lohnData = reports.map((r) => ({
    ID: r.id,
    Mitarbeiter: r.employee || "",
    Datum: r.report_date || "",
    Status: r.status || "",
    Arbeitsbeginn: r.day_start || "",
    Arbeitsende: r.day_end || "",
    "Pause1 Start": r.pause1_start || "",
    "Pause1 Ende": r.pause1_end || "",
    "Pause2 Start": r.pause2_start || "",
    "Pause2 Ende": r.pause2_end || "",
    "Pause3 Start": r.pause3_start || "",
    "Pause3 Ende": r.pause3_end || "",
    Bemerkungen: r.notes || "",
    Bruttostunden: grossHours(r.day_start, r.day_end),
    "Pausengesamt (Std)": toHours(totalPauseMinutes(r)),
    "Nettoarbeitszeit (Std)": netHours(r),
    "Stundenlohn EUR": "",
    "Feiertag?": "",
    Gutschrift_Iststunden: "",
    Nachtstunden: "",
    Sonntagsstunden: "",
    Feiertagsstunden: "",
    Wochentag: germanWeekday(r.report_date),
    "Grundlohn EUR": "",
    Zuschlagssatz: "",
    "Zuschlag EUR": "",
    "Gesamtlohn EUR": "",
    Monatsbeginn: monthStart(r.report_date),
    Jahr: yearFromDate(r.report_date),
    Monat: monthFromDate(r.report_date),
    "Sollstunden Monat": "",
    "Iststunden Monat": "",
    "Überstunden Monat": "",
    "Überstunden Jahr kumuliert": "",
    Hinweis: "",
  }));

  const wb = XLSX.utils.book_new();
  const wsLohn = XLSX.utils.json_to_sheet(lohnData);

  XLSX.utils.book_append_sheet(wb, wsLohn, "Lohn_Daten");
  XLSX.writeFile(wb, "lohn_export.xlsx");
}