
import React from 'react'
import { Controller } from 'react-hook-form'
import { Chip, Stack, Box, Typography, FormControl } from '@mui/material'

import theme from '../../theme'
const { palette } = theme

import { FormChipGroupInputI } from './InputInterface'

const CustomizedChip = {
 fontSize: '0.85rem',
 mb: 0.2,
 border: 1,
 borderColor: palette.secondary.light,
 letterSpacing: '0.06px',
 '&:hover': {
  borderColor: palette.primary.main,
  bgcolor: palette.primary.main,
  transition: 'none',
  color: palette.text.primary,
  fontWeight: 500,
  letterSpacing: '0px',
  px: 0.05,
 },
 '&:active': {
  boxShadow: 0,
 },
 '&.MuiChip-filled': {
  color: 'white',
  letterSpacing: '0.05px',
  '&:hover': {
   letterSpacing: '0px',
  },
 },
 '& .MuiChip-label': {
  px: 0.5,
 },
}

export const ChipGroup = ({
 width,
 label,
 required,
 options,
 value,
 onChange,
 handleChipClick,
 disabled,
 weight,
}: {
 width: string
 label?: string
 required: boolean
  // [核心修复] 允许 options 接收两种类型
 options: (string | { value: string; label: string })[]
 value: string
 onChange: any
 handleChipClick: any
 disabled?: boolean
 weight?: number
}) => {
 return (
  <Box
   sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    width: width,
   }}
  >
   {label !== undefined && (
    <Typography
     variant="caption"
     sx={{
      color: palette.text.primary,
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1.3em',
      pb: 0.5,
     }}
    >
     {label + (required ? ' *' : '')}
    </Typography>
   )}
   <Stack
    direction="row"
    spacing={0}
    sx={{
     flexWrap: 'wrap',
     justifyContent: 'flex-start',
    }}
   >
      {/* [核心修复] 增加逻辑来处理两种不同的 options 格式 */}
     {options.map((option) => {
        const isStringOption = typeof option === 'string';
        const chipValue = isStringOption ? option : option.value;
        const chipLabel = isStringOption ? option : option.label;

        return (
          <Chip
            key={chipValue}
            label={chipLabel}
            size="small"
            component={'button'}
            disabled={disabled}
            onClick={() => handleChipClick({ clickedValue: chipValue, currentValue: value })}
            onChange={onChange}
            variant={value === chipValue ? 'filled' : 'outlined'}
            color={value === chipValue ? 'primary' : 'secondary'}
            sx={{ ...CustomizedChip, ...(weight !== undefined ? { fontWeight: weight } : { fontWeight: 400 }) }}
          />
        )
     })}
   </Stack>
  </Box>
 )
}

export default function FormInputChipGroup({
 name,
 label,
 control,
 width,
 setValue,
 field,
 required,
 disabled,
}: FormChipGroupInputI) {
 const handleChipClick = ({ clickedValue, currentValue }: { clickedValue: string; currentValue: string }) => {
  required
   ? setValue(name, clickedValue)
   : clickedValue !== currentValue
   ? setValue(name, clickedValue)
   : setValue(name, '')
 }

 return field !== undefined ? (
  <FormControl size={'small'}>
   <Controller
    name={name}
    control={control}
    key={name}
    rules={{ required: required }}
    render={({ field: { onChange, value } }) => (
     <ChipGroup
      width={width}
      label={label}
      required={required}
      options={field.options}
      value={value}
      onChange={onChange}
      handleChipClick={handleChipClick}
      disabled={disabled}
     />
    )}
   />
  </FormControl>
 ) : null
}
