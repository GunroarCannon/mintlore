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

    // Rarity-specific clicks
    rare: require('../../assets/sfx/synth_beep_01.ogg'),
    epic: require('../../assets/sfx/synth_beep_03.ogg'),
    legendary: require('../../assets/sfx/retro_misc_01.ogg'),

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
    private isMusicLoading: boolean = false;
    private initialized: boolean = false;

    async init() {
        if (this.initialized) return;
        try {
            console.log('[AudioService] Initializing audio mode...');
            if (!Audio || !Audio.setAudioModeAsync) {
                console.error('[AudioService] Expo AV module not found!');
                return;
            }
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
                interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
            });
            this.initialized = true;
            console.log('[AudioService] Initialization successful.');
        } catch (e) {
            console.warn('[AudioService] Init failed:', e);
        }
    }

    async resumeMusic() {
        if (this.musicSound && this.musicPlaying) {
            try {
                const status = await this.musicSound.getStatusAsync();
                if (status.isLoaded && !status.isPlaying) {
                    await this.musicSound.playAsync();
                }
            } catch (e) {
                console.warn('[AudioService] Resume music failed:', e);
            }
        }
    }

    async pauseMusic() {
        if (this.musicSound && this.musicPlaying) {
            try {
                const status = await this.musicSound.getStatusAsync();
                if (status.isLoaded && status.isPlaying) {
                    await this.musicSound.pauseAsync();
                }
            } catch (e) {
                console.warn('[AudioService] Pause music failed:', e);
            }
        }
    }

    private async playSound(source: any, volume: number = 0.5): Promise<Sound | null> {
        try {
            await this.init();
            if (!this.initialized) return null;

            console.log('[AudioService] Creating sound for source:', typeof source === 'number' ? 'ResId ' + source : 'URI');
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
            if (!this.initialized) return;

            console.log('[AudioService] Starting scan loop...');
            const { sound } = await Audio.Sound.createAsync(source, {
                volume: 0.6,
                shouldPlay: true,
                isLooping: true,
            });
            await sound.playAsync();
            this.scanLoopSound = sound;
            console.log('[AudioService] Scan loop playing.');
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

    async playRarityClick(rarity: string) {
        const r = rarity.toLowerCase();
        if (r === 'legendary') await this.playSound(SFX.legendary, 0.6);
        else if (r === 'epic') await this.playSound(SFX.epic, 0.5);
        else if (r === 'rare') await this.playSound(SFX.rare, 0.5);
        else await this.playButtonClick();
    }

    async playVictory() {
        await this.playSound(SFX.victory, 0.5);
    }

    async playCoin() {
        await this.playSound(SFX.coin, 0.8);
    }

    // === Music Methods ===

    getCurrentTrackName(): string {
        return MUSIC_TRACKS[this.currentTrackIndex].name;
    }

    isMusicPlaying(): boolean {
        return this.musicPlaying;
    }

    async startMusic() {
        if (this.isMusicLoading) {
            console.log('[AudioService] Music already loading, skipping...');
            return;
        }

        console.log('[AudioService] Starting music sequence...');
        await this.stopMusic();
        this.isMusicLoading = true;

        try {
            await this.init();
            if (!this.initialized) {
                console.error('[AudioService] Not initialized, cannot start music.');
                this.isMusicLoading = false;
                return;
            }

            const track = MUSIC_TRACKS[this.currentTrackIndex];
            console.log('[AudioService] Loading track:', track.name);

            const { sound } = await Audio.Sound.createAsync(
                track.source,
                { volume: 0.8, shouldPlay: false, isLooping: true }
            );

            // Re-check if we were stopped while loading
            if (!this.isMusicLoading) {
                console.log('[AudioService] Stop called during load, unloading.');
                await sound.unloadAsync().catch(() => { });
                return;
            }

            console.log('[AudioService] Playback starting...');
            await sound.playAsync();
            this.musicSound = sound;
            this.musicPlaying = true;
            console.log('[AudioService] Music playing successfully.');
        } catch (e) {
            console.warn('[AudioService] Music start failed:', e);
        } finally {
            this.isMusicLoading = false;
        }
    }

    async stopMusic() {
        this.isMusicLoading = false;
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
