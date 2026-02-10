import { useState, useEffect } from 'react';
import { MessageSquare, Clock, Zap, ArrowRight, Loader2, Trash2, Edit, Plus, Boxes, Play, FileText, Download, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import GuidedSessionEditor from './GuidedSessionEditor';
import BundleEditor from './BundleEditor';
import BundleResults from './BundleResults';

export default function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sessions, setSessions] = useState([]);
    const [guidedSessions, setGuidedSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSessions: 0, totalTokens: 0 });
    const [editingSession, setEditingSession] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    // Bundles State
    const [bundles, setBundles] = useState([]);
    const [showBundleEditor, setShowBundleEditor] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [runningBundleId, setRunningBundleId] = useState(null);
    const [bundleResultData, setBundleResultData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [sessionsRes, guidedRes, bundlesRes] = await Promise.all([
                apiRequest('/api/sessions'),
                apiRequest('/api/guided-sessions'),
                apiRequest('/api/bundles')
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

            if (bundlesRes.ok) {
                const data = await bundlesRes.json();
                setBundles(data);
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

    // Bundle Handlers
    const handleEditBundle = (e, bundle) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBundle(bundle);
        setShowBundleEditor(true);
    };

    const handleSaveBundle = (savedBundle) => {
        if (editingBundle) {
            setBundles(prev => prev.map(b => b.id === savedBundle.id ? savedBundle : b));
        } else {
            setBundles(prev => [savedBundle, ...prev]);
        }
        setEditingBundle(null);
    };

    const handleDeleteBundle = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await apiRequest(`/api/bundles/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setBundles(prev => prev.filter(b => b.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete bundle:', error);
        }
    };

    const handleRunBundle = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (runningBundleId) return;

        setRunningBundleId(id);
        try {
            const res = await apiRequest(`/api/bundles/${id}/run`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setBundleResultData({ content: data.result, id: data.resultId });
            } else {
                const err = await res.json();
                alert('Failed to run bundle: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to run bundle:', error);
            alert('Failed to run bundle');
        } finally {
            setRunningBundleId(null);
        }
    };

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

            {/* Bundles Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Bundles</h2>
                    <button
                        onClick={() => {
                            setEditingBundle(null);
                            setShowBundleEditor(true);
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                </div>

                {bundles.length === 0 ? (
                    <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                        <p>No bundles created yet. Create a bundle to generate content from your sessions.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bundles.map(bundle => (
                            <div
                                key={bundle.id}
                                className="p-4 rounded-xl bg-card border border-border text-left flex flex-col gap-3 group relative hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Boxes className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{bundle.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {bundle.target_session_ids?.length || 0} sessions linked
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleRunBundle(e, bundle.id)}
                                            disabled={runningBundleId === bundle.id}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title="Run Bundle"
                                        >
                                            {runningBundleId === bundle.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Play className="w-4 h-4 fill-current" />
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => handleEditBundle(e, bundle)}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteBundle(e, bundle.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <BundleResults bundleId={bundle.id} />
                            </div>
                        ))}
                    </div>
                )}
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

            {/* Managed Modals */}
            {showEditor && (
                <GuidedSessionEditor
                    session={editingSession}
                    onClose={() => setShowEditor(false)}
                    onSave={handleSaveGuidedSession}
                />
            )}

            {showBundleEditor && (
                <BundleEditor
                    bundle={editingBundle}
                    onClose={() => setShowBundleEditor(false)}
                    onSave={handleSaveBundle}
                />
            )}

            {bundleResultData && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-lg flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">Bundle Result</h2>
                            <div className="flex items-center gap-2">
                                {bundleResultData.id && (
                                    <button
                                        onClick={async () => {
                                            // Optional: Create PDF and download directly
                                            try {
                                                const response = await apiRequest(`/api/bundles/results/${bundleResultData.id}/pdf`);
                                                if (!response.ok) throw new Error('Download failed');
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `report_${bundleResultData.id.slice(0, 8)}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                            } catch (err) {
                                                console.error('PDF creation failed:', err);
                                                alert('Failed to generate PDF');
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
                                        title="Generate PDF Report"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Create PDF</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setBundleResultData(null)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-muted/5">
                            <div className="max-w-none prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-code:text-primary">
                                <ReactMarkdown>
                                    {bundleResultData.content?.replace(/^```markdown\n|```$/g, '') || ''}
                                </ReactMarkdown>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex justify-end">
                            <button
                                onClick={() => setBundleResultData(null)}
                                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
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
