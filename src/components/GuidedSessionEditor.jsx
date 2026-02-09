import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function GuidedSessionEditor({ session = null, initialQuestions = [], onClose, onSave }) {
    const [title, setTitle] = useState(session?.title || '');
    const [description, setDescription] = useState(session?.description || '');
    const [questions, setQuestions] = useState(session?.questions || initialQuestions || ['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEditing = !!session;

    useEffect(() => {
        if (questions.length === 0) {
            setQuestions(['']);
        }
    }, [questions]);

    const handleAddQuestion = () => {
        setQuestions([...questions, '']);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const validQuestions = questions.filter(q => q.trim());
        if (!title.trim()) {
            setError('Title is required');
            setLoading(false);
            return;
        }
        if (validQuestions.length === 0) {
            setError('At least one question is required');
            setLoading(false);
            return;
        }

        try {
            const url = isEditing
                ? `/api/guided-sessions/${session.id}`
                : '/api/guided-sessions';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await apiRequest(url, {
                method,
                body: JSON.stringify({
                    title,
                    description,
                    questions: validQuestions
                })
            });

            if (!res.ok) throw new Error('Failed to save session');

            const savedSession = await res.json();
            onSave(savedSession);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">
                        {isEditing ? 'Edit Guided Session' : 'New Guided Session'}
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
                                placeholder="e.g., Venture Capital Deep Dive"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="What is this session about?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Questions Sequence</label>
                            <div className="space-y-3">
                                {questions.map((q, index) => (
                                    <div key={index} className="flex gap-2">
                                        <span className="py-2 text-sm text-muted-foreground w-6 text-center">
                                            {index + 1}.
                                        </span>
                                        <input
                                            type="text"
                                            value={q}
                                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="Enter question..."
                                            autoFocus={index === questions.length - 1 && questions.length > 1}
                                        />
                                        <button
                                            onClick={() => handleRemoveQuestion(index)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            disabled={questions.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddQuestion}
                                className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>
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
                        {isEditing ? 'Save Changes' : 'Create Session'}
                    </button>
                </div>
            </div>
        </div>
    );
}
