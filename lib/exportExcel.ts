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
  }));

  const wb = XLSX.utils.book_new();
  const wsLohn = XLSX.utils.json_to_sheet(lohnData);

  XLSX.utils.book_append_sheet(wb, wsLohn, "Lohn_Daten");
  XLSX.writeFile(wb, "lohn_export.xlsx");
}