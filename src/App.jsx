import './App.css'
import { Layout, Drawer, Input, Button, Space, notification, Tabs, Empty } from 'antd'
import { FileTextOutlined, DashboardOutlined } from '@ant-design/icons'
import Header from './components/Header'
import JobProgressCard from './components/JobProgressCard'
import Footer from './components/Footer'
import LogViewerEnhanced from './components/LogViewerEnhanced'
import { useState, useCallback } from 'react'
import { uploadLogFile } from './services/api'

const { Content } = Layout

function App() {
  // Job state
  const [activeJob, setActiveJob] = useState(null)
  const [completedJobId, setCompletedJobId] = useState(null)
  
  // Upload state
  const [pasteDrawerOpen, setPasteDrawerOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [timestampFormat, setTimestampFormat] = useState('ISO 8601')
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [pendingText, setPendingText] = useState('')

  // Job history for tabs
  const [jobHistory, setJobHistory] = useState([])
  const [activeTabKey, setActiveTabKey] = useState('welcome')

  const handleOpenPaste = () => {
    setPastedText('')
    setPasteDrawerOpen(true)
  }

  const handleClosePaste = () => setPasteDrawerOpen(false)

  const handleLoadPasted = () => {
    setPasteDrawerOpen(false)
    setPendingText(pastedText)
    notification.info({ 
      message: 'Logs ready', 
      description: 'Pasted logs are ready. Select timestamp format and click Analyze.', 
      placement: 'topRight' 
    })
  }

  const doUpload = useCallback(async (fileOrBlob, filename, fmt) => {
    setUploading(true)
    try {
      let file = fileOrBlob
      if (!(fileOrBlob instanceof File)) {
        file = new File([fileOrBlob], filename || 'pasted-log.txt', { type: 'text/plain' })
      }

      const response = await uploadLogFile(file, fmt)
      
      if (response && response.success) {
        notification.success({ 
          message: 'Upload queued', 
          description: response.message || 'File queued for processing', 
          placement: 'topRight' 
        })
        
        const newJob = { 
          jobId: response.data.jobId, 
          fileName: response.data.fileName, 
          fileSize: response.data.fileSize, 
          initialData: response.data 
        }
        
        setActiveJob(newJob)
        setActiveTabKey('progress')
        setPendingFile(null)
        setPendingText('')
      } else {
        notification.error({ 
          message: 'Upload failed', 
          description: response?.message || 'Server responded with an error', 
          placement: 'topRight' 
        })
      }
    } catch (err) {
      console.error('Upload error', err)
      notification.error({ 
        message: 'Upload error', 
        description: String(err.message || err), 
        placement: 'topRight' 
      })
    } finally {
      setUploading(false)
    }
  }, [])

  const handleLoadFile = (file) => {
    setPendingFile(file)
    notification.info({ 
      message: 'File ready', 
      description: `${file.name} selected. Choose timestamp format and click Analyze.`, 
      placement: 'topRight' 
    })
  }

  const handleAnalyze = ({ timestampFormat: fmt }) => {
    setTimestampFormat(fmt)
    if (pendingFile) {
      doUpload(pendingFile, pendingFile.name, fmt)
    } else if (pendingText) {
      const blob = new Blob([pendingText], { type: 'text/plain' })
      doUpload(blob, 'pasted-log.txt', fmt)
    } else {
      notification.warning({ 
        message: 'No logs', 
        description: 'Please paste logs or select a file before clicking Analyze.', 
        placement: 'topRight' 
      })
    }
  }

  const handleJobComplete = useCallback((statusData) => {
    const jobId = statusData.jobId || activeJob?.jobId
    if (jobId) {
      // Add to job history if not already present
      setJobHistory(prev => {
        if (!prev.find(j => j.jobId === jobId)) {
          return [...prev, {
            jobId,
            fileName: statusData.fileName || activeJob?.fileName,
            completedAt: new Date().toISOString(),
          }]
        }
        return prev
      })
      
      setCompletedJobId(jobId)
      setActiveTabKey(`logs-${jobId}`)
      
      notification.success({
        message: 'Processing Complete!',
        description: 'Your logs are ready for analysis. Click on the Logs tab to explore.',
        placement: 'topRight',
      })
    }
  }, [activeJob])

  const handleDismissJob = useCallback(() => {
    setActiveJob(null)
    if (completedJobId) {
      setActiveTabKey(`logs-${completedJobId}`)
    } else {
      setActiveTabKey('welcome')
    }
  }, [completedJobId])

  const handleTabChange = (key) => {
    setActiveTabKey(key)
  }

  const removeJobTab = (targetKey) => {
    setJobHistory(prev => prev.filter(j => `logs-${j.jobId}` !== targetKey))
    if (activeTabKey === targetKey) {
      setActiveTabKey(jobHistory.length > 1 ? `logs-${jobHistory[0].jobId}` : 'welcome')
    }
  }

  // Build tabs
  const tabItems = [
    {
      key: 'welcome',
      label: (
        <span>
          <DashboardOutlined />
          Dashboard
        </span>
      ),
      children: (
        <div className="welcome-content">
          <div className="welcome-section">
            <h2>Welcome to Log Scanner</h2>
            <p>
              Upload or paste your log files to analyze them. The scanner supports various log formats 
              including Log4j, Logback, JSON (NDJSON), CSV, Apache, Syslog, and more.
            </p>
            
            <div className="quick-actions">
              <Space size="large">
                <Button type="primary" size="large" onClick={handleOpenPaste}>
                  Paste Logs
                </Button>
                <Button size="large" onClick={() => document.querySelector('.ant-upload input')?.click()}>
                  Upload File
                </Button>
              </Space>
            </div>

            <div className="features-list">
              <h3>Features</h3>
              <ul>
                <li>🔍 Full-text search across log messages and stack traces</li>
                <li>🎯 Filter by log level, logger, thread, and time range</li>
                <li>📊 Real-time statistics and level distribution</li>
                <li>📑 Pagination for large log files</li>
                <li>⬇️ Export filtered results to CSV, JSON, or NDJSON</li>
                <li>🔎 View detailed log entries with stack traces</li>
              </ul>
            </div>
          </div>

          {/* Show progress card if there's an active job */}
          {activeJob && (
            <div className="progress-section">
              <h3>Processing Status</h3>
              <JobProgressCard
                initialJob={activeJob}
                onDismiss={handleDismissJob}
                onComplete={handleJobComplete}
              />
            </div>
          )}
        </div>
      ),
    },
  ]

  // Add progress tab if there's an active job
  if (activeJob && activeTabKey === 'progress') {
    tabItems.push({
      key: 'progress',
      label: (
        <span>
          <FileTextOutlined />
          Processing...
        </span>
      ),
      children: (
        <div className="progress-tab-content">
          <JobProgressCard
            initialJob={activeJob}
            onDismiss={handleDismissJob}
            onComplete={handleJobComplete}
          />
        </div>
      ),
    })
  }

  // Add tabs for completed jobs
  jobHistory.forEach(job => {
    tabItems.push({
      key: `logs-${job.jobId}`,
      label: (
        <span>
          <FileTextOutlined />
          {job.fileName || 'Logs'}
        </span>
      ),
      closable: true,
      children: (
        <LogViewerEnhanced jobId={job.jobId} />
      ),
    })
  })

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        onOpenPaste={handleOpenPaste}
        onLoadFile={handleLoadFile}
        onAnalyze={handleAnalyze}
        timestampFormat={timestampFormat}
        setTimestampFormat={setTimestampFormat}
        uploading={uploading}
      />

      <Drawer
        title="Paste logs"
        placement="right"
        width={640}
        onClose={handleClosePaste}
        open={pasteDrawerOpen}
      >
        <Input.TextArea 
          rows={16} 
          value={pastedText} 
          onChange={(e) => setPastedText(e.target.value)} 
          placeholder="Paste log text here..." 
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClosePaste}>Cancel</Button>
            <Button type="primary" onClick={handleLoadPasted} disabled={!pastedText.trim()}>
              Load
            </Button>
          </Space>
        </div>
      </Drawer>

      <Content style={{ padding: '0 16px', paddingTop: 8 }}>
        <div className="main-content">
          <Tabs
            activeKey={activeTabKey}
            onChange={handleTabChange}
            type="editable-card"
            hideAdd
            onEdit={(targetKey, action) => {
              if (action === 'remove') {
                removeJobTab(targetKey)
              }
            }}
            items={tabItems}
          />
        </div>
      </Content>
      
      <Footer />
    </Layout>
  )
}

export default App
