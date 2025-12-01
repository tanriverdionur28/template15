import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ConstructionCombobox = ({ constructions, onSelect, selectedConstruction, label }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConstructions, setFilteredConstructions] = useState(constructions);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredConstructions(constructions);
  }, [constructions]);

  useEffect(() => {
    // Filter constructions based on search query
    if (searchQuery.trim() === '') {
      setFilteredConstructions(constructions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = constructions.filter(
        (construction) =>
          construction.isBaslik?.toLowerCase().includes(query) ||
          construction.yibfNo?.toLowerCase().includes(query) ||
          construction.ilce?.toLowerCase().includes(query)
      );
      setFilteredConstructions(filtered);
    }
  }, [searchQuery, constructions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (construction) => {
    onSelect(construction);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200" ref={wrapperRef}>
      <Label>{label || 'İnşaat Listesinden Seç (Otomatik Doldurma)'}</Label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="İnşaat ismi veya YİBF No ile ara..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown List */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredConstructions.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                Sonuç bulunamadı
              </div>
            ) : (
              filteredConstructions.map((construction) => (
                <button
                  key={construction.id}
                  type="button"
                  onClick={() => handleSelect(construction)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0",
                    selectedConstruction?.id === construction.id && "bg-blue-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {construction.isBaslik || 'İsimsiz İnşaat'}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        <span className="font-medium">YİBF:</span> {construction.yibfNo}
                        {construction.ilce && (
                          <>
                            {' • '}
                            <span className="font-medium">İlçe:</span> {construction.ilce}
                          </>
                        )}
                      </div>
                    </div>
                    {selectedConstruction?.id === construction.id && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Construction Display */}
      {selectedConstruction && (
        <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-300">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-600 font-medium">
              ✓ Seçildi: {selectedConstruction.isBaslik}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {selectedConstruction.ilce} • YİBF: {selectedConstruction.yibfNo}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-slate-400 hover:text-slate-600 flex-shrink-0"
            title="Seçimi temizle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ConstructionCombobox;
