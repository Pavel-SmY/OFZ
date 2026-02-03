let ofzData = [];

async function loadOFZ() {
  const url = 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json';

  const res = await fetch(url);
  const json = await res.json();

  const cols = json.securities.columns;
  const rows = json.securities.data;

  const iSEC = cols.indexOf('SECID');
  const iMAT = cols.indexOf('MATDATE');
  const iCPN = cols.indexOf('COUPONRATE');
  const iPRC = cols.indexOf('PREVPRICE');
  const iYTM = cols.indexOf('YIELD');

  ofzData = rows
    .filter(r => r[iSEC]?.startsWith('SU'))
    .slice(0, 40)
    .map(r => ({
      secid: r[iSEC],
      mat: r[iMAT],
      coupon: r[iCPN],
      price: r[iPRC],
      ytm: r[iYTM]
    }));

  renderTable();
  renderMap();
  renderCurve();
}

function renderTable() {
  const tbody = document.getElementById('ofzTable');
  tbody.innerHTML = '';

  ofzData.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.secid}</td>
        <td>${o.mat || '—'}</td>
        <td>${o.coupon || '—'}</td>
        <td>${o.price || '—'}</td>
        <td>${o.ytm || '—'}</td>
      </tr>`;
  });
}

function renderMap() {
  const ctx = document.getElementById('mapChart');

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'ОФЗ',
        data: ofzData.filter(o => o.ytm).map(o => ({
          x: Math.random() * 15,
          y: o.ytm
        })),
        backgroundColor: '#4f46e5'
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Срок (лет)' } },
        y: { title: { display: true, text: 'Доходность %'} }
      }
    }
  });
}

function renderCurve() {
  const ctx = document.getElementById('curveChart');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1 год','3 года','5 лет','7 лет','10 лет'],
      datasets: [{
        label: 'Рыночная доходность',
        data: [11.2, 12.1, 12.8, 13.2, 13.5],
        borderColor: '#22c55e',
        fill: false
      }]
    }
  });
}

function selectOFZ() {
  const term = document.getElementById('term').value;
  const res = ofzData.slice(0, 2)
    .map(o => o.secid)
    .join(', ');

  document.getElementById('selectResult').innerText =
    res ? `Подходящие ОФЗ: ${res}` : 'Ничего не найдено';
}

loadOFZ();