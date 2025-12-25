import { useState } from 'react'
import { supabase } from '../supabaseClient'
import CameraModal from './CameraModal'
import CropModal from './CropModal'
import Tesseract from 'tesseract.js'

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
  const [frontOriginalImage, setFrontOriginalImage] = useState(null) // Store original for upload
  const [backImage, setBackImage] = useState(null)
  const [backOriginalImage, setBackOriginalImage] = useState(null) // Store original for upload
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(null)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [backOcrProcessing, setBackOcrProcessing] = useState(false)
  const [backOcrProgress, setBackOcrProgress] = useState(0)
  const [cropModalOpen, setCropModalOpen] = useState(null) // 'front' or 'back' or null
  const [pendingImageFile, setPendingImageFile] = useState(null) // Image waiting to be cropped

  // Extract business card info from OCR text
  const extractBusinessCardInfo = (text) => {
    console.log("text extracted:", text)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const info = {
      fullName: '',
      company: '',
      jobTitle: '',
      email: '',
      phone: '',
      website: '',
      address: ''
    }

    // Email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    // Phone regex (various formats)
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g
    // Website regex
    const websiteRegex = /(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi
    
    // Common job titles to identify
    const jobTitles = ['ceo', 'cto', 'cfo', 'coo', 'director', 'manager', 'engineer', 'developer', 'designer', 'consultant', 'analyst', 'executive', 'president', 'vice president', 'vp', 'head', 'lead', 'senior', 'junior', 'associate', 'specialist', 'coordinator', 'administrator', 'officer', 'founder', 'co-founder', 'owner', 'partner']
    
    // Extract email
    const emailMatch = text.match(emailRegex)
    if (emailMatch) {
      info.email = emailMatch[0]
    }

    // Extract phone
    const phoneMatch = text.match(phoneRegex)
    if (phoneMatch) {
      // Filter out short numbers that might be zip codes
      const validPhones = phoneMatch.filter(p => p.replace(/\D/g, '').length >= 7)
      if (validPhones.length > 0) {
        info.phone = validPhones[0]
      }
    }

    // Extract website
    const websiteMatch = text.match(websiteRegex)
    if (websiteMatch) {
      // Filter out email domains
      const validWebsites = websiteMatch.filter(w => !w.includes('@'))
      if (validWebsites.length > 0) {
        info.website = validWebsites[0]
      }
    }

    // Process lines for name, company, job title, address
    let potentialNames = []
    let potentialCompanies = []
    let addressParts = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lowerLine = line.toLowerCase()
      
      // Skip lines that are just email, phone, or website
      if (emailRegex.test(line) && line.match(emailRegex)?.[0] === line) continue
      if (line.match(/^[\d\s\-\+\(\)\.]+$/) && line.replace(/\D/g, '').length >= 7) continue
      
      // Check if line contains job title
      const hasJobTitle = jobTitles.some(title => lowerLine.includes(title))
      if (hasJobTitle && !info.jobTitle) {
        info.jobTitle = line
        continue
      }

      // Check for address indicators
      const addressKeywords = ['street', 'st.', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd', 'suite', 'floor', 'building', 'city', 'state', 'zip', 'country']
      const hasAddressKeyword = addressKeywords.some(keyword => lowerLine.includes(keyword))
      const hasZipCode = /\b\d{5,6}\b/.test(line)
      
      if (hasAddressKeyword || hasZipCode) {
        addressParts.push(line)
        continue
      }

      // First substantial line is usually name
      if (i < 3 && line.length > 2 && line.length < 50 && /^[A-Za-z\s\.\-']+$/.test(line)) {
        potentialNames.push(line)
      }
      
      // Lines with Inc, Ltd, LLC, Corp are usually company names
      if (/\b(inc|ltd|llc|corp|corporation|company|co\.|group|technologies|solutions|services|enterprises)\b/i.test(line)) {
        potentialCompanies.push(line)
      }
    }

    // Assign name (usually first text line that looks like a name)
    if (potentialNames.length > 0) {
      info.fullName = potentialNames[0]
    }

    // Assign company
    if (potentialCompanies.length > 0) {
      info.company = potentialCompanies[0]
    }

    // Assign address
    if (addressParts.length > 0) {
      info.address = addressParts.join(', ')
    }

    return info
  }

  // Process image with OCR
  const processImageWithOCR = async (imageFile) => {
    setOcrProcessing(true)
    setOcrProgress(0)
    setOcrError(null)
    console.log("imageFile:", imageFile)

    try {
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const extractedText = result.data.text
      
      if (!extractedText || extractedText.trim().length === 0) {
        setOcrError('No text detected in the image. Please take a clearer photo of the business card.')
        return null
      }

      const extractedInfo = extractBusinessCardInfo(extractedText)
      
      // Check if any useful info was extracted
      const hasAnyData = extractedInfo.fullName || extractedInfo.company || 
                         extractedInfo.email || extractedInfo.phone || 
                         extractedInfo.website || extractedInfo.jobTitle
      
      if (!hasAnyData) {
        setOcrError('Could not extract any contact information. Please try again with a clearer image.')
        return null
      }
      
      setExtractedData({ ...extractedInfo, rawText: extractedText })
      
      // Auto-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        fullName: extractedInfo.fullName || prev.fullName,
        company: extractedInfo.company || prev.company,
        jobTitle: extractedInfo.jobTitle || prev.jobTitle,
        email: extractedInfo.email || prev.email,
        phone: extractedInfo.phone || prev.phone,
        website: extractedInfo.website || prev.website,
        address: extractedInfo.address || prev.address
      }))

      return extractedInfo
    } catch (error) {
      console.error('OCR Error:', error)
      setOcrError('Failed to process image. Please try again.')
      return null
    } finally {
      setOcrProcessing(false)
    }
  }

  // Process back image with OCR - only fills empty fields
  const processBackImageWithOCR = async (imageFile) => {
    setBackOcrProcessing(true)
    setBackOcrProgress(0)

    try {
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setBackOcrProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const extractedText = result.data.text
      
      if (!extractedText || extractedText.trim().length === 0) {
        // Silent fail for back image - it's optional
        return null
      }

      const extractedInfo = extractBusinessCardInfo(extractedText)
      
      // Only fill in empty fields (don't overwrite existing data)
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || extractedInfo.fullName,
        company: prev.company || extractedInfo.company,
        jobTitle: prev.jobTitle || extractedInfo.jobTitle,
        email: prev.email || extractedInfo.email,
        phone: prev.phone || extractedInfo.phone,
        website: prev.website || extractedInfo.website,
        address: prev.address || extractedInfo.address
      }))

      return extractedInfo
    } catch (error) {
      console.error('OCR Error (back):', error)
      // Silent fail for back image
      return null
    } finally {
      setBackOcrProcessing(false)
    }
  }

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
      // Upload original images (not cropped) to Supabase
      const frontImageUrl = frontOriginalImage ? await handleImageUpload(frontOriginalImage, 'front') : null
      const backImageUrl = backOriginalImage ? await handleImageUpload(backOriginalImage, 'back') : null

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

  // Open crop modal when file is selected
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      setPendingImageFile(file)
      setCropModalOpen(type)
    }
  }

  // Open crop modal when camera captures image
  const handleCameraCapture = (file, type) => {
    setPendingImageFile(file)
    setCropModalOpen(type)
  }

  // Handle crop completion
  const handleCropComplete = async ({ croppedFile, originalFile }) => {
    const type = cropModalOpen
    setCropModalOpen(null)
    setPendingImageFile(null)
    
    const preview = URL.createObjectURL(croppedFile)
    
    if (type === 'front') {
      setFrontImage(croppedFile)
      setFrontOriginalImage(originalFile) // Store original for upload
      setFrontPreview(preview)
      // Process cropped image with OCR
      await processImageWithOCR(croppedFile)
    } else {
      setBackImage(croppedFile)
      setBackOriginalImage(originalFile) // Store original for upload
      setBackPreview(preview)
      // Process back image with OCR - only fills empty fields
      await processBackImageWithOCR(croppedFile)
    }
  }

  const handleCropCancel = () => {
    setCropModalOpen(null)
    setPendingImageFile(null)
  }

  const removeImage = (type) => {
    if (type === 'front') {
      setFrontImage(null)
      setFrontOriginalImage(null)
      setFrontPreview(null)
      setExtractedData(null)
      setOcrError(null)
      // Reset form data when removing front image
      setFormData({
        fullName: '',
        company: '',
        jobTitle: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        notes: formData.notes
      })
    } else {
      setBackImage(null)
      setBackOriginalImage(null)
      setBackPreview(null)
    }
  }

  const retakeImage = (type) => {
    removeImage(type)
    setCameraOpen(type)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl">
        {/* Mode Toggle */}
        <div className="mb-6 flex rounded-xl bg-white p-1 shadow-sm border border-gray-200">
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              mode === 'image'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📷 Upload Images
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ✏️ Manual Entry
          </button>
        </div>

        {/* Main Form */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {mode === 'image' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Card Images</h2>
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-900">
                    Front Image
                  </label>
                  {frontPreview ? (
                    <div className="relative">
                      <img src={frontPreview} alt="Front preview" className="w-full rounded-lg border-2 border-gray-200" />
                      
                      {/* OCR Processing Overlay */}
                      {ocrProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                          <div className="text-center text-white">
                            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                            <p className="font-medium">Processing image...</p>
                            <p className="text-sm opacity-80">{ocrProgress}% complete</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="absolute right-2 top-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => retakeImage('front')}
                          className="rounded-full bg-blue-500 p-2 text-white shadow-lg hover:bg-blue-600"
                          title="Retake"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage('front')}
                          className="rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                          title="Remove"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
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
                      
                      {/* Back Image OCR Processing Overlay */}
                      {backOcrProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                          <div className="text-center text-white">
                            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                            <p className="font-medium">Processing back...</p>
                            <p className="text-sm opacity-80">{backOcrProgress}% complete</p>
                          </div>
                        </div>
                      )}
                      
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

                {/* OCR Error Message */}
                {ocrError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-red-800">Text extraction failed</p>
                        <p className="text-sm text-red-600 mt-1">{ocrError}</p>
                        <button
                          type="button"
                          onClick={() => retakeImage('front')}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extracted Data Display */}
                {extractedData && !ocrError && !ocrProcessing && (
                  <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-semibold text-green-800">Extracted Information</h3>
                    </div>
                    <p className="text-sm text-green-700 mb-4">Review and edit the extracted information below:</p>
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                        <input
                          type="text"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                        <input
                          type="text"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Not detected"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'manual' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Details</h2>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Acme Inc."
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Job Title</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      placeholder="Senior Developer"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="www.company.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main St, City, State, ZIP"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional information..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Business Card'
                  )}
                </button>
              </div>
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

      <CropModal
        isOpen={cropModalOpen !== null}
        onClose={handleCropCancel}
        imageFile={pendingImageFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}