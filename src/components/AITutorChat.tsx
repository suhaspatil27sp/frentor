"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RotateCcw, Settings, Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface User {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  grade_level: number;
  education_board: string;
  preferred_language: string;
  timezone: string;
  facts_opt_in: boolean;
  onboarding_completed: boolean;
  created_at: string;
  is_active: boolean;
}

interface Session {
  session_id: string;
  user_id: string;
  is_active: boolean;
  current_concept?: string;
  concepts_covered: string[];
  started_at: string;
  last_message_at: string;
  auto_extended_count: number;
  session_timeout_hours: number;
}

interface Message {
  message_id: string;
  session_id: string;
  user_id: string;
  sender_type: 'user' | 'bot';
  message_text: string;
  sent_at: string;
  is_meaningful: boolean;
  intent?: string;
  token_count?: number;
  // Frontend-only properties for status tracking
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string; // For optimistic updates
}

interface QueuedMessage {
  tempId: string;
  message_text: string;
  timestamp: string;
  retryCount: number;
}

const AITutorChat: React.FC = () => {
  // User and session state management
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showUserSetup, setShowUserSetup] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API endpoint for Next.js app router
  const API_ENDPOINT = '/api/chat';
  const USER_ENDPOINT = '/api/user';

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = '44px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 120) + 'px'; // Max 3 lines
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueuedMessages();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedMessages]);

  // Initialize user session
  useEffect(() => {
    initializeUser();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load queued messages from memory (not localStorage)
  const loadQueuedMessages = (): QueuedMessage[] => {
    // Messages are now stored in state only, not localStorage
    return [];
  };

  // Save queued messages (no-op for now since we're using state)
  const saveQueuedMessages = (queued: QueuedMessage[]) => {
    // Messages are stored in state, no need for localStorage
  };

  const initializeUser = () => {
    if (typeof window === 'undefined') return;
    
    // Load queued messages
    setQueuedMessages(loadQueuedMessages());
    
    const savedUser = window.localStorage.getItem('aiTutorUser');
    
    if (!savedUser) {
      setShowUserSetup(true);
    } else {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        initializeChat(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        setShowUserSetup(true);
      }
    }
  };

  const createUser = async (userData: any) => {
    try {
      // Create user via API to get database-generated ID
      const response = await fetch(USER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username || `student_${Date.now()}`,
          first_name: userData.first_name,
          last_name: userData.last_name || '',
          age: userData.age,
          grade_level: userData.grade_level,
          education_board: userData.education_board || 'OTHER',
          preferred_language: 'en',
          timezone: 'Asia/Kolkata',
          facts_opt_in: true,
          onboarding_completed: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const newUser = await response.json();
      
      setUser(newUser);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('aiTutorUser', JSON.stringify(newUser));
      }
      setShowUserSetup(false);
      
      initializeChat(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      // TODO: Show error message to user
    }
  };

  const initializeChat = async (currentUser: User) => {
    try {
      // Create session via API to get database-generated ID
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.user_id
        })
      });

      if (response.ok) {
        const newSession = await response.json();
        setCurrentSession(newSession);
        
        // Initialize with welcome message
        const welcomeMessage: Message = {
          message_id: 'temp_welcome_' + Date.now(),
          session_id: newSession.session_id,
          user_id: currentUser.user_id,
          sender_type: 'bot',
          message_text: `Hi ${currentUser.first_name}! I'm your AI tutor. I'm here to help you learn and answer any questions you have about your studies. What would you like to work on today?`,
          sent_at: new Date().toISOString(),
          is_meaningful: true,
          status: 'sent'
        };
        
        setMessages([welcomeMessage]);
        
        // Process any queued messages
        if (queuedMessages.length > 0) {
          processQueuedMessages();
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const processQueuedMessages = async () => {
    if (!isOnline || queuedMessages.length === 0 || !user || !currentSession) return;

    const messagesToProcess = [...queuedMessages];
    setQueuedMessages([]);
    saveQueuedMessages([]);

    for (const queuedMsg of messagesToProcess) {
      try {
        await sendMessageToAPI(queuedMsg.message_text, queuedMsg.tempId);
      } catch (error) {
        console.error('Failed to process queued message:', error);
        // Re-queue if still failing
        const updatedQueued = [...queuedMessages, { ...queuedMsg, retryCount: queuedMsg.retryCount + 1 }];
        setQueuedMessages(updatedQueued);
        saveQueuedMessages(updatedQueued);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !currentSession) return;

    const messageText = inputText.trim();
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Optimistic update - show user message immediately
    const userMessage: Message = {
      message_id: tempId,
      session_id: currentSession.session_id,
      user_id: user.user_id,
      sender_type: 'user',
      message_text: messageText,
      sent_at: new Date().toISOString(),
      is_meaningful: true,
      status: 'sending',
      tempId: tempId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      if (!isOnline) {
        throw new Error('Offline');
      }
      
      await sendMessageToAPI(messageText, tempId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );

      // Queue message for retry if offline
      if (!isOnline) {
        const queuedMsg: QueuedMessage = {
          tempId,
          message_text: messageText,
          timestamp: new Date().toISOString(),
          retryCount: 0
        };
        
        const updatedQueued = [...queuedMessages, queuedMsg];
        setQueuedMessages(updatedQueued);
        saveQueuedMessages(updatedQueued);
      }
      
      setIsTyping(false);
    }
  };

  const sendMessageToAPI = async (messageText: string, tempId: string) => {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          user_id: user!.user_id,
          username: user!.username,
          first_name: user!.first_name,
          last_name: user!.last_name,
          age: user!.age,
          grade_level: user!.grade_level,
          education_board: user!.education_board,
          preferred_language: user!.preferred_language || 'en',
          timezone: user!.timezone || 'Asia/Kolkata'
        },
        session: currentSession,
        message: {
          message_text: messageText,
          sender_type: 'user',
          is_meaningful: true,
          token_count: messageText.split(' ').length
        },
        source: 'web_frontend'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from tutor');
    }

    const data = await response.json();
    
    // Update session if returned by API
    if (data.session) {
      setCurrentSession(data.session);
    }
    
    // Update user message with real database ID and sent status
    if (data.userMessage) {
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...data.userMessage, status: 'sent' }
            : msg
        )
      );
    }
    
    // Add bot response
    if (data.botMessage) {
      setMessages(prev => [...prev, { ...data.botMessage, status: 'sent' }]);
    }
    
    setIsTyping(false);
  };

  const retryMessage = async (message: Message) => {
    if (!message.tempId) return;
    
    // Update status to sending
    setMessages(prev => 
      prev.map(msg => 
        msg.tempId === message.tempId 
          ? { ...msg, status: 'sending' }
          : msg
      )
    );
    
    setIsTyping(true);
    
    try {
      await sendMessageToAPI(message.message_text, message.tempId);
    } catch (error) {
      console.error('Retry failed:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === message.tempId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!user) return;
    
    try {
      // End current session
      if (currentSession) {
        await fetch(`/api/session/${currentSession.session_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            end_reason: 'manual'
          })
        });
      }
      
      // Create new session
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id
        })
      });
      
      if (response.ok) {
        const newSession = await response.json();
        setCurrentSession(newSession);
        initializeChat(user);
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  // User setup modal
  const UserSetupModal = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      age: '',
      grade_level: '',
      education_board: 'CBSE',
      username: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const educationBoards = [
      { value: 'CBSE', label: 'CBSE' },
      { value: 'ICSE', label: 'ICSE' },
      { value: 'IB', label: 'IB' },
      { value: 'STATE_BOARD', label: 'State Board' },
      { value: 'OTHER', label: 'Other' }
    ];

    const grades = ['6', '7', '8', '9', '10', '11', '12'];

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      
      if (!formData.first_name.trim()) {
        newErrors.first_name = 'First name is required';
      }
      
      if (!formData.age || parseInt(formData.age) < 6 || parseInt(formData.age) > 18) {
        newErrors.age = 'Age must be between 6 and 18';
      }
      
      if (!formData.grade_level) {
        newErrors.grade_level = 'Grade level is required';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;
      
      setIsSubmitting(true);
      
      const userData = {
        ...formData,
        age: parseInt(formData.age),
        grade_level: parseInt(formData.grade_level),
        username: formData.username || `student_${formData.first_name}_${Date.now()}`
      };
      
      try {
        await createUser(userData);
      } catch (error) {
        console.error('Error creating user:', error);
        // TODO: Show error to user
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Welcome! Let&apos;s set up your profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value}))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your first name"
                disabled={isSubmitting}
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({...prev, last_name: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your last name (optional)"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="6"
                max="18"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.age ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your age (6-18)"
                disabled={isSubmitting}
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData(prev => ({...prev, grade_level: e.target.value}))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.grade_level ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select your grade</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
              {errors.grade_level && <p className="text-red-500 text-xs mt-1">{errors.grade_level}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Board</label>
              <select
                value={formData.education_board}
                onChange={(e) => setFormData(prev => ({...prev, education_board: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                {educationBoards.map(board => (
                  <option key={board.value} value={board.value}>{board.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Choose a username (auto-generated if empty)"
                disabled={isSubmitting}
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Start Learning!'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!user || showUserSetup) {
    return <UserSetupModal />;
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AI Tutor</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Hello {user.first_name}! Grade {user.grade_level} • {user.education_board}</span>
                {isOnline ? (
                  <span title="Online">
                    <Wifi className="w-4 h-4 text-green-500" />
                  </span>
                ) : (
                  <span title="Offline - messages will be queued">
                    <WifiOff className="w-4 h-4 text-red-500" />
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUserSetup(true)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Update profile"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Start new session"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
        </div>
        
        {/* Offline indicator */}
        {!isOnline && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <div className="flex items-center text-sm text-yellow-800">
              <WifiOff className="w-4 h-4 mr-2" />
              You&apos;re offline. Messages will be sent when connection is restored.
            </div>
          </div>
        )}
        
        {/* Queued messages indicator */}
        {queuedMessages.length > 0 && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-2">
            <div className="flex items-center text-sm text-blue-800">
              <Clock className="w-4 h-4 mr-2" />
              {queuedMessages.length} message{queuedMessages.length > 1 ? 's' : ''} queued for sending
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={`flex items-start space-x-3 ${
              message.sender_type === 'bot' ? 'flex-row' : 'flex-row-reverse space-x-reverse'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender_type === 'bot'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {message.sender_type === 'bot' ? (
                <Bot className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            
            <div
              className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-2 ${
                message.sender_type === 'bot'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'bg-green-500 text-white'
              }`}
            >
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {message.message_text}
              </p>
              
              <div className={`flex items-center justify-between mt-1 text-xs ${
                message.sender_type === 'bot' ? 'text-gray-400' : 'text-green-100'
              }`}>
                <span>{formatTime(message.sent_at)}</span>
                
                {message.sender_type === 'user' && (
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(message.status)}
                    {message.status === 'failed' && (
                      <button
                        onClick={() => retryMessage(message)}
                        className="text-red-400 hover:text-red-300 ml-1"
                        title="Retry message"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-32"
            rows={1}
            style={{ minHeight: '44px' }}
            disabled={isTyping}
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            Press Enter to send • Shift+Enter for new line
            {currentSession && (
              <span className="ml-2">• Session: {currentSession.session_id.substring(0, 8)}...</span>
            )}
          </span>
          <span>{inputText.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default AITutorChat;
