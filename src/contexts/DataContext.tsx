import { createContext, useContext, useState, ReactNode } from 'react';

interface QueryResult {
  id: string;
  title: string;
  query_text: string;
  results: any[];
  created_at: string;
}

interface DataContextType {
  queries: QueryResult[];
  activeQuery: QueryResult | null;
  rpcData: any;
  addQuery: (query: QueryResult) => void;
  setActiveQuery: (query: QueryResult | null) => void;
  updateRpcData: (data: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [queries, setQueries] = useState<QueryResult[]>([]);
  const [activeQuery, setActiveQuery] = useState<QueryResult | null>(null);
  const [rpcData, setRpcData] = useState<any>(null);

  const addQuery = (query: QueryResult) => {
    setQueries(prev => [query, ...prev.filter(q => q.id !== query.id)]);
  };

  const updateRpcData = (data: any) => {
    setRpcData(data);
  };

  return (
    <DataContext.Provider value={{
      queries,
      activeQuery,
      rpcData,
      addQuery,
      setActiveQuery,
      updateRpcData
    }}>
      {children}
    </DataContext.Provider>
  );
};