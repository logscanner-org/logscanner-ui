import React from 'react'
import { Layout, Typography, Space } from 'antd'
import './Footer.css'

const { Footer: AntFooter } = Layout
const { Text, Link } = Typography

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <AntFooter className="app-footer">
      <div className="app-footer__inner">
        <div>
          <Text type="secondary">© {year} Log Scanner</Text>
          <Text type="secondary"> · </Text>
          <Link href="#" target="_blank" rel="noreferrer">Repository</Link>
          <Text type="secondary"> · </Text>
          <Link href="#" target="_blank" rel="noreferrer">License</Link>
        </div>
      </div>
    </AntFooter>
  )
}
