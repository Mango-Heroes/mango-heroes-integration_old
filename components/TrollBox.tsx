import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { io } from 'socket.io-client'

// Dynamically import as it can't be rendered server side
const ChatBox = dynamic(
  () => (import('react-chat-plugin') as any).then((mod) => mod),
  { ssr: false }
)

const ChatFrame = dynamic(
  () => (import('react-chat-plugin') as any).then((mod) => mod.ChatFrame),
  { ssr: false }
)

const TrollBox = () => {
  const imageUrl = useMangoStore((s) => s.settings.avatar)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const [showChatBox, setshowChatBox] = useState(false)
  const [username, setusername] = useState(null)
  const [userId, setUserId] = useState(null)
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const showIcon = true

  const handleClickIcon = () => {
    setshowChatBox(!showChatBox)
  }

  const sendMessage = (message) => {
    socket.emit('new_message', {
      userId: userId,
      username: username,
      text: message,
    })
  }

  const setUserStatus = (username, imageUrl, userId) => {
    if (username && userId && imageUrl)
      socket.emit('user_join', {
        username: username,
        avatarUrl: imageUrl,
        id: userId,
      })
  }

  useEffect(() => {
    const newSocket = io(`http://localhost:5000`)
    setSocket(newSocket)
  }, [setSocket])

  useEffect(() => {
    if (!socket) return
    socket.on('history', (messageHistory) => {
      setMessages([
        {
          text: 'Welcome to Mango Markets!',
          timestamp: new Date(),
          type: 'notification',
        },
        ...messageHistory,
      ])
    })

    socket.on('recv_message', (message) => {
      setMessages((messages) => [...messages, message])
    })
  }, [socket])

  useEffect(() => {
    if (connected) {
      if (imageUrl && mangoAccount && mangoAccount.name) {
        setUserId(mangoAccount.publicKey.toBase58())
        setusername(mangoAccount.name)
        setUserStatus(
          mangoAccount.name,
          imageUrl,
          mangoAccount.publicKey.toBase58()
        )
      }
    }
  }, [connected, mangoAccount, imageUrl])

  return (
    <>
      {
        // Display chat only if username and profile pic exist
        connected && username && userId && imageUrl && (
          <ChatFrame
            //@ts-ignore
            chatbox={
              <ChatBox
                //@ts-ignore
                userId={userId}
                messages={messages}
                onSendMessage={sendMessage}
                placeholder={'Type a message...'}
                timestampFormat="h:mm a"
              />
            }
            clickIcon={handleClickIcon}
            showChatbox={showChatBox}
            showIcon={showIcon}
            iconStyle={{ background: '#FF9C24', fill: 'white' }}
          ></ChatFrame>
        )
      }
    </>
  )
}

export default TrollBox
