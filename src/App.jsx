import './App.css'
import { Layout, Drawer, Input, Button, Space } from 'antd'
import Header from './components/Header'
import { useState } from 'react'

const { Content } = Layout

function App() {
  const [loadedText, setLoadedText] = useState('')
  const [pasteDrawerOpen, setPasteDrawerOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')

  const handleOpenPaste = () => {
    setPastedText('')
    setPasteDrawerOpen(true)
  }

  const handleClosePaste = () => setPasteDrawerOpen(false)

  const handleLoadPasted = () => {
    setLoadedText(pastedText)
    console.log('Loaded pasted text:', pastedText.slice(0, 200))
    setPasteDrawerOpen(false)
  }

  const handleLoadFile = (file, text) => {
    setLoadedText(text)
    console.log('Loaded file:', file.name)
  }

  const handleAnalyze = ({ timestampFormat }) => {
    console.log('Analyze requested with format:', timestampFormat)
    // TODO: call backend analyze endpoint and display results
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header onOpenPaste={handleOpenPaste} onLoadFile={handleLoadFile} onAnalyze={handleAnalyze} />

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
          <p>Paste or upload logs, choose the timestamp format, and click <strong>Analyze</strong>.</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{loadedText ? loadedText.substring(0, 2000) : 'No logs loaded yet.'}</pre>
        </div>
      </Content>
    </Layout>
  )
}

export default App
