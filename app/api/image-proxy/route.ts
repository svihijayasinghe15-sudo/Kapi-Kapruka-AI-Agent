import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = ['partnercentral.kapruka.com', 'www.kapruka.com', 'kapruka.com'];

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    if (!ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
        return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
    }

    try {
        const response = await fetch(url, {
            headers: { Accept: 'image/*' },
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Image fetch failed' }, { status: response.status });
        }

        const contentType = response.headers.get('content-type') ?? 'image/jpeg';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
    }
}
