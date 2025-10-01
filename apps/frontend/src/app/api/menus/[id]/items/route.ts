import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/api';

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const { status, payload } = await proxyToBackend(`/menus/${params.id}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create menu item', details: String(error) },
      { status: 500 },
    );
  }
}
