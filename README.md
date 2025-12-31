# Basketball Props Tables

Modular Tabulator-based data tables for displaying basketball player prop clearances and betting information.

## Recent Updates

### Column Layout Changes
- **Removed "Player Info" combined header** - Name and Team are now standalone columns
- **Name column is frozen** on mobile/tablet devices for easy horizontal scrolling
- **Auto-fit column widths** - All columns except Name automatically size to fit their content (header + data) in a single row
- **Name column fills remaining space** on desktop to utilize full browser width
- **Center-justified headers** - All primary and secondary headers are center-aligned

### Dropdown Filters
- **Positioned above the table** - Dropdown filters now open upward, above the header row
- **High z-index** - Ensures dropdowns always appear on top of other content
- **Improved visibility** - No more issues with dropdowns appearing behind or below the table

### Responsive Design
- **Desktop text scaling** - Font size automatically scales to fit table within browser width
- **Mobile/Tablet optimization** - Smaller font sizes and frozen Name column for easy navigation
- **Single-line content** - Both headers and data cells maintain single-line display

## Directory Structure

```
basketball-props/
├── main.js                          # Entry point
├── README.md                        # This file
├── shared/
│   ├── config.js                    # API and app configuration
│   └── utils.js                     # Utility functions
├── components/
│   ├── customMultiSelect.js         # Multi-select dropdown filter (opens ABOVE)
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

### Column Layout

| Column | Behavior |
|--------|----------|
| Name | Frozen on mobile/tablet, fills remaining space on desktop |
| Team | Auto-fit to content, standalone column |
| Prop Info (Prop, Line, Split) | Auto-fit columns with center alignment |
| Clearance (% Over, Games) | Auto-fit columns |
| Opponent (Prop Rank, Pace Rank) | Auto-fit columns |
| Lineup | Auto-fit column |
| Player Stats (Median, Avg, High, Low, Mode) | Auto-fit columns |
| Median Odds (Over, Under) | Auto-fit columns with min/max filters |
| Best Odds (Over, Under) | Auto-fit columns with min/max filters |

### Filters

- **Text Search**: Player Name column has free-text search
- **Multi-Select Dropdown**: Team, Prop, Split, and Lineup Status columns (opens ABOVE table)
- **Min/Max Range**: Numeric columns (Line, Odds) support min/max filtering

### Sorting

- All columns are sortable
- Special sorters for:
  - Games format (e.g., "19/31" sorts by first number)
  - Rank format (e.g., "21 (25.2)" sorts by rank number)
  - Odds format (e.g., "-110 (DraftKings)" extracts numeric value)

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
| Player Clearance | Clearance percentage |
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
| Player Best Over Odds | Best available over (may include book name) |
| Player Best Under Odds | Best available under (may include book name) |
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

### Modifying Column Widths

Columns use these properties:
- `widthGrow: 0` - Auto-fit to content (most columns)
- `widthGrow: 1` - Fill remaining space (Name column on desktop)
- `minWidth` - Minimum width in pixels
- `frozen: true` - Sticky column (Name on mobile/tablet)

### Adding New Tables

1. Create new file in `tables/` extending `BaseTable`
2. Import and initialize in `main.js`

## Caching

Data is cached for 15 minutes in memory.

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

// Get current filters
window.tableDebug.getFilters()

// Clear all filters
window.tableDebug.clearFilters()

// Get row count
window.tableDebug.getRowCount()

// Force redraw
window.tableDebug.redraw(true)
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires ES6 module support.

## Responsive Breakpoints

| Breakpoint | Screen Width | Behavior |
|------------|--------------|----------|
| Mobile | ≤768px | Frozen Name column, smaller fonts |
| Tablet | 769px-1024px | Frozen Name column, medium fonts |
| Desktop | >1024px | Full-width Name column, auto-scaling fonts |
