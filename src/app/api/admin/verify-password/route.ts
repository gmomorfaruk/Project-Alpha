import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PANEL_PASSWORD || 'supersecretadminpass123!';

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
