const cards = [
  ["Victor Wembanyama", "San Antonio Spurs", "2023 Prizm Silver Rookie", "PSA 10", 1280, "2026-05-28", "Vault"],
  ["Michael Jordan", "Chicago Bulls", "1996 Topps Chrome Refractor", "PSA 9", 2450, "2026-05-18", "Listed"],
  ["LeBron James", "Los Angeles Lakers", "2003 Topps Chrome Rookie", "PSA 10", 7200, "2026-04-29", "Vault"],
  ["Kobe Bryant", "Los Angeles Lakers", "1996 Finest Rookie", "PSA 9", 3350, "2026-05-02", "Hold"],
  ["Stephen Curry", "Golden State Warriors", "2009 Topps Rookie", "PSA 10", 2950, "2026-05-30", "Listed"],
  ["Caitlin Clark", "Indiana Fever", "2024 Panini Rookie", "Raw", 420, "2026-05-25", "Watch"],
  ["Luka Doncic", "Dallas Mavericks", "2018 Prizm Silver Rookie", "PSA 10", 3650, "2026-04-21", "Vault"],
  ["Jayson Tatum", "Boston Celtics", "2017 Optic Holo Rookie", "PSA 10", 760, "2026-05-20", "Hold"],
  ["Anthony Edwards", "Minnesota Timberwolves", "2020 Prizm Rookie", "PSA 10", 980, "2026-05-12", "Listed"],
  ["Nikola Jokic", "Denver Nuggets", "2015 Prizm Rookie", "PSA 9", 890, "2026-05-10", "Hold"],
  ["Giannis Antetokounmpo", "Milwaukee Bucks", "2013 Prizm Rookie", "PSA 10", 2150, "2026-04-30", "Vault"],
  ["Shai Gilgeous-Alexander", "Oklahoma City Thunder", "2018 Optic Holo Rookie", "PSA 10", 640, "2026-05-29", "Listed"],
  ["Kevin Durant", "Phoenix Suns", "2007 Topps Chrome Rookie", "PSA 9", 1350, "2026-05-01", "Vault"],
  ["Ja Morant", "Memphis Grizzlies", "2019 Prizm Silver Rookie", "PSA 9", 390, "2026-04-18", "Watch"],
  ["Paolo Banchero", "Orlando Magic", "2022 Prizm Rookie", "Raw", 145, "2026-05-17", "Watch"],
  ["Devin Booker", "Phoenix Suns", "2015 Prizm Rookie", "PSA 10", 540, "2026-05-15", "Listed"],
  ["Jalen Brunson", "New York Knicks", "2018 Donruss Optic Rookie", "Raw", 118, "2026-05-06", "Hold"],
  ["A'ja Wilson", "Las Vegas Aces", "2018 WNBA Rookie", "PSA 10", 720, "2026-05-22", "Vault"],
  ["Damian Lillard", "Milwaukee Bucks", "2012 Prizm Rookie", "PSA 9", 480, "2026-04-27", "Listed"],
  ["Zion Williamson", "New Orleans Pelicans", "2019 Prizm Rookie", "Raw", 180, "2026-05-11", "Watch"],
  ["Trae Young", "Atlanta Hawks", "2018 Prizm Silver Rookie", "PSA 9", 330, "2026-05-04", "Hold"],
  ["Tyrese Haliburton", "Indiana Pacers", "2020 Prizm Rookie", "PSA 10", 460, "2026-05-24", "Listed"],
  ["Scoot Henderson", "Portland Trail Blazers", "2023 Select Rookie", "Raw", 95, "2026-05-09", "Watch"],
  ["Dwyane Wade", "Miami Heat", "2003 Topps Chrome Rookie", "PSA 9", 930, "2026-04-23", "Vault"],
  ["Dirk Nowitzki", "Dallas Mavericks", "1998 Topps Chrome Rookie", "PSA 10", 1180, "2026-05-16", "Hold"]
].map(([player, team, title, grade, value, acquiredAt, status], index) => ({
  id: index + 1,
  player,
  team,
  title,
  grade,
  value,
  acquiredAt,
  status,
  image: avatarDataUri(player, index)
}));

function avatarDataUri(player, index) {
  const initials = player
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const colors = ["#f47b20", "#f5b84b", "#19b975", "#58a6ff", "#c084fc"];
  const fill = colors[index % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="36" fill="${fill}"/><text x="36" y="43" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#091527">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function gradeRank(grade) {
  if (grade === "PSA 10") return 3;
  if (grade === "PSA 9") return 2;
  return 1;
}

function renderSummary(rows) {
  document.getElementById("cardCount").textContent = String(rows.length);
  document.getElementById("portfolioValue").textContent = money(
    rows.reduce((sum, card) => sum + card.value, 0)
  );
  document.getElementById("psaTenCount").textContent = String(
    rows.filter((card) => card.grade === "PSA 10").length
  );
}

renderSummary(cards);

const table = new Tabulator("#cardsTable", {
  data: cards,
  layout: "fitColumns",
  height: "660px",
  pagination: "local",
  paginationSize: 20,
  placeholder: "No cards match this search.",
  initialSort: [{ column: "value", dir: "desc" }],
  columns: [
    {
      title: "Image",
      field: "image",
      width: 82,
      hozAlign: "center",
      headerSort: false,
      formatter: (cell) => `<img class="card-avatar" src="${cell.getValue()}" alt="" />`
    },
    {
      title: "Title",
      field: "title",
      minWidth: 290,
      formatter: (cell) => {
        const row = cell.getData();
        return `<div class="card-cell"><div><strong class="card-title">${row.title}</strong><span class="card-subtitle">${row.player} - ${row.team}</span></div></div>`;
      }
    },
    {
      title: "Grade",
      field: "grade",
      width: 120,
      sorter: (a, b) => gradeRank(a) - gradeRank(b),
      formatter: (cell) => {
        const grade = cell.getValue();
        const className = grade === "PSA 10" ? "grade-psa10" : grade === "PSA 9" ? "grade-psa9" : "grade-raw";
        return `<span class="grade-badge ${className}">${grade}</span>`;
      }
    },
    {
      title: "Value",
      field: "value",
      width: 130,
      hozAlign: "right",
      sorter: "number",
      formatter: (cell) => money(cell.getValue())
    },
    {
      title: "Date",
      field: "acquiredAt",
      width: 140,
      sorter: "date"
    },
    {
      title: "Status",
      field: "status",
      width: 120,
      formatter: (cell) => `<span class="status-tag">${cell.getValue()}</span>`
    }
  ]
});

document.getElementById("playerSearch").addEventListener("input", (event) => {
  const query = event.target.value.trim();
  if (!query) {
    table.clearFilter();
    renderSummary(cards);
    return;
  }

  table.setFilter("player", "like", query);
  renderSummary(table.getData("active"));
});
