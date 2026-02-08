import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSessions: 0, totalTokens: 0 });

    useEffect(() => {
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            const res = await apiRequest('/api/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data);

                // Calculate stats
                const totalTokens = data.reduce((acc, s) => acc + (s.total_tokens || 0), 0);
                setStats({
                    totalSessions: data.length,
                    totalTokens,
                });
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatTokens(tokens) {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
        return tokens.toString();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return date.toLocaleDateString();
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Welcome to CloudPilot
                </h1>
                <p className="text-muted-foreground mt-2">
                    Your AI-powered assistant for intelligent conversations.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalSessions}</p>
                            <p className="text-sm text-muted-foreground">Chat Sessions</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <Zap className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatTokens(stats.totalTokens)}</p>
                            <p className="text-sm text-muted-foreground">Total Tokens Used</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {sessions.length > 0 ? formatDate(sessions[0]?.updated_at || sessions[0]?.created_at) : '—'}
                            </p>
                            <p className="text-sm text-muted-foreground">Last Activity</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Sessions</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-8 rounded-xl bg-card border border-border text-center">
                        <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">No chat sessions yet.</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                            Start a conversation using the chat panel on the right.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sessions.slice(0, 10).map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setSearchParams({ session: session.id })}
                                className={cn(
                                    "w-full group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left",
                                    searchParams.get('session') === session.id && "border-primary bg-primary/5"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{session.title}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDate(session.updated_at || session.created_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Zap className="w-3.5 h-3.5" />
                                                {formatTokens(session.total_tokens || 0)} tokens
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Features */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <h2 className="text-xl font-semibold mb-4">✨ Features</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>RAG-Enhanced Chat</strong> — Responses include context from your content</li>
                    <li>• <strong>Session History</strong> — All conversations are saved and retrievable</li>
                    <li>• <strong>Token Tracking</strong> — Monitor your AI usage per session</li>
                </ul>
            </div>
        </div>
    );
}
