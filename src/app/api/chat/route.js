import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getExtendedStandings } from '@/lib/db/queries/standings';
import { getPlayerDetails } from '@/lib/db/queries/players';
import { db } from '@/lib/db/client';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('models/gemini-flash-latest'), // Switching to 1.5 Flash (stable) to avoid 2.0 quota limits
      messages,
      system: `You are a helpful sports assistant for a fantasy basketball league called 'Biwenger Stats'.
      You have access to live data about the league, including standings, player stats, and market values.
      
      When asked about 'my team' or 'me', ask for their user name if you don't know it.
      
      Always format numbers nicely (e.g. 1.2M€, 15.4 pts).
      Keep responses concise and focused on the user's question.
      If you don't know the answer, say so, but try to use the available tools to find out.
      
      Current Date: ${new Date().toLocaleDateString('es-ES')}
      `,
      tools: {
        getStandings: tool({
          description: 'Get the current league standings (classification)',
          parameters: z.object({}),
          execute: async () => {
            const standings = getExtendedStandings();
            return standings.map((s) => ({
              rank: s.position,
              user: s.name,
              points: s.total_points,
              team_value: s.team_value,
              avg: s.average_points,
            }));
          },
        }),
        getPlayerStats: tool({
          description: 'Get detailed stats for a specific player by name',
          parameters: z.object({
            name: z.string().describe('The name of the player to search for'),
          }),
          execute: async ({ name }) => {
            // 1. Search for player ID by name
            const searchStmt = db.prepare(`
              SELECT id, name, team_id 
              FROM players 
              WHERE name LIKE ? 
              ORDER BY puntos DESC 
              LIMIT 1
            `);
            const player = searchStmt.get(`%${name}%`);

            if (!player) {
              return { error: `Player '${name}' not found.` };
            }

            // 2. Get detailed stats
            const details = getPlayerDetails(player.id);

            if (!details) return { error: 'Could not fetch details.' };

            return {
              name: details.name,
              team: details.team,
              position: details.position,
              price: details.price,
              total_points: details.total_points,
              average: details.season_avg,
              games_played: details.games_played,
              last_games: details.recentMatches.slice(0, 5).map((m) => ({
                round: m.round_name,
                points: m.fantasy_points,
                stats: `${m.points_scored}pts, ${m.rebounds}reb, ${m.assists}ast`,
              })),
            };
          },
        }),
      },
      maxSteps: 5, // Enable multi-step tool execution on the server
    });

    // Compatibility: Try toDataStreamResponse, fallback to text stream if missing
    if (typeof result.toDataStreamResponse === 'function') {
      return result.toDataStreamResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      return result.toTextStreamResponse();
    } else {
      throw new Error('Streaming method not supported in this SDK version');
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
