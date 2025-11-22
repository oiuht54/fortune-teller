interface MarkovChain {
    [key: string]: string[];
}

export class TextOracle {
    private chain: MarkovChain = {};
    private startKeys: string[] = [];
    private readonly PUNCTUATION_REGEX = /[«»""()—–-]/g;
    public isReady: boolean = false;

    private readonly STATE_SIZE = 2;

    private normalize(word: string): string {
        return word.replace(this.PUNCTUATION_REGEX, '').toLowerCase();
    }

    private makeKey(words: string[]): string {
        return words.map(w => this.normalize(w)).join(' ');
    }

    public async loadLibrary(filePaths: string[]): Promise<void> {
        try {
            const promises = filePaths.map(path => fetch(path).then(res => res.text()));
            const texts = await Promise.all(promises);
            const fullText = texts.join(' ');
            this.train(fullText);
            this.isReady = true;
        } catch (error) {
            console.error("Ошибка при загрузке книг:", error);
            this.train("Судьба молчит. Попробуй позже.");
            this.isReady = true;
        }
    }

    private train(text: string): void {
        const cleanText = text.replace(/\s+/g, ' ').trim();
        const words = cleanText.split(' ').filter(w => w.length > 0);

        for (let i = 0; i < words.length - this.STATE_SIZE; i++) {

            const context = words.slice(i, i + this.STATE_SIZE);
            const nextWord = words[i + this.STATE_SIZE];

            const key = this.makeKey(context);

            const prevWordIndex = i - 1;
            const isStartOfText = i === 0;
            let isSentenceStart = isStartOfText;

            if (!isStartOfText) {
                const prevWord = words[prevWordIndex];
                if (/[.!?]$/.test(prevWord)) {
                    isSentenceStart = true;
                }
            }

            if (isSentenceStart && /^[A-ZА-Я]/.test(context[0])) {
                this.startKeys.push(key);
            }

            if (!this.chain[key]) {
                this.chain[key] = [];
            }
            this.chain[key].push(nextWord);
        }
    }

    public generatePrediction(minLength: number = 5, maxLength: number = 40): string {
        if (!this.isReady || this.startKeys.length === 0) return "Загрузка мудрости...";

        let currentKey = this.startKeys[Math.floor(Math.random() * this.startKeys.length)];

        const output = currentKey.split(' ');

        output[0] = output[0].charAt(0).toUpperCase() + output[0].slice(1);

        let count = this.STATE_SIZE;

        while (count < maxLength) {
            const possibilities = this.chain[currentKey];

            if (!possibilities || possibilities.length === 0) break;

            const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
            output.push(nextWord);

            const newContext = output.slice(output.length - this.STATE_SIZE, output.length);
            currentKey = this.makeKey(newContext);

            count++;

            if (count > minLength && /[.!?]$/.test(nextWord)) {
                break;
            }
        }

        let result = output.join(' ');

        result = result.replace(/\s+([.,!?;:])/g, '$1');

        if (!/[.!?]$/.test(result)) result += '.';

        return result;
    }
}