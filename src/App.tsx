import React, { useState, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Waves, Leaf, Settings, History, FileText, Zap, CheckCircle2, Clock, Play, Upload, Paperclip, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { GeminiService } from './services/gemini';
import { FileUpload } from './components/FileUpload';
import { ImageDisplay } from './components/ImageDisplay';
import { OrderDisplay } from './components/OrderDisplay';
import { ExtractedFile, extractTextFromFile } from './utils/fileExtractor';
import { FoodBookingResult } from './services/foodBooking';
import { TicketBookingResult } from './services/ticketBooking';
import { FoodBookingResponse, MovieBookingResponse, BookingsResponse, AvailableItemsResponse } from './services/fasterbook';
import { useUser, useClerk, SignInButton, UserButton } from '@clerk/clerk-react';
import { clerkAuthService, ClerkUser } from './services/clerkAuth';
import { tasksService, TaskType } from './services/tasks';
import { mockRestaurantApi, mockHotelApi, mockFlightApi, mockRideApi } from './services/mockApis';
import TaskCenter from './components/TaskCenter';
import Markdown from './utils/markdown';
import FilesView from './components/FilesView';
import MemoryLogs from './components/MemoryLogs';
import { handleBookingWithTask } from './utils/bookingHelper';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
  orderType?: 'food' | 'ticket' | 'fasterbook_food' | 'fasterbook_movie' | 'fasterbook_bookings' | 'fasterbook_menu' | 'restaurant' | 'hotel' | 'flight' | 'ride';
  orderData?: FoodBookingResult | TicketBookingResult | FoodBookingResponse | MovieBookingResponse | BookingsResponse | AvailableItemsResponse;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
  description: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m A.U.R.A, your Universal Reasoning Agent. I can help you think through complex problems, manage tasks, and understand the world around you. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Research sustainable energy solutions',
      status: 'completed',
      description: 'Comprehensive analysis of renewable energy technologies',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      title: 'Schedule team meeting',
      status: 'processing',
      description: 'Coordinating calendars and sending invitations',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: '3',
      title: 'Analyze market trends',
      status: 'pending',
      description: 'Deep dive into Q4 performance metrics',
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'tasks' | 'files' | 'memory'>('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [currentUser, setCurrentUser] = useState<ClerkUser | null>(null);

  // Initialize Gemini service
  const [geminiService] = useState(() => new GeminiService());

  // Floating particles animation
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({length: 12}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1
    }));
    setParticles(newParticles);

    const loadUser = async () => {
      if (isLoaded && user) {
        const clerkUser = await clerkAuthService.getCurrentUser(user);
        setCurrentUser(clerkUser);
      } else {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, [user, isLoaded]);

  const handleFileUploaded = (file: ExtractedFile) => {
    geminiService.addUploadedFile(file);
    setShowFileUpload(false);
    
    // Add a system message about the uploaded file
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `I've successfully processed "${file.name}" and can now reference its content in our conversation. Feel free to ask me questions about the document or request analysis of its contents.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleRemoveFile = (fileName: string) => {
    geminiService.removeUploadedFile(fileName);
  };

  const handleQuickFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File size must be less than 100MB.');
      return;
    }

    setIsUploadingFile(true);
    setUploadError(null);

    try {
      const extractedFile = await extractTextFromFile(file);
      handleFileUploaded(extractedFile);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsUploadingFile(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await geminiService.sendMessage(input);

      if (aiResponse.startsWith('IMAGE_GENERATION:')) {
        const imagePrompt = aiResponse.replace('IMAGE_GENERATION:', '');
        setIsGeneratingImage(true);

        try {
          const imageUrl = await geminiService.generateImage(imagePrompt);

          const imageResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I've generated an image based on your request: "${imagePrompt}"`,
            timestamp: new Date(),
            imageUrl,
            imagePrompt
          };
          setMessages(prev => [...prev, imageResponse]);
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue generating the image. Please try again with a different prompt.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsGeneratingImage(false);
        }
      } else if (aiResponse === 'FOOD_BOOKING_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'food_booking') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve processed your food order! Here are the details:',
              timestamp: new Date(),
              orderType: 'food',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue processing your food order. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'TICKET_BOOKING_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'ticket_booking') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve booked your tickets! Here are the details:',
              timestamp: new Date(),
              orderType: 'ticket',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue booking your tickets. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_FOOD_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_food') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve processed your FasterBook food order! Here are the details:',
              timestamp: new Date(),
              orderType: 'fasterbook_food',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue with your FasterBook food order. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_MOVIE_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_movie') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve processed your FasterBook movie booking! Here are the details:',
              timestamp: new Date(),
              orderType: 'fasterbook_movie',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue with your FasterBook movie booking. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_BOOKINGS_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_bookings') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'Here are your FasterBook bookings:',
              timestamp: new Date(),
              orderType: 'fasterbook_bookings',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue retrieving your FasterBook bookings. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'RESTAURANT_ORDER_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue processing your restaurant order. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'HOTEL_BOOKING_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue booking your hotel. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FLIGHT_BOOKING_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue booking your flight. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'RIDE_BOOKING_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue booking your ride. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_MENU_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_menu') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'Here\'s the FasterBook menu with all available items:',
              timestamp: new Date(),
              orderType: 'fasterbook_menu',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue retrieving the FasterBook menu. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, response]);
      }
      
      // Generate task suggestions based on the conversation
      const suggestions = await geminiService.generateTaskSuggestions(input);
      if (suggestions.length > 0) {
        const newTasks = suggestions.map((suggestion, index) => ({
          id: `task-${Date.now()}-${index}`,
          title: suggestion,
          status: 'pending' as const,
          description: `Generated from your conversation with A.U.R.A`,
          timestamp: new Date()
        }));
        setTasks(prev => [...newTasks, ...prev]);
      }
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered a brief connection issue. Please try your message again, and I\'ll be ready to assist you.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
  };

  const getTaskIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'processing': return <Play className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 border-emerald-200';
      case 'processing': return 'bg-amber-50 border-amber-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  // Show landing page if not authenticated
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

        {/* Header */}
        <header className="relative z-10 px-6 py-4 md:px-8 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">A.U.R.A</span>
            </div>
            <SignInButton mode="modal">
              <button className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md">
                Sign In
              </button>
            </SignInButton>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative z-10 px-6 py-20 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl mb-8 animate-bloom">
              <Leaf className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Meet A.U.R.A
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto font-medium">
              Your Universal Reasoning Agent
            </p>
            <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Think smarter. Work faster. Achieve more. Your intelligent assistant for complex reasoning, task management, and seamless productivity.
            </p>

            {/* CTA */}
            <SignInButton mode="modal">
              <button className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105">
                <span>Get Started</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </SignInButton>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 px-6 py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-16">Powerful Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Intelligent Conversations</h3>
                <p className="text-slate-600 leading-relaxed">Engage in natural, context-aware conversations that help you think through complex problems.</p>
              </div>

              <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Smart Task Management</h3>
                <p className="text-slate-600 leading-relaxed">Automatically generate and track tasks from your conversations with AI-powered insights.</p>
              </div>

              <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Document Intelligence</h3>
                <p className="text-slate-600 leading-relaxed">Upload and analyze documents with powerful AI that understands context and extracts insights.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-12 text-center">
          <p className="text-slate-500 text-sm">Experience the future of intelligent assistance</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-green-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl" />

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 transform transition-transform duration-300 ease-out z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">A.U.R.A</h2>
              <p className="text-sm text-slate-600">Universal Reasoning Agent</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'chat' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Conversations</span>
          </button>

          <button
            onClick={() => setCurrentView('tasks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'tasks' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Zap className="w-5 h-5" />
            <span className="font-medium">Task Center</span>
          </button>

          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${showFileUpload ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Files</span>
          </button>

          <button
            onClick={() => setCurrentView('memory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'memory' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Memory Logs</span>
          </button>

          <button
            onClick={() => setCurrentView('files')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === 'files' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Files</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-all duration-200">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <h1 className="font-bold text-lg text-slate-900">A.U.R.A</h1>
                  <p className="text-xs text-slate-600">Ready to assist</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              {isLoaded && user && (
                <>
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 rounded-full">
                    <User className="w-4 h-4 text-slate-700" />
                    <span className="text-sm text-slate-700 max-w-[100px] md:max-w-none truncate">{currentUser?.full_name || currentUser?.email}</span>
                  </div>
                  <div className="clerk-user-button-wrapper">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-9 h-9 md:w-10 md:h-10',
                          userButtonPopoverCard: 'bg-white shadow-2xl border border-slate-200',
                          userButtonPopoverActionButton: 'hover:bg-slate-50',
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Chat View */}
        {currentView === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            {/* File Upload Panel */}
            {showFileUpload && (
              <div className="p-4 md:p-6 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 animate-slideIn">
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  uploadedFiles={geminiService.getUploadedFiles()}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            )}
            
            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 ${showFileUpload ? 'h-[calc(100vh-20rem)]' : ''}`}>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                  <div className={`max-w-full md:max-w-2xl ${message.type === 'user'
                    ? 'bg-slate-900 text-white rounded-3xl rounded-br-lg shadow-lg'
                    : 'bg-white/90 backdrop-blur-sm text-slate-800 rounded-3xl rounded-bl-lg border border-slate-200/50 shadow-sm'
                  } px-4 py-3 md:px-6 md:py-4 transition-all duration-200`}>
                    {message.type === 'assistant' ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                    {message.imageUrl && message.imagePrompt && (
                      <div className="mt-4">
                        <ImageDisplay
                          imageUrl={message.imageUrl}
                          prompt={message.imagePrompt}
                        />
                      </div>
                    )}
                    {message.orderType && message.orderData && (
                      <div className="mt-4">
                        <OrderDisplay
                          orderType={message.orderType}
                          orderData={message.orderData}
                        />
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-slate-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {(isTyping || isGeneratingImage) && (
                <div className="flex justify-start animate-slideIn">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl rounded-bl-lg px-4 py-3 md:px-6 md:py-4 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      {isGeneratingImage && (
                        <span className="text-sm text-slate-600">Generating image...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/50">
              {/* Upload Error */}
              {uploadError && (
                <div className="mb-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="text-sm">{uploadError}</span>
                  <button 
                    onClick={() => setUploadError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div className="flex items-end space-x-2 md:space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Message A.U.R.A..."
                    className="w-full px-4 py-3 md:px-6 md:py-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500 text-sm md:text-base"
                  />
                  
                  {geminiService.getUploadedFiles().length > 0 && (
                    <div className="absolute -top-8 left-2 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shadow-sm">
                      📎 {geminiService.getUploadedFiles().length} file(s) attached
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  accept="*"
                  onChange={handleQuickFileUpload}
                  className="hidden"
                  id="quick-file-upload"
                  disabled={isUploadingFile}
                />
                <button
                  onClick={() => document.getElementById('quick-file-upload')?.click()}
                  disabled={isUploadingFile}
                  className="p-3 md:p-3.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  title="Upload file"
                >
                  {isUploadingFile ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleVoice}
                  className={`p-3 md:p-3.5 rounded-xl transition-all duration-200 ${isListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isListening && <Waves className="w-4 h-4 absolute animate-ping" />}
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping || isGeneratingImage}
                  className="px-4 py-3 md:px-6 md:py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm md:text-base"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks View */}
        {currentView === 'tasks' && (
          <TaskCenter />
        )}

        {/* Files View */}
        {currentView === 'files' && (
          <FilesView
            files={geminiService.getUploadedFiles()}
            onRemoveFile={handleRemoveFile}
          />
        )}

        {/* Memory Logs View */}
        {currentView === 'memory' && (
          <MemoryLogs messages={messages} />
        )}

        {/* Old Tasks View (kept for reference) */}
        {currentView === 'tasks_old' && (
          <div className="p-6 space-y-6">
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-sage-200/30">
              <h2 className="text-xl font-semibold text-sage-800 mb-4">Active Tasks</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${getTaskStatusColor(task.status)} cursor-pointer animate-fadeIn`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTaskIcon(task.status)}
                        <span className="text-sm font-medium capitalize text-slate-700">{task.status}</span>
                      </div>
                      <div className="text-xs text-slate-500">{task.timestamp.toLocaleTimeString()}</div>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">{task.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-sage-200/30">
              <h3 className="text-lg font-semibold text-sage-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Create Report</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Automate Task</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <History className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Review History</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <Settings className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Configure</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}

export default App;