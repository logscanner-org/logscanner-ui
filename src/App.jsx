import './App.css'
import { Layout } from 'antd'
import Header from './components/Header'
import { useState } from 'react'

const { Content } = Layout

function App() {
  const [loadedText, setLoadedText] = useState('')

  const handleLoadText = (text) => {
    setLoadedText(text)
    console.log('Loaded text (paste):', text.slice(0, 200))
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
      <Header onLoadText={handleLoadText} onLoadFile={handleLoadFile} onAnalyze={handleAnalyze} />
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
