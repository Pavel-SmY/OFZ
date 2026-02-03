const SEC_URL = 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json';
const MD_URL  = 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/marketdata.json';
const ZC_URL  = 'https://iss.moex.com/iss/statistics/engines/stock/zcyc.json';

const tbody = document.querySelector('#ofzTable tbody');

const calcCard = document.getElementById('calcCard');
const calcSecid = document.getElementById('calcSecid');
const calcPrice = document.getElementById('calcPrice');
const calcCoupon = document.getElementById('calcCoupon');
const calcYears = document.getElementById('calcYears');
const calcResult = document.getElementById('calcResult');

let ofz = {};
let market = {};

function mapCols(cols) {
  const m = {};
  cols.forEach((c, i) => m[c] = i);
  return m;
}

async function loadOFZ() {
  const [s, m] = await Promise.all([fetch(SEC_URL), fetch(MD_URL)]);
  const sd = await s.json();
  const md = await m.json();

  const sc = mapCols(sd.securities.columns);
  const mc = mapCols(md.marketdata.columns);

  sd.securities.data.forEach(r => {
    ofz[r[sc.SECID]] = {
      secid: r[sc.SECID],
      maturity: r[sc.MATDATE],
      coupon: r[sc.COUPONPERCENT]
    };
  });

  md.marketdata.data.forEach(r => {
    market[r[mc.SECID]] = {
      price: r[mc.LAST],
      yield: r[mc.YIELD]
    };
  });

  renderTable();
  buildMap();
}

function renderTable() {
  tbody.innerHTML = '';
  Object.values(ofz).forEach(o => {
    const m = market[o.secid] || {};
    tbody.innerHTML += `
      <tr>
        <td>${o.secid}</td>
        <td>${o.maturity || '—'}</td>
        <td>${o.coupon ?? '—'}</td>
        <td>${m.price ?? '—'}</td>
        <td>${m.yield ?? '—'}</td>
        <td><button onclick="selectOFZ('${o.secid}')">Рассчитать</button></td>
      </tr>`;
  });
}

function selectOFZ(secid) {
  const o = ofz[secid];
  const m = market[secid];
  if (!o || !m || !m.price) return;

  const years = (new Date(o.maturity) - new Date()) / (365 * 24 * 3600 * 1000);

  calcSecid.textContent = secid;
  calcCoupon.textContent = o.coupon;
  calcYears.textContent = years.toFixed(2);
  calcPrice.value = m.price;
  calcResult.textContent = '';
  calcCard.classList.remove('hidden');
}

document.getElementById('calcBtn').onclick = () => {
  const price = +calcPrice.value;
  const coupon = +calcCoupon.textContent;
  const years = +calcYears.textContent;

  const ytm =
    ((coupon / 100 * 100) + (100 - price) / years) /
    ((100 + price) / 2) * 100;

  calcResult.textContent = `Оценочная доходность: ${ytm.toFixed(2)} %`;
};

function buildMap() {
  const points = [];
  Object.values(ofz).forEach(o => {
    const m = market[o.secid];
    if (!m || !m.yield || !o.maturity) return;
    const x = (new Date(o.maturity) - new Date()) / (365 * 24 * 3600 * 1000);
    if (x <= 0) return;
    points.push({ x, y: m.yield });
  });

  new Chart(document.getElementById('ofzMap'), {
    type: 'scatter',
    data: { datasets: [{ data: points, backgroundColor: '#2563eb' }] },
    options: {
      scales: {
        x: { title: { display: true, text: 'Срок, лет' }},
        y: { title: { display: true, text: 'Доходность, %' }}
      },
      plugins: { legend: { display: false } }
    }
  });
}

async function loadZC() {
  const r = await fetch(ZC_URL);
  const d = await r.json();
  const c = mapCols(d.zcyc.columns);

  const data = d.zcyc.data.map(r => ({
    x: r[c.MATURITY],
    y: r[c.VALUE]
  }));

  new Chart(document.getElementById('cbCurve'), {
    type: 'line',
    data: { datasets: [{ data, borderColor: '#2563eb', fill: true }] },
    options: {
      parsing: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Срок, лет' }},
        y: { title: { display: true, text: 'Доходность, %' }}
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* IIA */
document.getElementById('iiaCalcBtn').onclick = () => {
  const amt = +iiaAmount.value;
  const yrs = +iiaYears.value;
  const type = iiaType.value;

  if (type === 'A') {
    const r = Math.min(amt * 0.13, 52000) * yrs;
    iiaResult.textContent = `Возврат НДФЛ за ${yrs} лет: ${r.toFixed(0)} ₽`;
  } else {
    iiaResult.textContent = 'Доход освобождён от налога (тип Б)';
  }
};

loadOFZ();
loadZC();