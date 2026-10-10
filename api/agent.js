// The Desk's advisor: one turn of a conversation with Claude.
//
// The agent loop runs in the browser, not here. Every tool the model can
// call (team context, player search, trade evaluation) runs on the page,
// because that is where the league data, the rankings and the season
// simulation already live. This function only holds the API key, the
// system prompt and the tool definitions, and forwards one request per
// turn. The page sends the conversation, gets back Claude's content, runs
// any tool calls it asked for and sends the results on the next request.
//
// Environment:
//   ANTHROPIC_API_KEY  -- without it the endpoint answers {mode: 'demo'}
//                         and the page falls back to its free offline
//                         advisor, which runs the same tools with no model.
//   AGENT_MODEL        -- optional; defaults to claude-opus-5-5.
//   AGENT_ACCESS_CODE  -- optional premium gate. When set, a request must
//                         carry the same value in x-desk-access.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.AGENT_MODEL || 'claude-opus-5-5';
const MAX_MESSAGES = 60;

const SYSTEM = `You are the advisor inside The Desk, a dynasty fantasy football tool. You help one manager make decisions for their own team in their own Sleeper league.

Ground every recommendation in the tools, never in memory:
- get_team_context gives the manager's roster with dynasty values, record, playoff, bye and title odds, and the other teams.
- search_players resolves a player name to an id and tells you who rosters him.
- evaluate_trade re-runs the season simulation with a trade applied and returns value and odds before and after for both sides.

Dynasty value is a long-run asset measure. Playoff, bye and title odds are this season. A trade that gives up a little value can still be right if it buys a meaningful jump in bye or title odds for a contender, and a rebuilding team should usually do the opposite. Say which situation this manager is in and weigh both sides in that light.

Rules:
- Call get_team_context before giving team-specific advice.
- Resolve every named player with search_players before evaluating a trade with him.
- Quote the numbers the tools return; do not invent odds or values. If a tool fails or lacks data, say so.
- Odds come from a simulation and move by a point or two run to run; treat changes under about 2 points as noise.
- Be direct and brief: a verdict first, then the two or three numbers that drive it.`;

const TOOLS = [
  {
    name: 'get_team_context',
    description: "The manager's team in one league: roster with positions and dynasty values, record, playoff/bye/title odds, league settings, and a summary of every other team. Call this before any team-specific advice.",
    input_schema: {
      type: 'object',
      properties: {
        league_id: { type: 'string', description: 'Optional. Defaults to the league the manager has selected.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'search_players',
    description: 'Find players by name. Returns id, position, NFL team, dynasty value and which roster in the league owns him.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full or partial player name.' },
        league_id: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'evaluate_trade',
    description: "Simulate a trade between the manager and one other team. Returns dynasty value given and received, and playoff, bye and title odds before and after for both teams. Players only; draft picks are not supported yet.",
    input_schema: {
      type: 'object',
      properties: {
        give: { type: 'array', items: { type: 'string' }, description: "Player ids the manager sends away." },
        get: { type: 'array', items: { type: 'string' }, description: 'Player ids the manager receives. All must be on the same roster.' },
        league_id: { type: 'string' },
      },
      required: ['give', 'get'],
      additionalProperties: false,
    },
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const code = process.env.AGENT_ACCESS_CODE;
  if (code && req.headers['x-desk-access'] !== code) {
    res.status(401).json({ error: 'locked' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(200).json({ mode: 'demo' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length || messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: 'Bad conversation length' });
    return;
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      output_config: { effort: 'medium' },
      // A request the model declines is re-run on a fallback model
      // inside the same call rather than coming back empty.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    });
    res.status(200).json({
      mode: 'live',
      content: response.content,
      stop_reason: response.stop_reason,
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'The advisor is busy. Try again in a minute.' });
    } else if (error instanceof Anthropic.APIError) {
      res.status(502).json({ error: `Advisor error ${error.status}` });
    } else {
      res.status(500).json({ error: 'Advisor unavailable' });
    }
  }
}
