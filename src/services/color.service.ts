import { PokemonType } from '../types';
import { COLORS } from '../constants/colors';

// Simple color distance calculation to find the closest Pokemon type color
const getColorDistance = (c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }) => {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

export class ColorService {
    private typeColorMap: Record<string, { r: number, g: number, b: number }>;

    constructor() {
        this.typeColorMap = {
            fire: hexToRgb(COLORS.fire),
            water: hexToRgb(COLORS.water),
            grass: hexToRgb(COLORS.grass),
            electric: hexToRgb(COLORS.electric),
            psychic: hexToRgb(COLORS.psychic),
            ghost: hexToRgb(COLORS.ghost),
            dragon: hexToRgb(COLORS.dragon),
            dark: hexToRgb(COLORS.dark),
            steel: hexToRgb(COLORS.steel),
            normal: hexToRgb(COLORS.normal),
        };
    }

    /**
     * Maps a raw hex color to the nearest PokemonType
     */
    public mapColorToType(hex: string): PokemonType {
        const rgb = hexToRgb(hex);
        let minDistance = Infinity;
        let closestType: PokemonType = 'normal';

        for (const [type, typeRgb] of Object.entries(this.typeColorMap)) {
            const distance = getColorDistance(rgb, typeRgb);
            if (distance < minDistance) {
                minDistance = distance;
                closestType = type as PokemonType;
            }
        }

        return closestType;
    }

    /**
     * This is a placeholder since real image sampling in React Native 
     * usually requires native modules or a WebView canvas.
     * For now, we'll return a random color or one derived from the URI string
     * until a more complex WebView bridge is requested.
     */
    public async getDominantColor(uri: string): Promise<string> {
        // Deterministic "dominant" color based on filename for now
        const hash = uri.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const r = (hash * 123) % 255;
        const g = (hash * 456) % 255;
        const b = (hash * 789) % 255;

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

export const colorService = new ColorService();
