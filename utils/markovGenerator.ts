interface MarkovChain {
    [key: string]: string[];
}

export class TextOracle {
    private chain: MarkovChain = {};
    private startKeys: string[] = []; // Храним стартовые ПАРЫ слов
    private readonly PUNCTUATION_REGEX = /[«»""()—–-]/g; // Убрали точки из очистки, они важны для структуры
    public isReady: boolean = false;

    // Размер контекста (сколько слов помним назад).
    // 2 - оптимально для одной книги. 3 - для большой библиотеки.
    private readonly STATE_SIZE = 2;

    // Очистка слова для формирования ключа (приводим к нижнему регистру)
    private normalize(word: string): string {
        return word.replace(this.PUNCTUATION_REGEX, '').toLowerCase();
    }

    // Создание ключа из массива слов (например ["Как", "говорил"] -> "как говорил")
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
            this.train("Судьба молчит. Попробуй позже."); // Фолбек
            this.isReady = true;
        }
    }

    private train(text: string): void {
        // Более умная разбивка на слова, сохраняя знаки препинания приклеенными к словам
        const cleanText = text.replace(/\s+/g, ' ').trim();
        const words = cleanText.split(' ').filter(w => w.length > 0);

        // Проходимся по тексту окном размером STATE_SIZE + 1
        // Если STATE_SIZE = 2, берем слова [0, 1] как ключ, и [2] как значение
        for (let i = 0; i < words.length - this.STATE_SIZE; i++) {

            // Формируем текущее состояние (контекст)
            const context = words.slice(i, i + this.STATE_SIZE);
            const nextWord = words[i + this.STATE_SIZE];

            const key = this.makeKey(context);

            // Логика поиска начал предложений
            // Если это самое начало текста ИЛИ предыдущее слово (перед окном) было концом предложения
            const prevWordIndex = i - 1;
            const isStartOfText = i === 0;
            let isSentenceStart = isStartOfText;

            if (!isStartOfText) {
                const prevWord = words[prevWordIndex];
                if (/[.!?]$/.test(prevWord)) {
                    isSentenceStart = true;
                }
            }

            // Если это начало предложения и первое слово с большой буквы — запоминаем эту пару как стартовую
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

        // 1. Выбираем случайное начало (ключ из 2 слов)
        let currentKey = this.startKeys[Math.floor(Math.random() * this.startKeys.length)];

        // Исправлено: используем const, так как ссылка на массив не меняется
        const output = currentKey.split(' ');

        // Делаем первую букву заглавной
        output[0] = output[0].charAt(0).toUpperCase() + output[0].slice(1);

        let count = this.STATE_SIZE;

        while (count < maxLength) {
            const possibilities = this.chain[currentKey];

            // Тупик — нет продолжения
            if (!possibilities || possibilities.length === 0) break;

            // Выбираем следующее слово
            const nextWord = possibilities[Math.floor(Math.random() * possibilities.length)];
            output.push(nextWord);

            // Сдвигаем окно: убираем первое слово, добавляем новое, чтобы получить новый ключ
            const newContext = output.slice(output.length - this.STATE_SIZE, output.length);
            currentKey = this.makeKey(newContext);

            count++;

            // Проверка на конец предложения
            if (count > minLength && /[.!?]$/.test(nextWord)) {
                break;
            }
        }

        let result = output.join(' ');

        // Косметическая правка пунктуации (убираем пробелы перед точками, если вдруг возникли)
        result = result.replace(/\s+([.,!?;:])/g, '$1');

        if (!/[.!?]$/.test(result)) result += '.';

        return result;
    }
}