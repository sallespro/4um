import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Send, User, Bot, Loader2, Plus, ChevronLeft, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import GuidedSessionEditor from './GuidedSessionEditor';

export default function ChatInterface() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(searchParams.get('session'));
    const [sessions, setSessions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const scrollRef = useRef(null);

    // Sync with URL params
    useEffect(() => {
        const urlSessionId = searchParams.get('session');
        if (urlSessionId && urlSessionId !== sessionId) {
            loadSession({ id: urlSessionId });
        }
    }, [searchParams]);

    // Initial load if session is already in URL
    useEffect(() => {
        const urlSessionId = searchParams.get('session');
        if (urlSessionId) {
            loadSession({ id: urlSessionId });
        }
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            const res = await apiRequest('/api/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    async function createSession() {
        try {
            const res = await apiRequest('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({ title: 'New Chat' }),
            });
            if (res.ok) {
                const session = await res.json();
                setSearchParams({ session: session.id });
                setSessionId(session.id);
                setMessages([]);
                setSessions(prev => [session, ...prev]);
                setShowHistory(false);
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    }

    async function loadSession(session) {
        if (!session?.id) return;

        try {
            setSessionId(session.id);
            if (searchParams.get('session') !== session.id) {
                setSearchParams({ session: session.id });
            }

            const res = await apiRequest(`/api/sessions/${session.id}/messages`);

            if (res.ok) {
                const data = await res.json();
                setMessages(data.map(m => ({ ...m, id: m.id })));
            }
            setShowHistory(false);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    // Send message mutation
    const mutation = useMutation({
        mutationFn: async (content) => {
            // Create session if none exists
            let currentSessionId = sessionId;
            if (!currentSessionId) {
                const res = await apiRequest('/api/sessions', {
                    method: 'POST',
                    body: JSON.stringify({ title: content.slice(0, 50) }),
                });
                if (res.ok) {
                    const session = await res.json();
                    currentSessionId = session.id;
                    setSearchParams({ session: session.id });
                    setSessionId(session.id);
                    setSessions(prev => [session, ...prev]);
                }
            }

            // Optimistic update
            setMessages(prev => [...prev, { role: 'user', content, id: Date.now() }]);

            const res = await apiRequest('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ sessionId: currentSessionId, message: content }),
            });

            if (!res.ok) {
                throw new Error('Failed to send message');
            }

            return res.json();
        },
        onSuccess: (data) => {
            setMessages(prev => [...prev, { role: 'assistant', content: data.response, id: Date.now() }]);
        },
        onError: (error) => {
            console.error('Chat error:', error);
            setMessages(prev => prev.slice(0, -1));
        },
    });

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const [guidedQuestions, setGuidedQuestions] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Guided Sessions Configuration
    const GUIDED_TOPICS = {
        investments: [
            "What is the company experience as investment bank?",
            "What are types of investment funds available?"
        ]
    };

    // Load guided questions (either hardcoded or from API)
    useEffect(() => {
        const topic = searchParams.get('topic');
        if (!topic) return;

        if (GUIDED_TOPICS[topic]) {
            setGuidedQuestions(GUIDED_TOPICS[topic]);
        } else {
            // Assume it's a custom session ID
            apiRequest(`/api/guided-sessions/${topic}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to load guided session');
                })
                .then(data => {
                    if (data && data.questions) {
                        setGuidedQuestions(data.questions);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [searchParams]);

    // Auto-play guided questions
    useEffect(() => {
        const topic = searchParams.get('topic');
        if (!topic || guidedQuestions.length === 0 || mutation.isPending) return;

        // Check if we should send the next question
        const userMessages = messages.filter(m => m.role === 'user');
        const lastMessage = messages[messages.length - 1];

        // Conditions to send next message:
        // 1. No messages yet (start of session)
        // 2. Last message was from assistant (previous answer complete)
        const shouldSendNext = messages.length === 0 || (lastMessage && lastMessage.role === 'assistant');

        if (shouldSendNext && userMessages.length < guidedQuestions.length) {
            const nextQuestion = guidedQuestions[userMessages.length];

            // Small delay for natural feel
            const timer = setTimeout(() => {
                mutation.mutate(nextQuestion);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [messages, searchParams, guidedQuestions, mutation.isPending]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || mutation.isPending) return;
        mutation.mutate(input);
        setInput('');
    };

    // Session history view
    if (showHistory) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 p-4 border-b border-border">
                    <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-muted rounded-lg">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-medium">Session History</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={createSession}
                        className="w-full flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                    {sessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => loadSession(session)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg hover:bg-muted transition-colors",
                                session.id === sessionId && "bg-muted"
                            )}
                        >
                            <p className="font-medium truncate">{session.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(session.created_at).toLocaleDateString()}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Toolbar */}
            {messages.length > 0 && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="p-2 bg-background/80 backdrop-blur border border-border rounded-lg shadow-sm hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                        title="Save conversation as Guided Session"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Bot className="w-10 h-10 mb-3" />
                        <p className="text-sm">Start a conversation</p>
                        <button
                            onClick={() => setShowHistory(true)}
                            className="mt-2 text-xs text-primary hover:underline"
                        >
                            View history
                        </button>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                        )}

                        <div className={cn(
                            "rounded-xl px-4 py-2.5 text-sm max-w-[85%]",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border"
                        )}>
                            {msg.role === 'assistant' ? (
                                <article className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </article>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ))}

                {mutation.isPending && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="rounded-xl px-4 py-2.5 bg-card border border-border">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}

                <div className="h-20"></div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 px-4">
                <form onSubmit={handleSubmit} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message..."
                        className="w-full bg-card border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || mutation.isPending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground opacity-0 group-focus-within:opacity-100 transition-all disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>

            {/* Save as Guided Session Modal */}
            {showSaveModal && (
                <GuidedSessionEditor
                    initialQuestions={messages.filter(m => m.role === 'user').map(m => m.content)}
                    onClose={() => setShowSaveModal(false)}
                    onSave={() => {
                        // Just close, maybe show toast
                        setShowSaveModal(false);
                    }}
                />
            )}
        </div>
    );
}
