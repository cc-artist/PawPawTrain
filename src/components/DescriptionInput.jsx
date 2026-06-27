import React, { useCallback } from 'react'

const quickTags = ['开心', '活泼', '安静', '贪吃', '撒娇', '调皮', '乖巧', '困倦']

const DescriptionInput = React.memo(({ value, onChange }) => {
  const handleTagClick = useCallback((tag) => {
    onChange(prev => prev ? `${prev} ${tag}` : tag)
  }, [onChange])

  const handleChange = useCallback((e) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-white text-lg font-bold mb-1">📝 描述宠物行为</h4>
        <p className="text-gray-400 text-sm">描述您宠物的行为和情感（可选）</p>
      </div>

      <textarea
        value={value}
        onChange={handleChange}
        placeholder="描述您的宠物今天做了什么？有什么有趣的行为？心情如何？

例如：今天带狗狗去公园玩，它非常开心，跑来跑去，还和其他小狗交了朋友..."
        className="w-full h-40 bg-gray-700 text-white rounded-2xl p-4 resize-none outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
        autoComplete="off"
        spellCheck="false"
      />

      <div className="flex flex-wrap gap-2">
        <span className="text-gray-400 text-sm">快捷标签：</span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
})

export default DescriptionInput