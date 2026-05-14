import { Typography } from 'antd'
import { highlightText } from '../utils/filter'

interface HighlightTextProps {
  text: string
  query: string
  delete?: boolean
}

export default function HighlightText({ text, query, delete: del }: HighlightTextProps) {
  if (!query.trim()) {
    return <Typography.Text delete={del}>{text}</Typography.Text>
  }

  const segments = highlightText(text, query)

  return (
    <Typography.Text delete={del}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark key={i} style={{ background: '#ffd666', padding: '0 1px', borderRadius: 2 }}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </Typography.Text>
  )
}
