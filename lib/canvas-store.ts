import { create } from "zustand";

export type ElementType = "text" | "image" | "shape" | "qr";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  content?: string;
  src?: string;
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: "left" | "center" | "right";
  locked?: boolean;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  history: CanvasElement[][];
  historyIndex: number;

  // Actions
  addElement: (type: ElementType) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  setElements: (elements: CanvasElement[]) => void;
}

const INITIAL_ELEMENTS: CanvasElement[] = [
  {
    id: "org-name",
    type: "text",
    content: "ORGANIZATION NAME",
    x: 150,
    y: 40,
    width: 300,
    height: 30,
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: "500",
    textAlign: "center",
    fill: "#9CA3AF",
  },
  {
    id: "cert-title",
    type: "text",
    content: "CERTIFICATE OF ACHIEVEMENT",
    x: 100,
    y: 80,
    width: 400,
    height: 40,
    fontSize: 18,
    fontFamily: "Inter",
    fontWeight: "700",
    textAlign: "center",
    fill: "#4B5563",
  },
  {
    id: "recipient-name",
    type: "text",
    content: "{recipient_name}",
    x: 100,
    y: 180,
    width: 400,
    height: 60,
    fontSize: 32,
    fontFamily: "Inter",
    fontWeight: "800",
    textAlign: "center",
    fill: "#111827",
  },
  {
    id: "qr-code",
    type: "qr",
    x: 270,
    y: 320,
    width: 60,
    height: 60,
  },
];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: INITIAL_ELEMENTS,
  selectedElementId: "recipient-name",
  history: [INITIAL_ELEMENTS],
  historyIndex: 0,

  addElement: (type) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === "text" ? 200 : 100,
      height: type === "text" ? 40 : 100,
      content: type === "text" ? "New Text" : undefined,
      fill: type === "text" ? "#000000" : "#3B82F6",
      fontSize: type === "text" ? 24 : undefined,
      fontFamily: type === "text" ? "Inter" : undefined,
    };

    set((state) => {
      const newElements = [...state.elements, newElement];
      return {
        elements: newElements,
        selectedElementId: newElement.id,
      };
    });
    get().saveToHistory();
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
    // Note: Debounce history saving for performance
  },

  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().saveToHistory();
  },

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  saveToHistory: () => {
    const { elements, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    
    // Limit history size
    if (newHistory.length > 50) newHistory.shift();
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      set({
        elements: [...history[prevIndex]],
        historyIndex: prevIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({
        elements: [...history[nextIndex]],
        historyIndex: nextIndex,
      });
    }
  },
  setElements: (elements) => set({ 
    elements, 
    history: [elements], 
    historyIndex: 0 
  }),
}));
