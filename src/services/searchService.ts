import { criblFetch, getSearchJobsUrl } from '../utils/criblApi';

export interface SearchJob {
  id: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  startTime?: number;
  endTime?: number;
  eventCount?: number;
}

export type SearchResult = Record<string, any>;

export interface JobResults {
  info: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
    eventCount: number;
    [key: string]: any;
  };
  results: SearchResult[];
}

export interface TimelineBucket {
  duration: number;
  earliest: number;
  eventCount: number;
}

export interface TimeLine {
  buckets: TimelineBucket[];
  totalEventCount: number;
}

/**
 * Create a new search job
 */
export const createSearchJob = async (
  query: string,
  earliestTime: number,
  latestTime: number
): Promise<SearchJob> => {
  const baseUrl = getSearchJobsUrl();
  const response = await criblFetch(baseUrl, {
    method: 'POST',
    body: JSON.stringify({
      search: query,
      earliest_time: earliestTime,
      latest_time: latestTime,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create search job: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.sid,
    query,
    status: data.status || 'pending',
    startTime: earliestTime,
    endTime: latestTime,
  };
};

/**
 * Get job status
 */
export const getJobStatus = async (jobId: string): Promise<SearchJob> => {
  const baseUrl = getSearchJobsUrl();
  const response = await criblFetch(`${baseUrl}/${jobId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.sid || jobId,
    query: data.search || '',
    status: data.status || 'pending',
    eventCount: data.eventCount,
  };
};

/**
 * Get job results with streaming support
 */
export const getJobResults = async (jobId: string): Promise<JobResults> => {
  const baseUrl = getSearchJobsUrl();
  const response = await criblFetch(`${baseUrl}/${jobId}/results`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to get job results: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.trim().split('\n').filter((line: string) => line.length > 0);

  if (lines.length === 0) {
    return { info: { id: jobId, status: 'pending', eventCount: 0 }, results: [] };
  }

  // First line is the header info
  const info = JSON.parse(lines[0]);
  const results: SearchResult[] = [];

  // Remaining lines are results
  for (let i = 1; i < lines.length; i++) {
    try {
      results.push(JSON.parse(lines[i]));
    } catch (e) {
      // Skip invalid JSON lines
    }
  }

  return {
    info: {
      id: info.sid || jobId,
      status: info.status || 'pending',
      eventCount: info.eventCount || results.length,
      ...info,
    },
    results,
  };
};

/**
 * Get job timeline
 */
export const getJobTimeline = async (jobId: string): Promise<TimeLine> => {
  const baseUrl = getSearchJobsUrl();
  const response = await criblFetch(`${baseUrl}/${jobId}/timeline`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to get job timeline: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Poll job status until it reaches a terminal state
 */
export const pollJobStatus = async (
  jobId: string,
  maxWaitTime: number = 300000,
  pollInterval: number = 1000
): Promise<SearchJob> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const job = await getJobStatus(jobId);

    if (['completed', 'failed', 'canceled'].includes(job.status)) {
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Job polling timeout');
};
