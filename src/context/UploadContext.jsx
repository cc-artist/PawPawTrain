import { createContext, useContext, useState } from 'react'

const UploadContext = createContext()

export const UploadProvider = ({ children }) => {
  const [showUpload, setShowUpload] = useState(false)

  const openUpload = () => {
    setShowUpload(true)
  }

  const closeUpload = () => {
    setShowUpload(false)
  }

  return (
    <UploadContext.Provider value={{ showUpload, openUpload, closeUpload }}>
      {children}
    </UploadContext.Provider>
  )
}

export const useUpload = () => {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider')
  }
  return context
}
