import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function BundleEditor({ bundle = null, onClose, onSave }) {
    const [title, setTitle] = useState(bundle?.title || '');
    const [prompt, setPrompt] = useState(bundle?.prompt || '');
    const [selectedSessions, setSelectedSessions] = useState(bundle?.target_session_ids || []);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingSessions, setFetchingSessions] = useState(true);
    const [error, setError] = useState(null);

    const isEditing = !!bundle;

    useEffect(() => {
        async function loadSessions() {
            try {
                const res = await apiRequest('/api/sessions');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableSessions(data);
                }
            } catch (err) {
                console.error("Failed to load sessions:", err);
            } finally {
                setFetchingSessions(false);
            }
        }
        loadSessions();
    }, []);

    const toggleSession = (sessionId) => {
        setSelectedSessions(prev =>
            prev.includes(sessionId)
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!title.trim()) {
            setError('Title is required');
            setLoading(false);
            return;
        }
        if (!prompt.trim()) {
            setError('Prompt is required');
            setLoading(false);
            return;
        }
        if (selectedSessions.length === 0) {
            setError('Select at least one session for context');
            setLoading(false);
            return;
        }

        try {
            const url = isEditing
                ? `/api/bundles/${bundle.id}`
                : '/api/bundles';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await apiRequest(url, {
                method,
                body: JSON.stringify({
                    title,
                    prompt,
                    target_session_ids: selectedSessions
                })
            });

            if (!res.ok) throw new Error('Failed to save bundle');

            const savedBundle = await res.json();
            onSave(savedBundle);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">
                        {isEditing ? 'Edit Bundle' : 'New Bundle'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="e.g., Weekly Report Bundle"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Prompt</label>
                            <p className="text-xs text-muted-foreground mb-2">Define the instructions for generating the presentation.</p>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 h-32 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                                placeholder="e.g., Summarize the key findings from the selected sessions and format as a bulleted list..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Select Context Sessions</label>
                            {fetchingSessions ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions...
                                </div>
                            ) : availableSessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sessions available.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                                    {availableSessions.map(session => (
                                        <button
                                            key={session.id}
                                            onClick={() => toggleSession(session.id)}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-md text-sm text-left transition-colors border",
                                                selectedSessions.includes(session.id)
                                                    ? "bg-primary/10 border-primary/50 text-foreground"
                                                    : "bg-background border-transparent hover:bg-muted"
                                            )}
                                        >
                                            <span className="truncate flex-1 pr-2">{session.title}</span>
                                            {selectedSessions.includes(session.id) && (
                                                <Check className="w-4 h-4 text-primary shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                                {selectedSessions.length} sessions selected
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEditing ? 'Save Changes' : 'Create Bundle'}
                    </button>
                </div>
            </div>
        </div>
    );
}
