# Six Degrees Frontend

React-based game interface for the Six Degrees word association game.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Game will be available at `http://localhost:5173`

## Data Integration

### Automatic Data Updates

The frontend automatically uses the latest build data from the build system:

- **Data Source**: `../data/dummy_data.json` (relative to frontend)
- **Updates**: Automatically when build system runs
- **Manual Update**: `cd ../build_system && npm run update-frontend`

### Build Timestamp

The frontend displays when the current data was generated:
- **Location**: Top-left corner next to "Six Degrees" title
- **Format**: "Data: Jun 26, 2025, 04:07 PM"
- **Purpose**: Shows if you're using latest or outdated data

## Game Features

### Two View Modes

**Natural View** (Default):
- Template-based natural language descriptions
- "A Cat is a type of Animal..."
- "When thinking about cats, one might also think of..."

**Structured View**:
- Organized metadata sections
- Parent, Children, Traits, Acquaintances, Roles
- Technical/detailed view

### Navigation

- **Click words**: Navigate to linked words
- **Breadcrumbs**: Click any previous word to go back
- **Browser Back**: Works with browser back button
- **Keyboard**: Backspace key to go back
- **Reveal Path**: Shows optimal path to destination

### Tooltips

Hover over any linked word to see its definition/description preview.

## Data Structure

The frontend expects this data structure:

```json
{
  "master_words": {
    "Thing": {
      "word": "Thing",
      "type": "thing",
      "parent": null,
      "children": ["Animal", "Object", "Concept"],
      "traits": ["complex"],
      "acquaintances": ["item", "stuff"],
      "purposes": []
    }
  },
  "traits_master": {
    "complex": {
      "word": "complex",
      "type": "trait",
      "exemplars": ["Thing", "Animal", "System"]
    }
  },
  "roles_master": {
    "storing": {
      "word": "storing", 
      "type": "role",
      "exemplars": ["Container", "Furniture"]
    }
  },
  "buildInfo": {
    "timestamp": "2025-06-26T21:07:52.484Z",
    "date": "Jun 26, 2025, 04:07 PM"
  },
  "stats": {
    "total_words": 113,
    "thing_words": 113,
    "trait_words": 6,
    "role_words": 3
  }
}
```

## Development

### File Structure

```
src/
├── App.jsx          # Main game component
├── App.css          # Game styles
└── main.jsx         # React entry point
```

### Key Components

**App.jsx**:
- Game state management
- Navigation logic
- View mode switching
- Path finding (BFS)
- Natural language generation

**GameHeader**: 
- Title and build timestamp
- View mode toggle
- Destination display
- Step counter

**Breadcrumb**:
- Navigation path
- Click-to-navigate
- Current position

**WordPage**:
- Word display (both view modes)
- Link rendering
- Tooltip management

### Adding Features

#### New View Mode
1. Add state: `const [viewMode, setViewMode] = useState('new')`
2. Add toggle button in header
3. Add rendering logic in `WordPage`

#### New Navigation Feature
1. Update navigation functions
2. Add to breadcrumb component
3. Handle browser history

#### New Data Type
1. Update data structure expectations
2. Add rendering in both view modes
3. Update tooltip logic

## Troubleshooting

### Common Issues

#### "Failed to resolve import" Error
**Symptom**: Vite can't find `dummy_data.json`
**Solution**: 
```bash
cd ../build_system
npm run update-frontend
```

#### Shows Old Data
**Symptom**: Game shows outdated word counts or missing words
**Solution**:
```bash
# Update data
cd ../build_system
npm run update-frontend

# Check timestamp in top corner - should be recent
```

#### No Words/Empty Game
**Symptom**: Game loads but no words available
**Solution**:
```bash
# Generate fresh data
cd ../build_system
npm run test:25
# Frontend will auto-update
```

#### Poor Navigation/Broken Links
**Symptom**: Clicking words doesn't work or shows errors
**Cause**: Incomplete build data (words exist but not processed)
**Solution**: Use completed builds only

### Checking Data Quality

The build timestamp helps identify data issues:
- **Recent timestamp**: Data is fresh
- **Old timestamp**: May need refresh
- **No timestamp**: Very old data format

## Performance

### Expected Performance
- **Load time**: < 1 second for 100+ words
- **Navigation**: Instant between words
- **Path finding**: < 100ms for typical paths

### Large Datasets
- Game handles 1000+ words efficiently
- BFS path finding scales well
- React rendering optimized for word lists

## Configuration

### Styling
Edit `App.css` for visual customization:
- Colors, fonts, spacing
- Layout and responsiveness
- Animation and transitions

### Game Logic
Edit `App.jsx` for behavior changes:
- Path finding algorithm
- Natural language templates
- Navigation behavior
- View mode logic

---

## Integration with Build System

The frontend is designed to work seamlessly with the build system:

1. **Build system generates data** → `data/dummy_data.json`
2. **Frontend imports data** → Game loads automatically  
3. **Build timestamp shows** → User knows data freshness
4. **Updates are automatic** → No manual file copying needed

For the best experience, keep a build system terminal running `npm run monitor` while developing to see when new data is available.