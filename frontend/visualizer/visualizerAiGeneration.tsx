import aiPromptGLSL from "./visualizerAiPromptGLSL.txt";

const OPENAI_API_KEY = "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";
const OPENAI_ORG_KEY = "org-fOy80wD4goyZzQNVqywahJYq";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const sendAiChatMessages = async (messages: AiMessage[], model = "gpt-4"): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Organization": OPENAI_ORG_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages
    })
  });

  const result = await response.json();
  return result.choices[0].message.content;
};

export const generateGLSL = async (prompt: string): Promise<string> =>
  sendAiChatMessages([{role: "user", content: `${aiPromptGLSL}\n\nPrompt: ${prompt}`}]);

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Organization": OPENAI_ORG_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      "n": 1,
      "size": "1024x1024",
      "response_format": "b64_json"
    })
  });

  const result = await response.json();
  return `data:image/png;base64,${result.data[0].b64_json}`;
};
