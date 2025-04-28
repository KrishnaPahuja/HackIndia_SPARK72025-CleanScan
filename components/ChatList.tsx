'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatBox from './ChatBox';

interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  foodItemId?: string;
  foodItemName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ChatList() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient');
  
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [allNGOs, setAllNGOs] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showAllNGOs, setShowAllNGOs] = useState(false);
  
  // Get the user role in a type-safe way
  const getUserRole = (): string => {
    return (session?.user as ExtendedUser)?.role || '';
  };

  // Set active chat if recipient is in the URL
  useEffect(() => {
    if (recipientId) {
      setActiveChatId(recipientId);
    }
  }, [recipientId]);

  // Fetch chat participants and their information
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError('');
        
        const userRole = getUserRole();
        
        // Fetch recent chats (participants)
        const chatsResponse = await fetch('/api/chat');
        if (!chatsResponse.ok) {
          throw new Error('Failed to fetch chats');
        }
        const chatsData = await chatsResponse.json();
        
        // Process chat data to get unique participants with last message
        const participantsMap = new Map<string, ChatParticipant>();
        
        chatsData.forEach((chat: any) => {
          // Determine the other user in the chat (not the current user)
          const otherUser = chat.senderId._id === (session?.user as any).id ? 
            chat.recipientId : chat.senderId;
          
          const messageTime = new Date(chat.createdAt || chat.timestamp).toISOString();
          
          // Check if this participant is already in the map
          if (!participantsMap.has(otherUser._id) || 
              new Date(participantsMap.get(otherUser._id)!.lastMessageTime!) < new Date(messageTime)) {
            
            participantsMap.set(otherUser._id, {
              id: otherUser._id,
              name: otherUser.name,
              role: otherUser.role,
              foodItemId: chat.foodItemId?._id,
              foodItemName: chat.foodItemId?.title,
              lastMessage: chat.content,
              lastMessageTime: messageTime,
              unreadCount: chat.senderId._id !== (session?.user as any).id && !chat.read ? 1 : 0
            });
          } else if (chat.senderId._id !== (session?.user as any).id && !chat.read) {
            // Increment unread count for existing participant if this is an unread message from them
            const participant = participantsMap.get(otherUser._id)!;
            participant.unreadCount = (participant.unreadCount || 0) + 1;
            participantsMap.set(otherUser._id, participant);
          }
        });
        
        setParticipants(Array.from(participantsMap.values()));
        
        // If user is a restaurant, fetch all NGOs
        if (userRole === 'restaurant') {
          const ngosResponse = await fetch('/api/users/ngos');
          if (!ngosResponse.ok) {
            throw new Error('Failed to fetch NGOs');
          }
          const ngosData = await ngosResponse.json();
          
          // Convert NGO data to participant format
          const allNGOsData = ngosData.map((ngo: any) => ({
            id: ngo._id,
            name: ngo.name,
            role: 'ngo'
          }));
          
          setAllNGOs(allNGOsData);
        }
        
        // If there's a recipient in the URL and it's not in participants list, check if it's in allNGOs
        if (recipientId && !participantsMap.has(recipientId)) {
          const isNGO = userRole === 'restaurant' && 
            allNGOs.some(ngo => ngo.id === recipientId);
          
          if (isNGO) {
            setActiveChatId(recipientId);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchChats();
    }
  }, [session, recipientId]);
  
  const formatLastMessageTime = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const handleChatSelect = (participantId: string) => {
    setActiveChatId(participantId);
    // Update URL to include recipient for direct access or sharing
    router.replace(`/messages?recipient=${participantId}`, { scroll: false });
  };
  
  const closeChat = () => {
    setActiveChatId(null);
    setShowAllNGOs(false);
    // Remove recipient from URL
    router.replace('/messages', { scroll: false });
  };
  
  const toggleShowAllNGOs = () => {
    setShowAllNGOs(!showAllNGOs);
  };
  
  if (!session) {
    return (
      <div className="text-center p-6 bg-white rounded-xl shadow-md mt-4">
        <p className="text-gray-600 font-medium">Please log in to access your messages.</p>
      </div>
    );
  }

  // Find active participant from either regular chats or all NGOs list
  const activeParticipant = participants.find(p => p.id === activeChatId) || 
                          (getUserRole() === 'restaurant' ? allNGOs.find(p => p.id === activeChatId) : undefined);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Messages</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8 bg-red-50 rounded-lg">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 text-green-600 underline hover:text-green-700 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : activeChatId ? (
        // Show active chat
        <div>
          <div className="bg-gray-50 p-4 mb-5 rounded-lg border border-gray-100">
            <button 
              onClick={closeChat} 
              className="text-green-600 mb-3 flex items-center hover:text-green-700 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to all messages
            </button>
            {activeParticipant?.foodItemId && (
              <div className="text-sm flex items-center justify-between">
                <div>
                  <span className="text-gray-600">Regarding: </span>
                  <span className="font-semibold text-gray-800">{activeParticipant.foodItemName}</span>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                  {getUserRole() === 'restaurant' ? 'Claimed by NGO' : 'Your Claim'}
                </span>
              </div>
            )}
          </div>
          <ChatBox 
            chatId={`chat-${activeChatId}`}
            recipientId={activeChatId}
            recipientName={activeParticipant?.name || ''}
            foodItemId={activeParticipant?.foodItemId}
            foodItemName={activeParticipant?.foodItemName}
            onClose={closeChat}
          />
        </div>
      ) : participants.length === 0 && getUserRole() !== 'restaurant' ? (
        // No chats for NGOs
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium text-lg mb-2">No Active Conversations</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Conversations with restaurants will appear here when you claim their food donations.
          </p>
        </div>
      ) : (
        <div>
          {/* All NGOs for Restaurant View */}
          {getUserRole() === 'restaurant' && (
            <div className="mb-6">
              {!showAllNGOs && participants.length > 0 ? (
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Recent Conversations</h3>
                  <button 
                    onClick={toggleShowAllNGOs}
                    className="flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-colors font-medium text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Message
                  </button>
                </div>
              ) : showAllNGOs ? (
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">All NGOs</h3>
                  <button 
                    onClick={toggleShowAllNGOs}
                    className="flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-colors font-medium text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Recent
                  </button>
                </div>
              ) : null}
            </div>
          )}
          
          {/* Show chat list */}
          <div className="space-y-3">
            {showAllNGOs && getUserRole() === 'restaurant' ? 
              allNGOs.map((ngo) => (
                <div
                  key={ngo.id}
                  onClick={() => handleChatSelect(ngo.id)}
                  className="flex items-center p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all border border-gray-100 hover:border-green-200 hover:shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold mr-4 text-lg">
                    {ngo.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate flex items-center">
                      {ngo.name}
                      <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        NGO
                      </span>
                    </h3>
                    {ngo.lastMessage ? (
                      <p className="text-sm text-gray-500 truncate">
                        {ngo.lastMessage}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">
                        Start a new conversation
                      </p>
                    )}
                  </div>
                  {ngo.unreadCount && ngo.unreadCount > 0 && (
                    <div className="ml-3 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {ngo.unreadCount}
                    </div>
                  )}
                </div>
              ))
            : 
              participants.map((participant) => (
                <div
                  key={participant.id}
                  onClick={() => handleChatSelect(participant.id)}
                  className="flex items-center p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all border border-gray-100 hover:border-green-200 hover:shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4 text-lg ${
                    participant.role === 'restaurant' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {participant.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-gray-800 truncate flex items-center">
                        {participant.name}
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full 
                          ${participant.role === 'restaurant' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}">
                          {participant.role === 'restaurant' ? 'Restaurant' : 'NGO'}
                        </span>
                      </h3>
                      {participant.lastMessageTime && (
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap font-medium">
                          {formatLastMessageTime(participant.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {participant.foodItemName && (
                      <p className="text-xs text-green-600 font-medium truncate mt-0.5">
                        Re: {participant.foodItemName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {participant.lastMessage || 'Start a conversation'}
                    </p>
                  </div>
                  {participant.unreadCount && participant.unreadCount > 0 && (
                    <div className="ml-3 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {participant.unreadCount}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
          
          {/* Empty state for restaurant with no conversations */}
          {participants.length === 0 && getUserRole() === 'restaurant' && !showAllNGOs && (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">No Recent Conversations</p>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You don't have any active conversations with NGOs
              </p>
              <button
                onClick={toggleShowAllNGOs}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors"
              >
                Message an NGO
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 