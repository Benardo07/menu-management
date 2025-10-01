import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/api';

type Params = {
  params: { id: string; itemId: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const { status, payload } = await proxyToBackend(`/menus/${params.id}/items/${params.itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update menu item', details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { status, payload } = await proxyToBackend(`/menus/${params.id}/items/${params.itemId}`, {
      method: 'DELETE',
    });
    return NextResponse.json(payload, { status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete menu item', details: String(error) },
      { status: 500 },
    );
  }
}
