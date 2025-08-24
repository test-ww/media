
import * as React from 'react'

import { EditImageFormFields } from '@/app/api/edit-utils'
import { useState } from 'react'
import {
 Icon,
 List,
 ListItemButton,
 ListItemText,
 ListItem,
 ListItemIcon,
 Typography,
 Menu,
 MenuItem,
 Box,
} from '@mui/material'

import theme from '../../theme'
const { palette } = theme

const CustomizedMenu = {
 sx: {
  '& .MuiPaper-root': {
    // [颜色修复] 使用主题中的 paper 背景色，而不是 'white'
   background: palette.background.paper,
   color: palette.text.primary,
   boxShadow: 1,
  },
 },
}

const CustomizedButtonBase = {
 p: 0,
 width: '45%',
 '&:hover': {
    // [颜色修复] 确保悬浮颜色在深色模式下可见
  bgcolor: 'rgba(255, 255, 255, 0.08)',
  fontWeight: 700,
 },
 '& .MuiListItemIcon-root': {
  position: 'relative',
  left: 7,
  bottom: 2,
  minWidth: 45,
  px: 0,
  color: palette.secondary.main,
 },
 '& .MuiListitemText-root': {
  '& .MuiTypography-root': {
   fontWeight: 700,
  },
 },
}

const CustomizedPrimaryText = {
 fontSize: '1.1rem',
 fontWeight: 500,
 color: palette.primary.main,
}
const CustomizedSecondaryText = {
 fontSize: '0.9rem',
 fontWeight: 400,
 color: palette.secondary.main,
}

const editModeField = EditImageFormFields.editMode
const editModeOptions = editModeField.options

export default function EditModeMenu({
 handleNewEditMode,
 selectedEditMode,
}: {
 handleNewEditMode: any
 selectedEditMode: any
}) {
 const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

 const open = Boolean(anchorEl)
 const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
  setAnchorEl(event.currentTarget)
 }

 const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, value: string) => {
  handleNewEditMode(value)
  setAnchorEl(null)
 }

 const handleClose = () => {
  setAnchorEl(null)
 }

 return (
  <Box
   sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    width: '100%',
   }}
  >
   <Typography
    variant="caption"
    sx={{
     color: palette.text.primary,
     fontSize: '0.9rem',
     fontWeight: 500,
     lineHeight: '1.3em',
    }}
   >
    {editModeField.label}
   </Typography>
    {/* [颜色修复] 将 bgcolor 从 'white' 改为 'transparent'，使其继承父容器的背景色 */}
   <List component="nav" aria-label="Device settings" sx={{ bgcolor: 'transparent', pt: 0.25, pb: 2 }}>
    <ListItemButton
     id="lock-button"
     aria-haspopup="listbox"
     aria-controls={editModeField.label}
     aria-label={editModeField.label}
     aria-expanded={open ? 'true' : undefined}
     onClick={handleClickListItem}
     sx={CustomizedButtonBase}
    >
     <ListItemIcon sx={{ p: 1 }}>
      <Icon>{selectedEditMode?.icon}</Icon>
     </ListItemIcon>
     <ListItemText
      primary={selectedEditMode?.label}
      primaryTypographyProps={CustomizedPrimaryText}
      secondary={selectedEditMode?.description}
      secondaryTypographyProps={CustomizedSecondaryText}
     />
    </ListItemButton>
   </List>
   <Menu
    id="lock-menu"
    anchorEl={anchorEl}
    open={open}
    onClose={handleClose}
    MenuListProps={{
     'aria-labelledby': 'lock-button',
     role: 'listbox',
     dense: true,
    }}
      // [颜色修复] 移除此处多余的 bgcolor: 'white'，直接使用上面修复好的 CustomizedMenu
    sx={CustomizedMenu.sx}
   >
    {editModeOptions.map((option) => (
     <MenuItem
      key={option.label}
      selected={option.value === selectedEditMode?.value}
      disabled={!option.enabled}
      onClick={(event) => handleMenuItemClick(event, option.value)}
      sx={{ py: 1 }}
     >
      <ListItemIcon>
       <Icon>{option.icon}</Icon>
      </ListItemIcon>
      <ListItemText
       primary={option.label}
       primaryTypographyProps={CustomizedPrimaryText}
       secondary={option.description}
       secondaryTypographyProps={CustomizedSecondaryText}
      />
     </MenuItem>
    ))}
   </Menu>
  </Box>
 )
}
