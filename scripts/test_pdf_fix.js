
import { generatePDF } from "../server/lib/pdf.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock content with the problematic formatting (markdown fences)
const MOCK_BAD_CONTENT = `\`\`\`markdown
# Page 1: Company Experience
This is the first page. It should be white, not dark.

---

# Page 2: Work Culture
This is the second page. It should also be white.

---

# Page 3: Roadmap
This is the third page.
\`\`\``;

async function runTest() {
    console.log('Testing PDF generation with mock bad content...');
    console.log('Input starts with:', MOCK_BAD_CONTENT.substring(0, 20));

    // The generatePDF function should strip the fences
    const pdfPath = await generatePDF(
        MOCK_BAD_CONTENT,
        'Test Fix Bundle',
        `test_fix_mock`,
        'test@cloudpilot.ai'
    );

    console.log('PDF generated at:', pdfPath);
}

runTest();
