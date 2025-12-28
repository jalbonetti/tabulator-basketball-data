# Basketball Props Tables

Modular Tabulator-based data tables for displaying basketball player prop clearances and betting information.

## Directory Structure

```
basketball-props/
├── main.js                          # Entry point
├── README.md                        # This file
├── shared/
│   ├── config.js                    # API and app configuration
│   └── utils.js                     # Utility functions
├── components/
│   ├── customMultiSelect.js         # Multi-select dropdown filter
│   └── minMaxFilter.js              # Min/Max range filter
├── tables/
│   ├── baseTable.js                 # Base table class
│   └── basketPlayerPropClearances.js # Player prop clearances table
└── styles/
    └── tableStyles.js               # All CSS styles
```

## Setup

### 1. HTML Structure

Add a table element to your HTML:

```html
<div id="basketball-table"></div>
```

### 2. Include Tabulator

Add Tabulator.js from CDN:

```html
<link href="https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator.min.css" rel="stylesheet">
<script src="https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js"></script>
```

### 3. Include Your Scripts

Using ES6 modules via jsDelivr:

```html
<script type="module">
    import './main.js';
</script>
```

Or via jsDelivr CDN:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/basketball-props@main/main.js"></script>
```

## Features

### Filters

- **Text Search**: Player Name column has free-text search
- **Multi-Select Dropdown**: Team, Prop, Split, and Lineup Status columns
- **Min/Max Range**: Numeric columns (Prop Value, Stats, Odds) support min/max filtering

### Sorting

- All columns are sortable
- Special sorters for:
  - Games format (e.g., "19/31" sorts by first number)
  - Rank format (e.g., "21 (25.2)" sorts by rank number)

### Expandable Rows

Click any row to expand and see:
- Matchup details (game, spread, total)
- Minutes data (median, average)

## Supabase Table

The table connects to: `BasketPlayerPropClearances`

### Expected Columns

| Column Name | Description |
|-------------|-------------|
| Player Name | Player's full name |
| Player Team | Team abbreviation |
| Player Prop | Prop type (Points, Rebounds, etc.) |
| Player Prop Value | The line value |
| Split | Split type (All, Home, Away, etc.) |
| Player Clearance | Clearance percentage (0-1) |
| Player Games | Games format "X/Y" |
| Opponent Pace Rank | Numeric rank |
| Opponent Prop Rank | Format "X (Y.Y)" |
| Lineup Status | Confirmed, Expected, etc. |
| Player Prop Median | Median stat value |
| Player Prop Average | Average stat value |
| Player Prop High | Season high |
| Player Prop Low | Season low |
| Player Prop Mode | Most common value |
| Player Median Over Odds | Median over odds |
| Player Median Under Odds | Median under odds |
| Player Best Over Odds | Best available over |
| Player Best Under Odds | Best available under |
| Matchup | Game matchup string |
| Matchup Spread | Point spread |
| Matchup Total | Game total |
| Player Median Minutes | Median minutes played |
| Player Average Minutes | Average minutes played |

## Customization

### Changing Colors

Edit `styles/tableStyles.js` and modify the gradient colors:

```javascript
// Current: Orange theme
background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);

// Alternative: Blue theme
background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
```

### Adding New Columns

Edit `tables/basketPlayerPropClearances.js` in the `getColumns()` method.

### Adding New Tables

1. Create new file in `tables/` extending `BaseTable`
2. Import and initialize in `main.js`

## Caching

Data is cached for 15 minutes in:
- Memory (fastest)
- IndexedDB (persists across page loads)

To force refresh, call:
```javascript
window.basketballTable.refreshData();
```

## Debugging

Access debug tools via console:

```javascript
// Get table instance
window.tableDebug.getTable()

// View expanded row state
window.tableDebug.getGlobalState()

// Clear state
window.tableDebug.clearGlobalState()
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires ES6 module support.
