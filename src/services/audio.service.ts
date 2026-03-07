import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

// All sound assets must use require() for Expo bundler
const SFX = {
    // Screen transitions
    scannerOpen: require('../../assets/sfx/power_up_01.ogg'),
    discoveryOpen: require('../../assets/sfx/power_up_02.ogg'),

    // Scanning loop sounds (randomly selected)
    scanLoop: [
        require('../../assets/sfx/power_up_03.ogg'),
        require('../../assets/sfx/retro_coin_02.ogg'),
    ],

    // NFT click sounds (randomly selected)
    nftClick: [
        require('../../assets/sfx/power_up_04.ogg'),
        require('../../assets/sfx/power_up_05.ogg'),
        require('../../assets/sfx/Slide_Electronic_02.mp3'),
        require('../../assets/sfx/power_up_06.ogg'),
    ],

    // Error sound
    error: require('../../assets/sfx/synth_beep_02.ogg'),

    // Connect wallet (MWA)
    connectWallet: require('../../assets/sfx/Slide_Electronic_00.mp3'),

    // Scan wallet button
    scanWallet: require('../../assets/sfx/Slide_Electronic_01.mp3'),

    // Generic button clicks (randomly selected)
    buttonClick: [
        require('../../assets/sfx/Click_Electronic_00.mp3'),
        require('../../assets/sfx/Click_Electronic_04.mp3'),
        require('../../assets/sfx/Click_Electronic_07.mp3'),
        require('../../assets/sfx/Click_Electronic_09.mp3'),
        require('../../assets/sfx/Click_Standard_04.mp3'),
        require('../../assets/sfx/Click_Standard_05.mp3'),
    ],

    // Victory sting for rare+ NFTs
    victory: require('../../assets/sfx/retro_misc_01.ogg'),

    // Market tab coin
    coin: require('../../assets/sfx/coin.flac'),
};

const MUSIC_TRACKS = [
    { name: 'Rounded Hills', source: require('../../assets/music/rounded_hills.mp3') },
    { name: 'Keep Your Dream Alive', source: require('../../assets/music/Keep your dream alive! seamless.ogg') },
    { name: 'Oldskool', source: require('../../assets/music/Of Far Different Nature - Oldskool [v2] (CC-BY 4.0).ogg') },
    { name: 'BK Loop', source: require('../../assets/music/bkloop.mp3') },
    { name: 'Disconnected', source: require('../../assets/music/disconnected.ogg') },
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

class AudioService {
    private currentSfx: Sound | null = null;
    private scanLoopSound: Sound | null = null;
    private musicSound: Sound | null = null;
    private currentTrackIndex: number = 0;
    private musicPlaying: boolean = false;
    private initialized: boolean = false;

    async init() {
        if (this.initialized) return;
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
            this.initialized = true;
        } catch (e) {
            console.warn('[AudioService] Init failed:', e);
        }
    }

    private async playSound(source: any, volume: number = 0.5): Promise<Sound | null> {
        try {
            await this.init();
            const { sound } = await Audio.Sound.createAsync(source, { volume, shouldPlay: true });
            // Auto-unload when done
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync().catch(() => { });
                }
            });
            return sound;
        } catch (e) {
            console.warn('[AudioService] Play failed:', e);
            return null;
        }
    }

    // === SFX Methods ===

    async playScannerOpen() {
        await this.playSound(SFX.scannerOpen, 0.4);
    }

    async playDiscoveryOpen() {
        await this.playSound(SFX.discoveryOpen, 0.4);
    }

    async startScanLoop() {
        await this.stopScanLoop();
        const source = pickRandom(SFX.scanLoop);
        try {
            await this.init();
            const { sound } = await Audio.Sound.createAsync(source, {
                volume: 0.3,
                shouldPlay: true,
                isLooping: true,
            });
            this.scanLoopSound = sound;
        } catch (e) {
            console.warn('[AudioService] Scan loop failed:', e);
        }
    }

    async stopScanLoop() {
        if (this.scanLoopSound) {
            try {
                await this.scanLoopSound.stopAsync();
                await this.scanLoopSound.unloadAsync();
            } catch (e) { }
            this.scanLoopSound = null;
        }
    }

    async playNftClick() {
        await this.playSound(pickRandom(SFX.nftClick), 0.4);
    }

    async playError() {
        await this.playSound(SFX.error, 0.5);
    }

    async playConnectWallet() {
        await this.playSound(SFX.connectWallet, 0.4);
    }

    async playScanWallet() {
        await this.playSound(SFX.scanWallet, 0.4);
    }

    async playButtonClick() {
        await this.playSound(pickRandom(SFX.buttonClick), 0.3);
    }

    async playVictory() {
        await this.playSound(SFX.victory, 0.5);
    }

    async playCoin() {
        await this.playSound(SFX.coin, 0.4);
    }

    // === Music Methods ===

    getCurrentTrackName(): string {
        return MUSIC_TRACKS[this.currentTrackIndex].name;
    }

    isMusicPlaying(): boolean {
        return this.musicPlaying;
    }

    async startMusic() {
        await this.stopMusic();
        try {
            await this.init();
            const track = MUSIC_TRACKS[this.currentTrackIndex];
            const { sound } = await Audio.Sound.createAsync(track.source, {
                volume: 0.2,
                shouldPlay: true,
                isLooping: true,
            });
            this.musicSound = sound;
            this.musicPlaying = true;
        } catch (e) {
            console.warn('[AudioService] Music start failed:', e);
        }
    }

    async stopMusic() {
        if (this.musicSound) {
            try {
                await this.musicSound.stopAsync();
                await this.musicSound.unloadAsync();
            } catch (e) { }
            this.musicSound = null;
            this.musicPlaying = false;
        }
    }

    async nextTrack(): Promise<string> {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % MUSIC_TRACKS.length;
        if (this.musicPlaying) {
            await this.startMusic();
        }
        return this.getCurrentTrackName();
    }

    async toggleMusic(): Promise<boolean> {
        if (this.musicPlaying) {
            await this.stopMusic();
            return false;
        } else {
            await this.startMusic();
            return true;
        }
    }
}

export const audioService = new AudioService();
