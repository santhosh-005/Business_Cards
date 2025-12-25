import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function CardList() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCards(cards.filter(card => card.id !== id))
      setSelectedCard(null)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete card')
    }
  }

  const filteredCards = cards.filter(card => 
    (card.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (card.company?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (card.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading cards...</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center">
        <div className="mx-auto max-w-md">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">No business cards yet</h3>
          <p className="mt-2 text-gray-600">Get started by adding your first business card using the button above.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Business Cards</h2>
          <p className="mt-1 text-sm text-gray-600">{filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} found</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-64"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gray-200 transition hover:shadow-xl hover:ring-blue-500"
          >
            {card.front_image_url ? (
              <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={card.front_image_url}
                  alt="Business card"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <svg className="h-16 w-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}
            
            <div className="p-4">
              {card.full_name && (
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{card.full_name}</h3>
              )}
              {card.job_title && (
                <p className="mt-1 text-sm text-gray-600">{card.job_title}</p>
              )}
              {card.company && (
                <p className="mt-0.5 text-sm font-medium text-gray-700">{card.company}</p>
              )}
              <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                {card.email && (
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </span>
                )}
                {card.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50 p-4" onClick={() => setSelectedCard(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Business Card Details</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {(selectedCard.front_image_url || selectedCard.back_image_url) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedCard.front_image_url && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Front Image</label>
                        <img
                          src={selectedCard.front_image_url}
                          alt="Front"
                          className="w-full rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedCard.back_image_url && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Back Image</label>
                        <img
                          src={selectedCard.back_image_url}
                          alt="Back"
                          className="w-full rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-6 rounded-lg bg-gray-50 p-6 md:grid-cols-2">
                  {selectedCard.full_name && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
                      <p className="mt-1 text-gray-900">{selectedCard.full_name}</p>
                    </div>
                  )}
                  {selectedCard.company && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Company</label>
                      <p className="mt-1 text-gray-900">{selectedCard.company}</p>
                    </div>
                  )}
                  {selectedCard.job_title && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Job Title</label>
                      <p className="mt-1 text-gray-900">{selectedCard.job_title}</p>
                    </div>
                  )}
                  {selectedCard.email && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
                      <a href={`mailto:${selectedCard.email}`} className="mt-1 block text-blue-600 hover:text-blue-700">{selectedCard.email}</a>
                    </div>
                  )}
                  {selectedCard.phone && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</label>
                      <a href={`tel:${selectedCard.phone}`} className="mt-1 block text-blue-600 hover:text-blue-700">{selectedCard.phone}</a>
                    </div>
                  )}
                  {selectedCard.website && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Website</label>
                      <a href={selectedCard.website} target="_blank" rel="noopener noreferrer" className="mt-1 block text-blue-600 hover:text-blue-700">{selectedCard.website}</a>
                    </div>
                  )}
                  {selectedCard.address && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Address</label>
                      <p className="mt-1 text-gray-900">{selectedCard.address}</p>
                    </div>
                  )}
                  {selectedCard.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</label>
                      <p className="mt-1 text-gray-900">{selectedCard.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
                <button
                  onClick={() => handleDelete(selectedCard.id)}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
