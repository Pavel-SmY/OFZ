let ofzData = [];

function yearsToMaturity(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const mat = new Date(dateStr);
  if (Number.isNaN(mat.getTime())) return null;
  const diffMs = mat - today;
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return Number(value).toFixed(digits);
}

function updateHeroStats() {
  const avgYtm = document.getElementById("avgYtm");
  const avgTerm = document.getElementById("avgTerm");
  const countOfz = document.getElementById("countOfz");

  if (!ofzData.length) return;

  const avgYield = ofzData.reduce((sum, o) => sum + o.ytm, 0) / ofzData.length;
  const avgYears = ofzData.reduce((sum, o) => sum + o.years, 0) / ofzData.length;

  avgYtm.textContent = `${formatNumber(avgYield)}%`;
  avgTerm.textContent = `${formatNumber(avgYears, 1)} лет`;
  countOfz.textContent = `${ofzData.length}`;
}

/* LOAD OFZ */
async function loadOFZ() {
  const url = "ofz-data.json";

  const tbody = document.getElementById("ofzTable");

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    const cols = json.securities.columns;
    const rows = json.securities.data;

    const iSec = cols.indexOf("SECID");
    const iMat = cols.indexOf("MATDATE");
    const iCup = cols.indexOf("COUPONRATE");
    const iPrice = cols.indexOf("PREVPRICE");
    let iYTM = cols.indexOf("YIELDTOMATURITY");
    if (iYTM === -1) {
      iYTM = cols.indexOf("YIELD");
    }

    ofzData = rows
      .filter(r => r[iSec]?.startsWith("SU") && r[iYTM] != null)
      .map(r => {
        const years = yearsToMaturity(r[iMat]);
        return {
          secid: r[iSec],
          mat: r[iMat],
          coupon: r[iCup],
          price: r[iPrice],
          ytm: Number(r[iYTM]),
          years
        };
      })
      .filter(o => o.years != null && o.years > -0.1)
      .sort((a, b) => a.years - b.years);

    renderTable();
    renderMap();
    updateHeroStats();
  } catch (err) {
    console.error("Ошибка загрузки ОФЗ:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            Не удалось загрузить локальный файл ofz-data.json.
          </td>
        </tr>`;
    }
  }
}

/* TABLE */
function renderTable() {
  const tbody = document.getElementById("ofzTable");
  tbody.innerHTML = "";

  ofzData.slice(0, 20).forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.secid}</td>
      <td>${o.mat}</td>
      <td>${formatNumber(o.years, 1)}</td>
      <td>${formatNumber(o.coupon, 2)}</td>
      <td>${formatNumber(o.price, 2)}</td>
      <td>${formatNumber(o.ytm, 2)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

/* MAP */
function renderMap() {
  const ctx = document.getElementById("mapChart");

  const data = ofzData.map(o => ({
    x: o.years,
    y: o.ytm,
    label: o.secid
  }));

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "ОФЗ",
        data,
        backgroundColor: "#1f6f7a"
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.label}: ${ctx.raw.y.toFixed(2)}% (${ctx.raw.x.toFixed(1)} лет)`
          }
        },
        legend: { display: false }
      },
      scales: {
        x: {
          title: { display: true, text: "Срок до погашения (лет)" }
        },
        y: {
          title: { display: true, text: "Доходность, %" }
        }
      }
    }
  });
}

/* SELECT */
function selectOFZ() {
  const term = Number(document.getElementById("term").value);
  const res = ofzData
    .filter(o => o.years <= term)
    .sort((a, b) => b.ytm - a.ytm)
    .slice(0, 3);

  document.getElementById("selectResult").innerHTML =
    res.length
      ? res
          .map(o => `${o.secid} — ${formatNumber(o.ytm, 2)}% · ${formatNumber(o.years, 1)} лет`)
          .join("<br>")
      : "Подходящих ОФЗ не найдено";
}

loadOFZ();
