
// Sample AI suggestion function
export function generateSuggestion(messages: any[], chatContext: any) {
  const suggestions = [
    "Great! Let's meet up sometime.",
    "What are you doing this weekend?",
    "Can you share more details about that?",
    "That sounds interesting! Tell me more.",
    "I'm glad to hear that! How's everything else?",
    "Thanks for sharing. I appreciate it.",
    "Let's catch up soon!",
    "That's awesome news!",
    "I understand how you feel.",
    "Let me know if there's anything I can do to help."
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}
