import React from 'react'
import { tObj } from '../utils/i18n'

const TranslatedText = ({ text, className = '' }) => {
  const translation = typeof text === 'string' ? tObj(text) : text
  
  return (
    <span className={`flex flex-col ${className}`}>
      <span className="font-medium text-gray-800">{translation.en}</span>
      <span className="text-sm text-gray-500">{translation.zh}</span>
    </span>
  )
}

export default TranslatedText
