// ===== ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ =====
let ofz = [];

// ===== ЗАГРУЗКА ДАННЫХ MOEX =====
async function loadOFZ() {
  const url =
    'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off';

  const res = await fetch(url);
  const json = await res.json();

  const cols = json.securities.columns;
  const rows = json.securities.data;

  const idx = name => cols.indexOf(name);
  const today = new Date();

  ofz = rows
    .filter(r => r[idx('SECID')]?.startsWith('SU'))
    .map(r => {
      const mat = r[idx('MATDATE')];
      const years =
        mat ? (new Date(mat) - today) / (365 * 24 * 3600 * 1000) : null;

      return {
        secid: r[idx('SECID')],
        matdate: mat,
        coupon: r[idx('COUPONRATE')],
        price: r[idx('PREVPRICE')],
        ytm: r[idx('YIELD')],
        years
      };
    })
    .filter(b => b.ytm && b.years > 0 && b.years < 30);

  renderTable();
  renderMap();
  renderCurve();
}

// ===== КАТАЛОГ =====
function renderTable() {
  const tbody = document.getElementById('ofzTable');
  tbody.innerHTML = '';

  ofz.slice(0, 30).forEach(b => {
    tbody.innerHTML += `
      <tr>
        <td>${b.secid}</td>
        <td>${b.matdate || '—'}</td>
        <td>${b.coupon ?? '—'}</td>
        <td>${b.price ?? '—'}</td>
        <td>${b.ytm.toFixed(2)}</td>
      </tr>`;
  });
}

// ===== КАРТА ДОХОДНОСТИ =====
function renderMap() {
  const ctx = document.getElementById('mapChart');

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'ОФЗ',
        data: ofz.map(b => ({
          x: b.years,
          y: b.ytm,
          secid: b.secid
        })),
        backgroundColor: '#4f46e5'
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: c => {
              const p = c.raw;
              return `${p.secid}: ${p.y.toFixed(2)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Срок до погашения, лет' }
        },
        y: {
          title: { display: true, text: 'Доходность, %' }
        }
      }
    }
  });
}

// ===== КРИВАЯ ДОХОДНОСТИ =====
function renderCurve() {
  const buckets = {};

  ofz.forEach(b => {
    const k = Math.round(b.years);
    if (!buckets[k]) buckets[k] = [];
    buckets[k].push(b.ytm);
  });

  const labels = Object.keys(buckets).sort((a, b) => a - b);
  const values = labels.map(k =>
    buckets[k].reduce((a, b) => a + b, 0) / buckets[k].length
  );

  new Chart(document.getElementById('curveChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Средняя доходность ОФЗ',
        data: values,
        borderColor: '#22c55e',
        tension: 0.35
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Срок, лет' } },
        y: { title: { display: true, text: 'Доходность, %' } }
      }
    }
  });
}

// ===== СТАРТ =====
loadOFZ();