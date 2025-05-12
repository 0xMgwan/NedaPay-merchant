import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all payment links for a merchant (by merchantId query param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId');
  if (!merchantId) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const links = await prisma.paymentLink.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(links);
}

// POST: Create a new payment link
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { merchantId, url, amount, currency, description, status } = data;
  if (!merchantId || !url || !amount || !currency || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const newLink = await prisma.paymentLink.create({
    data: {
      merchantId,
      url,
      amount,
      currency,
      description,
      status,
    },
  });
  return NextResponse.json(newLink, { status: 201 });
}
