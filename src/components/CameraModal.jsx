import { useState, useRef, useEffect } from 'react'

export default function CameraModal({ isOpen, onClose, onCapture, title = "Capture Image" }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // 'user' for front, 'environment' for back

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraReady(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Failed to access camera. Please grant camera permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraReady(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
          onClose()
        }
      }, 'image/jpeg', 0.95)
    }
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4">
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-gray-300 text-sm mt-1">Position the card within the frame and tap capture</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-800 p-3 text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Card guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-opacity-60 rounded-lg">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-l-4 border-t-4 border-blue-500"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-r-4 border-t-4 border-blue-500"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-4 border-b-4 border-blue-500"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-4 border-b-4 border-blue-500"></div>
              </div>
            </div>
            
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-white font-medium">Initializing camera...</p>
                  <p className="text-gray-400 text-sm mt-1">Please allow camera access</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={switchCamera}
            className="flex items-center gap-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 px-5 py-3 text-white hover:bg-opacity-20 transition-all duration-200"
            title="Switch Camera"
            disabled={!isCameraReady}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-semibold">Flip</span>
          </button>
          
          <button
            onClick={captureImage}
            disabled={!isCameraReady}
            className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 px-5 py-3 text-white hover:bg-opacity-20 transition-all duration-200"
          >
            <span className="text-sm font-semibold">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
