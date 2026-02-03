let ofzData = [];

/* LOAD OFZ */
async function loadOFZ() {
  // Для GitHub Pages и любой статики берём данные из ofz-data.json (обновляется скриптом/CI)
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
    const iYTM = cols.indexOf("YIELDTOMATURITY");

    ofzData = rows
      .filter(r => r[iYTM])
      .map(r => ({
        secid: r[iSec],
        mat: r[iMat],
        coupon: r[iCup],
        price: r[iPrice],
        ytm: r[iYTM]
      }));

    renderTable();
    renderMap();
  } catch (err) {
    console.error("Ошибка загрузки ОФЗ:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            Не удалось загрузить локальный файл с данными ofz-data.json.
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
      <td>${o.coupon ?? "—"}</td>
      <td>${o.price ?? "—"}</td>
      <td>${o.ytm.toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

/* MAP */
function renderMap() {
  const ctx = document.getElementById("mapChart");

  const data = ofzData.map(o => ({
    x: Math.random() * 15, // упрощённо
    y: o.ytm,
    label: o.secid
  }));

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "ОФЗ",
        data,
        backgroundColor: "#2563eb"
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.label}: ${ctx.raw.y.toFixed(2)}%`
          }
        }
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
  const term = document.getElementById("term").value;
  const res = ofzData.slice(0, 3);

  document.getElementById("selectResult").innerHTML =
    res.length
      ? res.map(o => `${o.secid} — ${o.ytm.toFixed(2)}%`).join("<br>")
      : "Подходящих ОФЗ не найдено";
}

loadOFZ();