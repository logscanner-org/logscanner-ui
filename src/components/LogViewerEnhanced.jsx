import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Checkbox,
  Tooltip,
  Drawer,
  Typography,
  Spin,
  Empty,
  Collapse,
  Badge,
  Dropdown,
  message,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ExpandOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  BugOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { searchLogs, getJobSummary, getAvailableFields, exportLogs, buildSearchRequest } from '../services/api';
import './LogViewerEnhanced.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Log level colors and icons
const LEVEL_CONFIG = {
  ERROR: { color: '#ff4d4f', bgColor: '#fff2f0', icon: <CloseCircleOutlined /> },
  WARN: { color: '#faad14', bgColor: '#fffbe6', icon: <WarningOutlined /> },
  INFO: { color: '#1890ff', bgColor: '#e6f7ff', icon: <InfoCircleOutlined /> },
  DEBUG: { color: '#52c41a', bgColor: '#f6ffed', icon: <BugOutlined /> },
  TRACE: { color: '#8c8c8c', bgColor: '#fafafa', icon: <ExclamationCircleOutlined /> },
};

export default function LogViewerEnhanced({ jobId, onClose }) {
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [summary, setSummary] = useState(null);
  const [jobSummary, setJobSummary] = useState(null);
  const [availableFields, setAvailableFields] = useState({});
  
  // Filter state
  const [searchText, setSearchText] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedLogger, setSelectedLogger] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [hasError, setHasError] = useState(null);
  const [hasStackTrace, setHasStackTrace] = useState(null);
  
  // Sort state
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // UI state
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Build current search request
  const buildCurrentRequest = useCallback((page = pagination.current, size = pagination.pageSize) => {
    const request = buildSearchRequest(jobId, {
      page: page - 1, // API is 0-indexed
      size,
      sortBy: sortField,
      sortDirection: sortOrder,
      includeSummary: true,
    });

    if (searchText) {
      request.searchText = searchText;
    }
    if (selectedLevels.length > 0) {
      request.levels = selectedLevels;
    }
    if (selectedLogger) {
      request.logger = selectedLogger;
    }
    if (selectedThread) {
      request.thread = selectedThread;
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      request.startDate = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
      request.endDate = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
    }
    if (hasError !== null) {
      request.hasError = hasError;
    }
    if (hasStackTrace !== null) {
      request.hasStackTrace = hasStackTrace;
    }

    return request;
  }, [jobId, pagination, sortField, sortOrder, searchText, selectedLevels, selectedLogger, selectedThread, dateRange, hasError, hasStackTrace]);

  // Fetch logs
  const fetchLogs = useCallback(async (page = 1, size = pagination.pageSize) => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const request = buildCurrentRequest(page, size);
      const response = await searchLogs(request);
      
      if (response.success) {
        setLogs(response.data.logs || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: size,
          total: response.data.pagination?.totalElements || 0,
        }));
        setSummary(response.data.summary);
      }
    } catch (error) {
      message.error('Failed to fetch logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, buildCurrentRequest]);

  // Fetch job summary and available fields
  const fetchMetadata = useCallback(async () => {
    if (!jobId) return;
    
    try {
      const [summaryRes, fieldsRes] = await Promise.all([
        getJobSummary(jobId),
        getAvailableFields(jobId),
      ]);
      
      if (summaryRes.success) {
        setJobSummary(summaryRes.data);
      }
      if (fieldsRes.success) {
        setAvailableFields(fieldsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  }, [jobId]);

  // Initial load
  useEffect(() => {
    if (jobId) {
      fetchLogs(1);
      fetchMetadata();
    }
  }, [jobId]);

  // Refresh when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (jobId) {
        fetchLogs(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, selectedLevels, selectedLogger, selectedThread, dateRange, hasError, hasStackTrace, sortField, sortOrder]);

  // Handle table change (pagination, sorting)
  const handleTableChange = (pag, filters, sorter) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
    fetchLogs(pag.current, pag.pageSize);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setSelectedLevels([]);
    setSelectedLogger(null);
    setSelectedThread(null);
    setDateRange(null);
    setHasError(null);
    setHasStackTrace(null);
  };

  // Export logs
  const handleExport = async (format) => {
    setExporting(true);
    try {
      const request = buildCurrentRequest(1, 10000);
      delete request.includeSummary;
      
      const blob = await exportLogs(jobId, format, { query: request });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${jobId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Show log details
  const showLogDetail = (record) => {
    setSelectedLog(record);
    setDetailDrawerVisible(true);
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return searchText || selectedLevels.length > 0 || selectedLogger || selectedThread || 
           dateRange || hasError !== null || hasStackTrace !== null;
  }, [searchText, selectedLevels, selectedLogger, selectedThread, dateRange, hasError, hasStackTrace]);

  // Table columns
  const columns = [
    {
      title: 'Line',
      dataIndex: 'lineNumber',
      key: 'lineNumber',
      width: 70,
      sorter: true,
      sortOrder: sortField === 'lineNumber' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (val) => <Text type="secondary">{val}</Text>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: true,
      sortOrder: sortField === 'timestamp' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (val) => val ? new Date(val).toLocaleString() : '-',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      sorter: true,
      sortOrder: sortField === 'level' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (level) => {
        const config = LEVEL_CONFIG[level] || { color: '#8c8c8c', bgColor: '#fafafa' };
        return (
          <Tag 
            color={config.bgColor} 
            style={{ color: config.color, borderColor: config.color }}
            icon={config.icon}
          >
            {level}
          </Tag>
        );
      },
    },
    {
      title: 'Logger',
      dataIndex: 'logger',
      key: 'logger',
      width: 200,
      ellipsis: true,
      sorter: true,
      sortOrder: sortField === 'logger' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (val) => (
        <Tooltip title={val}>
          <Text style={{ fontSize: 12 }}>{val ? val.split('.').pop() : '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (val, record) => (
        <div 
          className="log-message-cell"
          onClick={() => showLogDetail(record)}
          style={{ cursor: 'pointer' }}
        >
          <Text ellipsis style={{ maxWidth: '100%' }}>
            {val}
          </Text>
          {record.hasStackTrace && (
            <Tag color="red" size="small" style={{ marginLeft: 8, fontSize: 10 }}>
              STACK
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Thread',
      dataIndex: 'thread',
      key: 'thread',
      width: 120,
      ellipsis: true,
      render: (val) => <Text type="secondary" style={{ fontSize: 12 }}>{val || '-'}</Text>,
    },
  ];

  // Render level badges for summary
  const renderLevelBadges = () => {
    if (!summary?.levelCounts) return null;
    
    return (
      <Space size={8} wrap>
        {Object.entries(summary.levelCounts).map(([level, count]) => {
          const config = LEVEL_CONFIG[level] || {};
          return (
            <Badge 
              key={level} 
              count={count} 
              style={{ backgroundColor: config.color || '#8c8c8c' }}
              overflowCount={99999}
            >
              <Tag 
                className={`level-filter-tag ${selectedLevels.includes(level) ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedLevels(prev => 
                    prev.includes(level) 
                      ? prev.filter(l => l !== level) 
                      : [...prev, level]
                  );
                }}
                style={{ 
                  cursor: 'pointer',
                  borderColor: selectedLevels.includes(level) ? config.color : undefined,
                }}
              >
                {level}
              </Tag>
            </Badge>
          );
        })}
      </Space>
    );
  };

  // Export menu items
  const exportMenuItems = [
    { key: 'csv', label: 'Export as CSV' },
    { key: 'json', label: 'Export as JSON' },
    { key: 'ndjson', label: 'Export as NDJSON' },
  ];

  if (!jobId) {
    return (
      <div className="log-viewer-enhanced">
        <Empty description="No job selected. Upload a log file to get started." />
      </div>
    );
  }

  return (
    <div className="log-viewer-enhanced">
      {/* Summary Stats */}
      {jobSummary && (
        <Card className="summary-card" size="small">
          <Row gutter={16}>
            <Col span={4}>
              <Statistic 
                title="Total Entries" 
                value={jobSummary.totalEntries || 0} 
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
            <Col span={4}>
              <Statistic 
                title="Errors" 
                value={jobSummary.errorCount || 0} 
                valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
              />
            </Col>
            <Col span={4}>
              <Statistic 
                title="Warnings" 
                value={jobSummary.warningCount || 0} 
                valueStyle={{ fontSize: 20, color: '#faad14' }}
              />
            </Col>
            <Col span={4}>
              <Statistic 
                title="Stack Traces" 
                value={jobSummary.stackTraceCount || 0} 
                valueStyle={{ fontSize: 20, color: '#722ed1' }}
              />
            </Col>
            <Col span={8}>
              <div className="time-range">
                <Text type="secondary" style={{ fontSize: 12 }}>Time Range</Text>
                <div>
                  <Text style={{ fontSize: 13 }}>
                    {jobSummary.earliestTimestamp ? new Date(jobSummary.earliestTimestamp).toLocaleString() : '-'}
                  </Text>
                  <Text type="secondary"> → </Text>
                  <Text style={{ fontSize: 13 }}>
                    {jobSummary.latestTimestamp ? new Date(jobSummary.latestTimestamp).toLocaleString() : '-'}
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Search and Filter Bar */}
      <Card className="filter-card" size="small">
        <Row gutter={[16, 12]} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search logs (message, stack trace...)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => fetchLogs(1)}
              enterButton={<SearchOutlined />}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            {renderLevelBadges()}
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<FilterOutlined />} 
                onClick={() => setFiltersVisible(!filtersVisible)}
                type={hasActiveFilters ? 'primary' : 'default'}
              >
                Filters {hasActiveFilters && <Badge count={1} size="small" offset={[5, 0]} />}
              </Button>
              
              {hasActiveFilters && (
                <Button icon={<ClearOutlined />} onClick={clearFilters}>
                  Clear
                </Button>
              )}
              
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => fetchLogs(pagination.current)}
                loading={loading}
              >
                Refresh
              </Button>
              
              <Dropdown
                menu={{
                  items: exportMenuItems,
                  onClick: ({ key }) => handleExport(key),
                }}
                disabled={exporting}
              >
                <Button icon={<DownloadOutlined />} loading={exporting}>
                  Export
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        {/* Advanced Filters */}
        {filtersVisible && (
          <div className="advanced-filters">
            <Row gutter={[16, 12]} style={{ marginTop: 16 }}>
              <Col span={6}>
                <label>Logger</label>
                <Select
                  placeholder="Filter by logger"
                  value={selectedLogger}
                  onChange={setSelectedLogger}
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                >
                  {(availableFields.loggers || []).map(logger => (
                    <Option key={logger} value={logger}>{logger}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <label>Thread</label>
                <Select
                  placeholder="Filter by thread"
                  value={selectedThread}
                  onChange={setSelectedThread}
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                >
                  {(availableFields.threads || []).map(thread => (
                    <Option key={thread} value={thread}>{thread}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <label>Date Range</label>
                <RangePicker
                  showTime
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <label>Flags</label>
                <div style={{ marginTop: 4 }}>
                  <Space>
                    <Checkbox
                      checked={hasError === true}
                      onChange={(e) => setHasError(e.target.checked ? true : null)}
                    >
                      Errors Only
                    </Checkbox>
                    <Checkbox
                      checked={hasStackTrace === true}
                      onChange={(e) => setHasStackTrace(e.target.checked ? true : null)}
                    >
                      With Stack Trace
                    </Checkbox>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Results Info */}
      <div className="results-info">
        <Text type="secondary">
          Showing {logs.length} of {pagination.total.toLocaleString()} logs
          {hasActiveFilters && ' (filtered)'}
        </Text>
      </div>

      {/* Logs Table */}
      <Table
        className="logs-table"
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['20', '50', '100', '200'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
        }}
        onChange={handleTableChange}
        size="small"
        scroll={{ x: 1200 }}
        rowClassName={(record) => {
          if (record.level === 'ERROR') return 'log-row-error';
          if (record.level === 'WARN') return 'log-row-warn';
          return '';
        }}
        onRow={(record) => ({
          onClick: () => showLogDetail(record),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Log Detail Drawer */}
      <Drawer
        title={
          <Space>
            <span>Log Entry Details</span>
            {selectedLog?.level && (
              <Tag color={LEVEL_CONFIG[selectedLog.level]?.color}>
                {selectedLog.level}
              </Tag>
            )}
          </Space>
        }
        placement="right"
        width={700}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
      >
        {selectedLog && (
          <div className="log-detail">
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <Text type="secondary">Line Number</Text>
                <div><Text strong>{selectedLog.lineNumber}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Timestamp</Text>
                <div>
                  <Text strong>
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : '-'}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Logger</Text>
                <div><Text code>{selectedLog.logger || '-'}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Thread</Text>
                <div><Text code>{selectedLog.thread || '-'}</Text></div>
              </Col>
              {selectedLog.source && (
                <Col span={12}>
                  <Text type="secondary">Source</Text>
                  <div><Text>{selectedLog.source}</Text></div>
                </Col>
              )}
              {selectedLog.hostname && (
                <Col span={12}>
                  <Text type="secondary">Hostname</Text>
                  <div><Text>{selectedLog.hostname}</Text></div>
                </Col>
              )}
            </Row>

            <div style={{ marginTop: 20 }}>
              <Text type="secondary">Message</Text>
              <Card size="small" className="message-card">
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedLog.message}
                </Paragraph>
              </Card>
            </div>

            {selectedLog.stackTrace && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Stack Trace</Text>
                <Card size="small" className="stacktrace-card">
                  <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', maxHeight: 300 }}>
                    {selectedLog.stackTrace}
                  </pre>
                </Card>
              </div>
            )}

            {selectedLog.rawLine && (
              <Collapse style={{ marginTop: 16 }}>
                <Panel header="Raw Log Line" key="raw">
                  <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                    {selectedLog.rawLine}
                  </pre>
                </Panel>
              </Collapse>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <Collapse style={{ marginTop: 16 }}>
                <Panel header="Metadata" key="metadata">
                  <pre style={{ margin: 0, fontSize: 12 }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </Panel>
              </Collapse>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
