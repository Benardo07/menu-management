import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/api';

type Params = {
  params: { id: string };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const url = new URL(request.url);
    const depth = url.searchParams.get('depth');
    const suffix = depth ? `?depth=${depth}` : '';
    const { status, payload } = await proxyToBackend(`/menus/${params.id}${suffix}`);
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch menu', details: String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const { status, payload } = await proxyToBackend(`/menus/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update menu', details: String(error) },
      { status: 500 },
    );
  }
}
