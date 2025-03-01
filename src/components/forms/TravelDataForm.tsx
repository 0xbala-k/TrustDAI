import React, { useState } from 'react';
import { TravelData } from '../../types';
import { Plus, X } from 'lucide-react';

interface TravelDataFormProps {
  initialData?: TravelData;
  onSubmit: (data: TravelData) => void;
  onCancel: () => void;
}

const TravelDataForm: React.FC<TravelDataFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<TravelData>(
    initialData || {
      passportNumber: '',
      expiryDate: '',
      visaDetails: '',
      preferredAirlines: [],
      frequentFlyerNumbers: {}
    }
  );

  const [newAirline, setNewAirline] = useState('');
  const [newFrequentFlyerAirline, setNewFrequentFlyerAirline] = useState('');
  const [newFrequentFlyerNumber, setNewFrequentFlyerNumber] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAirline = () => {
    if (newAirline.trim() && !formData.preferredAirlines.includes(newAirline.trim())) {
      setFormData(prev => ({
        ...prev,
        preferredAirlines: [...prev.preferredAirlines, newAirline.trim()]
      }));
      setNewAirline('');
    }
  };

  const handleRemoveAirline = (airline: string) => {
    setFormData(prev => ({
      ...prev,
      preferredAirlines: prev.preferredAirlines.filter(a => a !== airline)
    }));
  };

  const handleAddFrequentFlyer = () => {
    if (newFrequentFlyerAirline.trim() && newFrequentFlyerNumber.trim()) {
      setFormData(prev => ({
        ...prev,
        frequentFlyerNumbers: {
          ...prev.frequentFlyerNumbers,
          [newFrequentFlyerAirline.trim()]: newFrequentFlyerNumber.trim()
        }
      }));
      setNewFrequentFlyerAirline('');
      setNewFrequentFlyerNumber('');
    }
  };

  const handleRemoveFrequentFlyer = (airline: string) => {
    const updatedFrequentFlyers = { ...formData.frequentFlyerNumbers };
    delete updatedFrequentFlyers[airline];
    
    setFormData(prev => ({
      ...prev,
      frequentFlyerNumbers: updatedFrequentFlyers
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700">
            Passport Number
          </label>
          <input
            type="text"
            id="passportNumber"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="visaDetails" className="block text-sm font-medium text-gray-700">
          Visa Details
        </label>
        <textarea
          id="visaDetails"
          name="visaDetails"
          rows={2}
          value={formData.visaDetails}
          onChange={handleChange}
          placeholder="Enter visa information if applicable"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Airlines
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.preferredAirlines.map(airline => (
            <span 
              key={airline} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {airline}
              <button 
                type="button" 
                onClick={() => handleRemoveAirline(airline)}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={newAirline}
            onChange={(e) => setNewAirline(e.target.value)}
            placeholder="Add airline"
            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={handleAddAirline}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frequent Flyer Numbers
        </label>
        <div className="space-y-2 mb-3">
          {Object.entries(formData.frequentFlyerNumbers).map(([airline, number]) => (
            <div key={airline} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{airline}:</span> {number}
              </div>
              <button 
                type="button" 
                onClick={() => handleRemoveFrequentFlyer(airline)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={newFrequentFlyerAirline}
            onChange={(e) => setNewFrequentFlyerAirline(e.target.value)}
            placeholder="Airline"
            className="col-span-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <input
            type="text"
            value={newFrequentFlyerNumber}
            onChange={(e) => setNewFrequentFlyerNumber(e.target.value)}
            placeholder="Membership Number"
            className="col-span-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={handleAddFrequentFlyer}
            className="col-span-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default TravelDataForm;