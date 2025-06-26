import { useState, useEffect } from 'react'
import './App.css'
import rawGameData from '../../data/dummy_data.json'

// Data Adapter Layer - Makes frontend robust against backend changes
class GameDataAdapter {
  constructor(rawData) {
    this.raw = rawData || {}
    this.words = this.normalizeWords()
    this.buildInfo = this.normalizeBuildInfo()
    this.stats = this.normalizeStats()
  }

  normalizeWords() {
    const words = {}
    
    // Add master words (thing words)
    if (this.raw.master_words) {
      Object.entries(this.raw.master_words).forEach(([key, word]) => {
        words[key] = this.normalizeWord(word)
      })
    }
    
    // Add trait words
    if (this.raw.traits_master) {
      Object.entries(this.raw.traits_master).forEach(([key, trait]) => {
        words[key] = this.normalizeWord(trait)
      })
    }
    
    // Add role words
    if (this.raw.roles_master) {
      Object.entries(this.raw.roles_master).forEach(([key, role]) => {
        words[key] = this.normalizeWord(role)
      })
    }
    
    return words
  }

  normalizeWord(word) {
    return {
      word: word.word || 'Unknown',
      type: word.type || 'thing',
      parent: word.parent || null,
      children: word.children || [],
      traits: word.traits || [],
      acquaintances: word.acquaintances || [],
      purposes: word.purposes || [],
      exemplars: word.exemplars || [],
      related_traits: word.related_traits || [],
      definition: word.definition || null
    }
  }

  normalizeBuildInfo() {
    return {
      timestamp: this.raw.buildInfo?.timestamp || null,
      date: this.raw.buildInfo?.date || 'Unknown'
    }
  }

  normalizeStats() {
    return {
      total_words: this.raw.stats?.total_words || Object.keys(this.words).length,
      thing_words: this.raw.stats?.thing_words || 0,
      trait_words: this.raw.stats?.trait_words || 0,
      role_words: this.raw.stats?.role_words || 0
    }
  }

  // Safe word lookup
  findWord(wordName) {
    return this.words[wordName] || null
  }

  // Get all word names
  getWordNames() {
    return Object.keys(this.words)
  }

  // Check if word exists
  hasWord(wordName) {
    return wordName in this.words
  }

  // Get words by type
  getWordsByType(type) {
    return Object.values(this.words).filter(word => word.type === type)
  }

  // Safe game config access
  getGameConfig() {
    return {
      daily_puzzle: this.raw.game_config?.daily_puzzle || null
    }
  }
}

// Initialize the adapter
const gameData = new GameDataAdapter(rawGameData)

