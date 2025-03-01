import React from 'react';
import { Database, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddNew }) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
        <Database className="h-8 w-8 text-blue-600" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No data items yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Get started by creating your first data item.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add New Data
        </button>
      </div>
    </div>
  );
};

export default EmptyState;