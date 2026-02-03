// ===== MAP CHART (реальные выпуски, демо-данные YTM) =====
const mapCtx = document.getElementById("mapChart");

new Chart(mapCtx, {
  type: "scatter",
  data: {
    datasets: [{
      label: "ОФЗ",
      data: [
        { x: 1, y: 12.1, label: "ОФЗ 26214" },
        { x: 3, y: 12.8, label: "ОФЗ 26238" },
        { x: 5, y: 13.4, label: "ОФЗ 26240" },
        { x: 10, y: 13.9, label: "ОФЗ 26243" }
      ],
      backgroundColor: "#4f46e5"
    }]
  },
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: ctx =>
            `${ctx.raw.label}: ${ctx.raw.y}%`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: "Срок (лет)" } },
      y: { title: { display: true, text: "Доходность, %" } }
    }
  }
});

// ===== SELECTOR =====
function selectOFZ() {
  const term = document.getElementById("term").value;
  document.getElementById("selectionResult").innerHTML =
    `Подходящий вариант: ОФЗ сроком ${term} лет с фиксированным купоном`;
}

// ===== CATALOG (MOEX ISS) =====
fetch("https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json")
  .then(r => r.json())
  .then(data => {
    const rows = data.securities.data.slice(0, 10);
    const cols = data.securities.columns;

    const iSEC = cols.indexOf("SECID");
    const iMAT = cols.indexOf("MATDATE");
    const iPRICE = cols.indexOf("PREVPRICE");

    const table = document.getElementById("ofzTable");
    table.innerHTML = "";

    rows.forEach(r => {
      table.innerHTML += `
        <tr>
          <td>${r[iSEC]}</td>
          <td>${r[iMAT] || "-"}</td>
          <td>${r[iPRICE] || "-"}</td>
          <td>—</td>
        </tr>`;
    });
  });