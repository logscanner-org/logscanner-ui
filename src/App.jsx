import './App.css'
import { Layout, Drawer, Input, Button, Space, notification } from 'antd'
import Header from './components/Header'
import Footer from './components/Footer'
import LogViewer from './components/LogViewer'
import { useState } from 'react'

const { Content } = Layout

function App() {
  const [loadedText, setLoadedText] = useState('') // shown in LogViewer
  const [pendingText, setPendingText] = useState('') // holds pasted/uploaded logs until analyzed
  const [pasteDrawerOpen, setPasteDrawerOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [timestampFormat, setTimestampFormat] = useState('ISO 8601')

  const handleOpenPaste = () => {
    setPastedText('')
    setPasteDrawerOpen(true)
  }

  const handleClosePaste = () => setPasteDrawerOpen(false)

  const handleLoadPasted = () => {
    setPendingText(pastedText)
    setPasteDrawerOpen(false)
    notification.success({
      message: 'Logs pasted',
      description: 'Log content has been pasted and is ready for analysis.',
      placement: 'topRight',
      duration: 5
    })
  }

  const handleLoadFile = (file, text) => {
    setPendingText(text)
    notification.success({
      message: 'Log file uploaded',
      description: `${file.name} is ready for analysis.`,
      placement: 'topRight',
      duration: 5
    })
    console.log(text);
    console.log('File uploaded:', file.name)
  }

  const handleAnalyze = ({ timestampFormat: fmt }) => {
    setLoadedText(pendingText)
    setTimestampFormat(fmt)
    // TODO: send backend request with pendingText and fmt, then setLoadedText with result
    console.log('Analyze requested with format:', fmt)
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

      <Content style={{ padding: 24 }}>
        <div style={{ background: '#fff', minHeight: 360, padding: 16 }}>
          <h2>Welcome to Log Scanner</h2>
          <p>
            Paste or upload logs, choose the timestamp format, and click <strong>Analyze</strong>.<br />
            <span style={{ color: '#888', fontSize: 13 }}>
              (Logs will only be displayed after you click Analyze)
            </span>
          </p>
          <LogViewer lines={lines} />
        </div>
      </Content>
      <Footer />
    </Layout>
  )
}

export default App
