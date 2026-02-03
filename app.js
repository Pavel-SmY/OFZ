let ofzPoints = [];

async function loadOFZ() {
  const url =
    'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json' +
    '?iss.meta=off&iss.only=securities,marketdata' +
    '&securities.columns=SECID,MATDATE,COUPONPERCENT' +
    '&marketdata.columns=SECID,LAST,YIELD';

  const res = await fetch(url);
  const data = await res.json();

  const sec = data.securities.data;
  const md = data.marketdata.data;

  const mdMap = {};
  md.forEach(r => mdMap[r[0]] = r);

  const tbody = document.getElementById('ofzTable');
  tbody.innerHTML = '';

  const now = new Date();

  sec.forEach(s => {
    const mdRow = mdMap[s[0]];
    if (!mdRow || !mdRow[2]) return;

    const years =
      (new Date(s[1]) - now) / (1000 * 60 * 60 * 24 * 365);

    ofzPoints.push({
      x: years,
      y: mdRow[2],
      label: s[0]
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s[0]}</td>
      <td>${s[1]}</td>
      <td>${s[2] ?? '—'}</td>
      <td>${mdRow[1] ?? '—'}</td>
      <td>${mdRow[2].toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
  });

  buildMap();
}

function buildMap() {
  const ctx = document.getElementById('mapChart');

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'ОФЗ',
        data: ofzPoints,
        backgroundColor: '#4f46e5'
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Срок до погашения (лет)' } },
        y: { title: { display: true, text: 'YTM, %' } }
      }
    }
  });
}

async function buildCBRCurve() {
  const res = await fetch('https://www.cbr.ru/hd_base/zcyc_params/zcyc/');
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const rows = doc.querySelectorAll('table tr');
  const labels = [];
  const values = [];

  rows.forEach((r, i) => {
    if (i === 0) return;
    const td = r.querySelectorAll('td');
    if (td.length >= 2) {
      labels.push(td[0].innerText);
      values.push(parseFloat(td[1].innerText.replace(',', '.')));
    }
  });

  new Chart(document.getElementById('curveChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Кривая доходности ЦБ',
        data: values,
        borderColor: '#16a34a'
      }]
    }
  });
}

document.getElementById('pickBtn').onclick = () => {
  const term = document.getElementById('term').value;
  const result = document.getElementById('pickResult');

  let filtered = ofzPoints.filter(p =>
    term == 1 ? p.x <= 1 :
    term == 3 ? p.x <= 3 :
    term == 5 ? p.x <= 5 : p.x > 5
  );

  filtered = filtered.sort((a,b)=>b.y-a.y).slice(0,3);

  result.innerHTML = filtered.length
    ? filtered.map(p => `${p.label}: ${p.y.toFixed(2)}%`).join('<br>')
    : 'Нет подходящих выпусков';
};

loadOFZ();
buildCBRCurve();