import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dataDirectory = path.join(process.cwd(), 'public', 'data');

        if (!fs.existsSync(dataDirectory)) {
            return NextResponse.json({ files: [] });
        }

        const fileNames = fs.readdirSync(dataDirectory);

        const txtFiles = fileNames
            .filter((file) => file.endsWith('.txt'))
            .map((file) => `/data/${file}`);

        return NextResponse.json({ files: txtFiles });
    } catch (error) {
        console.error('Ошибка при чтении папки данных:', error);
        return NextResponse.json({ error: 'Failed to read data directory' }, { status: 500 });
    }
}