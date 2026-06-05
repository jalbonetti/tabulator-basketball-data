const cards = [
  ['Michael Jordan', '1986 Fleer Rookie', 'PSA 10', 285000, '2026-05-20', 'Vaulted', '#f9c74f'],
  ['LeBron James', '2003 Topps Chrome Refractor', 'BGS 9.5', 41000, '2026-05-18', 'For Review', '#90be6d'],
  ['Kobe Bryant', '1996 Topps Chrome Rookie', 'PSA 9', 18900, '2026-05-12', 'Listed', '#f8961e'],
  ['Stephen Curry', '2009 Topps Chrome Rookie', 'PSA 10', 16600, '2026-05-10', 'Vaulted', '#43aa8b'],
  ['Luka Doncic', '2018 Prizm Silver Rookie', 'PSA 10', 12850, '2026-05-08', 'Listed', '#577590'],
  ['Victor Wembanyama', '2023 Prizm Silver Rookie', 'Raw', 7200, '2026-05-07', 'Incoming', '#f3722c'],
  ['Kevin Durant', '2007 Topps Chrome Rookie', 'PSA 10', 6100, '2026-05-05', 'Listed', '#277da1'],
  ['Giannis Antetokounmpo', '2013 Prizm Rookie', 'PSA 10', 5600, '2026-05-02', 'Vaulted', '#f9844a'],
  ['Nikola Jokic', '2015 Prizm Rookie', 'BGS 9.5', 4850, '2026-04-29', 'For Review', '#4d908e'],
  ['Jayson Tatum', '2017 Prizm Silver Rookie', 'PSA 10', 4400, '2026-04-27', 'Listed', '#f9c74f'],
  ['Anthony Edwards', '2020 Prizm Silver Rookie', 'PSA 10', 3950, '2026-04-24', 'Incoming', '#90be6d'],
  ['Ja Morant', '2019 Prizm Silver Rookie', 'PSA 9', 2700, '2026-04-21', 'Listed', '#f94144'],
  ['Shai Gilgeous-Alexander', '2018 Prizm Silver Rookie', 'PSA 10', 3550, '2026-04-18', 'Vaulted', '#577590'],
  ['Devin Booker', '2015 Prizm Rookie', 'BGS 9.5', 2250, '2026-04-16', 'Listed', '#f8961e'],
  ['Paolo Banchero', '2022 Prizm Silver Rookie', 'PSA 10', 2100, '2026-04-13', 'Incoming', '#43aa8b'],
  ['Chet Holmgren', '2022 Prizm Silver Rookie', 'Raw', 1450, '2026-04-11', 'For Review', '#277da1'],
  ['Trae Young', '2018 Prizm Silver Rookie', 'PSA 10', 1850, '2026-04-07', 'Listed', '#f9844a'],
  ['Carmelo Anthony', '2003 Topps Chrome Rookie', 'PSA 9', 1250, '2026-04-03', 'Vaulted', '#4d908e'],
  ['Tim Duncan', '1997 Topps Chrome Rookie', 'PSA 9', 1700, '2026-03-30', 'Listed', '#f9c74f'],
  ['Allen Iverson', '1996 Topps Chrome Rookie', 'PSA 8', 1150, '2026-03-26', 'For Review', '#90be6d'],
  ['Dwyane Wade', '2003 Topps Chrome Rookie', 'PSA 9', 1325, '2026-03-24', 'Listed', '#f94144'],
  ['Dirk Nowitzki', '1998 Topps Chrome Rookie', 'BGS 9', 1525, '2026-03-21', 'Vaulted', '#577590'],
  ['Kevin Garnett', '1995 Finest Rookie', 'PSA 9', 980, '2026-03-17', 'Listed', '#f8961e'],
  ['Vince Carter', '1998 Topps Chrome Rookie', 'PSA 9', 875, '2026-03-14', 'Incoming', '#43aa8b'],
  ['Shaquille ONeal', '1992 Stadium Club Beam Team', 'PSA 9', 2200, '2026-03-11', 'Vaulted', '#277da1'],
  ['Larry Bird', '1980 Topps Scoring Leader', 'PSA 8', 3400, '2026-03-08', 'Listed', '#f9844a'],
].map(([player, title, grade, value, date, status, color], index) => ({
  id: index + 1,
  player,
  title,
  grade,
  value,
  date,
  status,
  image: avatarDataUri(player, color),
}));

function avatarDataUri(player, color) {
  const initials = player
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
      <rect width="72" height="72" rx="36" fill="${color}"/>
      <text x="36" y="43" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#101828">${initials}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function gradeRank(grade) {
  if (grade === 'Raw') {
    return 0;
  }

  const match = grade.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function renderMetrics() {
  document.getElementById('totalCards').textContent = cards.length;
  document.getElementById('collectionValue').textContent = currency(
    cards.reduce((sum, card) => sum + card.value, 0),
  );
  document.getElementById('vaultedCards').textContent = cards.filter(
    (card) => card.status === 'Vaulted',
  ).length;
}

function createTable() {
  const table = new Tabulator('#cardsTable', {
    data: cards,
    height: '640px',
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 20,
    paginationCounter: 'rows',
    placeholder: 'No cards match this search.',
    initialSort: [{ column: 'date', dir: 'desc' }],
    columns: [
      {
        title: 'Image',
        field: 'image',
        width: 88,
        hozAlign: 'center',
        formatter: (cell) => {
          const row = cell.getRow().getData();
          return `<img class="card-avatar" src="${cell.getValue()}" alt="${row.player} card avatar" />`;
        },
      },
      {
        title: 'Title',
        field: 'title',
        minWidth: 280,
        formatter: (cell) => {
          const row = cell.getRow().getData();
          return `<strong class="card-title">${cell.getValue()}</strong><span class="card-player">${row.player}</span>`;
        },
      },
      {
        title: 'Grade',
        field: 'grade',
        width: 130,
        sorter: (a, b) => gradeRank(a) - gradeRank(b),
        formatter: (cell) => {
          const grade = cell.getValue();
          const tone = grade === 'Raw' ? 'raw' : grade.includes('10') ? 'gem' : 'graded';
          return `<span class="grade-badge grade-${tone}">${grade}</span>`;
        },
      },
      {
        title: 'Value',
        field: 'value',
        width: 150,
        hozAlign: 'right',
        sorter: 'number',
        formatter: (cell) => currency(cell.getValue()),
      },
      {
        title: 'Date',
        field: 'date',
        width: 145,
        sorter: 'date',
      },
      {
        title: 'Status',
        field: 'status',
        width: 150,
        formatter: (cell) => {
          const status = cell.getValue();
          return `<span class="status-tag status-${statusClass(status)}">${status}</span>`;
        },
      },
    ],
  });

  document.getElementById('playerSearch').addEventListener('input', (event) => {
    const term = event.target.value.trim().toLowerCase();

    if (!term) {
      table.clearFilter();
      return;
    }

    table.setFilter((row) => row.player.toLowerCase().includes(term));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderMetrics();
  createTable();
});
