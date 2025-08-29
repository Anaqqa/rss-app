import React, { createContext, useContext, useState } from 'react';
import { exportFeeds, importFeeds } from '../services/api';

const ExportImportContext = createContext();

export const useExportImport = () => {
  const context = useContext(ExportImportContext);
  if (!context) {
    throw new Error('useExportImport must be used within ExportImportProvider');
  }
  return context;
};

export const ExportImportProvider = ({ children }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  
  const exportOPML = async (collectionIds = null) => {
    setIsExporting(true);
    try {
      await exportFeeds.opml(collectionIds);
      return { success: true, message: 'Export OPML réussi !' };
    } catch (error) {
      console.error('Erreur export OPML:', error);
      return { success: false, message: error.message };
    } finally {
      setIsExporting(false);
    }
  };

  const exportJSON = async (collectionIds = null) => {
    setIsExporting(true);
    try {
      await exportFeeds.json(collectionIds);
      return { success: true, message: 'Export JSON réussi !' };
    } catch (error) {
      console.error('Erreur export JSON:', error);
      return { success: false, message: error.message };
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async (collectionIds = null) => {
    setIsExporting(true);
    try {
      await exportFeeds.csv(collectionIds);
      return { success: true, message: 'Export CSV réussi !' };
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return { success: false, message: error.message };
    } finally {
      setIsExporting(false);
    }
  };

  
  const importOPML = async (file, collectionId = null) => {
    setIsImporting(true);
    try {
      const result = await importFeeds.opml(file, collectionId);
      setImportResult(result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur import OPML:', error);
      return { success: false, message: error.message };
    } finally {
      setIsImporting(false);
    }
  };

  const importJSON = async (file, collectionId = null) => {
    setIsImporting(true);
    try {
      const result = await importFeeds.json(file, collectionId);
      setImportResult(result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur import JSON:', error);
      return { success: false, message: error.message };
    } finally {
      setIsImporting(false);
    }
  };

  const clearImportResult = () => {
    setImportResult(null);
  };

  const value = {
    
    isExporting,
    isImporting,
    importResult,
    
    
    exportOPML,
    exportJSON,
    exportCSV,
    
    
    importOPML,
    importJSON,
    
    
    clearImportResult
  };

  return (
    <ExportImportContext.Provider value={value}>
      {children}
    </ExportImportContext.Provider>
  );
};