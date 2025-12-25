import { useState } from 'react'
import { supabase } from '../supabaseClient'
import CameraModal from './CameraModal'

export default function AddCard({ onCardAdded, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    jobTitle: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    notes: ''
  })
  const [mode, setMode] = useState('image') // 'image' or 'manual'
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(null)

  const handleImageUpload = async (file, type) => {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Cards_images')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }

    const { data } = supabase.storage
      .from('Cards_images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const frontImageUrl = frontImage ? await handleImageUpload(frontImage, 'front') : null
      const backImageUrl = backImage ? await handleImageUpload(backImage, 'back') : null

      const { data, error } = await supabase
        .from('business_cards')
        .insert([{
          full_name: formData.fullName,
          company: formData.company,
          job_title: formData.jobTitle,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
          front_image_url: frontImageUrl,
          back_image_url: backImageUrl,
          notes: formData.notes
        }])
        .select()

      if (error) throw error
      
      onCardAdded()
    } catch (error) {
      console.error('Error:', error)
      alert(`Failed to save card: ${error.message || JSON.stringify(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      if (type === 'front') {
        setFrontImage(file)
        setFrontPreview(preview)
      } else {
        setBackImage(file)
        setBackPreview(preview)
      }
    }
  }

  const handleCameraCapture = (file, type) => {
    const preview = URL.createObjectURL(file)
    if (type === 'front') {
      setFrontImage(file)
      setFrontPreview(preview)
    } else {
      setBackImage(file)
      setBackPreview(preview)
    }
  }

  const removeImage = (type) => {
    if (type === 'front') {
      setFrontImage(null)
      setFrontPreview(null)
    } else {
      setBackImage(null)
      setBackPreview(null)
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === 'image'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            📷 Upload Images
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            ✏️ Manual Entry
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-200 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {mode === 'image' && (
              /* Card Images Section */
              <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Card Images</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-900">
                    Front Image
                  </label>
                  {frontPreview ? (
                    <div className="relative">
                      <img src={frontPreview} alt="Front preview" className="w-full rounded-lg border-2 border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeImage('front')}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setCameraOpen('front')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-blue-400 hover:bg-blue-50"
                      >
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-center">
                          <p className="font-medium text-gray-700">Open Camera</p>
                          <p className="text-sm text-gray-500">Take a photo</p>
                        </div>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'front')}
                        className="hidden"
                        id="front-upload"
                      />
                      <label
                        htmlFor="front-upload"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload from device
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-900">
                    Back Image <span className="text-gray-400">(Optional)</span>
                  </label>
                  {backPreview ? (
                    <div className="relative">
                      <img src={backPreview} alt="Back preview" className="w-full rounded-lg border-2 border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeImage('back')}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setCameraOpen('back')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-blue-400 hover:bg-blue-50"
                      >
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-center">
                          <p className="font-medium text-gray-700">Open Camera</p>
                          <p className="text-sm text-gray-500">Take a photo</p>
                        </div>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'back')}
                        className="hidden"
                        id="back-upload"
                      />
                      <label
                        htmlFor="back-upload"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload from device
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {mode === 'manual' && (
              /* Contact Details Section */
              <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Senior Developer"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="www.company.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St, City, State, ZIP"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Additional Notes Section - Always visible */}
            <div className="border-t border-gray-200 pt-8">
              <label className="mb-2 block text-sm font-semibold text-gray-900">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Any additional information..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Business Card'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CameraModal
        isOpen={cameraOpen !== null}
        onClose={() => setCameraOpen(null)}
        onCapture={(file) => handleCameraCapture(file, cameraOpen)}
        title={`Capture ${cameraOpen === 'front' ? 'Front' : 'Back'} Image`}
      />
    </>
  )
}