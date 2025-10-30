import { MessageSquare, User, Bot } from 'lucide-react';
import Markdown from '../utils/markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
}

interface MemoryLogsProps {
  messages: Message[];
}

export default function MemoryLogs({ messages }: MemoryLogsProps) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <MessageSquare className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Chat History</h3>
        <p className="text-slate-600 max-w-md">
          Start a conversation with A.U.R.A to see your chat history here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Memory Logs</h2>
        <p className="text-slate-600">Complete conversation history with A.U.R.A</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 md:space-x-4 p-4 md:p-5 rounded-2xl ${
              message.type === 'user'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white border border-slate-200 shadow-sm'
            }`}
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                message.type === 'user'
                  ? 'bg-white/20'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}
            >
              {message.type === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${
                  message.type === 'user' ? 'text-white' : 'text-slate-900'
                }`}>
                  {message.type === 'user' ? 'You' : 'A.U.R.A'}
                </span>
                <span className={`text-xs ${
                  message.type === 'user' ? 'text-white/70' : 'text-slate-500'
                }`}>
                  {message.timestamp.toLocaleString()}
                </span>
              </div>

              <div className={message.type === 'user' ? 'text-white' : 'text-slate-800'}>
                {message.type === 'assistant' ? (
                  <Markdown content={message.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>

              {message.imageUrl && (
                <div className="mt-3">
                  <img
                    src={message.imageUrl}
                    alt={message.imagePrompt || 'Generated image'}
                    className="rounded-xl max-w-full md:max-w-sm border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
