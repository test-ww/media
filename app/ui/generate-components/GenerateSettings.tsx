// 文件路径: app/ui/generate-components/GenerateSettings.tsx (最终正确版)

import * as React from 'react'
import { IconButton, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedIconButtonOpen } from '../ux-components/Button-SX'
import FormInputDropdown from '../ux-components/InputDropdown'
import FormInputChipGroup from '../ux-components/InputChipGroup'
import { GenerateSettingsI } from '../ux-components/InputInterface'
import { FormInputTextSmall } from '../ux-components/InputTextSmall'
import { Settings } from '@mui/icons-material'
import CustomTooltip from '../ux-components/Tooltip'
import { FormInputNumberSmall } from '../ux-components/FormInputNumberSmall'

export default function GenerateSettings({
 control,
 setValue,
 generalSettingsFields,
 advancedSettingsFields,
 warningMessage,
}: GenerateSettingsI) {
 const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

 const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
 setAnchorEl(event.currentTarget)
 }

 const open = Boolean(anchorEl)

 const handleClose = () => {
 setAnchorEl(null)
 }

 const CustomizedMenu = {
 '& .MuiPaper-root': {
  boxShadow: 5,
  p: 1,
  width: 280,
  '& .MuiMenuItem-root': {
  p: 1,
  borderRadius: 2,
  },
 },
 }

 return (
 <>
  <CustomTooltip title="打开设置" size="small">
  <IconButton onClick={handleClick} disableRipple sx={{ px: 0.5 }}>
   <Avatar sx={{ ...CustomizedAvatarButton, ...(open === true && CustomizedIconButtonOpen) }}>
   <Settings
    sx={{
    ...CustomizedIconButton,
    ...(open === true && CustomizedIconButtonOpen),
    }}
   />
   </Avatar>
  </IconButton>
  </CustomTooltip>
  <Menu
  anchorEl={anchorEl}
  anchorOrigin={{
   vertical: 'bottom',
   horizontal: 'center',
  }}
  transformOrigin={{
   vertical: 'top',
   horizontal: 'center',
  }}
  open={open}
  onClose={handleClose}
  sx={CustomizedMenu}
   MenuListProps={{
    sx: {
     backgroundColor: 'background.paper',
    },
   }}
  >
  {warningMessage !== '' && (
   <Typography
   color="warning.main"
   sx={{ m: 1, fontSize: '0.7rem', fontWeight: 400, fontStyle: 'italic', px: 1 }}
   >
   {warningMessage}
   </Typography>
  )}
  {Object.entries(generalSettingsFields).map(function ([param, field]) {
   return (
   <MenuItem key={param}>
    <FormInputChipGroup
    name={param}
      // [核心修复] 直接使用 field.label，因为它已经在 utils 文件中被汉化
    label={field.label}
    key={param}
    control={control}
    setValue={setValue}
    width="100%"
    field={field}
    required={true}
    />
   </MenuItem>
   )
  })}

  {Object.entries(advancedSettingsFields).map(function ([param, field]) {
   return (
   <MenuItem key={param}>
    <FormInputDropdown
    name={param}
      // [核心修复] 直接使用 field.label，因为它已经在 utils 文件中被汉化
    label={field.label}
    key={param}
    control={control}
    field={field}
    styleSize="small"
    width="100%"
    required={true}
    />
   </MenuItem>
   )
  })}
  <MenuItem key={'negativePrompt'}>
   <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
   <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
    负向提示词 (Negative prompt)
   </Typography>
   <FormInputTextSmall
    rows={2}
    name="negativePrompt"
    label=""
    control={control}
    required={false}
   />
   </Box>
  </MenuItem>
  <MenuItem key={'seedNumber'}>
   <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
   <Typography variant="body2" sx={{ fontWeight: 500 }}>
    随机种子 (Seed number) (可选)
   </Typography>
   <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal', mb: 1 }}>
    特定的种子和提示词将始终产生相同的输出
   </Typography>
   <FormInputNumberSmall name="seedNumber" control={control} min={1} max={2147483647} />
   </Box>
  </MenuItem>
  </Menu>
 </>
 )
}
