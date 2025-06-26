import { useState, useEffect } from 'react'
import './App.css'
import gameData from '../../data/dummy_data.json'

function App() {
  const [currentWord, setCurrentWord] = useState(null)
  const [path, setPath] = useState([])
  const [stepCount, setStepCount] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [destination, setDestination] = useState(null)
  const [viewMode, setViewMode] = useState('natural') // 'natural' or 'structured'
  const [showOptimalPath, setShowOptimalPath] = useState(false)

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
    const { origin, destination } = gameData.game_config.daily_puzzle
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
    // Check master words first
    if (gameData.master_words[wordName]) {
      return gameData.master_words[wordName]
    }
    // Then check traits
    if (gameData.traits[wordName]) {
      return gameData.traits[wordName]
    }
    // Finally check roles
    if (gameData.roles[wordName]) {
      return gameData.roles[wordName]
    }
    return null
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
        <Header destination={destination} stepCount={stepCount} viewMode={viewMode} setViewMode={setViewMode} />
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
      <Header destination={destination} stepCount={stepCount} viewMode={viewMode} setViewMode={setViewMode} />
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
            <h3>Optimal Path from {gameData.game_config.daily_puzzle.origin} to {destination}:</h3>
            <div className="optimal-path">
              {(() => {
                const optimalPath = findOptimalPath(gameData.game_config.daily_puzzle.origin, destination)
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
    </div>
  )
}

function Header({ destination, stepCount, viewMode, setViewMode }) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Get destination word data
  const destWordData = gameData.master_words[destination] || 
                      gameData.traits[destination] || 
                      gameData.roles[destination]
  
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
        <h1>Six Degrees</h1>
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
        </div>
      </div>
    </header>
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
    const exists = allWords.master_words[word] || 
                  allWords.traits[word] || 
                  allWords.roles[word]
    
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