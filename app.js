let ofzData = [];

async function loadOFZ() {
  const url =
    "https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off&iss.only=securities,marketdata";

  const res = await fetch(url);
  const json = await res.json();

  const secCols = json.securities.columns;
  const secRows = json.securities.data;
  const mdCols = json.marketdata.columns;
  const mdRows = json.marketdata.data;

  const iSec = name => secCols.indexOf(name);
  const iMd = name => mdCols.indexOf(name);

  const today = new Date();

  ofzData = secRows.map((r, idx) => {
    const mat = r[iSec("MATDATE")];
    const years =
      mat ? (new Date(mat) - today) / (365 * 24 * 3600 * 1000) : null;

    return {
      secid: r[iSec("SECID")],
      maturity: mat,
      yearsToMaturity: years,
      price: mdRows[idx]?.[iMd("LAST")],
      ytm: mdRows[idx]?.[iMd("YIELD")]
    };
  }).filter(b => b.ytm && b.yearsToMaturity > 0);

  renderTable();
  buildMap();
}

function renderTable() {
  const tbody = document.getElementById("ofzTable");
  tbody.innerHTML = "";

  ofzData.slice(0, 20).forEach(b => {
    tbody.innerHTML += `
      <tr>
        <td>${b.secid}</td>
        <td>${b.maturity}</td>
        <td>${b.price?.toFixed(2) ?? "—"}</td>
        <td>${b.ytm.toFixed(2)}%</td>
      </tr>
    `;
  });
}

function buildMap() {
  const ctx = document.getElementById("ofzMap");

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "ОФЗ",
        data: ofzData.map(b => ({
          x: b.yearsToMaturity,
          y: b.ytm,
          secid: b.secid,
          maturity: b.maturity
        })),
        backgroundColor: "#4f46e5"
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: c => {
              const p = c.raw;
              return [
                `Выпуск: ${p.secid}`,
                `Погашение: ${p.maturity}`,
                `Доходность: ${p.y.toFixed(2)}%`
              ];
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: "Срок до погашения, лет" }},
        y: { title: { display: true, text: "Доходность YTM, %" }}
      }
    }
  });
}

function pickOFZ() {
  const term = Number(document.getElementById("pickTerm").value);
  const result = document.getElementById("pickResult");

  const found = ofzData
    .filter(b => b.yearsToMaturity <= term)
    .slice(0, 3);

  if (!found.length) {
    result.innerText = "Подходящих ОФЗ не найдено.";
    return;
  }

  result.innerHTML = found.map(b => `
    <div>
      <strong>${b.secid}</strong> —
      погашение ${b.maturity},
      доходность ${b.ytm.toFixed(2)}%
    </div>
  `).join("");
}

loadOFZ();