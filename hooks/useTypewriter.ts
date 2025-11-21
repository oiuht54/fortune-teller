import { useState, useEffect, useRef } from 'react';

export const useTypewriter = (text: string, speed: number = 30, onCharTyped?: () => void) => {
    const [displayedText, setDisplayedText] = useState('');
    // Используем ref, чтобы хранить актуальную версию функции обратного вызова
    const onCharTypedRef = useRef(onCharTyped);

    useEffect(() => {
        onCharTypedRef.current = onCharTyped;
    }, [onCharTyped]);

    useEffect(() => {
        setDisplayedText('');
        let index = 0;

        // Если текста нет, ничего не делаем
        if (!text) return;

        const intervalId = setInterval(() => {
            index++;
            setDisplayedText(text.slice(0, index));

            // Вызываем звуковой триггер
            if (onCharTypedRef.current) {
                onCharTypedRef.current();
            }

            if (index >= text.length) {
                clearInterval(intervalId);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return displayedText;
};