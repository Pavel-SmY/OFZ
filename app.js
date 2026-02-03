let ofzData = [];
let chart;

async function loadOFZ() {
  const url =
    "https://iss.moex.com/iss/engines/stock/markets/bonds/securities.json?iss.meta=off&securities.columns=SECID,SHORTNAME,MATDATE,COUPONVALUE,YIELD,PREVPRICE&limit=100";

  const res = await fetch(url);
  const json = await res.json();

  ofzData = json.securities.data
    .filter(row => row[0].startsWith("SU"))
    .map(row => ({
      secid: row[0],
      name: row[1],
      matdate: row[2],
      coupon: row[3],
      ytm: row[4],
      price: row[5]
    }));

  renderTable();
  renderChart();
}

function renderTable() {
  const tbody = document.getElementById("ofzTable");
  tbody.innerHTML = "";

  ofzData.slice(0, 15).forEach(ofz => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ofz.secid}</td>
      <td>${ofz.matdate}</td>
      <td>${ofz.coupon ?? "—"}</td>
      <td>${ofz.price ?? "—"}</td>
      <td>${ofz.ytm ?? "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart() {
  const ctx = document.getElementById("ofzChart");

  const points = ofzData
    .filter(o => o.ytm && o.matdate)
    .map(o => {
      const years =
        (new Date(o.matdate) - new Date()) / (1000 * 60 * 60 * 24 * 365);
      return { x: years, y: o.ytm, label: o.secid };
    });

  chart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "ОФЗ",
          data: points,
          backgroundColor: "#2563eb"
        }
      ]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx =>
              `${ctx.raw.label}: ${ctx.raw.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Срок до погашения, лет" }
        },
        y: {
          title: { display: true, text: "Доходность, %" }
        }
      }
    }
  });
}

function selectOFZ() {
  const term = Number(document.getElementById("termSelect").value);
  const result = document.getElementById("selectResult");

  const filtered = ofzData.filter(o => {
    const years =
      (new Date(o.matdate) - new Date()) / (1000 * 60 * 60 * 24 * 365);
    return years > 0 && years <= term + 0.5;
  });

  if (!filtered.length) {
    result.textContent = "Подходящих ОФЗ не найдено";
    return;
  }

  const best = filtered.sort((a, b) => b.ytm - a.ytm)[0];
  result.textContent = `Рекомендуем: ${best.secid} с доходностью ${best.ytm}%`;
}

loadOFZ();