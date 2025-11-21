'use client';

import { useEffect, useRef } from 'react';

interface FractalCanvasProps {
    trigger: number;
}

export default function FractalCanvas({ trigger }: FractalCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    // Храним параметры, чтобы они не сбрасывались резко при клике, а менялись плавно
    const paramsRef = useRef({
        cRe: -0.7,
        cIm: 0.27015,
        hueBase: 0,
        targetCRe: -0.7,
        targetCIm: 0.27015
    });

    const WIDTH = 500;
    const HEIGHT = 400;
    const MAX_ITERATIONS = 60; // Оптимизация для FPS

    useEffect(() => {
        // При каждом триггере выбираем новую "цель" для формы фрактала
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.7885;
        paramsRef.current.targetCRe = radius * Math.cos(angle);
        paramsRef.current.targetCIm = radius * Math.sin(angle);
        // Сдвигаем цветовую базу
        paramsRef.current.hueBase = Math.random() * 360;
    }, [trigger]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // alpha: false ускоряет отрисовку
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const imageData = ctx.createImageData(WIDTH, HEIGHT);
        const data = imageData.data;
        const w2 = WIDTH / 2;
        const h2 = HEIGHT / 2;

        const renderFrame = () => {
            const time = Date.now();

            // 1. Логика "Дыхания" (Бесконечный зум туда-сюда)
            // Синус колеблется от -1 до 1. Мы приводим это к диапазону зума [0.8 ... 2.5]
            // Делим время на 3000, чтобы цикл длился около 6-7 секунд
            const zoomPhase = Math.sin(time / 2500);
            const zoom = 1.2 + (zoomPhase * 0.7); // Зум от 0.5 до 1.9

            // 2. Плавная интерполяция параметров формы (Lerp)
            // Фрактал будет плавно перетекать в новую форму при клике
            paramsRef.current.cRe += (paramsRef.current.targetCRe - paramsRef.current.cRe) * 0.05;
            paramsRef.current.cIm += (paramsRef.current.targetCIm - paramsRef.current.cIm) * 0.05;

            const cRe = paramsRef.current.cRe;
            const cIm = paramsRef.current.cIm;

            // Вращение цветов
            const hueAnimation = (time / 50) % 360;

            for (let y = 0; y < HEIGHT; y++) {
                for (let x = 0; x < WIDTH; x++) {
                    let zx = 1.5 * (x - w2) / (0.5 * zoom * WIDTH);
                    let zy = (y - h2) / (0.5 * zoom * HEIGHT);

                    let i = MAX_ITERATIONS;
                    while (zx * zx + zy * zy < 4 && i > 0) {
                        const xtemp = zx * zx - zy * zy + cRe;
                        zy = 2.0 * zx * zy + cIm;
                        zx = xtemp;
                        i--;
                    }

                    const pIndex = (y * WIDTH + x) * 4;

                    if (i > 0) {
                        // Быстрый перевод HSL -> RGB внутри цикла для скорости
                        const t = i / MAX_ITERATIONS;
                        // Цвет зависит от итераций + времени + базового оттенка
                        const h = (hueAnimation + t * 200 + paramsRef.current.hueBase) % 360;
                        const s = 70; // Saturation %
                        const l = t * 100; // Lightness %

                        // Упрощенная конвертация HSL для Canvas (CSS style string медленно, считаем математику)
                        // Но для максимальной скорости и простоты кода здесь применим хитрость:
                        // HSL to RGB формула громоздкая.
                        // Вставим "грязный" хак или воспользуемся упрощенным вариантом.

                        // Вариант "Психодел":
                        data[pIndex] = Math.abs(Math.sin(h * 0.01 + 0)) * 255 * t; // R
                        data[pIndex+1] = Math.abs(Math.sin(h * 0.01 + 2)) * 255 * t; // G
                        data[pIndex+2] = Math.abs(Math.sin(h * 0.01 + 4)) * 255 * t; // B
                        data[pIndex+3] = 255;
                    } else {
                        data[pIndex] = 0;
                        data[pIndex+1] = 0;
                        data[pIndex+2] = 0;
                        data[pIndex+3] = 255;
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            animationRef.current = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [trigger]); // Перезапускаем эффект только если изменился триггер

    return (
        <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="rounded-lg shadow-2xl border border-gray-700 w-full max-w-[500px] h-auto"
        />
    );
}