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

        const prompt = `You are a highly advanced Pokedex from the year 2099. Analyze this holographic NFT "${name}". 
    Specs: ${rarity} class, ${type1}${type2 ? '/' + type2 : ''} protocol. 
    Bio-data: ${baseDescription}.
    Provide a factual yet mystical 1-2 sentence description that reveals something specific about its traits or elemental nature. 
    Be immersive and avoid generic filler.`;

        const payload = {
            model: 'llama3-8b-8192', // Using a standard Groq model name
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 100,
        };

        try {
            console.log(`[AiService] Requesting AI description for: ${name}`);
            console.log(`[AiService] API Key check: ${GROQ_API_KEY ? `PRESENT (len: ${GROQ_API_KEY.length})` : 'MISSING'}`);
            console.log(`[AiService] Payload: ${JSON.stringify(payload)}`);

            const response = await fetch(this.GROQ_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log(`[AiService] Response Status: ${response.status} ${response.statusText}`);

            const data = await response.json();
            console.log(`[AiService] Response Data: ${JSON.stringify(data)}`);

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status} ${JSON.stringify(data)}`);
            }

            const generatedDesc = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');

            if (!generatedDesc) {
                console.warn('[AiService] No content in AI response');
                return baseDescription;
            }

            console.log(`[AiService] Successfully generated description: ${generatedDesc.substring(0, 30)}...`);

            await AsyncStorage.setItem(cacheKey, JSON.stringify({
                description: generatedDesc,
                timestamp: Date.now()
            }));

            return generatedDesc;
        } catch (e: any) {
            console.error('[AiService] API error details:', e.message || e);
            return baseDescription;
        }
    }
}

export const aiService = new AiService();
