import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Property, Unit, UnitType } from '@prisma/client';

interface PropertyWithUnits extends Property {
  units: Unit[];
}

export default function PropertyManager() {
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingProperty, setIsAddingProperty] = useState<boolean>(false);
  const [isAddingUnit, setIsAddingUnit] = useState<boolean>(false);
  const { data: session } = useSession();

  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    notes: ''
  });

  const [newUnit, setNewUnit] = useState({
    name: '',
    type: UnitType.ROOM,
    beds: 1,
    bath: 1,
    surface: 0,
    basePrice: 0,
    notes: ''
  });

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/properties?includeUnits=true');
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
        if (data.length > 0 && !selectedProperty) {
          setSelectedProperty(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProperty]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || session.user.role !== 'ADMIN') {
      alert('Solo gli amministratori possono aggiungere proprietà');
      return;
    }

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProperty),
      });

      if (response.ok) {
        const property = await response.json();
        setProperties([...properties, { ...property, units: [] }]);
        setSelectedProperty(property.id);
        setNewProperty({ name: '', address: '', notes: '' });
        setIsAddingProperty(false);
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Si è verificato un errore durante l\'aggiunta della proprietà');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || session.user.role !== 'ADMIN') {
      alert('Solo gli amministratori possono aggiungere unità');
      return;
    }

    if (!selectedProperty) {
      alert('Seleziona prima una proprietà');
      return;
    }

    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newUnit,
          propertyId: selectedProperty
        }),
      });

      if (response.ok) {
        const unit = await response.json();
        setProperties(properties.map(p => {
          if (p.id === selectedProperty) {
            return { ...p, units: [...p.units, unit] };
          }
          return p;
        }));
        setNewUnit({
          name: '',
          type: UnitType.ROOM,
          beds: 1,
          bath: 1,
          surface: 0,
          basePrice: 0,
          notes: ''
        });
        setIsAddingUnit(false);
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding unit:', error);
      alert('Si è verificato un errore durante l\'aggiunta dell\'unità');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!session || session.user.role !== 'ADMIN') {
      alert('Solo gli amministratori possono eliminare proprietà');
      return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa proprietà? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProperties(properties.filter(p => p.id !== propertyId));
        if (selectedProperty === propertyId) {
          setSelectedProperty(properties.length > 1 ? properties[0].id : null);
        }
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Si è verificato un errore durante l\'eliminazione della proprietà');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!session || session.user.role !== 'ADMIN') {
      alert('Solo gli amministratori possono eliminare unità');
      return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa unità? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProperties(properties.map(p => ({
          ...p,
          units: p.units.filter(u => u.id !== unitId)
        })));
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Si è verificato un errore durante l\'eliminazione dell\'unità');
    }
  };

  const getSelectedProperty = () => {
    return properties.find(p => p.id === selectedProperty);
  };

  const getUnitTypeName = (type: UnitType) => {
    return type === UnitType.ROOM ? 'Camera' : 'Appartamento';
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Proprietà</h2>
        {session?.user?.role === 'ADMIN' && (
          <button
            onClick={() => setIsAddingProperty(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Aggiungi Proprietà
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Elenco Proprietà</h3>
            {properties.length === 0 ? (
              <p className="text-gray-500">Nessuna proprietà disponibile</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <li key={property.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedProperty(property.id)}
                        className={`text-left ${selectedProperty === property.id ? 'font-medium text-indigo-600' : 'text-gray-900'}`}
                      >
                        {property.name}
                        <span className="ml-2 text-sm text-gray-500">
                          ({property.units.length} unità)
                        </span>
                      </button>
                      {session?.user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
            {selectedProperty ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">{getSelectedProperty()?.name}</h3>
                  {session?.user?.role === 'ADMIN' && (
                    <button
                      onClick={() => setIsAddingUnit(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Aggiungi Unità
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Dettagli Proprietà</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700"><span className="font-medium">Indirizzo:</span> {getSelectedProperty()?.address}</p>
                    {getSelectedProperty()?.notes && (
                      <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Note:</span> {getSelectedProperty()?.notes}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Unità</h4>
                  {getSelectedProperty()?.units.length === 0 ? (
                    <p className="text-gray-500">Nessuna unità disponibile per questa proprietà</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nome
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Posti Letto
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bagni
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Superficie (m²)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Prezzo Base
                            </th>
                            {session?.user?.role === 'ADMIN' && (
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Azioni
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getSelectedProperty()?.units.map((unit) => (
                            <tr key={unit.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {unit.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getUnitTypeName(unit.type)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {unit.beds}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {unit.bath}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {unit.surface}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €{unit.basePrice.toFixed(2)}
                              </td>
                              {session?.user?.role === 'ADMIN' && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleDeleteUnit(unit.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Elimina
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Seleziona una proprietà o creane una nuova</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal per aggiungere una nuova proprietà */}
      {isAddingProperty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aggiungi Nuova Proprietà</h3>
            <form onSubmit={handleAddProperty}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Indirizzo
                </label>
                <input
                  type="text"
                  id="address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  id="notes"
                  value={newProperty.notes}
                  onChange={(e) => setNewProperty({ ...newProperty, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingProperty(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal per aggiungere una nuova unità */}
      {isAddingUnit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aggiungi Nuova Unità</h3>
            <form onSubmit={handleAddUnit}>
              <div className="mb-4">
                <label htmlFor="unitName" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="unitName"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="unitType" className="block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  id="unitType"
                  value={newUnit.type}
                  onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value as UnitType })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value={UnitType.ROOM}>Camera</option>
                  <option value={UnitType.APARTMENT}>Appartamento</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="beds" className="block text-sm font-medium text-gray-700">
                    Posti Letto
                  </label>
                  <input
                    type="number"
                    id="beds"
                    min="1"
                    value={newUnit.beds}
                    onChange={(e) => setNewUnit({ ...newUnit, beds: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="bath" className="block text-sm font-medium text-gray-700">
                    Bagni
                  </label>
                  <input
                    type="number"
                    id="bath"
                    min="1"
                    value={newUnit.bath}
                    onChange={(e) => setNewUnit({ ...newUnit, bath: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="surface" className="block text-sm font-medium text-gray-700">
                    Superficie (m²)
                  </label>
                  <input
                    type="number"
                    id="surface"
                    min="1"
                    step="0.1"
                    value={newUnit.surface}
                    onChange={(e) => setNewUnit({ ...newUnit, surface: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                    Prezzo Base (€)
                  </label>
                  <input
                    type="number"
                    id="basePrice"
                    min="0"
                    step="0.01"
                    value={newUnit.basePrice}
                    onChange={(e) => setNewUnit({ ...newUnit, basePrice: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="unitNotes" className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  id="unitNotes"
                  value={newUnit.notes}
                  onChange={(e) => setNewUnit({ ...newUnit, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingUnit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 