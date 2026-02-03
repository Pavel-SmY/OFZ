let ofzData = [];

/* Загрузка ОФЗ */
async function loadOFZ() {
  const url =
    'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off';

  const res = await fetch(url);
  const json = await res.json();

  const cols = json.securities.columns;
  const rows = json.securities.data;

  const i = name => cols.indexOf(name);

  ofzData = rows
    .filter(r => r[i('SECID')].startsWith('SU'))
    .map(r => ({
      secid: r[i('SECID')],
      matdate: r[i('MATDATE')],
      coupon: r[i('COUPONRATE')],
      price: r[i('PREVPRICE')],
      ytm: r[i('YIELD')]
    }))
    .filter(o => o.ytm);

  renderTable();
  buildMap();
}

/* Таблица */
function renderTable() {
  const tbody = document.getElementById('ofzTable');
  tbody.innerHTML = '';

  ofzData.slice(0, 15).forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.secid}</td>
        <td>${o.matdate || '—'}</td>
        <td>${o.coupon || '—'}</td>
        <td>${o.price || '—'}</td>
        <td>${o.ytm.toFixed(2)}%</td>
      </tr>
    `;
  });
}

/* Карта доходности */
function buildMap() {
  const points = ofzData.map(o => {
    const years =
      (new Date(o.matdate) - new Date()) / (365 * 24 * 3600 * 1000);
    return { x: years, y: o.ytm };
  });

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
        x: { title: { display: true, text: 'Срок (лет)' } },
        y: { title: { display: true, text: 'YTM, %' } }
      }
    }
  });
}

/* Кривая ЦБ (MOEX ZCYC) */
async function buildCurve() {
  const url =
    'https://iss.moex.com/iss/statistics/engines/stock/zcyc.json?iss.meta=off';

  const res = await fetch(url);
  const json = await res.json();

  const rows = json.zcyc.data;
  const cols = json.zcyc.columns;

  const t = cols.indexOf('TERM');
  const v = cols.indexOf('VALUE');

  new Chart(document.getElementById('curveChart'), {
    type: 'line',
    data: {
      labels: rows.map(r => r[t]),
      datasets: [{
        label: 'Кривая ЦБ РФ',
        data: rows.map(r => r[v]),
        borderColor: '#16a34a',
        fill: true,
        backgroundColor: 'rgba(22,163,74,0.15)'
      }]
    }
  });
}

/* Подбор */
function selectOFZ() {
  const years = Number(document.getElementById('termSelect').value);
  const now = new Date();

  const filtered = ofzData.filter(o => {
    const y =
      (new Date(o.matdate) - now) / (365 * 24 * 3600 * 1000);
    return y <= years;
  });

  document.getElementById('selectResult').innerText =
    filtered.length
      ? `Найдено выпусков: ${filtered.length}`
      : 'Подходящих ОФЗ не найдено';
}

/* INIT */
loadOFZ();
buildCurve();