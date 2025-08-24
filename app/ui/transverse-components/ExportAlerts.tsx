import React from 'react'
import { Alert, Box, Button, IconButton } from '@mui/material'
import theme from '../../theme'
import { ArrowForwardIos, Close } from '@mui/icons-material'
const { palette } = theme

export const CloseWithoutSubmitWarning = ({ onClose, onKeepOpen }: { onClose: any; onKeepOpen: any }) => {
 return (
  <Alert
   severity="warning"
   sx={{
    height: 'auto',
    mb: 2,
    fontSize: '1rem',
    fontWeight: 500,
    pt: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'left',
      // [颜色修复] 移除硬编码的颜色，让 Alert 组件自动处理
    // color: palette.warning.dark,
   }}
   icon={false}
   variant="outlined"
  >
      {/* [汉化] */}
   {'您确定要立即退出吗？'}
   <Box sx={{ display: 'flex', alignContent: 'center' }}>
    <Button
     color="inherit"
     size="small"
     onClick={onKeepOpen}
     sx={{
      fontSize: '1rem',
      fontWeight: 400,
        // [颜色修复] 使用更清晰的文本颜色
      color: palette.text.primary,
      width: 130,
      '&:hover': { background: 'transparent', color: palette.warning.main, fontWeight: 500 },
     }}
    >
     <ArrowForwardIos sx={{ fontSize: '0.8rem', p: 0, mt: 0.2, mr: 0.5 }} />
        {/* [汉化] */}
     {'不，留在此处'}
    </Button>
    <Button
     color="inherit"
     size="small"
     onClick={onClose}
     sx={{
      fontSize: '1rem',
      fontWeight: 400,
        // [颜色修复] 使用更清晰的文本颜色
      color: palette.text.secondary,
      '&:hover': { background: 'transparent', color: palette.warning.main, fontWeight: 400 },
     }}
    >
     <Close sx={{ fontSize: '0.8rem', p: 0, mt: 0.2, mr: 0.5 }} />
        {/* [汉化] */}
     {'是的，不导出并关闭'}
    </Button>
   </Box>
  </Alert>
 )
}

export const ExportAlerts = ({
 onClose,
 message,
 style,
}: {
 onClose: any
 message: string
 style: 'error' | 'success'
}) => {
 return (
  <Alert
   severity={style}
   action={
      // [汉化]
    <IconButton aria-label="关闭" color="inherit" size="small" onClick={onClose} sx={{ pt: 0.2 }}>
     <Close fontSize="inherit" />
    </IconButton>
   }
   sx={{ 
      height: 'auto', 
      mb: 2, 
      fontSize: 16, 
      fontWeight: 500, 
      pt: 1, 
      // [颜色修复] 移除此行，让 Alert 根据 severity 自动设置最佳颜色
      // color: palette.text.secondary 
    }}
  >
   {message}
  </Alert>
 )
}
