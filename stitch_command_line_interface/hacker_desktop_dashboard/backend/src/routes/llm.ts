import { Router } from 'express';

const router = Router();

router.post('/explain', (req, res) => {
  const { context, data, provider, model } = req.body || {};
  const explanation = `Context: ${context}. Provider: ${provider || 'openai'}. Model: ${model || 'gpt-4'}.\nSummary: ${JSON.stringify(data).slice(0, 200)}${JSON.stringify(data).length > 200 ? '...' : ''}`;
  const suggestedActions = [
    { id: 'action-1', label: 'Open related logs', command: 'open logs --tail' },
    { id: 'action-2', label: 'Run sanity tests', command: 'npm run test:sanity' },
  ];
  res.json({ explanation, suggestedActions, confidence: 0.82, model: model || 'gpt-4', tokensUsed: 256 });
});

router.post('/analyze-code', (req, res) => {
  const { code, analysisType } = req.body || {};
  const issues = [
    { severity: 'warning', line: 12, message: 'Consider memoizing this computation.' },
    { severity: 'info', line: 3, message: 'Prefer const over let when variables are not reassigned.' },
  ];
  if (!code) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'code is required' } });
    return;
  }
  res.json({
    issues,
    summary: `Found ${issues.length} potential ${analysisType || 'general'} issues.`,
    recommendations: ['Enable ESLint rule no-explicit-any', 'Add unit tests for edge cases'],
  });
});

router.post('/generate-code', (req, res) => {
  const { prompt, language } = req.body || {};
  if (!prompt || !language) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'prompt and language are required' } });
    return;
  }
  res.json({ code: `// ${language} generated code for: ${prompt}\nfunction hello(){ return 'world'; }`, explanation: 'Simple starter snippet.', language });
});

router.post('/completions', (req, res) => {
  const { prefix } = req.body || {};
  res.json({ completions: [prefix ? `${prefix}OptionA` : 'OptionA', 'OptionB', 'OptionC'] });
});

export default router;
