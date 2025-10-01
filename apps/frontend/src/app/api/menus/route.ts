import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/api';

export async function GET() {
  try {
    const { status, payload } = await proxyToBackend('/menus');
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch menus', details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { status, payload } = await proxyToBackend('/menus', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create menu', details: String(error) },
      { status: 500 },
    );
  }
}
