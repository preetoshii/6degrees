import { useState, useEffect } from 'react'
import './App.css'
import gameData from '../../data/dummy_data.json'

function App() {
  const [currentWord, setCurrentWord] = useState(null)
  const [path, setPath] = useState([])
  const [stepCount, setStepCount] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [destination, setDestination] = useState(null)

  // Initialize game on mount
  useEffect(() => {
    startNewGame()
  }, [])

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
    setCurrentWord(wordName)
    setPath([...path, wordName])
    setStepCount(stepCount + 1)
  }

  const navigateBackToStep = (index) => {
    const newPath = path.slice(0, index + 1)
    const wordName = newPath[newPath.length - 1]
    
    setPath(newPath)
    setCurrentWord(wordName)
    setStepCount(index)
    setGameWon(false)
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

  if (gameWon) {
    return (
      <div className="app">
        <Header destination={destination} stepCount={stepCount} />
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
      <Header destination={destination} stepCount={stepCount} />
      <Breadcrumb path={path} onNavigate={navigateBackToStep} />
      <main className="main-content">
        {wordData ? (
          <WordPage 
            wordData={wordData} 
            onNavigate={navigateToWord}
            allWords={gameData}
          />
        ) : (
          <div className="loading">Loading...</div>
        )}
      </main>
    </div>
  )
}

function Header({ destination, stepCount }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Six Degrees</h1>
        <div className="game-info">
          <div className="destination-badge">
            Destination: {destination}
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

function WordPage({ wordData, onNavigate, allWords }) {
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

  return (
    <div className="word-page">
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