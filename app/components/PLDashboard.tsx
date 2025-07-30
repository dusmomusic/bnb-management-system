import { useState, useEffect, useCallback } from 'react';
import { Property } from '@prisma/client';

interface PLData {
  revenue: number;
  fixedExpenses: number;
  variableExpenses: number;
  margin: number;
}

interface PLDashboardProps {
  properties: Property[];
}

export default function PLDashboard({ properties }: PLDashboardProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [plData, setPLData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchPLData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/reports/pl?propertyId=${selectedProperty}&year=${selectedYear}&month=${selectedMonth}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPLData(data);
      }
    } catch (error) {
      console.error('Error fetching P&L data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProperty, selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedProperty) {
      fetchPLData();
    }
  }, [selectedProperty, selectedYear, selectedMonth, fetchPLData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateMarginPercentage = () => {
    if (!plData || plData.revenue === 0) return 0;
    return (plData.margin / plData.revenue) * 100;
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
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

        <div className="w-full md:w-1/3">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Anno
          </label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/3">
          <label htmlFor="month" className="block text-sm font-medium text-gray-700">
            Mese
          </label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {selectedProperty && plData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Ricavi</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">{formatCurrency(plData.revenue)}</p>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Spese Fisse</h3>
                <p className="mt-2 text-3xl font-bold text-red-600">{formatCurrency(plData.fixedExpenses)}</p>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Spese Variabili</h3>
                <p className="mt-2 text-3xl font-bold text-red-600">{formatCurrency(plData.variableExpenses)}</p>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Margine</h3>
                <p className={`mt-2 text-3xl font-bold ${plData.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(plData.margin)}
                </p>
                <p className={`text-sm ${plData.margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateMarginPercentage().toFixed(1)}% dei ricavi
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">Seleziona una proprietà, un anno e un mese per visualizzare i dati P&L</p>
            </div>
          )}

          {selectedProperty && plData && (
            <div className="mt-8 bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Dettaglio P&L</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Importo
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % sul Totale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Ricavi da Prenotazioni
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(plData.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        100%
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        Spese Fisse
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-10">
                        Affitto / Mutuo
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(plData.fixedExpenses * 0.7)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((plData.fixedExpenses * 0.7 / plData.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-10">
                        Utenze
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(plData.fixedExpenses * 0.2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((plData.fixedExpenses * 0.2 / plData.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-10">
                        Assicurazione
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(plData.fixedExpenses * 0.1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((plData.fixedExpenses * 0.1 / plData.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        Spese Variabili
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-10">
                        Manutenzione
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(plData.variableExpenses * 0.4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((plData.variableExpenses * 0.4 / plData.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-10">
                        Pulizie
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(plData.variableExpenses * 0.3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((plData.variableExpenses * 0.3 / plData.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-10">
                        Commissioni Portali
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(plData.variableExpenses * 0.3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {((plData.variableExpenses * 0.3 / plData.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Margine Operativo
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${plData.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(plData.margin)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${plData.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculateMarginPercentage().toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 