import { Groq } from 'groq-sdk';

let groqClient = null;

function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY not found in environment');
      return null;
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export async function callGemini(userMessage, systemMessage = '', expectJson = true) {
  const ai = getGroq();
  if (!ai) return { success: false, error: 'Gemini (Groq) not configured', raw: null, data: null };

  try {
    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: userMessage });

    const completion = await ai.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      response_format: expectJson ? { type: 'json_object' } : { type: 'text' },
    });
    
    const raw = completion.choices[0]?.message?.content || '';
    
    if (!expectJson) {
      return { success: true, raw, data: null };
    }

    try {
      const data = JSON.parse(raw);
      return { success: true, raw, data };
    } catch (e) {
      let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        cleaned = cleaned.slice(start, end + 1);
        try {
          const data = JSON.parse(cleaned);
          return { success: true, raw, data };
        } catch (err2) {}
      }
      return { success: true, raw, data: null };
    }
  } catch (err) {
    console.error('Gemini error:', err.message);
    return { success: false, error: err.message, raw: null, data: null };
  }
}

export async function callGeminiChat(userMessage, systemMessage = '') {
  const ai = getGroq();
  if (!ai) return { success: false, error: 'Gemini (Groq) not configured', raw: null };

  try {
    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: userMessage });

    const completion = await ai.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    
    return { success: true, raw: completion.choices[0]?.message?.content || '' };
  } catch (err) {
    console.error('Gemini Chat error:', err.message);
    return { success: false, error: err.message, raw: null };
  }
}
