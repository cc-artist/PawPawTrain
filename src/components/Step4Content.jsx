import React, { useState, useCallback, useEffect, useRef } from 'react'
import { t } from '../utils/i18n'

const quickTags = [
  { en: 'Happy', zh: '开心' },
  { en: 'Active', zh: '活泼' },
  { en: 'Quiet', zh: '安静' },
  { en: 'Greedy', zh: '贪吃' },
  { en: 'Cute', zh: '撒娇' },
  { en: 'Naughty', zh: '调皮' },
  { en: 'Well-behaved', zh: '乖巧' },
  { en: 'Sleepy', zh: '困倦' },
]

function Step4Content({ value: externalValue, onChange }) {
  const [internalValue, setInternalValue] = useState('')
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    setInternalValue(externalValue || '')
  }, [externalValue])

  const handleTagClick = useCallback((tag) => {
    setInternalValue(prev => {
      const newValue = prev ? `${prev} ${tag.zh}` : tag.zh
      onChangeRef.current(newValue)
      return newValue
    })
  }, [])

  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChangeRef.current(newValue)
  }, [])

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">📝 {t('upload.describeBehavior')}</h4>
        <p className="text-gray-400 text-sm whitespace-pre-line">{t('upload.describeBehaviorOptional')}</p>
      </div>

      <textarea
        value={internalValue}
        onChange={handleChange}
        placeholder="描述您的宠物今天做了什么？有什么有趣的行为？心情如何？

例如：今天带狗狗去公园玩，它非常开心，跑来跑去，还和其他小狗交了朋友..."
        className="w-full h-40 bg-gray-700 text-white rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
        autoComplete="off"
        spellCheck="false"
        style={{ 
          imeMode: 'active', 
          WebkitUserModify: 'read-write', 
          userSelect: 'text',
          WebkitLineClamp: 'unset'
        }}
      />

      <div className="flex flex-wrap gap-2">
        <span className="text-gray-400 text-sm whitespace-pre-line">{t('upload.quickTags')}</span>
        {quickTags.map((tag) => (
          <button
            key={tag.zh}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            <span className="whitespace-pre-line">{`${tag.en}\n${tag.zh}`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default React.memo(Step4Content, () => true)
