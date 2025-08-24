'use client'

import * as React from 'react'
import { useForm, SubmitHandler, useWatch } from 'react-hook-form'
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
  IconButton,
  Stack,
  Avatar,
} from '@mui/material'
import {
  Send as SendIcon,
  WatchLater as WatchLaterIcon,
  ArrowDownward as ArrowDownwardIcon,
  Autorenew,
} from '@mui/icons-material'

import theme from '../../theme'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from '../ux-components/Button-SX'
import { useEffect, useRef } from 'react'
import CustomTooltip from '../ux-components/Tooltip'
import { CustomizedAccordionSummary } from '../ux-components/Accordion-SX'
import { FilterMediaFormI } from '../../api/export-utils'
import FormInputChipGroupMultiple from '../ux-components/InputChipGroupMultiple'
import { useAppContext, appContextDataDefault } from '../../context/app-context'

const { palette } = theme

export default function LibraryFiltering({
  isMediasLoading,
  setIsMediasLoading,
  setErrorMsg,
  submitFilters,
  openFilters,
  setOpenFilters,
}: {
  isMediasLoading: boolean
  setIsMediasLoading: any
  setErrorMsg: any
  submitFilters: any
  openFilters: boolean
  setOpenFilters: any
}) {
  const { handleSubmit, reset, control, setValue } = useForm<FilterMediaFormI>()

  const { appContext } = useAppContext()
  const ExportImageFormFields = appContext ? appContext.exportMetaOptions : appContextDataDefault.exportMetaOptions
  let temp2: any = []
  if (ExportImageFormFields) {
    Object.entries(ExportImageFormFields).forEach(([name, field]) => {
      if (field.isExportVisible && field.options !== undefined) {
        temp2.push({ key: name, field: field })
      }
    })
  }

  const MetadataFilterFields = temp2

  const watchedFields = useWatch({ control })
  const watchedFieldValues = useWatch({
    control,
    name: MetadataFilterFields.map((field: { key: any }) => field.key),
  })

  const prevSelectedFields = useRef<Set<string>>(new Set())

  useEffect(() => {
    const activeFieldKeys = MetadataFilterFields.filter(
      (field: { key: string | number }) => watchedFields[field.key]?.length > 0
    ).map((field: { key: any }) => field.key)

    const newSelections = activeFieldKeys.filter((key: any) => !prevSelectedFields.current.has(key))

    if (newSelections.length > 0)
      MetadataFilterFields.forEach((field: { key: any }) => {
        if (!newSelections.includes(field.key)) setValue(field.key, [])
      })

    prevSelectedFields.current = new Set(activeFieldKeys)
  }, [watchedFieldValues, setValue])

  const onSubmit: SubmitHandler<FilterMediaFormI> = async (formData: FilterMediaFormI) => {
    setIsMediasLoading(true)
    setOpenFilters(false)

    try {
      submitFilters(formData)
    } catch (error: any) {
      setErrorMsg(error.toString())
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Accordion
        disableGutters
        sx={{
          // [最终修复] 将背景色改为透明，以解决白色背景问题
          backgroundColor: 'transparent',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
        }}
        expanded={openFilters}
        onChange={() => setOpenFilters(!openFilters)}
      >
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={CustomizedAccordionSummary}
        >
          <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
            {'设置筛选器'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ 
          pt: 1, 
          pl: 3, 
          // [最终修复] 将背景色改为透明，以解决白色背景问题
          bgcolor: 'transparent' 
        }}>
          <Typography
            display="inline"
            sx={{ fontSize: '0.9rem', fontStyle: 'italic', color: palette.text.secondary, my: 2 }}
          >
            {'筛选器可以有多个值，但一次只能使用一个筛选器'}
          </Typography>
          <Stack direction="row" spacing={5} sx={{ pr: 4, pt: 2 }}>
            {MetadataFilterFields.map(function ({ key, field }: any) {
              return (
                <Box key={key} width="100%" sx={{ px: 0 }}>
                  <FormInputChipGroupMultiple
                    name={key}
                    label={field.label}
                    key={key}
                    control={control}
                    setValue={setValue}
                    width="400"
                    options={field.options}
                    required={false}
                  />
                </Box>
              )
            })}
          </Stack>
          <Stack direction="row" gap={1} sx={{ pt: 2, pl: 0 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isMediasLoading}
              endIcon={isMediasLoading ? <WatchLaterIcon /> : <SendIcon />}
              sx={{ ...CustomizedSendButton, ...{ ml: 0 } }}
            >
              {'获取'}
            </Button>
            <CustomTooltip title="重置所有筛选器" size="small">
              <IconButton onClick={() => reset()} aria-label="重置表单" disableRipple sx={{ px: 0.5 }}>
                <Avatar sx={CustomizedAvatarButton}>
                  <Autorenew sx={CustomizedIconButton} />
                </Avatar>
              </IconButton>
            </CustomTooltip>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </form>
  )
}
