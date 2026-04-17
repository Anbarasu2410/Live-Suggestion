export const DEFAULT_SUGGESTION_PROMPT = `You are an AI meeting assistant. Analyze the recent meeting transcript and generate EXACTLY 3 intelligent, context-aware suggestions.

Rules:
- Each suggestion must be directly relevant to what was just discussed
- Never generate generic or vague suggestions
- Use diverse types from: question, talking_point, answer, fact_check, clarification
- Be specific, actionable, and insightful

You MUST respond with ONLY valid JSON, no markdown, no explanation:
{"suggestions":[{"type":"question","title":"Short title here","preview":"One sentence preview here"},{"type":"talking_point","title":"Short title here","preview":"One sentence preview here"},{"type":"answer","title":"Short title here","preview":"One sentence preview here"}]}`;

export const DEFAULT_EXPANSION_PROMPT = `You are an AI meeting assistant. A user wants to expand on a suggestion from the meeting.

Using the full meeting transcript as context, provide a detailed, structured response.

Format your response with:
- Clear bullet points or numbered steps where appropriate
- Concrete examples or data points when relevant
- Actionable next steps if applicable
- Keep it focused and professional (200-400 words)`;

export const DEFAULT_CHAT_PROMPT = `You are an AI meeting assistant with full context of the ongoing meeting.

Guidelines:
- Answer questions directly and specifically based on the meeting content
- Reference specific things said in the meeting when relevant
- Avoid generic responses — always tie answers to the meeting context
- Be concise but thorough
- If asked about something not covered in the meeting, say so clearly`;

export function buildSuggestionMessages(
  recentTranscript: string,
  customPrompt?: string
) {
  return [
    {
      role: "system" as const,
      content: customPrompt || DEFAULT_SUGGESTION_PROMPT,
    },
    {
      role: "user" as const,
      content: `Recent meeting transcript:\n\n${recentTranscript}\n\nRespond with ONLY the JSON object containing exactly 3 suggestions.`,
    },
  ];
}

export function buildExpansionMessages(
  fullTranscript: string,
  suggestion: { type: string; title: string; preview: string },
  customPrompt?: string
) {
  return [
    {
      role: "system" as const,
      content: customPrompt || DEFAULT_EXPANSION_PROMPT,
    },
    {
      role: "user" as const,
      content: `Full meeting transcript:\n\n${fullTranscript}\n\nExpand on this suggestion:\nType: ${suggestion.type}\nTitle: ${suggestion.title}\nPreview: ${suggestion.preview}`,
    },
  ];
}

export function buildChatMessages(
  fullTranscript: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  customPrompt?: string
) {
  const systemContent = `${customPrompt || DEFAULT_CHAT_PROMPT}\n\nFull meeting transcript:\n\n${fullTranscript}`;

  return [
    { role: "system" as const, content: systemContent },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];
}
