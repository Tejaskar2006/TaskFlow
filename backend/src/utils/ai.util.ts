import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI;

const getAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Using gemini-2.0-flash — the stable, default model for newer API keys
const MODEL_NAME = 'gemini-2.0-flash';

const extractJSON = (text: string) => {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON Extraction Error, raw text:', text);
    throw new Error('AI returned invalid format');
  }
};

const uniqueSubtasks = (subtasks: string[]): string[] => {
  return Array.from(
    new Set(
      subtasks
        .map((subtask) => subtask.trim())
        .filter(Boolean)
    )
  ).slice(0, 8);
};

const buildFallbackSubtasks = (title: string, description?: string): string[] => {
  const context = `${title} ${description || ''}`.toLowerCase();
  const fallback = [
    `Clarify requirements for ${title}`,
    `Break down the work for ${title}`,
    'Prepare the needed assets and dependencies',
    'Implement the first pass',
    'Review and refine the implementation',
    'Test the result end to end',
    'Document updates and follow-ups',
  ];

  if (context.includes('bug') || context.includes('fix') || context.includes('error')) {
    fallback.splice(
      0,
      fallback.length,
      'Reproduce the issue consistently',
      'Identify the root cause',
      'Implement the fix',
      'Verify the affected user flow',
      'Add or update regression coverage',
      'Document any follow-up cleanup'
    );
  }

  if (context.includes('design') || context.includes('ui') || context.includes('page')) {
    fallback.splice(
      0,
      fallback.length,
      'Review the current UI and requirements',
      'Create a layout/content plan',
      'Implement the visual updates',
      'Refine spacing, states, and responsiveness',
      'Validate the experience on desktop and mobile',
      'Collect final review feedback'
    );
  }

  return uniqueSubtasks(fallback).slice(0, 6);
};

const buildFallbackSummary = (comments: any[]): string => {
  const totalComments = comments.length;
  const latestComments = comments.slice(-2).map((comment) => {
    const author = comment.user?.name || 'User';
    const content = String(comment.content || '').trim().replace(/\s+/g, ' ');
    return `${author}: ${content}`;
  });

  if (latestComments.length === 0) {
    return 'No comments to summarize yet.';
  }

  if (latestComments.length === 1) {
    return `There is 1 comment on this task. Latest update: ${latestComments[0]}`;
  }

  return `There are ${totalComments} comments on this task. Latest discussion points: ${latestComments.join(' | ')}`;
};

export const generateSubtasks = async (title: string, description?: string) => {
  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Task: "${title}"
Description: "${description || 'N/A'}"

Generate a checklist of 5-8 subtasks for this task.
Return ONLY a JSON array of strings. No other text.
Example: ["Task 1", "Task 2"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const subtasks = extractJSON(text);

    if (!Array.isArray(subtasks) || subtasks.some((subtask) => typeof subtask !== 'string')) {
      throw new Error('AI returned subtasks in an unexpected format');
    }

    return uniqueSubtasks(subtasks);
  } catch (error: any) {
    console.error('AI Subtask Generation Error:', error.message);
    return buildFallbackSubtasks(title, description);
  }
};

export const suggestPriority = async (title: string, description?: string, dueDate?: Date) => {
  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Analyze this task and return ONLY one word: low, medium, or high.
Title: ${title}
Description: ${description || 'N/A'}
Due Date: ${dueDate ? dueDate.toISOString() : 'None'}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().toLowerCase().trim();

    if (text.includes('high')) return 'high';
    if (text.includes('low')) return 'low';
    return 'medium';
  } catch (error: any) {
    console.error('AI Priority Suggestion Error:', error.message);
    return 'medium';
  }
};

export const summarizeComments = async (comments: any[]) => {
  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const commentText = comments.map(c => `${c.user?.name || 'User'}: ${c.content}`).join('\n');

    const prompt = `Summarize this task discussion in 2 concise sentences:\n\n${commentText}\n\nSummary:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    console.error('AI Summarization Error:', error.message);
    return buildFallbackSummary(comments);
  }
};
