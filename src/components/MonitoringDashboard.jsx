import React, { useEffect, useState, useRef } from 'react';
import { Settings2, Pin, Gauge, RotateCcw, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { useContainerStore } from '../stores/containerStore';
import VirtualizedContainerList from './dashboard/VirtualizedContainerList';
import useContainerData from './useContainerData';

const MonitoringDashboard = ({ credentials }) => {
  const { initialLoad } = useContainerData(credentials);
  const { 
    pinnedServices, 
    clearPinned,
    error,
    clearSearchTerms,
    clearCustomThresholds,
  } = useContainerStore();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        clearSearchTerms();
        clearCustomThresholds();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSearchTerms, clearCustomThresholds]);

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
        </div>
      </div>

      {/* Initial loading state */}
      {initialLoad && (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-gray-500 border-t-white rounded-full mb-2" />
            <p className="text-gray-400">Loading containers...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-900/20 rounded-lg">
          Error: {error}
        </div>
      )}

      {!initialLoad && (
        <div className="flex-1 flex flex-col rounded-lg border border-gray-800 bg-gray-900/50 p-0.5 min-h-0 h-full">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-2 px-3 py-1.5 text-sm font-medium text-gray-400">
            <div className="w-8 flex justify-center">
              {pinnedServices.size > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearPinned}
                  className="h-5 w-5 text-gray-400 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <VirtualizedContainerList />
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
