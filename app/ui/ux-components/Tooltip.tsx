import React from 'react'
import { Box, Fade, Tooltip } from '@mui/material'
import theme from '../../theme'
const { palette } = theme

// 保持不变
const CustomizedSmallTooltip = {
  sx: { '& .MuiTooltip-tooltip': { backgroundColor: 'transparent', color: palette.text.primary, width: 85, fontWeight: 400, fontSize: 12, lineHeight: 0.9, pt: 1, textAlign: 'center' } },
  modifiers: [ { name: 'offset', options: { offset: [1, -35] } } ],
}

// 保持不变
const CustomizedBigTooltip = {
  sx: { '& .MuiTooltip-tooltip': { backgroundColor: 'transparent', color: palette.text.primary } },
}

// 保持不变
const CustomizedSmallWhiteTooltip = {
  sx: { '& .MuiTooltip-tooltip': { backgroundColor: 'white', color: palette.text.primary, width: 80, fontWeight: 400, fontSize: 12, lineHeight: 0.9, textAlign: 'center' } },
  modifiers: [ { name: 'offset', options: { offset: [1, -17] } } ],
}

// [新增] 专门用于暗色主题画廊的 Tooltip 样式
const CustomizedDarkTooltipStyle = {
  sx: {
    '& .MuiTooltip-tooltip': {
      backgroundColor: palette.background.paper,
      color: palette.text.primary,
      border: `1px solid ${palette.primary.main}`,
      fontSize: 12,
      fontWeight: 500,
    },
  },
}

// 保持不变
export default function CustomTooltip({ children, title, size }: { children: React.ReactElement; title: string; size: string }) {
  const [open, setOpen] = React.useState(false)
  const handleTooltipOpen = () => { setOpen(true) }
  const handleTooltipClose = () => { setOpen(false) }

  return (
    <Tooltip
      title={title} open={open} placement={size === 'small' ? 'bottom' : size === 'big' ? 'right' : 'top'}
      disableInteractive TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}
      slotProps={{ popper: { ...(size === 'small' && CustomizedSmallTooltip), ...(size === 'big' && CustomizedBigTooltip) } }}
    >
      <Box onMouseEnter={handleTooltipOpen} onMouseLeave={handleTooltipClose} onClick={handleTooltipClose} sx={{ display: 'flex' }}>
        {children ? children : null}
      </Box>
    </Tooltip>
  )
}

// 保持不变
export function CustomWhiteTooltip({ children, title, size }: { children: React.ReactElement; title: string; size: string }) {
  const [open, setOpen] = React.useState(false)
  const handleTooltipOpen = () => { setOpen(true) }
  const handleTooltipClose = () => { setOpen(false) }

  return (
    <Tooltip
      title={title} open={open} placement={'bottom'} disableInteractive
      TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}
      slotProps={{ popper: { ...CustomizedSmallWhiteTooltip } }}
    >
      <Box onMouseEnter={handleTooltipOpen} onMouseLeave={handleTooltipClose} onClick={handleTooltipClose} sx={{ display: 'flex' }}>
        {children ? children : null}
      </Box>
    </Tooltip>
  )
}

// [新增] 专门用于暗色主题画廊的 Tooltip 组件
export function CustomDarkTooltip({ children, title }: { children: React.ReactElement; title: string }) {
  const [open, setOpen] = React.useState(false)
  const handleTooltipOpen = () => { setOpen(true) }
  const handleTooltipClose = () => { setOpen(false) }

  return (
    <Tooltip
      title={title} open={open} placement={'top'} disableInteractive
      TransitionComponent={Fade} TransitionProps={{ timeout: 200 }}
      slotProps={{ popper: { ...CustomizedDarkTooltipStyle } }}
    >
      <Box onMouseEnter={handleTooltipOpen} onMouseLeave={handleTooltipClose} onClick={handleTooltipClose} sx={{ display: 'flex' }}>
        {children ? children : null}
      </Box>
    </Tooltip>
  )
}
