const cards = [
  { id: 1, player: "Michael Jordan", title: "1986 Fleer Rookie", team: "Chicago Bulls", grade: "PSA 10", value: 285000, date: "2026-05-18", status: "Hold", image: "https://i.pravatar.cc/96?img=12" },
  { id: 2, player: "Kobe Bryant", title: "1996 Topps Chrome Rookie", team: "Los Angeles Lakers", grade: "PSA 10", value: 42000, date: "2026-05-21", status: "Listed", image: "https://i.pravatar.cc/96?img=13" },
  { id: 3, player: "LeBron James", title: "2003 Topps Chrome Refractor", team: "Cleveland Cavaliers", grade: "PSA 9", value: 18500, date: "2026-04-29", status: "Hold", image: "https://i.pravatar.cc/96?img=14" },
  { id: 4, player: "Stephen Curry", title: "2009 Topps Rookie", team: "Golden State Warriors", grade: "PSA 10", value: 7600, date: "2026-05-09", status: "Sold", image: "https://i.pravatar.cc/96?img=15" },
  { id: 5, player: "Kevin Durant", title: "2007 Topps Chrome", team: "Seattle SuperSonics", grade: "Raw", value: 890, date: "2026-03-22", status: "Listed", image: "https://i.pravatar.cc/96?img=16" },
  { id: 6, player: "Luka Doncic", title: "2018 Prizm Silver", team: "Dallas Mavericks", grade: "PSA 10", value: 5200, date: "2026-06-02", status: "Hold", image: "https://i.pravatar.cc/96?img=17" },
  { id: 7, player: "Victor Wembanyama", title: "2023 Prizm Rookie", team: "San Antonio Spurs", grade: "PSA 9", value: 2400, date: "2026-05-31", status: "Listed", image: "https://i.pravatar.cc/96?img=18" },
  { id: 8, player: "Shaquille O'Neal", title: "1992 Upper Deck Rookie", team: "Orlando Magic", grade: "Raw", value: 310, date: "2026-02-17", status: "Hold", image: "https://i.pravatar.cc/96?img=19" },
  { id: 9, player: "Tim Duncan", title: "1997 Topps Chrome", team: "San Antonio Spurs", grade: "PSA 10", value: 3400, date: "2026-01-26", status: "Sold", image: "https://i.pravatar.cc/96?img=20" },
  { id: 10, player: "Allen Iverson", title: "1996 Finest Rookie", team: "Philadelphia 76ers", grade: "PSA 9", value: 1250, date: "2026-04-14", status: "Listed", image: "https://i.pravatar.cc/96?img=21" },
  { id: 11, player: "Giannis Antetokounmpo", title: "2013 Prizm Rookie", team: "Milwaukee Bucks", grade: "PSA 10", value: 6100, date: "2026-04-02", status: "Hold", image: "https://i.pravatar.cc/96?img=22" },
  { id: 12, player: "Nikola Jokic", title: "2015 Prizm Rookie", team: "Denver Nuggets", grade: "PSA 9", value: 1650, date: "2026-05-06", status: "Listed", image: "https://i.pravatar.cc/96?img=23" },
  { id: 13, player: "Jayson Tatum", title: "2017 Prizm Silver", team: "Boston Celtics", grade: "PSA 10", value: 2150, date: "2026-05-12", status: "Hold", image: "https://i.pravatar.cc/96?img=24" },
  { id: 14, player: "Anthony Edwards", title: "2020 Prizm Rookie", team: "Minnesota Timberwolves", grade: "Raw", value: 460, date: "2026-03-07", status: "Sold", image: "https://i.pravatar.cc/96?img=25" },
  { id: 15, player: "Caitlin Clark", title: "2024 Select Courtside", team: "Indiana Fever", grade: "PSA 10", value: 3900, date: "2026-05-27", status: "Listed", image: "https://i.pravatar.cc/96?img=26" },
  { id: 16, player: "Dwyane Wade", title: "2003 Topps Chrome", team: "Miami Heat", grade: "PSA 9", value: 980, date: "2026-02-28", status: "Hold", image: "https://i.pravatar.cc/96?img=27" },
  { id: 17, player: "Dirk Nowitzki", title: "1998 Topps Chrome", team: "Dallas Mavericks", grade: "PSA 10", value: 2800, date: "2026-01-19", status: "Sold", image: "https://i.pravatar.cc/96?img=28" },
  { id: 18, player: "Ja Morant", title: "2019 Prizm Silver", team: "Memphis Grizzlies", grade: "Raw", value: 520, date: "2026-04-08", status: "Listed", image: "https://i.pravatar.cc/96?img=29" },
  { id: 19, player: "Shai Gilgeous-Alexander", title: "2018 Optic Holo", team: "Oklahoma City Thunder", grade: "PSA 10", value: 1900, date: "2026-06-01", status: "Hold", image: "https://i.pravatar.cc/96?img=30" },
  { id: 20, player: "Magic Johnson", title: "1980 Topps Bird/Erving/Magic", team: "Los Angeles Lakers", grade: "PSA 9", value: 12200, date: "2026-03-18", status: "Listed", image: "https://i.pravatar.cc/96?img=31" },
  { id: 21, player: "Larry Bird", title: "1980 Topps Bird/Erving/Magic", team: "Boston Celtics", grade: "PSA 9", value: 12100, date: "2026-03-20", status: "Hold", image: "https://i.pravatar.cc/96?img=32" },
  { id: 22, player: "Hakeem Olajuwon", title: "1986 Fleer Rookie", team: "Houston Rockets", grade: "Raw", value: 780, date: "2026-02-03", status: "Sold", image: "https://i.pravatar.cc/96?img=33" }
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function gradeClass(grade) {
  if (grade === "PSA 10") return "grade-psa10";
  if (grade === "PSA 9") return "grade-psa9";
  return "grade-raw";
}

function statusClass(status) {
  return `status-${status.toLowerCase()}`;
}

const table = new Tabulator("#cardsTable", {
  data: cards,
  layout: "fitColumns",
  responsiveLayout: "collapse",
  pagination: true,
  paginationSize: 20,
  initialSort: [{ column: "value", dir: "desc" }],
  columns: [
    {
      title: "Card",
      field: "title",
      minWidth: 290,
      formatter: (cell) => {
        const row = cell.getData();
        return `<div class="card-title"><img class="avatar" src="${row.image}" alt="${row.player}"><span><span class="title-main">${row.title}</span><span class="title-sub">${row.player} · ${row.team}</span></span></div>`;
      }
    },
    { title: "Player", field: "player", sorter: "string", minWidth: 170 },
    {
      title: "Grade",
      field: "grade",
      sorter: "string",
      width: 120,
      formatter: (cell) => `<span class="grade-badge ${gradeClass(cell.getValue())}">${cell.getValue()}</span>`
    },
    {
      title: "Value",
      field: "value",
      sorter: "number",
      hozAlign: "right",
      width: 130,
      formatter: (cell) => money.format(cell.getValue())
    },
    { title: "Date", field: "date", sorter: "date", width: 130 },
    {
      title: "Status",
      field: "status",
      width: 120,
      formatter: (cell) => `<span class="status-tag ${statusClass(cell.getValue())}">${cell.getValue()}</span>`
    }
  ]
});

const search = document.querySelector("#playerSearch");
const resultCount = document.querySelector("#resultCount");

function updateCount() {
  resultCount.textContent = `${table.getDataCount("active")} cards shown`;
}

search.addEventListener("input", () => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    table.clearFilter();
  } else {
    table.setFilter((row) => row.player.toLowerCase().includes(query));
  }
  updateCount();
});

table.on("dataFiltered", updateCount);
table.on("tableBuilt", updateCount);
