document.addEventListener("DOMContentLoaded", () => {
    loadOFZ();
  });
  
  async function loadOFZ() {
    const url =
      "https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off";
  
    try {
      const res = await fetch(url);
      const data = await res.json();
  
      const columns = data.securities.columns;
      const rows = data.securities.data;
  
      const secidIdx = columns.indexOf("SECID");
      const nameIdx = columns.indexOf("SHORTNAME");
      const matIdx = columns.indexOf("MATDATE");
  
      const tbody = document.querySelector("#ofzTable tbody");
  
      if (!tbody) {
        console.error("Таблица #ofzTable не найдена");
        return;
      }
  
      tbody.innerHTML = "";
  
      rows
        .filter(row => row[secidIdx]?.startsWith("OFZ"))
        .slice(0, 20)
        .forEach(row => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${row[secidIdx]}</td>
            <td>${row[nameIdx]}</td>
            <td>${row[matIdx] ?? "—"}</td>
          `;
          tbody.appendChild(tr);
        });
  
    } catch (err) {
      console.error("Ошибка загрузки ОФЗ:", err);
      document.querySelector("#ofzTable tbody").innerHTML =
        "<tr><td colspan='3'>Ошибка загрузки данных</td></tr>";
    }
  }