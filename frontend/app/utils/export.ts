export function exportCSV(data:any[]) {
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(h => obj[h]));

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "physicians.csv";
  a.click();
}