import React, { useState } from 'react'
import { Layout, Button, Select, Upload, Input, Space, Typography } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import './Header.css'

const { Header: AntHeader } = Layout
const { Option } = Select

export default function Header({ onOpenPaste, onLoadFile, onAnalyze }) {
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
  const handleAnalyze = () => {
    const fmt = timestampFormat === 'Custom' ? customFormat : timestampFormat
    onAnalyze?.({ timestampFormat: fmt })
  }

  return (
    <AntHeader className="logscanner-header">
      <div className="logscanner-header__inner">
        <div>
          <a href="#" aria-label="Log Scanner home" className="logscanner-header__brand">
            <img src="/logscanner-logo.svg" alt="Log Scanner logo" className="logscanner-header__logo" />
            <div className="logscanner-header__title">
              <Typography.Title level={4} style={{ margin: 0, color: 'inherit', lineHeight: 1 }}>
                Log Scanner
              </Typography.Title>
            </div>
          </a>
        </div>

        <div className="logscanner-header__controls">
          <Space>
            <Button onClick={() => onOpenPaste?.()}>Paste Logs</Button>

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
    </AntHeader>
  )
}
