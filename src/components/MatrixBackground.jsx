import { useEffect, useRef } from 'react';

export default function MatrixBackground({ theme = 'dark' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Characters to use (Katakana + Latin)
        const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charArray = chars.split('');

        const fontSize = 18; // Larger font = Less dense
        const columns = canvas.width / fontSize;

        // Array of drops - one per column
        const drops = [];
        for (let i = 0; i < columns; i++) {
            // Start below the screen with random offsets so they don't all appear at once
            drops[i] = (canvas.height / fontSize) + Math.random() * 100;
        }

        const draw = () => {
            // Semi-transparent background to create trail effect
            // Dark: Slate-900 (approx), Light: Slate-50
            ctx.fillStyle = theme === 'dark' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(248, 250, 252, 0.1)'; // Slightly more eager fade for cleaner look
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Text color
            // Dark: Indigo-400 (#818cf8), Light: Blue-500 (#3b82f6)
            ctx.fillStyle = theme === 'dark' ? '#818cf8' : '#3b82f6';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                // Only draw if within visible range (plus a bit of buffer) to save perf
                if (drops[i] * fontSize > -50 && drops[i] * fontSize < canvas.height + 500) {
                    const text = charArray[Math.floor(Math.random() * charArray.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                }

                // Reset to bottom if it goes off screen (top) and randomly
                if (drops[i] * fontSize < 0 && Math.random() > 0.98) {
                    drops[i] = (canvas.height / fontSize) + Math.random() * 20;
                }

                // Decrement y coordinate to move up
                drops[i] -= 0.5; // Slower speed (was 1)
            }
        };

        const interval = setInterval(draw, 50); // Slower framerate (was 33)

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', resize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 opacity-[0.15] dark:opacity-[0.4]"
        />
    );
}
