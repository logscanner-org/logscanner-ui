import React from 'react'
import { Virtuoso } from 'react-virtuoso'
import './LogViewer.css'

export default function LogViewer({ lines = [] }) {
  return (
    <div className="logviewer">
      <Virtuoso
        data={lines}
        style={{ height: '60vh' }}
        itemContent={(index, line) => (
          <div className="logviewer__line" data-index={index} key={index}>
            <div className="logviewer__index">{index + 1}</div>
            <div className="logviewer__text">{line}</div>
          </div>
        )}
      />
    </div>
  )
}
