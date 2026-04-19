import React, { createContext, useContext, useState, useEffect } from 'react';

const KitContext = createContext();

const DEFAULT_PROJECT = {
  name: 'IC Kit',
  currency: 'USD',
  jpyRate: 155,
  standard: 'UK',
  casbee_building_type: 'residential',
  casbee_target_rank: 'A',
};

export function KitProvider({ children }) {
  const [parts, setPartsInternal] = useState([]);
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectSettings, setProjectSettings] = useState(DEFAULT_PROJECT);

  // Undo/redo history
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // setParts with history tracking
  function setParts(fnOrParts) {
    setPartsInternal(prev => {
      const next = typeof fnOrParts === 'function' ? fnOrParts(prev) : fnOrParts;
      setUndoStack(stack => [...stack.slice(-29), prev]);
      setRedoStack([]);
      return next;
    });
  }

  // setParts without history (used for load/reset)
  function setPartsNoHistory(fnOrParts) {
    setPartsInternal(fnOrParts);
    setUndoStack([]);
    setRedoStack([]);
  }

  function undo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setPartsInternal(current => {
      setRedoStack(s => [...s.slice(-9), current]);
      return prev;
    });
  }

  function redo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setPartsInternal(current => {
      setUndoStack(s => [...s.slice(-29), current]);
      return next;
    });
  }

  // Currency formatter
  function formatCurrency(usd) {
    if (projectSettings.currency === 'JPY') {
      const jpy = Math.round(usd * projectSettings.jpyRate);
      return `¥${jpy.toLocaleString()}`;
    }
    return `$${usd.toLocaleString()}`;
  }

  useEffect(() => {
    const saved = localStorage.getItem('ic-kit-save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPartsInternal(data.parts || []);
        setPresets(data.presets || []);
        if (data.projectSettings) setProjectSettings({ ...DEFAULT_PROJECT, ...data.projectSettings });
        setIsLoading(false);
        return;
      } catch (err) {}
    }

    const basePath = import.meta.env.BASE_URL;
    fetch(`${basePath}default-kit.json`)
      .then((res) => res.json())
      .then((data) => {
        setPartsInternal(data.parts || []);
        setPresets(data.presets || []);
        if (data.projectSettings) setProjectSettings({ ...DEFAULT_PROJECT, ...data.projectSettings });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load default kit:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoading && parts.length > 0) {
      localStorage.setItem('ic-kit-save', JSON.stringify({ parts, presets, projectSettings }));
    }
  }, [parts, presets, projectSettings, isLoading]);

  const loadKitFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.parts && data.presets) {
          setPartsNoHistory(data.parts);
          setPresets(data.presets);
          if (data.projectSettings) setProjectSettings({ ...DEFAULT_PROJECT, ...data.projectSettings });
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
    setParts(prev => [...prev, {
      id: `Custom Part ${prev.length + 1}`,
      shape: 'box',
      pos: [0, 0, 0],
      exp: [0, 5, 0],
      size: [2, 2, 2],
      sequence: prev.length + 1,
      wire: false,
      transparent: false,
      structural_role: null,
      variants: [{
        label: 'Default Variant',
        color: '#aaaaaa',
        meta: 'Custom added part',
        weight_kg: 1000,
        unit_cost_usd: 5000,
        carbon_kgco2e: 500,
        seismic_grade: null,
        fire_resistance_grade: null,
        load_bearing_kn: null,
        bsl_compliant: null,
        bsl_notes: null,
        unit_cost_jpy: null,
        labor_cost_jpy: null,
        jis_standards: null,
        ifc_entity: 'IfcBuildingElementProxy',
        ifc_property_set: null,
      }]
    }]);
  };

  const updatePart = (id, newProps) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...newProps } : p));
  };

  const addConnection = (fromId, conn) => {
    setParts(prev => prev.map(p => {
      if (p.id === fromId) {
        if ((p.connections ?? []).some(c => c.to === conn.to && c.type === conn.type)) return p;
        return { ...p, connections: [...(p.connections ?? []), conn] };
      }
      if (p.id === conn.to) {
        const reverse = { to: fromId, type: conn.type, hardware: conn.hardware };
        if ((p.connections ?? []).some(c => c.to === fromId && c.type === conn.type)) return p;
        return { ...p, connections: [...(p.connections ?? []), reverse] };
      }
      return p;
    }));
  };

  const removeConnection = (fromId, connTo) => {
    setParts(prev => prev.map(p => {
      if (p.id === fromId) return { ...p, connections: (p.connections ?? []).filter(c => c.to !== connTo) };
      if (p.id === connTo)  return { ...p, connections: (p.connections ?? []).filter(c => c.to !== fromId) };
      return p;
    }));
  };

  const removePart = (id) => {
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const duplicatePart = (id) => {
    setParts(prev => {
      const partToDup = prev.find(p => p.id === id);
      if (!partToDup) return prev;
      const newPart = {
        ...partToDup,
        id: `${partToDup.id} (Copy ${Date.now().toString().slice(-4)})`,
        sequence: prev.length + 1,
        pos: [partToDup.pos[0] + 1, partToDup.pos[1], partToDup.pos[2]]
      };
      return [...prev, newPart];
    });
  };

  const exportKit = () => {
    const dataObj = { parts, presets, projectSettings };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-kit.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const savePreset = (label, selectedVariants, visible) => {
    const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
    const newPreset = {
      id,
      label,
      description: `Custom preset – ${label}`,
      custom: true,
      variants: { ...selectedVariants },
      visible: { ...visible },
    };
    setPresets([...presets, newPreset]);
  };

  const removePreset = (id) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const clearAutoSave = () => {
    localStorage.removeItem('ic-kit-save');
    window.location.reload();
  };

  return (
    <KitContext.Provider value={{
      parts, presets, setPresets,
      projectSettings, setProjectSettings, formatCurrency,
      loadKitFromFile, isLoading,
      addPart, duplicatePart, updatePart, removePart, exportKit, clearAutoSave,
      savePreset, removePreset, addConnection, removeConnection,
      undo, redo, canUndo, canRedo,
    }}>
      {children}
    </KitContext.Provider>
  );
}

export function useKit() {
  return useContext(KitContext);
}
