import { generateId } from './utils.js';

const STORAGE_KEY = "routing_map_draft_v4.3";

const getInitialState = () => ({
    meta: { 
        productName: '', productCode: '', docVersion: '1.0', 
        docDate: new Date().toISOString().slice(0,10), 
        author: '', batchSize: 100, description: '' 
    },
    ingredients: [],
    performanceData: [],
    stabilityData: [],
    equipment: [],
    processSteps: [],
    qualityControl: []
});

class Store {
    constructor() {
        this.state = this.loadFromStorage() || getInitialState();
        this.listeners = [];
    }

    /**
     * Normalize data structure to ensure all arrays exist
     */
    normalizeState(data) {
        const defaults = getInitialState();
        const normalized = {
            meta: { ...defaults.meta, ...(data.meta || {}) },
            ingredients: Array.isArray(data.ingredients) ? data.ingredients : defaults.ingredients,
            performanceData: Array.isArray(data.performanceData) ? data.performanceData : defaults.performanceData,
            stabilityData: Array.isArray(data.stabilityData) ? data.stabilityData : defaults.stabilityData,
            equipment: Array.isArray(data.equipment) ? data.equipment : defaults.equipment,
            processSteps: Array.isArray(data.processSteps) ? data.processSteps : defaults.processSteps,
            qualityControl: Array.isArray(data.qualityControl) ? data.qualityControl : defaults.qualityControl
        };
        
        // Migration logic: ensure tradeName exists if name was used
        normalized.ingredients.forEach(ing => {
            if (ing.name && !ing.tradeName) {
                ing.tradeName = ing.name;
                delete ing.name;
            }
        });
        return normalized;
    }

    getState() {
        return this.state;
    }

    /**
     * Update state and notify listeners
     * @param {Object} newState - The new state object (or partial update logic could be implemented)
     */
    setState(newState) {
        this.state = newState;
        this.saveToStorage();
        this.notify();
    }

    /**
     * Load state from local storage
     */
    loadFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return this.normalizeState(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading state:", e);
                return null;
            }
        }
        return null;
    }

    saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    clearStorage() {
        localStorage.removeItem(STORAGE_KEY);
        this.setState(getInitialState());
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Actions ---

    addIngredient() {
        const newState = { ...this.state };
        newState.ingredients.push({ 
            id: generateId(), phase: '', tradeName: '', inciName: '', 
            func: '', supplier: '', notes: '', percent: 0 
        });
        this.setState(newState);
    }

    addPerformanceParam() {
        const newState = { ...this.state };
        newState.performanceData.push({ id: generateId(), parameter: '', value: '' });
        this.setState(newState);
    }

    addStabilityTest() {
        const newState = { ...this.state };
        newState.stabilityData.push({ id: generateId(), condition: '', result: '' });
        this.setState(newState);
    }

    addEquipment() {
        const newState = { ...this.state };
        newState.equipment.push({ id: generateId(), shortName: '', fullName: '', notes: '' });
        this.setState(newState);
    }

    addProcessStep() {
        const newState = { ...this.state };
        newState.processSteps.push({ 
            id: generateId(), number: '', description: '', equipment: '', parameters: [] 
        });
        this.setState(newState);
    }

    addQcBlock() {
        const newState = { ...this.state };
        newState.qualityControl.push({ id: generateId(), name: '', checks: [] });
        this.setState(newState);
    }

    deleteItem(collectionName, id) {
        const newState = { ...this.state };
        if (Array.isArray(newState[collectionName])) {
            newState[collectionName] = newState[collectionName].filter(item => item.id !== id);
            this.setState(newState);
        }
    }
}

export const store = new Store();