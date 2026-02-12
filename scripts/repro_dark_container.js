
import { generatePDF } from '../server/lib/pdf.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
    // Simulating a response that might cause a trailing dark container
    // Case 1: Extra whitespace after the closing fence
    // Case 2: Trailing --- at the end
    const mockContent = `\`\`\`markdown
# Page 1
Content 1

---

# Page 2
Content 2

---

# Page 3
Content 3

---
\`\`\`
\n\n  `;

    try {
        console.log('Generating PDF with mock problematic content...');
        const pdfPath = await generatePDF(mockContent, 'Dark Container Test', 'problem_test', 'test@example.com');
        console.log('PDF generated at:', pdfPath);
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
