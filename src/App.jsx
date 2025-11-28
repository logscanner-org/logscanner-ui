import './App.css'
import { Layout, Drawer, Input, Button, Space, notification } from 'antd'
import Header from './components/Header'
import JobProgressCard from './components/JobProgressCard'
import Footer from './components/Footer'
import LogViewer from './components/LogViewer'
import { useState } from 'react'

const { Content } = Layout

function App() {
  const [loadedText, setLoadedText] = useState('') // shown in LogViewer
  const [pasteDrawerOpen, setPasteDrawerOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [timestampFormat, setTimestampFormat] = useState('ISO 8601')
  const [uploading, setUploading] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [pendingText, setPendingText] = useState('')

  const handleOpenPaste = () => {
    setPastedText('')
    setPasteDrawerOpen(true)
  }

  const handleClosePaste = () => setPasteDrawerOpen(false)

  const handleLoadPasted = () => {
    setPasteDrawerOpen(false)
    // store pasted text as pending until Analyze is clicked
    setPendingText(pastedText)
    notification.info({ message: 'Logs ready', description: 'Pasted logs are ready. Select timestamp format and click Analyze.', placement: 'topRight' })
  }
  const uploadLogFile = async (fileOrBlob, filename, fmt) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('timestampFormat', fmt ?? timestampFormat)
      // if it's a File instance use it directly, otherwise wrap Blob with name
      if (fileOrBlob instanceof File) {
        form.append('logfile', fileOrBlob)
      } else {
        form.append('logfile', fileOrBlob, filename || 'pasted-log.txt')
      }

      const res = await fetch('http://localhost:8080/logs/upload', {
        method: 'POST',
        body: form
      })

      const data = await res.json()
      if (res.ok && data && data.success) {
        notification.success({ message: 'Upload queued', description: data.message || 'File queued for processing', placement: 'topRight' })
        // store active job
        setActiveJob({ jobId: data.data.jobId, fileName: data.data.fileName, fileSize: data.data.fileSize, initialData: data.data })
        // clear pending after upload queued
        setPendingFile(null)
        setPendingText('')
      } else {
        console.error('Upload failed', data)
        notification.error({ message: 'Upload failed', description: data?.message || 'Server responded with an error', placement: 'topRight' })
      }
    } catch (err) {
      console.error('Upload error', err)
      notification.error({ message: 'Upload error', description: String(err), placement: 'topRight' })
    } finally {
      setUploading(false)
    }
  }

  const handleLoadFile = (file) => {
    // file is a File object from Header; store as pending until Analyze is clicked
    setPendingFile(file)
    notification.info({ message: 'File ready', description: `${file.name} selected. Choose timestamp format and click Analyze.`, placement: 'topRight' })
  }

  const handleAnalyze = ({ timestampFormat: fmt }) => {
    // start upload using pending file or pasted text
    setTimestampFormat(fmt)
    // determine what to upload
    if (pendingFile) {
      uploadLogFile(pendingFile, pendingFile.name, fmt)
    } else if (pendingText) {
      const blob = new Blob([pendingText], { type: 'text/plain' })
      uploadLogFile(blob, 'pasted-log.txt', fmt)
    } else {
      notification.warning({ message: 'No logs', description: 'Please paste logs or select a file before clicking Analyze.', placement: 'topRight' })
    }
  }

  const lines = loadedText ? loadedText.split(/\r?\n/) : []

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        onOpenPaste={handleOpenPaste}
        onLoadFile={handleLoadFile}
        onAnalyze={handleAnalyze}
        timestampFormat={timestampFormat}
        setTimestampFormat={setTimestampFormat}
      />

      <Drawer
        title="Paste logs"
        placement="right"
        width={640}
        onClose={handleClosePaste}
        open={pasteDrawerOpen}
      >
        <Input.TextArea rows={12} value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Paste log text here..." />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClosePaste}>Cancel</Button>
            <Button type="primary" onClick={handleLoadPasted}>Load</Button>
          </Space>
        </div>
      </Drawer>

      <Content style={{ padding: 15, paddingTop: 10 }}>
        <div style={{ background: '#fff', minHeight: 360, padding: 16, paddingTop: 5 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flexBasis: '35%', maxWidth: '40%', minWidth: 240 }}>
              <h2 style={{ marginTop: 0 }}>Welcome to Log Scanner</h2>
              <p>
                Paste or upload logs, choose the timestamp format, and monitor processing below.<br />
                <span style={{ color: '#888', fontSize: 13 }}>
                  (Processing starts after upload; progress will appear below)
                </span>
              </p>
            </div>

            <div style={{ flexBasis: '60%', flexGrow: 1, minWidth: 260, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
              {activeJob ? (
                <div style={{ width: '100%' }}>
                  <JobProgressCard
                    initialJob={activeJob}
                    onDismiss={() => setActiveJob(null)}
                    onComplete={async (statusData) => {
                      try {
                        if (statusData.resultUrl) {
                          const res = await fetch(`http://localhost:8080${statusData.resultUrl}`)
                          const result = await res.json()
                          const processed = result.processedLogs ?? result.data?.processedLogs ?? result.data?.fileContent ?? null
                          if (processed) setLoadedText(processed)
                        }
                      } catch (err) {
                        console.error('Failed to fetch result:', err)
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 2, width: '100%' }}>
            <LogViewer lines={lines} />
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  )
}

export default App
