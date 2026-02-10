import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directory exists
const STORAGE_DIR = path.join(__dirname, '../../storage/bundle_results');
await fs.mkdir(STORAGE_DIR, { recursive: true });

const TAILWIND_CDN = '<script src="https://cdn.tailwindcss.com"></script>';
const TYPOGRAPHY_CDN = '<script src="https://cdn.tailwindcss.com?plugins=typography"></script>';

const CORPORATE_TEMPLATE = (content, title, userEmail) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    ${TAILWIND_CDN}
    ${TYPOGRAPHY_CDN}
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0;
            background: #f9fafb;
        }
        .page {
            padding: 2.5cm;
            min-height: 29.7cm; /* A4 height */
            background: white;
            box-sizing: border-box;
            position: relative;
            page-break-after: always;
        }
        .page:last-child {
            page-break-after: auto;
        }
        .prose h1 { color: #1e3a8a; }
        .prose h2 { color: #1d4ed8; border-bottom: 2px solid #eff6ff; padding-bottom: 0.5rem; margin-top: 2rem; }
        .prose p { color: #374151; font-size: 1.125rem; }
        .footer {
            position: absolute;
            bottom: 1.5cm;
            left: 2.5cm;
            right: 2.5cm;
            font-size: 11px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 1rem;
            display: flex;
            justify-content: space-between;
        }
        .header {
            margin-bottom: 3rem;
            border-left: 4px solid #2563eb;
            padding-left: 1.5rem;
        }
    </style>
</head>
<body class="bg-gray-50">
    ${content}
</body>
</html>
`;

export async function generatePDF(resultContent, title, filename, userEmail) {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Clean up potential markdown code blocks from the AI response
    // ensuring we don't treat the entire content as a code block
    const cleanContent = resultContent.replace(/^```markdown\s*/i, '').replace(/\s*```$/, '');

    // Render markdown to HTML server-side
    // We'll split by "---" to create separate pages for a presentation feel
    const sections = cleanContent.split(/\n---\s*\n/);

    const pageHtml = sections.map((section, idx) => {
        const html = marked.parse(section);
        return `
            <div class="page">
                <div class="header">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-sm font-semibold text-blue-600 uppercase tracking-wider">${title}</h2>
                            <h1 class="text-2xl font-bold text-gray-900 mt-1">Section ${idx + 1}</h1>
                        </div>
                        <div class="text-right text-xs text-gray-400">
                            ${new Date().toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
                <article class="prose prose-lg max-w-none">
                    ${html}
                </article>
                <div class="footer">
                    <div>Confidential - CloudPilot AI Program</div>
                    <div class="flex gap-6">
                        <span>User: ${userEmail || 'CloudPilot User'}</span>
                        <span>Page ${idx + 1} of ${sections.length}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const htmlContent = CORPORATE_TEMPLATE(pageHtml, title, userEmail);

    await page.setContent(htmlContent, { waitUntil: 'networkidle2' });

    const pdfPath = path.join(STORAGE_DIR, `${filename}.pdf`);

    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
            top: '0mm',
            bottom: '0mm',
            left: '0mm',
            right: '0mm'
        }
    });

    await browser.close();
    return pdfPath;
}
