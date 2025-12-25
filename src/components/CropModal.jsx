import { useState, useRef, useEffect } from 'react'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

export default function CropModal({ isOpen, onClose, imageFile, onCropComplete }) {
  const cropperRef = useRef(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Load image when modal opens
  useEffect(() => {
    if (isOpen && imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      setIsReady(false)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setImageUrl(null)
      setIsReady(false)
    }
  }, [isOpen, imageFile])

  // Rotate handlers
  const handleRotateLeft = () => {
    const cropper = cropperRef.current?.cropper
    if (cropper) {
      cropper.rotate(-90)
    }
  }

  const handleRotateRight = () => {
    const cropper = cropperRef.current?.cropper
    if (cropper) {
      cropper.rotate(90)
    }
  }

  // Reset crop area
  const handleReset = () => {
    const cropper = cropperRef.current?.cropper
    if (cropper) {
      cropper.reset()
    }
  }

  // Crop and complete
  const handleCrop = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) return

    // Get cropped canvas at original quality
    const croppedCanvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    })

    if (!croppedCanvas) return

    // Convert to blob
    const croppedBlob = await new Promise(resolve => {
      croppedCanvas.toBlob(resolve, 'image/jpeg', 0.95)
    })

    const croppedFile = new File([croppedBlob], 'cropped_card.jpg', { type: 'image/jpeg' })

    onCropComplete({
      croppedFile,
      originalFile: imageFile
    })
  }

  // Close handler
  const handleClose = () => {
    setImageUrl(null)
    setIsReady(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-white">Crop Business Card</h3>
            <p className="text-sm text-gray-400 mt-1">Adjust the crop area to select the card region</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full bg-gray-800 p-2 text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cropper Container */}
        <div className="flex-1 relative bg-gray-950 overflow-hidden">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="font-medium">Loading image...</p>
              </div>
            </div>
          )}
          <div className="h-full w-full" style={{ minHeight: '400px' }}>
            {imageUrl && (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                style={{ height: '100%', width: '100%' }}
                viewMode={1}
                dragMode="move"
                autoCropArea={0.8}
                guides={true}
                center={true}
                highlight={true}
                cropBoxMovable={true}
                cropBoxResizable={true}
                toggleDragModeOnDblclick={false}
                ready={() => setIsReady(true)}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Rotation & Reset Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRotateLeft}
                disabled={!isReady}
                className="rounded-lg bg-gray-800 p-3 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Rotate Left"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleRotateRight}
                disabled={!isReady}
                className="rounded-lg bg-gray-800 p-3 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Rotate Right"
              >
                <svg className="h-5 w-5 transform scale-x-[-1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                disabled={!isReady}
                className="rounded-lg bg-gray-800 px-4 py-3 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title="Reset"
              >
                Reset
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-600 bg-gray-800 px-6 py-3 font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                disabled={!isReady}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Crop & Process
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
