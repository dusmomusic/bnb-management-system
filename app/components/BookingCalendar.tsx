import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Property, Unit, Booking } from '@prisma/client';

// Definisci un tipo per l'utente con la proprietà role
type UserWithRole = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

// Definisci un tipo per la sessione con l'utente esteso
type SessionWithUser = {
  user?: UserWithRole;
  expires: string;
};

// Estendi DateSelectArg per includere la proprietà resource
interface ExtendedDateSelectArg extends DateSelectArg {
  resource?: {
    id: string;
  };
}

interface BookingWithUnitAndGuest extends Booking {
  unit: Unit;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface BookingCalendarProps {
  properties: Property[];
}

export default function BookingCalendar({ properties }: BookingCalendarProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<BookingWithUnitAndGuest[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const calendarRef = useRef<FullCalendar | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Cast della sessione al tipo personalizzato
  const typedSession = session as SessionWithUser | null;
  
  // Funzione helper per verificare il ruolo dell'utente
  const isViewer = (): boolean => {
    return typedSession?.user?.role === 'VIEWER';
  };

  // Carica le unità quando cambia la proprietà selezionata
  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty);
      fetchBookings(selectedProperty);
    }
  }, [selectedProperty]);

  // Converte le prenotazioni in eventi per il calendario
  useEffect(() => {
    const newEvents = bookings.map(booking => ({
      id: booking.id,
      title: `${booking.guest.firstName} ${booking.guest.lastName}`,
      start: booking.startDate,
      end: booking.endDate,
      resourceId: booking.unitId,
      extendedProps: {
        unitName: booking.unit.name,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        price: booking.price,
        source: booking.source,
        notes: booking.notes
      },
      backgroundColor: getBookingColor(booking.source || ''),
      borderColor: getBookingColor(booking.source || '')
    }));

    setEvents(newEvents);
  }, [bookings]);

  // Recupera le unità per la proprietà selezionata
  const fetchUnits = async (propertyId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/units?propertyId=${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Recupera le prenotazioni per la proprietà selezionata
  const fetchBookings = async (propertyId: string) => {
    try {
      setIsLoading(true);
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
      
      const response = await fetch(
        `/api/bookings?propertyId=${propertyId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce la selezione di un intervallo di date
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (isViewer()) {
      alert('Non hai i permessi per creare prenotazioni');
      return;
    }

    // Cast a ExtendedDateSelectArg per accedere alla proprietà resource
    const extendedSelectInfo = selectInfo as ExtendedDateSelectArg;
    const resourceId = extendedSelectInfo.resource?.id;
    
    if (!resourceId) return;

    router.push(
      `/bookings/new?unitId=${resourceId}&startDate=${selectInfo.startStr}&endDate=${selectInfo.endStr}`
    );
  };

  // Gestisce il click su un evento
  const handleEventClick = (clickInfo: EventClickArg) => {
    router.push(`/bookings/${clickInfo.event.id}`);
  };

  // Gestisce lo spostamento di un evento
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    if (isViewer()) {
      alert('Non hai i permessi per modificare prenotazioni');
      dropInfo.revert();
      return;
    }

    const bookingId = dropInfo.event.id;
    const unitId = dropInfo.event.getResources()[0].id;
    const startDate = dropInfo.event.start;
    const endDate = dropInfo.event.end;

    if (!bookingId || !unitId || !startDate || !endDate) {
      dropInfo.revert();
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitId,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
        dropInfo.revert();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Si è verificato un errore durante l\'aggiornamento della prenotazione');
      dropInfo.revert();
    }
  };

  // Restituisce un colore in base alla fonte della prenotazione
  const getBookingColor = (source: string): string => {
    switch (source.toLowerCase()) {
      case 'booking.com':
        return '#0077CC';
      case 'airbnb':
        return '#FF5A5F';
      case 'expedia':
        return '#00355F';
      case 'diretto':
        return '#28A745';
      default:
        return '#6C757D';
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="w-full md:w-1/3">
          <label htmlFor="property" className="block text-sm font-medium text-gray-700">
            Proprietà
          </label>
          <select
            id="property"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Seleziona una proprietà</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-4 h-[800px]">
          {selectedProperty ? (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="resourceTimelineMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
              }}
              resources={units.map(unit => ({
                id: unit.id,
                title: unit.name
              }))}
              events={events}
              editable={!isViewer()}
              selectable={!isViewer()}
              selectMirror={true}
              dayMaxEvents={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              height="100%"
              allDaySlot={false}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Seleziona una proprietà per visualizzare il calendario</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 