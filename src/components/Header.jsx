import React, { useState } from 'react'
import { Layout, Button, Select, Upload, Drawer, Input, Space, Typography } from 'antd'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'

const { Header: AntHeader } = Layout
const { TextArea } = Input
const { Option } = Select

export default function Header({ onLoadText, onLoadFile, onAnalyze }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [timestampFormat, setTimestampFormat] = useState('ISO 8601')
  const [customFormat, setCustomFormat] = useState('')

  const uploadProps = {
    accept: '.log,.txt,.json,.gz',
    showUploadList: false,
    beforeUpload(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        onLoadFile?.(file, text)
      }
      reader.readAsText(file)
      return false // prevent antd from uploading
    },
  }

  const handleLoadPasted = () => {
    onLoadText?.(pastedText)
    setDrawerOpen(false)
  }

  const handleAnalyze = () => {
    const fmt = timestampFormat === 'Custom' ? customFormat : timestampFormat
    onAnalyze?.({ timestampFormat: fmt })
  }

  return (
    <AntHeader style={{ background: '#fff', padding: '8px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Log Scanner
          </Typography.Title>
          <Typography.Text type="secondary">UI</Typography.Text>
        </div>

        <div>
          <Space>
            <Button onClick={() => setDrawerOpen(true)}>Paste Logs</Button>

            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>

            <Select value={timestampFormat} onChange={(v) => setTimestampFormat(v)} style={{ width: 220 }}>
              <Option value="ISO 8601">ISO 8601</Option>
              <Option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</Option>
              <Option value="DD/MM/YYYY HH:mm:ss">DD/MM/YYYY HH:mm:ss</Option>
              <Option value="Custom">Custom</Option>
            </Select>

            {timestampFormat === 'Custom' && (
              <Input placeholder="Custom format" value={customFormat} onChange={(e) => setCustomFormat(e.target.value)} />
            )}

            <Button type="primary" onClick={handleAnalyze}>Analyze</Button>
          </Space>
        </div>
      </div>

      <Drawer
        title="Paste logs"
        placement="right"
        width={640}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        <TextArea rows={12} value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Paste log text here..." />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleLoadPasted}>Load</Button>
          </Space>
        </div>
      </Drawer>
    </AntHeader>
  )
}
