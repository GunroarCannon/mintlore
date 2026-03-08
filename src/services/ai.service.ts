// services/ai.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GROQ_API_KEY } from '@env';
import { Rarity, PokemonType } from '../types';

interface AiResponse {
    description: string;
    timestamp: number;
}

class AiService {
    private readonly CACHE_PREFIX = 'ai_desc_';
    private readonly GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private lastRequestTime = 0;
    private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

    private async waitRateLimit() {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.RATE_LIMIT_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLast));
        }
        this.lastRequestTime = Date.now();
    }

    public async getNFTDescription(
        name: string,
        type1: PokemonType,
        type2: PokemonType | undefined,
        rarity: Rarity,
        baseDescription: string
    ): Promise<string> {
        const cacheKey = `${this.CACHE_PREFIX}${name}_${rarity}`;

        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached) as AiResponse;
                console.log(`[AiService] Returning cached description for ${name}`);
                return parsed.description;
            }
        } catch (e) {
            console.error('[AiService] Cache read error:', e);
        }

        const models = [
            'llama-3.1-8b-instant',
            'llama3-70b-8192',
            'mixtral-8x7b-32768'
        ];

        const prompt = `You are a highly advanced Pokedex from the year 2099. Analyze this holographic NFT "${name}". 
    Specs: ${rarity} class, ${type1}${type2 ? '/' + type2 : ''} protocol. 
    Bio-data: ${baseDescription}.
    Provide a factual yet mystical 1-2 sentence description that reveals something specific about its traits or elemental nature. 
    IMPORTANT: Do NOT use markdown, do NOT use asterisks (**), and do NOT include headers like "Pokedex Entry" or "Classification". Just provide the description text itself.`;

        for (const model of models) {
            try {
                await this.waitRateLimit();
                console.log(`[AiService] Attempting with model: ${model}`);

                const payload = {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 100,
                };

                const response = await fetch(this.GROQ_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.warn(`[AiService] Model ${model} failed: ${response.status}`, errorData);
                    continue; // Try next model
                }

                const data = await response.json();
                let generatedDesc = data.choices?.[0]?.message?.content?.trim()
                    .replace(/^"|"$/g, '')
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/Pokedex Entry \d+: /gi, '')
                    .replace(/Classification: /gi, '')
                    .trim();

                if (!generatedDesc) {
                    console.warn(`[AiService] No content from model ${model}`);
                    continue;
                }

                console.log(`[AiService] Successfully generated with ${model}: ${generatedDesc.substring(0, 30)}...`);

                await AsyncStorage.setItem(cacheKey, JSON.stringify({
                    description: generatedDesc,
                    timestamp: Date.now()
                }));

                return generatedDesc;
            } catch (e: any) {
                console.error(`[AiService] Error with model ${model}:`, e.message || e);
                // Continue to next model
            }
        }

        console.warn('[AiService] All models failed or returned no content. Using fallback.');
        return baseDescription;
    }
}

export const aiService = new AiService();
