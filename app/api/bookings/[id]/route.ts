import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth';

const prisma = new PrismaClient();

// PUT /api/bookings/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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