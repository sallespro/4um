import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Zap, ArrowRight, Loader2, Trash2 } from 'lucide-react';
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

    async function deleteSession(e, id) {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            const res = await apiRequest(`/api/sessions/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== id));
                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalSessions: prev.totalSessions - 1
                }));
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
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
                    custom learning programs
                </h1>
                <p className="text-muted-foreground mt-2">
                    custom workflows for AI powered business
                </p>
            </div>

            {/* Session History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Sessions</h2>
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
                            <div
                                key={session.id}
                                onClick={() => setSearchParams({ session: session.id })}
                                className={cn(
                                    "w-full group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left cursor-pointer",
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => deleteSession(e, session.id)}
                                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Compact Stats Cards at bottom */}
            <div className="flex items-center gap-6 py-4 px-1 border-t border-border/40">
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sessions</span>
                    <span className="text-lg font-bold">{stats.totalSessions}</span>
                </div>

                <div className="w-px h-8 bg-border/60" />

                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tokens</span>
                    <span className="text-lg font-bold">{formatTokens(stats.totalTokens)}</span>
                </div>

                <div className="w-px h-8 bg-border/60" />

                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Activity</span>
                    <span className="text-lg font-bold">
                        {sessions.length > 0 ? formatDate(sessions[0]?.updated_at || sessions[0]?.created_at) : '—'}
                    </span>
                </div>
            </div>

        </div>
    );
}
