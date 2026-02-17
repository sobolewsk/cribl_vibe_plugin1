import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import type { SearchResult } from './services/searchService';
import {
  createSearchJob,
  pollJobStatus,
  getJobResults,
} from './services/searchService';
import './App.css';

interface SearchState {
  loading: boolean;
  error: string | null;
  results: SearchResult[];
  jobId: string | null;
  jobStatus: 'pending' | 'running' | 'completed' | 'failed' | 'canceled' | null;
}

export const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [earliest, setEarliest] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [latest, setLatest] = useState(new Date().toISOString().slice(0, 16));
  const [state, setState] = useState<SearchState>({
    loading: false,
    error: null,
    results: [],
    jobId: null,
    jobStatus: null,
  });

  const gridRef = useRef<AgGridReact>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a query' }));
      return;
    }

    try {
      setState({
        loading: true,
        error: null,
        results: [],
        jobId: null,
        jobStatus: 'pending',
      });

      const earliestTime = Math.floor(new Date(earliest).getTime() / 1000);
      const latestTime = Math.floor(new Date(latest).getTime() / 1000);

      if (earliestTime >= latestTime) {
        throw new Error('Earliest time must be before latest time');
      }

      // Create search job
      const job = await createSearchJob(query, earliestTime, latestTime);
      setState(prev => ({ ...prev, jobId: job.id, jobStatus: 'pending' }));

      // Poll for completion
      const completedJob = await pollJobStatus(job.id);
      setState(prev => ({ ...prev, jobStatus: completedJob.status as any }));

      if (completedJob.status === 'failed') {
        throw new Error('Search job failed');
      }

      if (completedJob.status === 'canceled') {
        throw new Error('Search job was canceled');
      }

      // Fetch results
      const jobResults = await getJobResults(job.id);

      setState({
        loading: false,
        error: null,
        results: jobResults.results,
        jobId: job.id,
        jobStatus: 'completed',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        jobStatus: 'failed',
      }));
    }
  };

  // Dynamically generate columns from results
  const getColumnDefs = () => {
    if (state.results.length === 0) {
      return [];
    }

    const firstResult = state.results[0];
    return Object.keys(firstResult).map(key => ({
      field: key,
      headerName: key,
      flex: 1,
      minWidth: 100,
    }));
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Cribl Vibe Search</h1>
      </div>

      <div className="controls-section">
        <div className="query-section">
          <label>Kusto Query:</label>
          <Editor
            height="150px"
            defaultLanguage="kusto"
            value={query}
            onChange={(value: string | undefined) => setQuery(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              fontSize: 14,
            }}
          />
        </div>

        <div className="time-section">
          <div className="time-group">
            <label>Earliest Time:</label>
            <input
              type="datetime-local"
              value={earliest}
              onChange={e => setEarliest(e.target.value)}
              disabled={state.loading}
            />
          </div>
          <div className="time-group">
            <label>Latest Time:</label>
            <input
              type="datetime-local"
              value={latest}
              onChange={e => setLatest(e.target.value)}
              disabled={state.loading}
            />
          </div>
        </div>

        <div className="button-section">
          <button onClick={handleSearch} disabled={state.loading} className="search-button">
            {state.loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {state.error && <div className="error-message">{state.error}</div>}
        {state.jobId && (
          <div className="job-info">
            Job ID: <code>{state.jobId}</code> | Status: <strong>{state.jobStatus}</strong>
          </div>
        )}
      </div>

      <div className="results-section">
        <div className="results-header">
          <h2>Results</h2>
          {state.results.length > 0 && (
            <span className="result-count">{state.results.length} events</span>
          )}
        </div>

        {state.results.length > 0 ? (
          <div style={{ height: '100%' }} className="ag-theme-quartz">
            <AgGridReact
              ref={gridRef}
              rowData={state.results}
              columnDefs={getColumnDefs()}
              defaultColDef={{ sortable: true, filter: true, resizable: true }}
              pagination={true}
              paginationPageSize={50}
            />
          </div>
        ) : (
          <div className="no-results">
            {state.jobStatus === null ? 'Enter a query and click Search' : 'No results found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
