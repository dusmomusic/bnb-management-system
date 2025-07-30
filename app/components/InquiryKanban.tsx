import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Inquiry, InquiryStatus, Contact } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface InquiryWithContact extends Inquiry {
  contact: Contact;
}

export default function InquiryKanban() {
  const [inquiries, setInquiries] = useState<InquiryWithContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [draggedInquiry, setDraggedInquiry] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/inquiries');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (inquiryId: string) => {
    if (session?.user?.role === 'VIEWER') return;
    setDraggedInquiry(inquiryId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: InquiryStatus) => {
    e.preventDefault();
    if (!draggedInquiry || session?.user?.role === 'VIEWER') return;

    const inquiry = inquiries.find(i => i.id === draggedInquiry);
    if (!inquiry || inquiry.status === status) return;

    try {
      const response = await fetch(`/api/inquiries/${draggedInquiry}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status
        }),
      });

      if (response.ok) {
        setInquiries(inquiries.map(i => {
          if (i.id === draggedInquiry) {
            return { ...i, status };
          }
          return i;
        }));
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      alert('Si è verificato un errore durante l\'aggiornamento dello stato della richiesta');
    } finally {
      setDraggedInquiry(null);
    }
  };

  const handleConvertToBooking = (inquiry: InquiryWithContact) => {
    router.push(`/bookings/new?contactId=${inquiry.contactId}&inquiryId=${inquiry.id}`);
  };

  const getInquiriesByStatus = (status: InquiryStatus) => {
    return inquiries.filter(inquiry => inquiry.status === status);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Richieste</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonna Nuove */}
          <div
            className="bg-white shadow rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, InquiryStatus.NEW)}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Nuove
              <span className="ml-2 text-sm text-gray-500">
                ({getInquiriesByStatus(InquiryStatus.NEW).length})
              </span>
            </h3>
            <div className="space-y-3">
              {getInquiriesByStatus(InquiryStatus.NEW).length === 0 ? (
                <p className="text-gray-500 text-sm">Nessuna richiesta nuova</p>
              ) : (
                getInquiriesByStatus(InquiryStatus.NEW).map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-move"
                    draggable={session?.user?.role !== 'VIEWER'}
                    onDragStart={() => handleDragStart(inquiry.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">{inquiry.subject}</h4>
                      <span className="text-xs text-gray-500">{formatDate(inquiry.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{inquiry.message}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-gray-500">
                        {inquiry.contact.firstName} {inquiry.contact.lastName}
                      </span>
                      {session?.user?.role !== 'VIEWER' && (
                        <button
                          onClick={() => handleConvertToBooking(inquiry)}
                          className="ml-auto text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          Converti in prenotazione
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonna In Lavorazione */}
          <div
            className="bg-white shadow rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, InquiryStatus.IN_PROGRESS)}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              In Lavorazione
              <span className="ml-2 text-sm text-gray-500">
                ({getInquiriesByStatus(InquiryStatus.IN_PROGRESS).length})
              </span>
            </h3>
            <div className="space-y-3">
              {getInquiriesByStatus(InquiryStatus.IN_PROGRESS).length === 0 ? (
                <p className="text-gray-500 text-sm">Nessuna richiesta in lavorazione</p>
              ) : (
                getInquiriesByStatus(InquiryStatus.IN_PROGRESS).map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-move"
                    draggable={session?.user?.role !== 'VIEWER'}
                    onDragStart={() => handleDragStart(inquiry.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">{inquiry.subject}</h4>
                      <span className="text-xs text-gray-500">{formatDate(inquiry.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{inquiry.message}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-gray-500">
                        {inquiry.contact.firstName} {inquiry.contact.lastName}
                      </span>
                      {session?.user?.role !== 'VIEWER' && (
                        <button
                          onClick={() => handleConvertToBooking(inquiry)}
                          className="ml-auto text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          Converti in prenotazione
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonna Chiuse */}
          <div
            className="bg-white shadow rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, InquiryStatus.CLOSED)}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Chiuse
              <span className="ml-2 text-sm text-gray-500">
                ({getInquiriesByStatus(InquiryStatus.CLOSED).length})
              </span>
            </h3>
            <div className="space-y-3">
              {getInquiriesByStatus(InquiryStatus.CLOSED).length === 0 ? (
                <p className="text-gray-500 text-sm">Nessuna richiesta chiusa</p>
              ) : (
                getInquiriesByStatus(InquiryStatus.CLOSED).map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white border border-gray-200 rounded-md p-3 shadow-sm cursor-move"
                    draggable={session?.user?.role !== 'VIEWER'}
                    onDragStart={() => handleDragStart(inquiry.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">{inquiry.subject}</h4>
                      <span className="text-xs text-gray-500">{formatDate(inquiry.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{inquiry.message}</p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        {inquiry.contact.firstName} {inquiry.contact.lastName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 