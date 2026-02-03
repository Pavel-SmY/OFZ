let ofzData = [];

async function loadOFZ() {
  const url =
    'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off&iss.only=securities,marketdata';

  const res = await fetch(url);
  const json = await res.json();

  const secCols = json.securities.columns;
  const secRows = json.securities.data;
  const mdCols = json.marketdata.columns;
  const mdRows = json.marketdata.data;

  const secidI = secCols.indexOf('SECID');
  const matI = secCols.indexOf('MATDATE');
  const nameI = secCols.indexOf('SHORTNAME');

  const priceI = mdCols.indexOf('LAST');
  const ytmI = mdCols.indexOf('YIELD');

  ofzData = secRows.map((r, i) => ({
    secid: r[secidI],
    matdate: r[matI],
    name: r[nameI],
    price: mdRows[i]?.[priceI],
    ytm: mdRows[i]?.[ytmI]
  })).filter(o => o.matdate && o.ytm);

  renderTable();
  buildMap();
}

function renderTable() {
  const tbody = document.getElementById('ofzTable');
  tbody.innerHTML = '';

  ofzData.slice(0, 15).forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.secid}</td>
      <td>${o.matdate}</td>
      <td>${o.price?.toFixed(2) ?? '—'}</td>
      <td>${o.ytm.toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
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
        x: { title: { display: true, text: 'Срок до погашения, лет' }},
        y: { title: { display: true, text: 'Доходность YTM, %' }}
      }
    }
  });
}

function selectOFZ() {
  const limit = Number(document.getElementById('termSelect').value);
  const now = new Date();

  const found = ofzData.filter(o => {
    const years = (new Date(o.matdate) - now) / (365 * 24 * 3600 * 1000);
    return years > 0 && years <= limit;
  });

  const res = document.getElementById('selectResult');
  res.innerText = found.length
    ? `Подходит выпусков: ${found.length}. Например: ${found[0].secid}`
    : 'Подходящих ОФЗ не найдено';
}

loadOFZ();