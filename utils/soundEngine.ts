export class SoundEngine {
    private audioCtx: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private isPlaying: boolean = false;

    public initAudio() {
        if (this.audioCtx || typeof window === 'undefined') return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();

        // Мастер-канал (компрессор, чтобы звуки не оглушали)
        const compressor = this.audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 0.3; // Общая громкость

        this.gainNode.connect(compressor);
        compressor.connect(this.audioCtx.destination);
    }

    public startDrone() {
        if (this.isPlaying || !this.audioCtx || !this.gainNode) return;

        // Глубокий гул (Dark Ambient Drone)
        const freqs = [65.41, 82.41, 98.00]; // Cello range cords

        freqs.forEach((freq, i) => {
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            osc.type = i % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.value = freq;

            // Дрожание звука
            const lfo = this.audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.05 + Math.random() * 0.1;
            const lfoGain = this.audioCtx.createGain();
            lfoGain.gain.value = 2.0;
            lfo.connect(lfoGain.gain);

            const oscGain = this.audioCtx.createGain();
            oscGain.gain.value = 0.15; // Тихий фон

            osc.connect(oscGain);
            oscGain.connect(this.gainNode!); // Подключаем к мастеру
            osc.start();
        });

        this.isPlaying = true;
    }

    // Звук "Глитч-печати"
    public playKeystroke() {
        if (!this.audioCtx || !this.gainNode) return;

        const t = this.audioCtx.currentTime;

        // 1. Металлический щелчок (Square wave)
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        osc.type = 'square';
        // Случайная частота для "роботизированности" (от 800 до 2000 Гц)
        // Это создает эффект "говорения" компьютера
        osc.frequency.setValueAtTime(800 + Math.random() * 1200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.05); // Резкое падение тона

        oscGain.gain.setValueAtTime(0.05, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(oscGain);
        oscGain.connect(this.gainNode);
        osc.start(t);
        osc.stop(t + 0.06);

        // 2. Шум (Механика клавиш)
        const bufferSize = this.audioCtx.sampleRate * 0.05; // 0.05 сек
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // Белый шум
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Фильтр, чтобы шум был глухим (Highpass)
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.05, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.gainNode);

        noise.start(t);
    }
}

export const soundManager = new SoundEngine();