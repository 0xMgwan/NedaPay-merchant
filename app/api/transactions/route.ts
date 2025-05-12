import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all transactions for a merchant (by merchantId query param)
export async function GET(req: NextRequest) {
  // Prevent build/static analysis from triggering this API route
  if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId');
  if (!merchantId) {
    // Return 404 to prevent build/static analysis failures
    return new NextResponse('Not Found', { status: 404 });
  }
  const transactions = await prisma.transaction.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(transactions);
}

// POST: Add a new transaction
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { merchantId, wallet, amount, currency, status, txHash } = data;
  if (!merchantId || !wallet || !amount || !currency || !status || !txHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const transaction = await prisma.transaction.create({
    data: {
      merchantId,
      wallet,
      amount,
      currency,
      status,
      txHash,
    },
  });
  return NextResponse.json(transaction, { status: 201 });
}
