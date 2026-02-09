import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Zap, ArrowRight, Loader2, Trash2, Edit, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import GuidedSessionEditor from './GuidedSessionEditor';

export default function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sessions, setSessions] = useState([]);
    const [guidedSessions, setGuidedSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSessions: 0, totalTokens: 0 });
    const [editingSession, setEditingSession] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [sessionsRes, guidedRes] = await Promise.all([
                apiRequest('/api/sessions'),
                apiRequest('/api/guided-sessions')
            ]);

            if (sessionsRes.ok) {
                const data = await sessionsRes.json();
                setSessions(data);

                // Calculate stats
                const totalTokens = data.reduce((acc, s) => acc + (s.total_tokens || 0), 0);
                setStats({
                    totalSessions: data.length,
                    totalTokens,
                });
            }

            if (guidedRes.ok) {
                const data = await guidedRes.json();
                setGuidedSessions(data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteSession(e, id) {
        e.preventDefault();
        e.stopPropagation();

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

    async function deleteGuidedSession(e, id) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this guided session template?')) return;

        try {
            const res = await apiRequest(`/api/guided-sessions/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setGuidedSessions(prev => prev.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete guided session:', error);
        }
    }

    async function createGuidedSession(topicOrId) {
        // If it's the hardcoded 'investments' topic
        if (topicOrId === 'investments') {
            await startSession('VC Exploration', 'investments');
            return;
        }

        // It's a custom guided session ID
        const guidedSession = guidedSessions.find(gs => gs.id === topicOrId);
        if (guidedSession) {
            await startSession(guidedSession.title, guidedSession.id);
        }
    }

    async function startSession(title, topic) {
        try {
            const res = await apiRequest('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({ title }),
            });

            if (res.ok) {
                const session = await res.json();
                // Navigate to new session with topic param
                setSearchParams({ session: session.id, topic });
            }
        } catch (error) {
            console.error('Failed to create guided session:', error);
        }
    }

    const handleEditGuidedSession = (e, session) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingSession(session);
        setShowEditor(true);
    };

    const handleSaveGuidedSession = (savedSession) => {
        if (editingSession) {
            setGuidedSessions(prev => prev.map(s => s.id === savedSession.id ? savedSession : s));
        } else {
            setGuidedSessions(prev => [savedSession, ...prev]);
        }
        setEditingSession(null);
    };

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
                    AI Studio
                </h1>
                <p className="text-muted-foreground mt-2">
                    Expertise, ferramentas e ação
                </p>
            </div>

            {/* Explore Topics */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Explore Topics</h2>
                    <button
                        onClick={() => {
                            setEditingSession(null);
                            setShowEditor(true);
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Built-in VC Session */}
                    <button
                        onClick={() => createGuidedSession('investments')}
                        className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left flex items-start gap-3 group relative"
                    >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-medium group-hover:text-primary transition-colors">Venture Capital</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Guided exploration of investment banking experience and available funds.
                            </p>
                        </div>
                    </button>

                    {/* Custom Guided Sessions */}
                    {guidedSessions.map(gs => (
                        <button
                            key={gs.id}
                            onClick={() => createGuidedSession(gs.id)}
                            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left flex items-start gap-3 group relative"
                        >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-16">
                                <h3 className="font-medium truncate group-hover:text-primary transition-colors">{gs.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {gs.description || 'Custom guided session'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span
                                    onClick={(e) => handleEditGuidedSession(e, gs)}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-background rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </span>
                                <span
                                    onClick={(e) => deleteGuidedSession(e, gs.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-background rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Guided Session Editor Modal */}
            {showEditor && (
                <GuidedSessionEditor
                    session={editingSession}
                    onClose={() => setShowEditor(false)}
                    onSave={handleSaveGuidedSession}
                />
            )}

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
                                className={cn(
                                    "w-full group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left relative",
                                    searchParams.get('session') === session.id && "border-primary bg-primary/5"
                                )}
                            >
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setSearchParams({ session: session.id })}
                                >
                                    <div className="flex-1 min-w-0 pr-12">
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
                                <button
                                    type="button"
                                    onClick={(e) => deleteSession(e, session.id)}
                                    className="absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 z-10"
                                    title="Delete session"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
