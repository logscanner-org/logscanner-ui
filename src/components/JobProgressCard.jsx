import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card, Progress, Tag, Button, Space, Typography, notification } from 'antd'
import './JobProgressCard.css'

const { Text } = Typography

const STATUS_COLOR = {
  PENDING: 'orange',
  PROCESSING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'red'
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const kb = 1024
  if (bytes < kb) return `${bytes} B`
  if (bytes < kb * kb) return `${(bytes / kb).toFixed(2)} KB`
  return `${(bytes / (kb * kb)).toFixed(2)} MB`
}

function elapsed(startedAt) {
  if (!startedAt) return ''
  const start = new Date(startedAt)
  const diff = Date.now() - start.getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export default function JobProgressCard({ initialJob, onDismiss, onComplete }) {
  const [job, setJob] = useState(initialJob)
  const [failCount, setFailCount] = useState(0)
  const pollingRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Keep internal job state in sync when parent provides a new initialJob
  useEffect(() => {
    setJob(initialJob)
    setFailCount(0)
    // ensure any previous polling is stopped; new effect will start polling for new jobId
    stopPolling()
  }, [initialJob, stopPolling])

  useEffect(() => {
    let mounted = true
    const jobId = job?.jobId
    if (!jobId) return

    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8080/logs/status/${jobId}`)
        const data = await res.json()
        if (!mounted) return
        if (data && data.success) {
          setJob((prev) => ({ ...prev, statusData: data.data }))
          // reset failCount on success
          setFailCount(0)
          const st = data.data.status
          if (st === 'COMPLETED') {
            stopPolling()
            notification.success({ message: 'Processing completed', description: data.data.message || 'Done', placement: 'topRight' })
            onComplete?.(data.data)
          } else if (st === 'FAILED' || st === 'CANCELLED') {
            stopPolling()
            notification.error({ message: 'Processing failed', description: data.data.error || data.data.message || 'Failed', placement: 'topRight' })
          }
        } else {
          setFailCount((c) => c + 1)
        }
      } catch (err) {
        setFailCount((c) => c + 1)
        console.error('Polling error', err)
      }
    }

    // start immediate poll then interval
    poll()
    pollingRef.current = setInterval(poll, 2500)

    return () => {
      mounted = false
      stopPolling()
    }
  }, [job?.jobId, stopPolling])

  if (!job) return null

  const status = job.statusData?.status || 'PENDING'
  const progress = job.statusData?.progress ?? 0
  const fileName = job.statusData?.fileName || job.fileName || ''
  const fileSize = job.statusData?.fileSize || job.fileSize || 0
  const message = job.statusData?.message || ''
  const totalLines = job.statusData?.totalLines ?? 0
  const processedLines = job.statusData?.processedLines ?? 0
  const successfulLines = job.statusData?.successfulLines ?? 0
  const failedLines = job.statusData?.failedLines ?? 0
  const linesPerSecond = job.statusData?.linesPerSecond ?? 0
  const startedAt = job.statusData?.startedAt

  return (
    <Card className="job-card" bordered>
      <div className="job-card__head">
        <Space size={6} align="center">
          <Tag color={STATUS_COLOR[status] || 'default'}>{status}</Tag>
          <Text strong title={fileName}>{fileName}</Text>
          <Text type="secondary">{formatBytes(fileSize)}</Text>
        </Space>

        <div>
          {(status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') ? (
            <Button size="small" onClick={() => onDismiss?.(job)}>
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 3 }}>
        <Progress percent={Math.round(progress)} status={status === 'FAILED' ? 'exception' : 'active'} strokeColor={STATUS_COLOR[status] || undefined} strokeWidth={8} />
        <div className="job-card__meta">
          <Text style={{ fontSize: 13 }}>{message}</Text>
          <div className="job-card__stats">
            {totalLines > 0 && <Text type="secondary">{processedLines} / {totalLines} lines</Text>}
            {typeof successfulLines === 'number' && <Text type="secondary">{successfulLines} successful</Text>}
            {typeof failedLines === 'number' && failedLines > 0 && <Text type="danger">{failedLines} failed</Text>}
            {linesPerSecond > 0 && <Text type="secondary">{linesPerSecond.toFixed(2)} l/s</Text>}
            {startedAt && <Text type="secondary">{elapsed(startedAt)}</Text>}
          </div>
        </div>
      </div>
    </Card>
  )
}
