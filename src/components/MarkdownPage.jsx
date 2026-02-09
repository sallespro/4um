import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

export default function MarkdownPage() {
    const { slug } = useParams();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadContent() {
            setLoading(true);
            setError(null);
            try {
                // Dynamically import all markdown files from the root pages directory
                const modules = import.meta.glob('/pages/*.md', { query: '?raw', import: 'default' });

                const path = `/pages/${slug}.md`;

                if (!modules[path]) {
                    throw new Error('Page not found');
                }

                const markdown = await modules[path]();
                setContent(markdown);
            } catch (err) {
                console.error("Failed to load markdown:", err);
                setError("Content not found.");
            } finally {
                setLoading(false);
            }
        }

        loadContent();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <h2 className="text-xl font-semibold">404</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 overflow-y-auto">
            <article className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-muted-foreground prose-a:text-primary">
                <ReactMarkdown>{content}</ReactMarkdown>
            </article>
        </div>
    );
}
