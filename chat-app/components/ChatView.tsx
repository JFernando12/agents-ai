import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  SendIcon,
  MicIcon,
  AttachmentIcon,
  LogoIcon,
  CopyIcon,
  ShareIcon,
  RetryIcon,
  ReadAloudIcon,
} from "./Icons";
import { useMessages } from "@/lib/hooks/useMessages";
import { useTypingEffect } from "@/lib/hooks/useTypingEffect";
import { useContextVisibility } from '@/contexts/ContextVisibilityContext';
import { Chat, Message } from '@/types';
import { ContextViewer } from './ContextViewer';

import { ContextToggleButton } from './ContextToggleButton';

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();



const ChatMessage: React.FC<{
  message: Message;
  isLatest?: boolean;
  showContexts?: boolean;
}> = ({ message, isLatest = false, showContexts = false }) => {
  const isUser = message.role === 'user';
  const { displayedText, isTyping } = useTypingEffect(
    message.content,
    10,
    !isUser && isLatest
  );

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      return decodeURIComponent(url.split('/').pop()!.split('?')[0]);
    } catch {
      return 'archivo';
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl space-y-2">
          {(message?.attachments?.length || 0) > 0 && (
            <div className="mt-2 space-y-1">
              {message?.attachments?.map((item, index) => {
                const isUrl = item.startsWith('http');
                const fileName = getFileNameFromUrl(item);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm"
                  >
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      PDF
                    </span>

                    {isUrl ? (
                      <a
                        href={item}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[200px]"
                      >
                        {fileName}
                      </a>
                    ) : (
                      <span className="truncate opacity-80">
                        {item} (subiendo…)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-gray-800 dark:text-gray-200">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-600">
        <LogoIcon className="w-6 h-6 p-0.5" />
      </div>
      <div className="flex flex-col flex-1">
        <div className="max-w-3xl p-4 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 overflow-x-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedText}
            </ReactMarkdown>
          </div>
        </div>
        {showContexts && message.context_data && (
          <div className="max-w-3xl">
            <ContextViewer contextData={message.context_data} />
          </div>
        )}
        <div className="mt-2 flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <div className="relative group">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full"
              aria-label="Copiar"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
            <span
              className="absolute -top-8 left-1/2 -translate-x-1/2 
              px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 
              group-hover:opacity-100 transition-opacity"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </span>
          </div>
          <button
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full hidden hidden"
            aria-label="Compartir"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full hidden hidden"
            aria-label="Intentar de nuevo"
          >
            <RetryIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full hidden hidden"
            aria-label="Leer en voz alta"
          >
            <ReadAloudIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const PromptInput: React.FC<{
  onSendMessage: (prompt: string , file?: File | null) => void;
}> = ({ onSendMessage }) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_HEIGHT = 160;
  const [fileError, setFileError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !file) return;
    onSendMessage(prompt,file);
    setPrompt('');
    removeFile();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      e.target.value = '';
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      if (pdf.numPages > 5) {
        setFileError('El archivo debe tener máximo 5 páginas');
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
      setFileError(null);

    } catch (error: any) {
      console.error('Error leyendo PDF:', error);
      e.target.value = '';
    }
  };
  
  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
  
      const textarea = textareaRef.current;
      if (!textarea) return;
  
      textarea.style.height = 'auto'; // reset
      textarea.style.height = Math.min(textarea.scrollHeight, MAX_HEIGHT) + 'px';
    };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 flex flex-col w-full h-full p-2"
    >

      {file && (
        <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg w-fit">
          <div className="w-8 h-8 flex items-center justify-center bg-red-500 rounded-md text-sm font-bold">
            {file.type === "application/pdf" ? "PDF" : "IMG"}
          </div>

          <span className="text-sm truncate max-w-[180px]">
            {file.name}
          </span>

          <button
            type="button"
            onClick={removeFile}
            className="ml-2 text-gray-300 hover:text-white"
            aria-label="Quitar archivo"
          >
            ✕
          </button>
        </div>
      )}


      <div className="w-full flex items-center p-2">
        <button
          type="button"
          onClick={handleClick}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600"
          aria-label="Adjuntar archivo"
        >
          <AttachmentIcon className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <textarea
          ref={textareaRef}
          value={prompt}
          rows={1}
          placeholder="Pregunta lo que quieras"
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="flex-1 resize-none bg-transparent border-none focus:ring-0 outline-none px-2 text-gray-700 dark:text-gray-200 leading-6 overflow-y-auto"
        />
        
        <button
          type="button"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hidden"
        >
          <MicIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!prompt.trim() && !file}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
      {fileError && (
        <p className="mt-1 text-sm text-red-400 px-4">
          {fileError}
        </p>
      )}
    </form>
  );
};

const ChatView: React.FC<{
  chat: Chat;
  onSendMessage: (prompt: string, file?: File | null) => void;
  isLoading: boolean;
}> = ({ chat, onSendMessage, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: messages = [] } = useMessages({ chatId: chat.id });
  const { showContexts, toggleContextVisibility } = useContextVisibility();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
      >
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            isLatest={index === messages.length - 1 && msg.role === 'model'}
            showContexts={showContexts}
          />
        ))}
        {isLoading && messages.length > 0 && (
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
              <LogoIcon className="w-6 h-6 p-0.5 animate-pulse drop-shadow-[0_0_3px_currentColor] scale-110" />
            </div>
            <div className="max-w-xl p-4 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
              <p className="text-gray-500 dark:text-gray-400">Pensando...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 md:p-8 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto">
          <PromptInput onSendMessage={onSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
