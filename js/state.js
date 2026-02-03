import { generateId } from './utils.js';

export const STORAGE_KEY = "routing_map_draft_v4.3";

export const getInitialState = () => ({
    meta: { 
        productName: '', 
        productCode: '', 
        docVersion: '1.0', 
        docDate: new Date().toISOString().slice(0,10), 
        author: '', 
        batchSize: 100, 
        description: '' 
    },
    ingredients: [],
    performanceData: [],
    stabilityData: [],
    equipment: [],
    processSteps: [],
    qualityControl: []
});

/**
 * Ensures data structure is correct and migrates old formats
 */
export function normalizeState(data) {
    const defaults = getInitialState();
    const normalized = {
        meta: { ...defaults.meta, ...(data.meta || {}) },
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        performanceData: Array.isArray(data.performanceData) ? data.performanceData : [],
        stabilityData: Array.isArray(data.stabilityData) ? data.stabilityData : [],
        equipment: Array.isArray(data.equipment) ? data.equipment : [],
        processSteps: Array.isArray(data.processSteps) ? data.processSteps : [],
        qualityControl: Array.isArray(data.qualityControl) ? data.qualityControl : []
    };

    // Migration: name -> tradeName
    normalized.ingredients.forEach(ing => {
        if (ing.name && !ing.tradeName) {
            ing.tradeName = ing.name;
            delete ing.name;
        }
    });
    return normalized;
}

export function saveToLocalStorage(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeState(JSON.parse(saved)) : null;
}