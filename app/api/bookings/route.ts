import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/bookings
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const unitId = searchParams.get('unitId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    if (propertyId) {
      where.unit = {
        propertyId
      };
    }
    
    if (unitId) {
      where.unitId = unitId;
    }
    
    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } }
          ]
        }
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        unit: true,
        guest: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Errore durante il recupero delle prenotazioni' }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const data = await request.json();
    
    // Verifica che non ci siano sovrapposizioni
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        unitId: data.unitId,
        OR: [
          {
            startDate: {
              lte: new Date(data.endDate)
            },
            endDate: {
              gte: new Date(data.startDate)
            }
          }
        ]
      }
    });

    if (overlappingBooking) {
      return NextResponse.json({ error: 'Esiste già una prenotazione per questo periodo' }, { status: 409 });
    }

    const booking = await prisma.booking.create({
      data: {
        unitId: data.unitId,
        guestId: data.guestId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        price: data.price,
        source: data.source,
        notes: data.notes
      },
      include: {
        unit: true,
        guest: true
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Errore durante la creazione della prenotazione' }, { status: 500 });
  }
}

// PUT /api/bookings/:id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const data = await request.json();
    const id = params.id;

    // Verifica che non ci siano sovrapposizioni con altre prenotazioni
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        unitId: data.unitId,
        id: { not: id },
        OR: [
          {
            startDate: {
              lte: new Date(data.endDate)
            },
            endDate: {
              gte: new Date(data.startDate)
            }
          }
        ]
      }
    });

    if (overlappingBooking) {
      return NextResponse.json({ error: 'Esiste già una prenotazione per questo periodo' }, { status: 409 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        unitId: data.unitId,
        guestId: data.guestId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        price: data.price,
        source: data.source,
        notes: data.notes
      },
      include: {
        unit: true,
        guest: true
      }
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Errore durante l\'aggiornamento della prenotazione' }, { status: 500 });
  }
}

// DELETE /api/bookings/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const id = params.id;
    
    await prisma.booking.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Errore durante l\'eliminazione della prenotazione' }, { status: 500 });
  }
} 