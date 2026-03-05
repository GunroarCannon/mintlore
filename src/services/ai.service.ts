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

        await this.waitRateLimit();

        const prompt = `You are a Pokedex from the future. Write a short, punchy, and cool flavor description (2 sentences max) for an NFT named "${name}". 
    It is a ${rarity} rarity ${type1}${type2 ? '/' + type2 : ''} type creature. 
    Original data: ${baseDescription}.
    Make it sound legendary if it's legendary, and consistent with its elemental types.`;

        try {
            console.log(`[AiService] Generating AI description for ${name}...`);
            const response = await fetch(this.GROQ_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 100,
                }),
            });

            const data = await response.json();
            const generatedDesc = data.choices[0].message.content.trim().replace(/^"|"$/g, '');

            await AsyncStorage.setItem(cacheKey, JSON.stringify({
                description: generatedDesc,
                timestamp: Date.now()
            }));

            return generatedDesc;
        } catch (e) {
            console.error('[AiService] API error:', e);
            return baseDescription;
        }
    }
}

export const aiService = new AiService();
