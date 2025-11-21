import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Определяем путь к папке public/data
        const dataDirectory = path.join(process.cwd(), 'public', 'data');

        // Проверяем, существует ли папка
        if (!fs.existsSync(dataDirectory)) {
            return NextResponse.json({ files: [] });
        }

        // Читаем содержимое папки
        const fileNames = fs.readdirSync(dataDirectory);

        // Фильтруем только .txt файлы и создаем публичные пути (URL)
        const txtFiles = fileNames
            .filter((file) => file.endsWith('.txt'))
            .map((file) => `/data/${file}`);

        return NextResponse.json({ files: txtFiles });
    } catch (error) {
        console.error('Ошибка при чтении папки данных:', error);
        return NextResponse.json({ error: 'Failed to read data directory' }, { status: 500 });
    }
}