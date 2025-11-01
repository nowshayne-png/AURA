import React, { useState, useEffect } from 'react';
import { useUser, useClerk, SignInButton, UserButton } from '@clerk/clerk-react';
import { Menu, X, Plus, Trash2, LogOut, ChevronRight } from 'lucide-react';
import { GeminiService } from './services/gemini';
import { databaseService } from './services/database';
import Markdown from './utils/markdown';
import { InfinityLogo } from './components/InfinityLogo';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
}

interface Conversation {
  id: string;
  title?: string;
  created_at: string;
}

function App() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [geminiService] = useState(() => new GeminiService());

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadConversations();
    }
  }, [user, isLoaded]);

  const loadConversations = async () => {
    try {
      const convos = await databaseService.getConversations(user!.id);
      setConversations(convos);

      if (convos.length > 0 && !currentConversationId) {
        setCurrentConversationId(convos[0].id);
        loadMessages(convos[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await databaseService.getMessages(conversationId);
      setMessages(
        msgs.map((msg) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          imageUrl: msg.image_url,
          imagePrompt: msg.image_prompt,
        }))
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const conversation = await databaseService.createConversation(user!.id, 'New Conversation');
      setConversations((prev) => [conversation, ...prev]);
      setCurrentConversationId(conversation.id);
      setMessages([]);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    loadMessages(conversationId);
    setSidebarOpen(false);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await databaseService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      if (currentConversationId === conversationId) {
        if (conversations.length > 1) {
          const nextConversation = conversations.find((c) => c.id !== conversationId);
          if (nextConversation) {
            selectConversation(nextConversation.id);
          }
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user || !currentConversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      await databaseService.addMessage(
        currentConversationId,
        user.id,
        'user',
        input
      );

      const aiResponse = await geminiService.sendMessage(input);

      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      if (aiResponse.startsWith('IMAGE_GENERATION:')) {
        const imagePrompt = aiResponse.replace('IMAGE_GENERATION:', '');
        try {
          const imageUrl = await geminiService.generateImage(imagePrompt);
          assistantMessage.imageUrl = imageUrl;
          assistantMessage.imagePrompt = imagePrompt;
          assistantMessage.content = `I've generated an image based on your request: "${imagePrompt}"`;
        } catch (error) {
          assistantMessage.content = 'Failed to generate image. Please try again.';
        }
      }

      setMessages((prev) => [...prev, assistantMessage]);

      await databaseService.addMessage(
        currentConversationId,
        user.id,
        'assistant',
        assistantMessage.content,
        assistantMessage.imageUrl,
        assistantMessage.imagePrompt
      );

      if (conversations.find((c) => c.id === currentConversationId)?.title === 'New Conversation') {
        const newTitle = input.substring(0, 50);
        await databaseService.updateConversation(currentConversationId, { title: newTitle });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversationId ? { ...c, title: newTitle } : c
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-electric-300 border-t-electric-500 rounded-full animate-spin" />
          <p className="text-electric-300 text-sm">Loading Voxa...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-screen bg-gradient-hero relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 -left-40 w-80 h-80 bg-electric-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-40 w-80 h-80 bg-electric-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {/* Header */}
          <header className="px-6 md:px-12 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <InfinityLogo size={32} />
              <span className="text-2xl font-bold gradient-text">VOXA</span>
            </div>
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 bg-electric-500 hover:bg-electric-600 text-white rounded-full font-semibold transition-all duration-300 flex items-center space-x-2">
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </SignInButton>
          </header>

          {/* Hero Section */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-8 animate-bloom">
              <InfinityLogo size={120} />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">VOXA</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl">
              Your smart help for any request.
            </p>
            <p className="text-lg text-electric-300 mb-12 max-w-xl font-light">
              Experience the future of intelligent assistance with Voxa, powered by advanced AI.
            </p>

            <SignInButton mode="modal">
              <button className="group relative px-8 py-4 bg-gradient-electric text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-electric-500/50 transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center space-x-2">
                  <span>Try Voxa for free</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </SignInButton>

            {/* Features Grid */}
            <div className="mt-20 grid md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="glass rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-semibold mb-2 text-electric-300">Fast & Responsive</h3>
                <p className="text-sm text-gray-400">Instant responses to your queries</p>
              </div>
              <div className="glass rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="font-semibold mb-2 text-electric-300">Intelligent</h3>
                <p className="text-sm text-gray-400">Understands context and learns from you</p>
              </div>
              <div className="glass rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="text-3xl mb-3">💾</div>
                <h3 className="font-semibold mb-2 text-electric-300">Persistent</h3>
                <p className="text-sm text-gray-400">Your conversations are saved securely</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-hero flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 glass z-40 transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <InfinityLogo size={28} />
              <span className="font-bold gradient-text text-lg">VOXA</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={createNewConversation}
            className="m-4 p-3 rounded-xl bg-electric-500/20 hover:bg-electric-500/30 text-electric-300 font-semibold flex items-center justify-center space-x-2 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2">
            <p className="text-xs text-white/40 uppercase font-semibold px-2 py-4">History</p>
            {conversations.map((conversation) => (
              <div key={conversation.id} className="group flex items-center space-x-2">
                <button
                  onClick={() => selectConversation(conversation.id)}
                  className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 truncate ${
                    currentConversationId === conversation.id
                      ? 'bg-electric-500/30 text-electric-300'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {conversation.title || 'Untitled'}
                </button>
                <button
                  onClick={() => deleteConversation(conversation.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400/60 hover:text-red-400 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => signOut()}
              className="w-full p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center justify-center space-x-2 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="px-6 py-4 glass border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-white/60 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-3">
              <InfinityLogo size={28} />
              <div>
                <h1 className="font-bold gradient-text">VOXA</h1>
                <p className="text-xs text-white/60">Your smart help</p>
              </div>
            </div>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
                userButtonPopoverCard: 'bg-dark-800 border border-white/10',
              },
            }}
          />
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <InfinityLogo size={80} />
              <div>
                <h2 className="text-3xl font-bold mb-2 gradient-text">Welcome to VOXA</h2>
                <p className="text-gray-400 max-w-md">Start a conversation to experience intelligent assistance</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
              >
                <div
                  className={`max-w-2xl rounded-2xl px-6 py-4 ${
                    message.type === 'user'
                      ? 'bg-electric-500/20 border border-electric-400/50 text-electric-100'
                      : 'glass text-white'
                  }`}
                >
                  {message.type === 'assistant' ? (
                    <Markdown content={message.content} />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  {message.imageUrl && (
                    <div className="mt-4">
                      <img
                        src={message.imageUrl}
                        alt={message.imagePrompt || 'Generated'}
                        className="rounded-lg max-w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start animate-slideIn">
              <div className="glass rounded-2xl px-6 py-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 glass border-t border-white/10">
          <div className="flex items-end space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-electric-400 transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              className="px-6 py-3 bg-gradient-electric text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-electric-500/50 disabled:opacity-50 transition-all duration-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
