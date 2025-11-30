const API_BASE_URL = 'http://localhost:8080';

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data?.message || data?.data?.message || `HTTP error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export async function uploadLogFile(file, timestampFormat) {
  const formData = new FormData();
  formData.append('logfile', file);
  if (timestampFormat) {
    formData.append('timestampFormat', timestampFormat);
  }
  
  const response = await fetch(`${API_BASE_URL}/logs/upload`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data?.message || 'Upload failed');
  }
  
  return data;
}

export async function getJobStatus(jobId) {
  return fetchApi(`/logs/status/${jobId}`);
}

export async function getJobResult(jobId) {
  return fetchApi(`/logs/result/${jobId}`);
}

export async function searchLogs(request) {
  return fetchApi('/logs/search', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getJobSummary(jobId) {
  return fetchApi(`/logs/job/${jobId}/summary`);
}

export async function getLevelDistribution(jobId) {
  return fetchApi(`/logs/job/${jobId}/levels`);
}

export async function getTimeline(jobId, interval = '1h') {
  return fetchApi(`/logs/job/${jobId}/timeline?interval=${interval}`);
}

export async function getFieldValues(jobId, fieldName, limit = 100) {
  return fetchApi(`/logs/job/${jobId}/fields/${fieldName}?limit=${limit}`);
}

export async function getAvailableFields(jobId) {
  return fetchApi(`/logs/job/${jobId}/fields`);
}

export async function exportLogs(jobId, format = 'csv', request = {}) {
  const response = await fetch(`${API_BASE_URL}/logs/job/${jobId}/export?format=${format}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.message || 'Export failed');
  }
  
  return response.blob();
}

export async function getContextLines(jobId, lineNumber, before = 5, after = 5) {
  return fetchApi(`/logs/job/${jobId}/context/${lineNumber}?before=${before}&after=${after}`);
}

export function buildSearchRequest(jobId, overrides = {}) {
  return {
    jobId,
    page: 0,
    size: 50,
    sortBy: 'timestamp',
    sortDirection: 'desc',
    includeSummary: true,
    highlightMatches: false,
    ...overrides,
  };
}

export default {
  uploadLogFile,
  getJobStatus,
  getJobResult,
  searchLogs,
  getJobSummary,
  getLevelDistribution,
  getTimeline,
  getFieldValues,
  getAvailableFields,
  exportLogs,
  getContextLines,
  buildSearchRequest,
};
