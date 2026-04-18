import React, { createContext, useContext, useState, useEffect } from 'react';

const KitContext = createContext();

export function KitProvider({ children }) {
  const [parts, setParts] = useState([]);
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ic-kit-save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setParts(data.parts || []);
        setPresets(data.presets || []);
        setIsLoading(false);
        return;
      } catch (err) {}
    }

    fetch('/default-kit.json')
      .then((res) => res.json())
      .then((data) => {
        setParts(data.parts || []);
        setPresets(data.presets || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load default kit:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoading && parts.length > 0) {
      localStorage.setItem('ic-kit-save', JSON.stringify({ parts, presets }));
    }
  }, [parts, presets, isLoading]);

  const loadKitFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.parts && data.presets) {
          setParts(data.parts);
          setPresets(data.presets);
        } else {
          alert('Invalid kit format. Missing parts or presets array.');
        }
      } catch (err) {
        alert('Failed to parse kit JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const addPart = () => {
    setParts([...parts, {
      id: `Custom Part ${parts.length + 1}`,
      shape: 'box',
      pos: [0, 0, 0],
      exp: [0, 5, 0],
      size: [2, 2, 2],
      sequence: parts.length + 1,
      wire: false,
      transparent: false,
      variants: [{
        label: 'Default Variant',
        color: '#aaaaaa',
        meta: 'Custom added part',
        weight_kg: 1000,
        unit_cost_usd: 5000,
        carbon_kgco2e: 500
      }]
    }]);
  };

  const updatePart = (id, newProps) => {
    setParts(parts.map(p => p.id === id ? { ...p, ...newProps } : p));
  };

  const removePart = (id) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const duplicatePart = (id) => {
    const partToDup = parts.find(p => p.id === id);
    if (!partToDup) return;
    const newPart = {
      ...partToDup,
      id: `${partToDup.id} (Copy ${Date.now().toString().slice(-4)})`,
      sequence: parts.length + 1,
      pos: [partToDup.pos[0] + 1, partToDup.pos[1], partToDup.pos[2]]
    };
    setParts([...parts, newPart]);
  };

  const exportKit = () => {
    const dataObj = { parts, presets };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-kit.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAutoSave = () => {
    localStorage.removeItem('ic-kit-save');
    window.location.reload();
  };

  return (
    <KitContext.Provider value={{ 
      parts, setParts, presets, setPresets, 
      loadKitFromFile, isLoading, 
      addPart, duplicatePart, updatePart, removePart, exportKit, clearAutoSave
    }}>
      {children}
    </KitContext.Provider>
  );
}

export function useKit() {
  return useContext(KitContext);
}
