import { getBackendToken } from '@/lib/server-token';
import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const token = await getBackendToken();
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to create API token' },
      { status: 401 },
    );
  }
}
