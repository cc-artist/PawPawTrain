import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { t } from '../utils/i18n'

const mockChatRooms = [
  { id: 1, name: '🐱 猫咪交流群', description: '分享养猫心得', members: 128, online: 32, theme: '#FF9500' },
  { id: 2, name: '🐕 狗狗乐园', description: '讨论狗狗训练', members: 256, online: 64, theme: '#5AC8FA' },
  { id: 3, name: '🐰 兔兔小屋', description: '萌兔爱好者聚集地', members: 64, online: 16, theme: '#FF2D55' },
  { id: 4, name: '🦜 鸟友会', description: '分享养鸟经验', members: 48, online: 8, theme: '#34C759' },
  { id: 5, name: '🐹 仓鼠俱乐部', description: '小宠爱好者', members: 96, online: 24, theme: '#AF52DE' },
  { id: 6, name: '🏃 宠物运动会', description: '交流运动训练', members: 88, online: 22, theme: '#FF3B30' }
]

const mockMessages = [
  { id: 1, user: '小明', avatar: '🐱', content: '大家好！我家猫猫最近学会了握手', time: '10:30', isMe: false },
  { id: 2, user: '花花', avatar: '🐶', content: '好棒！怎么训练的？', time: '10:31', isMe: false },
  { id: 3, user: '我', avatar: '🐾', content: '用零食引诱，反复练习就会了', time: '10:32', isMe: true },
  { id: 4, user: '阿杰', avatar: '🐰', content: '学到了！我也试试', time: '10:33', isMe: false }
]

const ChatRoomList = ({ onSelectRoom }) => {
  return (
    <div className="space-y-3">
      {mockChatRooms.map(room => (
        <motion.div
          key={room.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRoom(room)}
          className="glass-effect rounded-2xl p-4 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: room.theme + '20' }}
            >
              {room.name.split(' ')[0]}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{room.name}</div>
              <div className="text-sm text-gray-500">{room.description}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-500">{room.online} {t('chat.online')}</div>
              <div className="text-xs text-gray-400">{room.members} Members</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const ChatRoomDetail = ({ room, onBack }) => {
  const [messages, setMessages] = useState(mockMessages)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!inputText.trim()) return
    
    const newMessage = {
      id: messages.length + 1,
      user: '我',
      avatar: '🐾',
      content: inputText,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }
    
    setMessages([...messages, newMessage])
    setInputText('')

    setTimeout(() => {
      const replies = [
        '好可爱！',
        '哈哈，太有趣了',
        '我家宠物也会这个',
        '学到了！',
        '太棒了！'
      ]
      const randomReply = {
        id: messages.length + 2,
        user: '热心网友',
        avatar: ['🐱', '🐶', '🐰', '🦜'][Math.floor(Math.random() * 4)],
        content: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      }
      setMessages(prev => [...prev, randomReply])
    }, 1000 + Math.random() * 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        className="flex items-center gap-4 p-4 border-b border-gray-200"
        style={{ backgroundColor: room.theme + '10' }}
      >
        <button onClick={onBack} className="text-2xl">←</button>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: room.theme + '20' }}
        >
          {room.name.split(' ')[0]}
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{room.name}</div>
          <div className="text-sm text-green-500">{room.online} {t('chat.online')}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-xl flex-shrink-0">
              {msg.avatar}
            </div>
            <div className={`max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="text-xs text-gray-500 mb-1">{msg.user}</div>
              <div 
                className={`p-3 rounded-2xl ${
                  msg.isMe 
                    ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              <div className="text-xs text-gray-400 mt-1">{msg.time}</div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('chat.typeMessage')}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl font-medium"
          >
            {t('chat.send')}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

const ChatRooms = () => {
  const [selectedRoom, setSelectedRoom] = useState(null)

  if (selectedRoom) {
    return (
      <ChatRoomDetail 
        room={selectedRoom} 
        onBack={() => setSelectedRoom(null)} 
      />
    )
  }

  return (
    <ChatRoomList onSelectRoom={setSelectedRoom} />
  )
}

export default ChatRooms
