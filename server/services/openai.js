import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'o3-mini';

/**
 * Generate a chat completion using OpenAI
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} context - Optional RAG context to inject
 * @returns {Promise<{content: string, usage: {prompt_tokens: number, completion_tokens: number, total_tokens: number}}>}
 */
export async function generateCompletion(messages, context = null) {
    const systemMessage = {
        role: 'system',
        content: context
            ? `You are CloudPilot, a helpful AI assistant. Use the following context to inform your responses:\n\n${context}\n\nAnswer the user's questions based on this context when relevant.`
            : 'You are CloudPilot, a helpful AI assistant.',
    };

    const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [systemMessage, ...messages],
    });

    return {
        content: response.choices[0].message.content,
        usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}

export default openai;
