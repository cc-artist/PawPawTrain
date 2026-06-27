import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPetTypes, saveCustomPetType } from '../data/petTypes'

const PET_EMOJIS = [
  '🐶', '🐱', '🐰', '🐹', '🐭', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦',
  '🦜', '🦢', '🦉', '🐝', '🦋', '🐌', '🐞', '🦗', '🐢', '🐍',
  '🦎', '🐙', '🦑', '🦐', '🦀', '🐠', '🐟', '🐡', '🦈', '🐬',
  '🦭', '🐳', '🐋', '🦩', '🦚', '🦃', '🦆', '🦅', '🦔', '🐿️',
  '🦝', '🦘', '🦒', '🦥', '🦦', '🐲', '🦄', '🌈', '⭐', '🌟',
]

const PetTypeSelector = ({ selectedPetType, onSelect, selectedBreed, onBreedChange, selectedColor, onColorChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPetName, setNewPetName] = useState('')
  const [newPetEmoji, setNewPetEmoji] = useState('🐾')
  const [newPetBreeds, setNewPetBreeds] = useState(['默认品种'])
  const [newPetColors, setNewPetColors] = useState(['默认毛色'])
  const [breedsInput, setBreedsInput] = useState('默认品种')
  const [colorsInput, setColorsInput] = useState('默认毛色')
  const dropdownRef = useRef(null)
  const [petTypes, setPetTypes] = useState([])

  useEffect(() => {
    setPetTypes(getPetTypes())
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowCreateForm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredTypes = petTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (petType) => {
    onSelect(petType)
    onBreedChange(petType.breeds[0])
    onColorChange(petType.colors[0])
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleCreate = () => {
    if (!newPetName.trim()) return

    const newType = {
      type: newPetName.toLowerCase().replace(/\s+/g, '_'),
      name: newPetName.trim(),
      emoji: newPetEmoji,
      breeds: newPetBreeds,
      colors: newPetColors,
      isCustom: true,
    }

    const success = saveCustomPetType(newType)
    if (success) {
      setPetTypes(getPetTypes())
      setNewPetName('')
      setNewPetEmoji('🐾')
      setNewPetBreeds(['默认品种'])
      setNewPetColors(['默认毛色'])
      setBreedsInput('默认品种')
      setColorsInput('默认毛色')
      setShowCreateForm(false)
    } else {
      alert('该宠物类型已存在')
    }
  }

  const handleBreedsInputChange = (e) => {
    setBreedsInput(e.target.value)
    setNewPetBreeds(e.target.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean))
  }

  const handleColorsInputChange = (e) => {
    setColorsInput(e.target.value)
    setNewPetColors(e.target.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
          selectedPetType
            ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-yellow-500/20'
            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedPetType?.emoji || '🐾'}</span>
          <div>
            <div className="text-gray-400 text-xs">选择宠物类型</div>
            <div className={`font-medium ${selectedPetType ? 'text-white' : 'text-gray-500'}`}>
              {selectedPetType?.name || '请选择...'}
            </div>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="ml-auto text-gray-400"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-700 overflow-hidden"
          >
            {!showCreateForm ? (
              <>
                <div className="p-3 border-b border-gray-700">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索宠物类型..."
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {filteredTypes.length > 0 ? (
                    <div className="p-2">
                      {filteredTypes.map((petType) => (
                        <button
                          key={petType.type}
                          type="button"
                          onClick={() => handleSelect(petType)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-700 ${
                            selectedPetType?.type === petType.type ? 'bg-gray-700' : ''
                          }`}
                        >
                          <span className="text-xl">{petType.emoji}</span>
                          <span className="text-white flex-1 text-left">{petType.name}</span>
                          {petType.isCustom && (
                            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">自定义</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      没有找到匹配的宠物类型
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(true)}
                        className="block w-full mt-3 py-2 text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        + 创建新类型
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full py-2 text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>+</span>
                    <span>创建自定义宠物类型</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold">🐾 创建自定义宠物类型</h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">宠物名称</label>
                    <input
                      type="text"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="例如：外星宠物"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">选择表情符号</label>
                    <div className="grid grid-cols-10 gap-1 mb-2">
                      {PET_EMOJIS.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setNewPetEmoji(emoji)}
                          className={`w-8 h-8 rounded-lg text-lg transition-all ${
                            newPetEmoji === emoji
                              ? 'bg-orange-500/30 ring-2 ring-orange-500'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="text-center text-xl">{newPetEmoji}</div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">品种列表（用逗号分隔）</label>
                    <input
                      type="text"
                      value={breedsInput}
                      onChange={handleBreedsInputChange}
                      placeholder="例如：品种A, 品种B, 品种C"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">毛色列表（用逗号分隔）</label>
                    <input
                      type="text"
                      value={colorsInput}
                      onChange={handleColorsInputChange}
                      placeholder="例如：白色, 黑色, 花色"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!newPetName.trim()}
                      className="flex-1 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      创建
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PetTypeSelector
