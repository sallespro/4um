import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, ChevronDown, ChevronRight, RefreshCw, Eye, X, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils'; // Assuming cn is available

export default function BundleResults({ bundleId }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [viewingResult, setViewingResult] = useState(null);
    const [viewerUrl, setViewerUrl] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [sendingId, setSendingId] = useState(null);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

    useEffect(() => {
        if (expanded && results.length === 0) {
            loadResults();
        }
    }, [expanded]);

    useEffect(() => {
        if (viewingResult) {
            loadViewerPdf(viewingResult.id);
        } else {
            if (viewerUrl) {
                window.URL.revokeObjectURL(viewerUrl);
                setViewerUrl(null);
            }
        }
    }, [viewingResult]);

    async function loadViewerPdf(resultId) {
        try {
            const res = await apiRequest(`/api/bundles/results/${resultId}/pdf?view=true`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                setViewerUrl(url);
            }
        } catch (err) {
            console.error('Failed to load viewer PDF:', err);
        }
    }

    async function loadResults() {
        setLoading(true);
        try {
            const res = await apiRequest(`/api/bundles/${bundleId}/results`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (err) {
            console.error('Failed to load results:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleDownload = async (e, result) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setDownloadingId(result.id);

        try {
            const response = await apiRequest(`/api/bundles/results/${result.id}/pdf`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${result.id.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleSendEmail = async (e, result) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSendingId(result.id);
        setStatus(null);

        try {
            const response = await apiRequest(`/api/bundles/results/${result.id}/email`, {
                method: 'POST'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send email');
            }

            setStatus({ type: 'success', message: 'E-mail enviado com sucesso!' });
            setTimeout(() => setStatus(null), 3000);

        } catch (err) {
            console.error('Email send failed:', err);
            setStatus({ type: 'error', message: err.message || 'Falha ao enviar e-mail' });
            setTimeout(() => setStatus(null), 4000);
        } finally {
            setSendingId(null);
        }
    };

    return (
        <div className="mt-4 border-t border-border/50 pt-2">
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
            >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {expanded ? 'Hide History' : 'Show History'}
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 pl-2">
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </div>
                    ) : results.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No results yet.</p>
                    ) : (
                        results.map(result => (
                            <div key={result.id} className="flex items-center justify-between group/result">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="w-3 h-3" />
                                    <span>{new Date(result.created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/result:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleSendEmail(e, result)}
                                        disabled={sendingId === result.id}
                                        className="p-1.5 hover:bg-primary/10 text-primary rounded transition-colors disabled:opacity-50"
                                        title="Send via Email"
                                    >
                                        {sendingId === result.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Mail className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setViewingResult(result); }}
                                        className="p-1.5 hover:bg-primary/10 text-primary rounded transition-colors"
                                        title="View PDF"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Status Toast Notification */}
                    {status && (
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300",
                            status.type === 'success' ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                        )}>
                            {status.type === 'success' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                                <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            {status.message}
                        </div>
                    )}
                </div>
            )}

            {/* PDF Viewer Modal */}
            {viewingResult && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl bg-card border border-border rounded-xl shadow-2xl flex flex-col h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h2 className="font-semibold">Bundle Report Preview</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSendEmail(null, viewingResult)}
                                    disabled={sendingId === viewingResult.id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50"
                                    title="Send via Email"
                                >
                                    {sendingId === viewingResult.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Mail className="w-3 h-3" />
                                    )}
                                    Email
                                </button>
                                <button
                                    onClick={() => handleDownload(null, viewingResult)}
                                    disabled={downloadingId === viewingResult.id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {downloadingId === viewingResult.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Download className="w-3 h-3" />
                                    )}
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => setViewingResult(null)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-muted/20 relative">
                            {viewerUrl ? (
                                <iframe
                                    src={viewerUrl}
                                    className="w-full h-full border-0"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground">Preparing preview...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
