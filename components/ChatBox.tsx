'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  senderName: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatBoxProps {
  chatId: string;
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  foodItemId?: string;
  foodItemName?: string;
}

// Extend the user type to include id and role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ChatBox({ chatId, recipientId, recipientName, onClose, foodItemId, foodItemName }: ChatBoxProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get the user id in a type-safe way
  const getUserId = (): string => {
    return (session?.user as ExtendedUser)?.id || '';
  };
  
  // Get the user role
  const getUserRole = (): string => {
    return (session?.user as ExtendedUser)?.role || '';
  };

  // Fetch messages for this chat
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch messages between users
        const response = await fetch(`/api/chat/${recipientId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        
        // Convert API response to Message interface
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg._id,
          senderId: msg.senderId._id,
          receiverId: msg.recipientId._id,
          content: msg.content,
          timestamp: msg.timestamp || msg.createdAt,
          senderName: msg.senderId.name,
          status: msg.senderId._id === getUserId() ? 'read' : undefined
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId && session && recipientId) {
      fetchMessages();
      
      // Set up polling for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000);
      
      return () => clearInterval(interval);
    }
  }, [chatId, recipientId, session]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator randomly
  useEffect(() => {
    if (messages.length > 0 && Math.random() > 0.7) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.senderId === getUserId()) {
        setTypingIndicator(true);
        
        const timeout = setTimeout(() => {
          setTypingIndicator(false);
        }, 3000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !session || sending) return;
    
    try {
      setSending(true);
      
      // Create a temporary message for immediate UI feedback
      const tempMessage: Message = {
        id: `temp-${Date.now().toString()}`,
        senderId: getUserId(),
        receiverId: recipientId,
        content: newMessage,
        timestamp: new Date().toISOString(),
        senderName: session.user?.name || 'You',
        status: 'sending'
      };
      
      // Add to local state immediately for UI responsiveness
      setMessages([...messages, tempMessage]);
      setNewMessage('');
      
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          content: newMessage,
          foodItemId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Replace temporary message with actual message from the server and update status
      setMessages(messages => 
        messages.map(msg => 
          msg.id === tempMessage.id 
            ? {
                id: data._id,
                senderId: data.senderId._id,
                receiverId: data.recipientId._id,
                content: data.content,
                timestamp: data.timestamp || data.createdAt,
                senderName: data.senderId.name,
                status: 'sent'
              } 
            : msg
        )
      );
      
      // Simulate delivered status after 1 second
      setTimeout(() => {
        setMessages(messages => 
          messages.map(msg => 
            msg.id === data._id 
              ? {...msg, status: 'delivered'}
              : msg
          )
        );
      }, 1000);
      
      // Simulate read status after 2.5 seconds
      setTimeout(() => {
        setMessages(messages => 
          messages.map(msg => 
            msg.id === data._id 
              ? {...msg, status: 'read'}
              : msg
          )
        );
      }, 2500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show an error to the user
      alert('Failed to send message. Please try again.');
      
      // Remove the temporary message
      setMessages(messages => messages.filter(msg => msg.id !== `temp-${Date.now().toString()}`));
      // Put the message text back in the input
      setNewMessage(newMessage);
    } finally {
      setSending(false);
    }
  };
  
  // Render message status indicator
  const renderMessageStatus = (status?: string) => {
    if (!status) return null;
    
    switch(status) {
      case 'sending':
        return <div className="mr-1 h-3 w-3 rounded-full border-t border-r border-gray-300 animate-spin"></div>;
      case 'sent':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'delivered':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'read':
        return (
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400 -ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Suggest common restaurant-NGO messages
  const getQuickReplies = () => {
    const userRole = getUserRole();
    
    if (userRole === 'restaurant') {
      return [
        'The food is ready for pickup now',
        'We can keep the food until 9pm tonight',
        'Please use the back entrance for pickup',
        'Do you need containers?',
        'Here\'s the address: ',
        'How many people will be coming?'
      ];
    } else {
      return [
        'What time can we pick up the food?',
        'How long can you keep the food for us?',
        'We\'ll be there in 30 minutes',
        'Do you need a donation receipt?',
        'How much food is available?',
        'We\'ll bring our own containers'
      ];
    }
  };
  
  const handleQuickReply = (message: string) => {
    setNewMessage(message);
  };

  return (
    <div className="flex flex-col h-[550px] rounded-xl shadow-md overflow-hidden border border-gray-200 bg-gradient-to-b from-gray-50 to-white">
      {/* Chat header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-green-500 text-white p-4 shadow-sm">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center font-bold mr-3 text-lg shadow-sm">
            {recipientName.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{recipientName}</h3>
            {foodItemName && (
              <p className="text-xs text-green-100">Regarding: {foodItemName}</p>
            )}
          </div>
          {typingIndicator && (
            <div className="ml-3 px-3 py-1 bg-green-700 bg-opacity-30 rounded-full text-xs animate-pulse flex items-center">
              <span className="sr-only">Typing</span>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-green-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-5 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium text-lg mb-2">No messages yet</p>
            <p className="text-gray-500 mb-6">Start the conversation with {recipientName}!</p>
            {foodItemName && (
              <div className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200 font-medium">
                {foodItemName}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {foodItemName && (
              <div className="text-center mb-5">
                <div className="inline-block bg-green-50 text-green-700 text-sm px-4 py-1.5 rounded-full border border-green-200 font-medium">
                  Conversation about: {foodItemName}
                </div>
              </div>
            )}
            
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="border-t border-gray-200 flex-grow"></div>
              <div className="mx-4 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                Today
              </div>
              <div className="border-t border-gray-200 flex-grow"></div>
            </div>
            
            {messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === getUserId();
              const showSenderInfo = index === 0 || 
                messages[index-1].senderId !== msg.senderId;
              
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {!isCurrentUser && showSenderInfo && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm mr-2 mt-2">
                      {msg.senderName.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[80%] ${
                      isCurrentUser 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl rounded-tr-none shadow-sm' 
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-none shadow-sm border border-gray-100'
                    }`}
                  >
                    {showSenderInfo && !isCurrentUser && (
                      <div className={`text-xs font-medium text-gray-500 px-4 pt-2`}>
                        {msg.senderName}
                      </div>
                    )}
                    <div className="px-4 py-3">
                      <p className="leading-snug">{msg.content}</p>
                      <div className={`text-xs mt-1 text-right flex items-center justify-end gap-1 ${isCurrentUser ? 'text-green-100' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {isCurrentUser && renderMessageStatus(msg.status)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {typingIndicator && (
              <div className="flex justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm mr-2 mt-2">
                  {recipientName.substring(0, 1).toUpperCase()}
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none shadow-sm border border-gray-100 px-4 py-3">
                  <div className="flex space-x-2 items-center h-6">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Quick replies */}
      <div className="bg-white p-3 overflow-x-auto whitespace-nowrap border-t border-gray-100">
        <div className="flex space-x-2">
          {getQuickReplies().map((reply, index) => (
            <button
              key={index}
              onClick={() => handleQuickReply(reply)}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200 whitespace-nowrap transition-colors hover:shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center rounded-full border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 bg-white">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 focus:outline-none bg-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-green-600 hover:bg-green-700 text-white h-full p-3 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center w-12"
          >
            {sending ? (
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 