function App() {
  const [currentWord, setCurrentWord] = useState(null)
  const [path, setPath] = useState([])
  const [stepCount, setStepCount] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [destination, setDestination] = useState(null)
  const [viewMode, setViewMode] = useState('natural') // 'natural' or 'structured'
  const [showOptimalPath, setShowOptimalPath] = useState(false)
  const [showGraphExplorer, setShowGraphExplorer] = useState(false)

  // Initialize game on mount
  useEffect(() => {
    startNewGame()
  }, [])

  // Handle browser back button and backspace key
  useEffect(() => {
    // Push initial state
    if (path.length > 0) {
      window.history.pushState({ path, stepCount }, '', window.location.href)
    }

    // Handle popstate (browser back/forward)
    const handlePopState = (event) => {
      if (event.state && event.state.path && event.state.path.length > 1) {
        const newPath = event.state.path.slice(0, -1)
        const wordName = newPath[newPath.length - 1]
        setPath(newPath)
        setCurrentWord(wordName)
        setStepCount(newPath.length - 1)
        setGameWon(false)
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (event) => {
      // Only handle backspace when not in an input field
      if (event.key === 'Backspace' && 
          event.target.tagName !== 'INPUT' && 
          event.target.tagName !== 'TEXTAREA' &&
          path.length > 1) {
        event.preventDefault()
        navigateBackToStep(path.length - 2)
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [path])

  const startNewGame = () => {
    // Use daily puzzle if available, otherwise pick random start/end
    let origin = 'Thing'
    let destination = 'Horse'
    
    const config = gameData.getGameConfig()
    if (config.daily_puzzle) {
      origin = config.daily_puzzle.origin
      destination = config.daily_puzzle.destination
    } else {
      // Pick a random origin and destination from available words
      const wordNames = gameData.getWordNames()
      if (wordNames.length > 1) {
        origin = wordNames[0] // Start with first word (likely "Thing")
        // Pick a random destination that's not the origin
        const possibleDests = wordNames.filter(w => w !== origin)
        if (possibleDests.length > 0) {
          destination = possibleDests[Math.floor(Math.random() * possibleDests.length)]
        }
      }
    }
    
    setCurrentWord(origin)
    setDestination(destination)
    setPath([origin])
    setStepCount(0)
    setGameWon(false)
  }

  const navigateToWord = (wordName) => {
    // Find the word data
    const wordData = findWordData(wordName)
    if (!wordData) return

    // Check if we won
    if (wordName === destination) {
      setGameWon(true)
    }

    // Update game state
    const newPath = [...path, wordName]
    const newStepCount = stepCount + 1
    
    setCurrentWord(wordName)
    setPath(newPath)
    setStepCount(newStepCount)
    
    // Push to browser history
    window.history.pushState({ path: newPath, stepCount: newStepCount }, '', window.location.href)
  }

  const navigateBackToStep = (index) => {
    const newPath = path.slice(0, index + 1)
    const wordName = newPath[newPath.length - 1]
    
    setPath(newPath)
    setCurrentWord(wordName)
    setStepCount(index)
    setGameWon(false)
    
    // Push to browser history
    window.history.pushState({ path: newPath, stepCount: index }, '', window.location.href)
  }

  const findWordData = (wordName) => {
    return gameData.findWord(wordName)
  }

  const shareScore = () => {
    const text = `I reached ${destination} from ${path[0]} in ${stepCount} steps!\nPlay Six Degrees: [link]`
    navigator.clipboard.writeText(text)
    alert('Score copied to clipboard!')
  }

  // Find shortest path between two words using BFS
  const findOptimalPath = (start, end) => {
    const queue = [[start]]
    const visited = new Set([start])
    
    while (queue.length > 0) {
      const currentPath = queue.shift()
      const currentWord = currentPath[currentPath.length - 1]
      
      // Get word data
      const wordData = findWordData(currentWord)
      if (!wordData) continue
      
      // Check all connections
      const connections = [
        ...(wordData.parent ? [wordData.parent] : []),
        ...(wordData.children || []),
        ...(wordData.traits || []),
        ...(wordData.acquaintances || []),
        ...(wordData.purposes || [])
      ]
      
      for (const nextWord of connections) {
        if (nextWord === end) {
          return [...currentPath, nextWord]
        }
        
        if (!visited.has(nextWord) && findWordData(nextWord)) {
          visited.add(nextWord)
          queue.push([...currentPath, nextWord])
        }
      }
    }
    
    return null // No path found
  }
  
  const toggleOptimalPath = () => {
    setShowOptimalPath(!showOptimalPath)
  }

  if (gameWon) {
    return (
      <div className="app">
        <Header destination={destination} stepCount={stepCount} viewMode={viewMode} setViewMode={setViewMode} onOpenGraphExplorer={() => setShowGraphExplorer(true)} />
        <main className="main-content">
          <div className="victory-screen">
            <h2>🎉 Victory!</h2>
            <div className="victory-stats">
              You reached <strong>{destination}</strong> in {stepCount} steps
            </div>
            <div className="victory-path">
              <strong>Your path:</strong><br />
              {path.join(' → ')}
            </div>
            <div className="victory-buttons">
              <button className="button button-primary" onClick={shareScore}>
                Share Score
              </button>
              <button className="button button-secondary" onClick={startNewGame}>
                Play Again
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const wordData = findWordData(currentWord)

  return (
    <div className="app">
      <Header destination={destination} stepCount={stepCount} viewMode={viewMode} setViewMode={setViewMode} onOpenGraphExplorer={() => setShowGraphExplorer(true)} />
      <Breadcrumb path={path} onNavigate={navigateBackToStep} />
      <main className="main-content">
        <div className="game-controls">
          <button 
            className="reveal-path-btn"
            onClick={toggleOptimalPath}
          >
            {showOptimalPath ? 'Hide' : 'Reveal'} Optimal Path
          </button>
        </div>
        
        {showOptimalPath && (
          <div className="optimal-path-display">
            <h3>Optimal Path from {path[0]} to {destination}:</h3>
            <div className="optimal-path">
              {(() => {
                const optimalPath = findOptimalPath(path[0], destination)
                if (!optimalPath) return <p>No path found</p>
                return (
                  <div className="path-steps">
                    {optimalPath.map((word, index) => (
                      <span key={index} className="path-item">
                        <span 
                          className="path-word"
                          onClick={() => navigateToWord(word)}
                        >
                          {word}
                        </span>
                        {index < optimalPath.length - 1 && <span className="path-arrow">→</span>}
                      </span>
                    ))}
                    <span className="path-length">({optimalPath.length - 1} steps)</span>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
        
        {wordData ? (
          <WordPage 
            wordData={wordData} 
            onNavigate={navigateToWord}
            allWords={gameData}
            viewMode={viewMode}
          />
        ) : (
          <div className="loading">Loading...</div>
        )}
      </main>
      
      {/* Graph Explorer Modal */}
      {showGraphExplorer && (
        <GraphExplorer 
          gameData={gameData}
          onClose={() => setShowGraphExplorer(false)}
          onNavigateToWord={(word) => {
            setShowGraphExplorer(false)
            navigateToWord(word)
          }}
        />
      )}
    </div>
  )
}

function Header({ destination, stepCount, viewMode, setViewMode, onOpenGraphExplorer }) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Get destination word data
  const destWordData = gameData.findWord(destination)
  
  // Generate tooltip content
  const getTooltipContent = () => {
    if (!destWordData) return destination
    
    const descriptions = []
    
    // Main definition
    if (destWordData.type === 'thing' && destWordData.parent) {
      descriptions.push(`A ${destination} is a type of ${destWordData.parent}.`)
    } else if (destWordData.type === 'trait') {
      descriptions.push(`${destination} is a characteristic or quality.`)
    } else if (destWordData.type === 'role') {
      descriptions.push(`${destination} represents a function or purpose.`)
    }
    
    // Add one more detail if available
    if (destWordData.traits && destWordData.traits.length > 0) {
      descriptions.push(`It can be described as ${destWordData.traits[0]}.`)
    } else if (destWordData.children && destWordData.children.length > 0) {
      descriptions.push(`Examples include ${destWordData.children.slice(0, 2).join(' and ')}.`)
    }
    
    return descriptions.join(' ')
  }
  
  return (
    <header className="header">
      <div className="header-content">
        <div className="title-section">
          <h1>Six Degrees</h1>
          {gameData.buildInfo && (
            <div className="build-info">
              Data: {gameData.buildInfo.date}
            </div>
          )}
        </div>
        <div className="game-info">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'natural' ? 'active' : ''}`}
              onClick={() => setViewMode('natural')}
            >
              Natural
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'structured' ? 'active' : ''}`}
              onClick={() => setViewMode('structured')}
            >
              Structured
            </button>
          </div>
          <div 
            className="destination-badge"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            Destination: <span className="destination-word">{destination}</span>
            {showTooltip && (
              <div className="destination-tooltip">
                {getTooltipContent()}
              </div>
            )}
          </div>
          <div className="step-counter">
            Steps: {stepCount}
          </div>
          <button 
            className="button button-secondary"
            onClick={onOpenGraphExplorer}
            title="Explore Word Graph"
          >
            🔍 Graph
          </button>
        </div>
      </div>
    </header>
  )
}

function GraphExplorer({ gameData, onClose, onNavigateToWord }) {
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'thing', 'trait', 'role'
    minChildren: 0,
    maxChildren: 100,
    minTraits: 0,
    maxTraits: 20,
    minAcquaintances: 0,
    maxAcquaintances: 20,
    searchTerm: ''
  })
  
  const [sortBy, setSortBy] = useState('name') // 'name', 'children', 'traits', 'acquaintances', 'type'
  const [sortDirection, setSortDirection] = useState('asc')
  
  // Get all words and apply filters
  const allWords = Object.values(gameData.words)
  const filteredWords = allWords.filter(word => {
    // Type filter
    if (filters.type !== 'all' && word.type !== filters.type) return false
    
    // Count filters
    if (word.children.length < filters.minChildren || word.children.length > filters.maxChildren) return false
    if (word.traits.length < filters.minTraits || word.traits.length > filters.maxTraits) return false
    if (word.acquaintances.length < filters.minAcquaintances || word.acquaintances.length > filters.maxAcquaintances) return false
    
    // Search filter
    if (filters.searchTerm && !word.word.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false
    
    return true
  })
  
  // Sort words
  const sortedWords = [...filteredWords].sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy) {
      case 'name':
        aVal = a.word.toLowerCase()
        bVal = b.word.toLowerCase()
        break
      case 'children':
        aVal = a.children.length
        bVal = b.children.length
        break
      case 'traits':
        aVal = a.traits.length
        bVal = b.traits.length
        break
      case 'acquaintances':
        aVal = a.acquaintances.length
        bVal = b.acquaintances.length
        break
      case 'type':
        aVal = a.type
        bVal = b.type
        break
      default:
        return 0
    }
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  
  // Statistics
  const stats = {
    total: allWords.length,
    filtered: filteredWords.length,
    byType: {
      thing: allWords.filter(w => w.type === 'thing').length,
      trait: allWords.filter(w => w.type === 'trait').length,
      role: allWords.filter(w => w.type === 'role').length
    }
  }
  
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const resetFilters = () => {
    setFilters({
      type: 'all',
      minChildren: 0,
      maxChildren: 100,
      minTraits: 0,
      maxTraits: 20,
      minAcquaintances: 0,
      maxAcquaintances: 20,
      searchTerm: ''
    })
  }
  
  return (
    <div className="graph-explorer-overlay">
      <div className="graph-explorer">
        <div className="graph-explorer-header">
          <h2>🔍 Word Graph Explorer</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="graph-explorer-content">
          {/* Statistics Panel */}
          <div className="stats-panel">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Words:</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Filtered:</span>
                <span className="stat-value">{stats.filtered}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Things:</span>
                <span className="stat-value">{stats.byType.thing}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Traits:</span>
                <span className="stat-value">{stats.byType.trait}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Roles:</span>
                <span className="stat-value">{stats.byType.role}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Build Date:</span>
                <span className="stat-value">{gameData.buildInfo.date}</span>
              </div>
            </div>
          </div>
          
          {/* Filters Panel */}
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="button button-small" onClick={resetFilters}>Reset</button>
            </div>
            
            <div className="filters-grid">
              {/* Search */}
              <div className="filter-group">
                <label>Search:</label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  placeholder="Type to search words..."
                />
              </div>
              
              {/* Type Filter */}
              <div className="filter-group">
                <label>Type:</label>
                <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="thing">Things</option>
                  <option value="trait">Traits</option>
                  <option value="role">Roles</option>
                </select>
              </div>
              
              {/* Children Count */}
              <div className="filter-group">
                <label>Children: {filters.minChildren} - {filters.maxChildren}</label>
                <div className="range-inputs">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={filters.minChildren}
                    onChange={(e) => updateFilter('minChildren', parseInt(e.target.value))}
                  />
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={filters.maxChildren}
                    onChange={(e) => updateFilter('maxChildren', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Traits Count */}
              <div className="filter-group">
                <label>Traits: {filters.minTraits} - {filters.maxTraits}</label>
                <div className="range-inputs">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={filters.minTraits}
                    onChange={(e) => updateFilter('minTraits', parseInt(e.target.value))}
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={filters.maxTraits}
                    onChange={(e) => updateFilter('maxTraits', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Acquaintances Count */}
              <div className="filter-group">
                <label>Acquaintances: {filters.minAcquaintances} - {filters.maxAcquaintances}</label>
                <div className="range-inputs">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={filters.minAcquaintances}
                    onChange={(e) => updateFilter('minAcquaintances', parseInt(e.target.value))}
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={filters.maxAcquaintances}
                    onChange={(e) => updateFilter('maxAcquaintances', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="sort-panel">
            <h3>Sort</h3>
            <div className="sort-controls">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="children">Children Count</option>
                <option value="traits">Traits Count</option>
                <option value="acquaintances">Acquaintances Count</option>
              </select>
              <button 
                className="button button-small"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          
          {/* Words List */}
          <div className="words-panel">
            <h3>Words ({sortedWords.length})</h3>
            <div className="words-list">
              {sortedWords.map(word => (
                <div key={word.word} className={`word-item ${word.type}`}>
                  <div className="word-header">
                    <span 
                      className="word-name"
                      onClick={() => onNavigateToWord(word.word)}
                    >
                      {word.word}
                    </span>
                    <span className="word-type">{word.type}</span>
                  </div>
                  <div className="word-stats">
                    <span>Children: {word.children.length}</span>
                    <span>Traits: {word.traits.length}</span>
                    <span>Acquaintances: {word.acquaintances.length}</span>
                    {word.purposes.length > 0 && <span>Roles: {word.purposes.length}</span>}
                    {word.exemplars.length > 0 && <span>Exemplars: {word.exemplars.length}</span>}
                  </div>
                  {word.parent && (
                    <div className="word-parent">
                      Parent: <span onClick={() => onNavigateToWord(word.parent)}>{word.parent}</span>
                    </div>
                  )}
                  {word.children.length > 0 && (
                    <div className="word-children">
                      Children: {word.children.slice(0, 5).map(child => (
                        <span key={child} onClick={() => onNavigateToWord(child)}>{child}</span>
                      ))}
                      {word.children.length > 5 && <span>... +{word.children.length - 5} more</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Breadcrumb({ path, onNavigate }) {
  return (
    <nav className="breadcrumb">
      <div className="breadcrumb-content">
        {path.map((word, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              className="breadcrumb-item"
              onClick={() => onNavigate(index)}
            >
              {word}
            </span>
            {index < path.length - 1 && (
              <span className="breadcrumb-separator">→</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}

function WordPage({ wordData, onNavigate, allWords, viewMode }) {
  const renderWordLink = (word, className = '') => {
    // Check if this word exists in our data
    const exists = allWords.hasWord(word)
    
    if (!exists) return null

    return (
      <span
        key={word}
        className={`word-link ${className}`}
        onClick={() => onNavigate(word)}
      >
        {word}
      </span>
    )
  }

  // Natural language templates
  const generateNaturalDescription = () => {
    const descriptions = []
    
    // Main definition based on type and parent
    if (wordData.type === 'thing' && wordData.parent) {
      descriptions.push(
        <p key="main">
          A <strong>{wordData.word}</strong> is a type of {renderWordLink(wordData.parent, 'inline-link')}.
        </p>
      )
    } else if (wordData.type === 'trait') {
      descriptions.push(
        <p key="main">
          <strong>{wordData.word}</strong> is a characteristic or quality that describes certain things.
        </p>
      )
    } else if (wordData.type === 'role') {
      descriptions.push(
        <p key="main">
          <strong>{wordData.word}</strong> represents a function or purpose in the world.
        </p>
      )
    } else {
      descriptions.push(
        <p key="main">
          <strong>{wordData.word}</strong> is a fundamental concept.
        </p>
      )
    }

    // Children description
    if (wordData.children && wordData.children.length > 0) {
      const childLinks = wordData.children.slice(0, 3).map(child => renderWordLink(child, 'inline-link'))
      descriptions.push(
        <p key="children">
          Some examples of {wordData.word.toLowerCase()} include {childLinks.reduce((prev, curr, i) => [prev, i === childLinks.length - 1 ? ' and ' : ', ', curr])}{wordData.children.length > 3 && ', among others'}.
        </p>
      )
    }

    // Traits description
    if (wordData.traits && wordData.traits.length > 0) {
      const traitLinks = wordData.traits.map(trait => renderWordLink(trait, 'inline-link trait-link'))
      descriptions.push(
        <p key="traits">
          {wordData.word} can be described as {traitLinks.reduce((prev, curr, i) => [prev, i === traitLinks.length - 1 ? ' and ' : ', ', curr])}.
        </p>
      )
    }

    // Acquaintances description
    if (wordData.acquaintances && wordData.acquaintances.length > 0) {
      const acqLinks = wordData.acquaintances.slice(0, 4).map(acq => renderWordLink(acq, 'inline-link'))
      descriptions.push(
        <p key="acquaintances">
          When thinking about {wordData.word.toLowerCase()}, one might also think of {acqLinks.reduce((prev, curr, i) => [prev, i === acqLinks.length - 1 ? ' and ' : ', ', curr])}.
        </p>
      )
    }

    // Roles description
    if (wordData.purposes && wordData.purposes.length > 0) {
      const roleLinks = wordData.purposes.map(purpose => renderWordLink(purpose, 'inline-link role-link'))
      descriptions.push(
        <p key="roles">
          {wordData.word} can serve the role of {roleLinks.reduce((prev, curr, i) => [prev, i === roleLinks.length - 1 ? ' or ' : ', ', curr])}.
        </p>
      )
    }

    // Exemplars description (for traits)
    if (wordData.exemplars && wordData.exemplars.length > 0) {
      const exemplarLinks = wordData.exemplars.slice(0, 3).map(ex => renderWordLink(ex, 'inline-link'))
      descriptions.push(
        <p key="exemplars">
          Things that are particularly {wordData.word.toLowerCase()} include {exemplarLinks.reduce((prev, curr, i) => [prev, i === exemplarLinks.length - 1 ? ' and ' : ', ', curr])}.
        </p>
      )
    }

    return descriptions
  }

  if (viewMode === 'natural') {
    return (
      <div className="word-page natural-view">
        <h2 className="word-title">{wordData.word}</h2>
        <div className="natural-description">
          {generateNaturalDescription()}
        </div>
      </div>
    )
  }

  // Structured view (original)
  return (
    <div className="word-page structured-view">
      <h2 className="word-title">{wordData.word}</h2>
      
      {wordData.definition && (
        <p className="word-definition">{wordData.definition}</p>
      )}

      <div className="metadata-sections">
        {/* Parent section - only for thing words */}
        {wordData.type === 'thing' && wordData.parent && (
          <div className="metadata-section">
            <h3>Parent</h3>
            <div className="metadata-items">
              {renderWordLink(wordData.parent, 'parent-link')}
            </div>
          </div>
        )}

        {/* Children section - only for thing words */}
        {wordData.children && wordData.children.length > 0 && (
          <div className="metadata-section">
            <h3>Children</h3>
            <div className="metadata-items">
              {wordData.children.map(child => renderWordLink(child))}
            </div>
          </div>
        )}

        {/* Traits section */}
        {wordData.traits && wordData.traits.length > 0 && (
          <div className="metadata-section">
            <h3>Traits</h3>
            <div className="metadata-items">
              {wordData.traits.map(trait => renderWordLink(trait, 'trait-link'))}
            </div>
          </div>
        )}

        {/* Acquaintances section */}
        {wordData.acquaintances && wordData.acquaintances.length > 0 && (
          <div className="metadata-section">
            <h3>Acquaintances</h3>
            <div className="metadata-items">
              {wordData.acquaintances.map(acq => renderWordLink(acq))}
            </div>
          </div>
        )}

        {/* Purposes/Roles section */}
        {wordData.purposes && wordData.purposes.length > 0 && (
          <div className="metadata-section">
            <h3>Roles</h3>
            <div className="metadata-items">
              {wordData.purposes.map(purpose => renderWordLink(purpose, 'role-link'))}
            </div>
          </div>
        )}

        {/* Exemplars section - for traits */}
        {wordData.exemplars && wordData.exemplars.length > 0 && (
          <div className="metadata-section">
            <h3>Exemplars</h3>
            <div className="metadata-items">
              {wordData.exemplars.map(ex => renderWordLink(ex))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App