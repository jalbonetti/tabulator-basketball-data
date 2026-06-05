const DEFAULT_CARDS = [
    { id: 'card-001', playerName: 'Michael Jordan', title: '1986 Fleer Michael Jordan Rookie', image: 'https://ui-avatars.com/api/?name=Michael+Jordan&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 10, value: 285000, status: 'Vaulted', date: '2026-05-30' },
    { id: 'card-002', playerName: 'LeBron James', title: '2003 Topps Chrome LeBron James Refractor', image: 'https://ui-avatars.com/api/?name=LeBron+James&background=12244d&color=f5a623', grader: 'PSA', grade: 9, value: 42500, status: 'For Sale', date: '2026-05-24' },
    { id: 'card-003', playerName: 'Kobe Bryant', title: '1996 Topps Chrome Kobe Bryant Rookie', image: 'https://ui-avatars.com/api/?name=Kobe+Bryant&background=0d1b3e&color=f5a623', grader: 'BGS', grade: 9.5, value: 18500, status: 'Watchlist', date: '2026-05-18' },
    { id: 'card-004', playerName: 'Stephen Curry', title: '2009 Topps Stephen Curry Rookie', image: 'https://ui-avatars.com/api/?name=Stephen+Curry&background=12244d&color=f5a623', grader: 'PSA', grade: 10, value: 9600, status: 'Vaulted', date: '2026-05-16' },
    { id: 'card-005', playerName: 'Victor Wembanyama', title: '2023 Prizm Victor Wembanyama Silver', image: 'https://ui-avatars.com/api/?name=Victor+Wembanyama&background=0d1b3e&color=f5a623', grader: 'Raw', grade: null, value: 780, status: 'Raw', date: '2026-05-12' },
    { id: 'card-006', playerName: 'Giannis Antetokounmpo', title: '2013 Prizm Giannis Antetokounmpo Rookie', image: 'https://ui-avatars.com/api/?name=Giannis+Antetokounmpo&background=12244d&color=f5a623', grader: 'PSA', grade: 9, value: 3400, status: 'Hold', date: '2026-05-09' },
    { id: 'card-007', playerName: 'Luka Doncic', title: '2018 Prizm Luka Doncic Rookie Silver', image: 'https://ui-avatars.com/api/?name=Luka+Doncic&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 10, value: 5100, status: 'For Sale', date: '2026-05-06' },
    { id: 'card-008', playerName: 'Kevin Durant', title: '2007 Topps Chrome Kevin Durant Rookie', image: 'https://ui-avatars.com/api/?name=Kevin+Durant&background=12244d&color=f5a623', grader: 'PSA', grade: 9, value: 2200, status: 'Hold', date: '2026-05-03' },
    { id: 'card-009', playerName: 'Anthony Edwards', title: '2020 Prizm Anthony Edwards Rookie Silver', image: 'https://ui-avatars.com/api/?name=Anthony+Edwards&background=0d1b3e&color=f5a623', grader: 'Raw', grade: null, value: 640, status: 'Raw', date: '2026-04-30' },
    { id: 'card-010', playerName: 'Jayson Tatum', title: '2017 Prizm Jayson Tatum Rookie', image: 'https://ui-avatars.com/api/?name=Jayson+Tatum&background=12244d&color=f5a623', grader: 'PSA', grade: 10, value: 1250, status: 'Hold', date: '2026-04-26' },
    { id: 'card-011', playerName: 'Nikola Jokic', title: '2015 Prizm Nikola Jokic Rookie', image: 'https://ui-avatars.com/api/?name=Nikola+Jokic&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 9, value: 2100, status: 'Vaulted', date: '2026-04-22' },
    { id: 'card-012', playerName: 'Shaquille ONeal', title: '1992 Topps Shaquille ONeal Rookie', image: 'https://ui-avatars.com/api/?name=Shaquille+ONeal&background=12244d&color=f5a623', grader: 'Raw', grade: null, value: 180, status: 'Raw', date: '2026-04-18' },
    { id: 'card-013', playerName: 'Tim Duncan', title: '1997 Topps Chrome Tim Duncan Rookie', image: 'https://ui-avatars.com/api/?name=Tim+Duncan&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 9, value: 920, status: 'Hold', date: '2026-04-14' },
    { id: 'card-014', playerName: 'Allen Iverson', title: '1996 Topps Chrome Allen Iverson Rookie', image: 'https://ui-avatars.com/api/?name=Allen+Iverson&background=12244d&color=f5a623', grader: 'PSA', grade: 8, value: 430, status: 'Watchlist', date: '2026-04-10' },
    { id: 'card-015', playerName: 'Ja Morant', title: '2019 Prizm Ja Morant Rookie Silver', image: 'https://ui-avatars.com/api/?name=Ja+Morant&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 9, value: 760, status: 'For Sale', date: '2026-04-06' },
    { id: 'card-016', playerName: 'Shai Gilgeous-Alexander', title: '2018 Prizm Shai Gilgeous-Alexander Rookie', image: 'https://ui-avatars.com/api/?name=Shai+Gilgeous-Alexander&background=12244d&color=f5a623', grader: 'PSA', grade: 10, value: 1450, status: 'Vaulted', date: '2026-04-02' },
    { id: 'card-017', playerName: 'Caitlin Clark', title: '2024 Panini Caitlin Clark Rated Rookie', image: 'https://ui-avatars.com/api/?name=Caitlin+Clark&background=0d1b3e&color=f5a623', grader: 'Raw', grade: null, value: 320, status: 'Raw', date: '2026-03-29' },
    { id: 'card-018', playerName: 'Dirk Nowitzki', title: '1998 Topps Chrome Dirk Nowitzki Rookie', image: 'https://ui-avatars.com/api/?name=Dirk+Nowitzki&background=12244d&color=f5a623', grader: 'PSA', grade: 9, value: 880, status: 'Hold', date: '2026-03-25' },
    { id: 'card-019', playerName: 'Dwyane Wade', title: '2003 Topps Chrome Dwyane Wade Rookie', image: 'https://ui-avatars.com/api/?name=Dwyane+Wade&background=0d1b3e&color=f5a623', grader: 'BGS', grade: 9, value: 1150, status: 'Hold', date: '2026-03-21' },
    { id: 'card-020', playerName: 'LaMelo Ball', title: '2020 Prizm LaMelo Ball Rookie Silver', image: 'https://ui-avatars.com/api/?name=LaMelo+Ball&background=12244d&color=f5a623', grader: 'PSA', grade: 9, value: 390, status: 'For Sale', date: '2026-03-17' },
    { id: 'card-021', playerName: 'Paolo Banchero', title: '2022 Prizm Paolo Banchero Rookie Silver', image: 'https://ui-avatars.com/api/?name=Paolo+Banchero&background=0d1b3e&color=f5a623', grader: 'Raw', grade: null, value: 240, status: 'Raw', date: '2026-03-13' },
    { id: 'card-022', playerName: 'Magic Johnson', title: '1980 Topps Magic Johnson Rookie', image: 'https://ui-avatars.com/api/?name=Magic+Johnson&background=12244d&color=f5a623', grader: 'PSA', grade: 7, value: 1700, status: 'Vaulted', date: '2026-03-09' },
    { id: 'card-023', playerName: 'Larry Bird', title: '1980 Topps Larry Bird Rookie', image: 'https://ui-avatars.com/api/?name=Larry+Bird&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 7, value: 1650, status: 'Vaulted', date: '2026-03-05' },
    { id: 'card-024', playerName: 'Hakeem Olajuwon', title: '1986 Fleer Hakeem Olajuwon Rookie', image: 'https://ui-avatars.com/api/?name=Hakeem+Olajuwon&background=12244d&color=f5a623', grader: 'PSA', grade: 8, value: 1180, status: 'Watchlist', date: '2026-03-01' },
    { id: 'card-025', playerName: 'Charles Barkley', title: '1986 Fleer Charles Barkley Rookie', image: 'https://ui-avatars.com/api/?name=Charles+Barkley&background=0d1b3e&color=f5a623', grader: 'PSA', grade: 8, value: 980, status: 'Watchlist', date: '2026-02-25' },
    { id: 'card-026', playerName: 'Kawhi Leonard', title: '2012 Prizm Kawhi Leonard Rookie', image: 'https://ui-avatars.com/api/?name=Kawhi+Leonard&background=12244d&color=f5a623', grader: 'PSA', grade: 10, value: 1320, status: 'Hold', date: '2026-02-21' },
];

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[character]));
}

function normalizeCard(card) {
    const grade = card.grade === null || card.grade === undefined ? null : Number(card.grade);
    return {
        ...card,
        grade,
        gradeLabel: grade ? `${card.grader || 'PSA'} ${grade}` : 'Raw',
        status: card.status || (grade ? 'Hold' : 'Raw'),
    };
}

function injectDashboardStyles() {
    if (document.querySelector('style[data-source="cards-pro-dashboard"]')) {
        return;
    }

    const style = document.createElement('style');
    style.setAttribute('data-source', 'cards-pro-dashboard');
    style.textContent = `
        .cards-pro-dashboard {
            background: #071225;
            color: #f8fafc;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            min-height: 100vh;
            padding: 42px 18px;
        }

        .cards-pro-dashboard__inner {
            margin: 0 auto;
            max-width: 1180px;
        }

        .cards-pro-dashboard__header {
            align-items: end;
            display: flex;
            gap: 24px;
            justify-content: space-between;
            margin-bottom: 22px;
        }

        .cards-pro-dashboard__eyebrow {
            color: #f5a623;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0;
            margin: 0 0 8px;
            text-transform: uppercase;
        }

        .cards-pro-dashboard h1 {
            color: #ffffff;
            font-size: clamp(34px, 6vw, 72px);
            line-height: 0.96;
            letter-spacing: 0;
            margin: 0;
        }

        .cards-pro-dashboard__search {
            display: grid;
            gap: 8px;
            max-width: 380px;
            width: min(100%, 380px);
        }

        .cards-pro-dashboard__search label {
            color: #b8c7dc;
            font-size: 13px;
            font-weight: 700;
        }

        .cards-pro-dashboard__search input {
            background: #0d1b3e;
            border: 1px solid rgba(245, 166, 35, 0.45);
            border-radius: 8px;
            color: #ffffff;
            font-size: 16px;
            min-height: 46px;
            outline: none;
            padding: 0 14px;
            width: 100%;
        }

        .cards-pro-dashboard__search input:focus {
            border-color: #f5a623;
            box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.18);
        }

        .cards-pro-dashboard__search input::placeholder {
            color: #7186a8;
        }

        .cards-pro-dashboard__table {
            border: 1px solid rgba(245, 166, 35, 0.24);
            border-radius: 8px;
            min-height: 560px;
            overflow: hidden;
        }

        .cards-pro-dashboard .tabulator {
            background: #0d1b3e;
            border: 0;
            color: #edf2f7;
        }

        .cards-pro-dashboard .tabulator-header,
        .cards-pro-dashboard .tabulator-col {
            background: #0a1731;
            border-color: rgba(245, 166, 35, 0.18);
        }

        .cards-pro-dashboard .tabulator-col-title {
            color: #f5a623;
            font-weight: 800;
        }

        .cards-pro-dashboard .tabulator-row {
            background: #0d1b3e;
            border-bottom-color: rgba(255, 255, 255, 0.06);
            color: #f8fafc;
        }

        .cards-pro-dashboard .tabulator-row:nth-child(even) {
            background: #102149;
        }

        .cards-pro-dashboard .tabulator-row:hover {
            background: #172d5f;
        }

        .cards-pro-avatar {
            aspect-ratio: 1;
            border: 2px solid rgba(245, 166, 35, 0.82);
            border-radius: 50%;
            display: block;
            height: 42px;
            object-fit: cover;
            width: 42px;
        }

        .cards-pro-title {
            display: grid;
            gap: 3px;
            line-height: 1.2;
        }

        .cards-pro-title strong {
            color: #ffffff;
            font-size: 15px;
        }

        .cards-pro-title span {
            color: #9fb2cc;
            font-size: 13px;
        }

        .cards-pro-grade,
        .cards-pro-status {
            align-items: center;
            border-radius: 6px;
            display: inline-flex;
            font-size: 12px;
            font-weight: 800;
            justify-content: center;
            min-height: 28px;
            padding: 0 10px;
            white-space: nowrap;
        }

        .cards-pro-grade--gem {
            background: #20c997;
            color: #06171f;
        }

        .cards-pro-grade--graded {
            background: #213c77;
            color: #dce8ff;
        }

        .cards-pro-grade--raw {
            background: #4b5563;
            color: #f3f4f6;
        }

        .cards-pro-status {
            background: rgba(245, 166, 35, 0.14);
            border: 1px solid rgba(245, 166, 35, 0.34);
            color: #ffd58a;
        }

        @media (max-width: 760px) {
            .cards-pro-dashboard {
                padding: 28px 10px;
            }

            .cards-pro-dashboard__header {
                align-items: stretch;
                display: grid;
            }

            .cards-pro-dashboard__search {
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
}

function buildColumnConfig() {
    return [
        {
            title: '',
            field: 'image',
            width: 72,
            headerSort: false,
            formatter: (cell) => `<img class="cards-pro-avatar" alt="" src="${escapeHtml(cell.getValue())}">`,
        },
        {
            title: 'Title',
            field: 'title',
            minWidth: 280,
            formatter: (cell) => {
                const row = cell.getRow().getData();
                return `<span class="cards-pro-title"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.playerName)}</span></span>`;
            },
        },
        {
            title: 'Grade',
            field: 'grade',
            width: 124,
            sorter: 'number',
            formatter: (cell) => {
                const row = cell.getRow().getData();
                const className = row.grade >= 10 ? 'cards-pro-grade--gem' : row.grade ? 'cards-pro-grade--graded' : 'cards-pro-grade--raw';
                return `<span class="cards-pro-grade ${className}">${escapeHtml(row.gradeLabel)}</span>`;
            },
        },
        {
            title: 'Value',
            field: 'value',
            width: 140,
            sorter: 'number',
            hozAlign: 'right',
            formatter: (cell) => `<strong>${formatter.format(Number(cell.getValue()) || 0)}</strong>`,
        },
        {
            title: 'Status',
            field: 'status',
            width: 132,
            formatter: (cell) => `<span class="cards-pro-status">${escapeHtml(cell.getValue())}</span>`,
        },
        {
            title: 'Date',
            field: 'date',
            width: 128,
            sorter: 'date',
        },
    ];
}

export function initCardsProDashboard({
    root = '#cards-pro-dashboard',
    cards = DEFAULT_CARDS,
} = {}) {
    if (!window.Tabulator) {
        throw new Error('Tabulator must be loaded before initCardsProDashboard runs.');
    }

    const rootElement = typeof root === 'string' ? document.querySelector(root) : root;
    if (!rootElement) {
        throw new Error('Cards dashboard root element was not found.');
    }

    injectDashboardStyles();

    rootElement.classList.add('cards-pro-dashboard');
    rootElement.innerHTML = `
        <div class="cards-pro-dashboard__inner">
            <section class="cards-pro-dashboard__header" aria-labelledby="cards-pro-dashboard-title">
                <div>
                    <p class="cards-pro-dashboard__eyebrow">C.A.R.D.S. Pro Dashboard</p>
                    <h1 id="cards-pro-dashboard-title">Sports Card Inventory</h1>
                </div>
                <div class="cards-pro-dashboard__search">
                    <label for="cards-pro-player-search">Player search</label>
                    <input id="cards-pro-player-search" type="search" placeholder="Search Jordan, Curry, Wembanyama...">
                </div>
            </section>
            <div class="cards-pro-dashboard__table" id="cards-pro-table"></div>
        </div>
    `;

    const table = new window.Tabulator('#cards-pro-table', {
        data: cards.map(normalizeCard),
        layout: 'fitColumns',
        pagination: true,
        paginationSize: 20,
        placeholder: 'No cards match this view.',
        initialSort: [{ column: 'date', dir: 'desc' }],
        columns: buildColumnConfig(),
    });

    const search = rootElement.querySelector('#cards-pro-player-search');
    search.addEventListener('input', () => {
        const query = search.value.trim();
        if (!query) {
            table.clearFilter();
            return;
        }

        table.setFilter('playerName', 'like', query);
    });

    window.cardsProDashboard = table;
    return table;
}

