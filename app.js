let ofzData = [];

async function loadOFZ() {
  const url =
    'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off';

  const res = await fetch(url);
  const json = await res.json();

  const cols = json.securities.columns;
  const rows = json.securities.data;

  const i = name => cols.indexOf(name);

  ofzData = rows
    .filter(r => r[i('SECID')]?.startsWith('SU'))
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

function buildMap() {
  const now = new Date();

  const points = ofzData.map(o => ({
    x: (new Date(o.matdate) - now) / (365 * 24 * 3600 * 1000),
    y: o.ytm
  })).filter(p => p.x > 0 && p.x < 30);

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
        x: { title: { display: true, text: 'Срок до погашения, лет' } },
        y: { title: { display: true, text: 'Доходность YTM, %' } }
      }
    }
  });
}

function selectOFZ() {
  const years = Number(document.getElementById('termSelect').value);
  const now = new Date();

  const filtered = ofzData.filter(o =>
    (new Date(o.matdate) - now) / (365 * 24 * 3600 * 1000) <= years
  );

  document.getElementById('selectResult').innerText =
    filtered.length
      ? `Подходящих выпусков: ${filtered.length}`
      : 'Подходящих ОФЗ не найдено';
}

loadOFZ();