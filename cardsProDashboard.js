const nbaCards = [
  { imageSeed: "jordan", title: "1986 Fleer Michael Jordan Rookie", player: "Michael Jordan", team: "CHI", grade: "PSA 10", value: 224500, status: "Vault", acquired: "2025-12-08" },
  { imageSeed: "lebron", title: "2003 Topps Chrome LeBron James", player: "LeBron James", team: "CLE", grade: "PSA 10", value: 38500, status: "Hold", acquired: "2026-01-15" },
  { imageSeed: "wemby", title: "2023 Prizm Victor Wembanyama Silver", player: "Victor Wembanyama", team: "SAS", grade: "PSA 10", value: 8700, status: "Watch", acquired: "2026-03-04" },
  { imageSeed: "curry", title: "2009 Topps Stephen Curry Rookie", player: "Stephen Curry", team: "GSW", grade: "PSA 9", value: 4550, status: "Hold", acquired: "2025-11-18" },
  { imageSeed: "kobe", title: "1996 Topps Chrome Kobe Bryant", player: "Kobe Bryant", team: "LAL", grade: "PSA 10", value: 24800, status: "Vault", acquired: "2025-09-22" },
  { imageSeed: "ant", title: "2020 Prizm Anthony Edwards Silver", player: "Anthony Edwards", team: "MIN", grade: "PSA 10", value: 1800, status: "Sell", acquired: "2026-04-11" },
  { imageSeed: "luka", title: "2018 Prizm Luka Doncic Rookie", player: "Luka Doncic", team: "DAL", grade: "PSA 10", value: 5200, status: "Hold", acquired: "2025-10-30" },
  { imageSeed: "shai", title: "2018 Optic Shai Gilgeous-Alexander", player: "Shai Gilgeous-Alexander", team: "OKC", grade: "PSA 10", value: 1650, status: "Watch", acquired: "2026-02-19" },
  { imageSeed: "tatum", title: "2017 Prizm Jayson Tatum Silver", player: "Jayson Tatum", team: "BOS", grade: "PSA 9", value: 940, status: "Hold", acquired: "2025-08-14" },
  { imageSeed: "ja", title: "2019 Prizm Ja Morant Rookie", player: "Ja Morant", team: "MEM", grade: "Raw", value: 260, status: "Sell", acquired: "2026-05-12" },
  { imageSeed: "joker", title: "2015 Prizm Nikola Jokic Rookie", player: "Nikola Jokic", team: "DEN", grade: "PSA 10", value: 12900, status: "Vault", acquired: "2025-07-01" },
  { imageSeed: "giannis", title: "2013 Prizm Giannis Antetokounmpo", player: "Giannis Antetokounmpo", team: "MIL", grade: "PSA 9", value: 6100, status: "Hold", acquired: "2025-12-28" },
  { imageSeed: "kd", title: "2007 Topps Chrome Kevin Durant", player: "Kevin Durant", team: "SEA", grade: "PSA 10", value: 7400, status: "Vault", acquired: "2025-06-15" },
  { imageSeed: "booker", title: "2015 Prizm Devin Booker Silver", player: "Devin Booker", team: "PHX", grade: "PSA 10", value: 1150, status: "Watch", acquired: "2026-01-06" },
  { imageSeed: "maxey", title: "2020 Optic Tyrese Maxey Holo", player: "Tyrese Maxey", team: "PHI", grade: "PSA 10", value: 780, status: "Hold", acquired: "2026-03-30" },
  { imageSeed: "brunson", title: "2018 Prizm Jalen Brunson Rookie", player: "Jalen Brunson", team: "NYK", grade: "Raw", value: 120, status: "Watch", acquired: "2026-04-28" },
  { imageSeed: "zion", title: "2019 Prizm Zion Williamson Silver", player: "Zion Williamson", team: "NOP", grade: "PSA 9", value: 690, status: "Sell", acquired: "2025-10-04" },
  { imageSeed: "paolo", title: "2022 Prizm Paolo Banchero Silver", player: "Paolo Banchero", team: "ORL", grade: "PSA 10", value: 1250, status: "Hold", acquired: "2026-02-07" },
  { imageSeed: "haliburton", title: "2020 Select Tyrese Haliburton", player: "Tyrese Haliburton", team: "IND", grade: "PSA 10", value: 830, status: "Watch", acquired: "2026-05-02" },
  { imageSeed: "duncan", title: "1997 Topps Chrome Tim Duncan", player: "Tim Duncan", team: "SAS", grade: "PSA 10", value: 7800, status: "Vault", acquired: "2025-05-21" },
  { imageSeed: "iverson", title: "1996 Topps Chrome Allen Iverson", player: "Allen Iverson", team: "PHI", grade: "PSA 9", value: 1125, status: "Hold", acquired: "2025-09-03" },
  { imageSeed: "dirk", title: "1998 Topps Chrome Dirk Nowitzki", player: "Dirk Nowitzki", team: "DAL", grade: "Raw", value: 420, status: "Watch", acquired: "2026-04-17" },
  { imageSeed: "dwade", title: "2003 Topps Chrome Dwyane Wade", player: "Dwyane Wade", team: "MIA", grade: "PSA 10", value: 3100, status: "Hold", acquired: "2025-12-01" },
  { imageSeed: "lamelo", title: "2020 Prizm LaMelo Ball Silver", player: "LaMelo Ball", team: "CHA", grade: "PSA 9", value: 440, status: "Sell", acquired: "2026-01-27" },
  { imageSeed: "cade", title: "2021 Prizm Cade Cunningham Silver", player: "Cade Cunningham", team: "DET", grade: "PSA 10", value: 980, status: "Watch", acquired: "2026-05-19" }
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const gradeRank = {
  Raw: 0,
  "PSA 9": 9,
  "PSA 10": 10
};

function avatarDataUri(seed) {
  const colors = ["#f97316", "#f5b942", "#35d07f", "#4f8cff", "#e879f9"];
  const color = colors[Math.abs(hashCode(seed)) % colors.length];
  const initials = seed.slice(0, 2).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="#0a2038"/>
      <circle cx="57" cy="22" r="20" fill="${color}" opacity=".86"/>
      <circle cx="25" cy="55" r="28" fill="#f5b942" opacity=".28"/>
      <text x="40" y="48" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#fff">${initials}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function hashCode(value) {
  return [...value].reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
}

function gradeClass(grade) {
  if (grade === "PSA 10") return "grade-psa10";
  if (grade === "Raw") return "grade-raw";
  return "grade-other";
}

function statusClass(status) {
  if (status === "Watch") return "status-watch";
  if (status === "Sell") return "status-sell";
  return "";
}

function updateMetrics(data) {
  const totalValue = data.reduce((sum, card) => sum + card.value, 0);
  document.getElementById("metric-cards").textContent = data.length.toString();
  document.getElementById("metric-value").textContent = currencyFormatter.format(totalValue);
  document.getElementById("metric-psa10").textContent = data.filter((card) => card.grade === "PSA 10").length.toString();
}

document.addEventListener("DOMContentLoaded", () => {
  updateMetrics(nbaCards);

  const table = new Tabulator("#cards-table", {
    data: nbaCards,
    layout: "fitColumns",
    responsiveLayout: "collapse",
    height: "680px",
    pagination: true,
    paginationSize: 20,
    paginationCounter: "rows",
    initialSort: [{ column: "value", dir: "desc" }],
    columns: [
      {
        title: "Image",
        field: "imageSeed",
        hozAlign: "center",
        headerSort: false,
        width: 86,
        formatter: (cell) => `<img class="card-image" alt="" src="${avatarDataUri(cell.getValue())}">`
      },
      {
        title: "Title",
        field: "title",
        minWidth: 290,
        formatter: (cell) => {
          const card = cell.getRow().getData();
          return `<span class="card-title"><strong>${card.title}</strong><span>${card.player} · ${card.team}</span></span>`;
        }
      },
      {
        title: "Grade",
        field: "grade",
        width: 128,
        sorter: (a, b) => (gradeRank[a] ?? 0) - (gradeRank[b] ?? 0),
        formatter: (cell) => `<span class="grade-badge ${gradeClass(cell.getValue())}">${cell.getValue()}</span>`
      },
      {
        title: "Value",
        field: "value",
        width: 140,
        hozAlign: "right",
        sorter: "number",
        formatter: (cell) => `<span class="value-cell">${currencyFormatter.format(cell.getValue())}</span>`
      },
      {
        title: "Status",
        field: "status",
        width: 124,
        formatter: (cell) => `<span class="status-tag ${statusClass(cell.getValue())}">${cell.getValue()}</span>`
      },
      {
        title: "Date",
        field: "acquired",
        width: 138,
        sorter: "date",
        sorterParams: { format: "yyyy-MM-dd" }
      }
    ]
  });

  const search = document.getElementById("player-search");
  const clear = document.getElementById("clear-search");

  search.addEventListener("input", () => {
    const query = search.value.trim();
    if (!query) {
      table.clearFilter();
      return;
    }

    table.setFilter("player", "like", query);
  });

  clear.addEventListener("click", () => {
    search.value = "";
    table.clearFilter();
    search.focus();
  });

  window.cardsDashboardTable = table;
});
