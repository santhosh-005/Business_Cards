import { useState } from 'react'
import './App.css'
import AddCard from './components/AddCard'
import CardList from './components/CardList'

function App() {
  const [showAddCard, setShowAddCard] = useState(false)
  const [refreshList, setRefreshList] = useState(0)

  const handleCardAdded = () => {
    setRefreshList(prev => prev + 1)
    setShowAddCard(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">CardManager</h1>
              <p className="hidden text-xs text-gray-500 md:block">Organize your business contacts</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddCard(!showAddCard)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 md:px-6"
          >
            {showAddCard ? (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden md:inline">Back to Cards</span>
                <span className="md:hidden">Back</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline">Add New Card</span>
                <span className="md:hidden">Add</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {showAddCard ? (
          <AddCard onCardAdded={handleCardAdded} onCancel={() => setShowAddCard(false)} />
        ) : (
          <CardList key={refreshList} />
        )}
      </main>
    </div>
  )
}

export default App
