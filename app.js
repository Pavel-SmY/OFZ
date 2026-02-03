let ofzData = [];

/* =======================
   ЗАГРУЗКА ОФЗ (MOEX)
======================= */
async function loadOFZ() {
  const url =
    'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off';

  const res = await fetch(url);
  const json = await res.json();

  const cols = json.securities.columns;
  const rows = json.securities.data;

  const i = name => cols.indexOf(name);

  ofzData = rows
    .filter(r => r[i('SECID')] && r[i('SECID')].startsWith('SU'))
    .map(r => ({
      secid: r[i('SECID')],
      matdate: r[i('MATDATE')],
      coupon: r[i('COUPONRATE')],
      price: r[i('PREVPRICE')],
      ytm: r[i('YIELD')]
    }))
    .filter(o => o.ytm && o.matdate);

  renderTable();
  buildMap();
}

/* =======================
   ТАБЛИЦА
======================= */
function renderTable() {
  const tbody = document.getElementById('ofzTable');
  tbody.innerHTML = '';

  ofzData.slice(0, 20).forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.secid}</td>
        <td>${o.matdate}</td>
        <td>${o.coupon ?? '—'}</td>
        <td>${o.price ?? '—'}</td>
        <td>${o.ytm.toFixed(2)}%</td>
      </tr>
    `;
  });
}

/* =======================
   КАРТА ДОХОДНОСТИ ОФЗ
======================= */
function buildMap() {
  const now = new Date();

  const points = ofzData.map(o => {
    const years =
      (new Date(o.matdate) - now) / (365 * 24 * 3600 * 1000);
    return { x: years, y: o.ytm };
  }).filter(p => p.x > 0 && p.x < 30);

  new Chart(document.getElementById('mapChart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'ОФЗ',
        data: points,
        backgroundColor: '#4f46e5'
      }]
    },
    options: {
      scales: {
        x: {
          title: { display: true, text: 'Срок до погашения, лет' }
        },
        y: {
          title: { display: true, text: 'Доходность YTM, %' }
        }
      }
    }
  });
}

/* =======================
   КРИВАЯ ДОХОДНОСТИ ЦБ РФ
   (MOEX ZCYC — РАБОЧАЯ)
======================= */
async function buildCurve() {
  const url =
    'https://iss.moex.com/iss/statistics/engines/stock/zcyc/params.json?iss.meta=off';

  const res = await fetch(url);
  const json = await res.json();

  const cols = json.params.columns;
  const rows = json.params.data;

  const t = cols.indexOf('TERM');
  const v = cols.indexOf('VALUE');

  const terms = [];
  const values = [];

  rows.forEach(r => {
    if (r[t] && r[v]) {
      terms.push(r[t]);
      values.push(r[v]);
    }
  });

  new Chart(document.getElementById('curveChart'), {
    type: 'line',
    data: {
      labels: terms,
      datasets: [{
        label: 'Кривая доходности ЦБ РФ',
        data: values,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.15)',
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      scales: {
        x: {
          title: { display: true, text: 'Срок, лет' }
        },
        y: {
          title: { display: true, text: 'Доходность, %' }
        }
      }
    }
  });
}

/* =======================
   ПОДБОР ОФЗ
======================= */
function selectOFZ() {
  const years = Number(document.getElementById('termSelect').value);
  const now = new Date();

  const filtered = ofzData.filter(o => {
    const y =
      (new Date(o.matdate) - now) / (365 * 24 * 3600 * 1000);
    return y <= years && y > 0;
  });

  document.getElementById('selectResult').innerText =
    filtered.length
      ? `Подходящих выпусков: ${filtered.length}`
      : 'Подходящих ОФЗ не найдено';
}

/* =======================
   INIT
======================= */
loadOFZ();
buildCurve();