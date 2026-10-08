"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './ai-support.module.css';
import { escapeHtml } from '../../../lib/markdown';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AISupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Olá! Sou o LabsAi, o assistente de desenvolvimento da comunidade. Como posso ajudar com seu código ou projeto hoje?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError('');
    
    // Add user message to UI
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          messages: newMessages.filter(m => m.role !== 'system') 
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o servidor');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <h2>LabsAi</h2>
        </div>
        <div className={styles.status}>
          <div className={styles.statusDot}></div>
          <span>IA Online</span>
        </div>
      </div>

      <div className={styles.chatArea}>
        <div className={styles.messagesList}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`${styles.messageWrapper} ${
                msg.role === 'user' ? styles.wrapperUser : styles.wrapperBot
              }`}
            >
              <div 
                className={`${styles.message} ${
                  msg.role === 'user' ? styles.messageUser : 
                  msg.role === 'system' ? styles.messageSystem : styles.messageBot
                }`}
                dangerouslySetInnerHTML={{
                  __html: escapeHtml(msg.content)
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #58a6ff; text-decoration: underline;">$1</a>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>
          ))}
          
          {isTyping && (
            <div className={`${styles.messageWrapper} ${styles.wrapperBot}`}>
              <div className={`${styles.message} ${styles.messageBot}`}>
                <div className={styles.typingIndicator}>
                  <div className={styles.typingDot}></div>
                  <div className={styles.typingDot}></div>
                  <div className={styles.typingDot}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              Erro: {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <textarea
            className={styles.textArea}
            placeholder="Faça uma pergunta sobre o desenvolvimento..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isTyping}
          />
          <button 
            type="submit" 
            className={styles.sendBtn}
            disabled={isTyping || !inputValue.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
