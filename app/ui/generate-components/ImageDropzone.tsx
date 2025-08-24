import { Box, IconButton } from '@mui/material'
import React from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

import theme from '../../theme'
// 【核心修复】: 从新的共享工具文件中导入
import { fileToBase64 } from '@/app/lib/imageUtils'
import { getAspectRatio } from '../edit-components/EditImageDropzone' // 这个导入路径保持不变，因为 getAspectRatio 仍在 EditImageDropzone 中

import { AddPhotoAlternate, ControlPointDuplicate } from '@mui/icons-material'

const { palette } = theme

export default function ImageDropzone({
  setImage,
  image,
  onNewErrorMsg,
  size,
  maxSize,
  object,
  setValue,
  addAdditionalRefObject,
  isNewImagePossible,
}: {
  setImage: (base64Image: string) => void
  image: string | null
  onNewErrorMsg: (msg: string) => void
  size: {
    width: string
    height: string
  }
  maxSize: {
    width: number
    height: number
  }
  object: string
  setValue?: any
  addAdditionalRefObject?: () => void
  isNewImagePossible?: boolean
  refPosition?: number
}) {
  const onDrop = async (acceptedFiles: File[]) => {
    onNewErrorMsg('')

    const file = acceptedFiles[0]
    if (!file) return;

    const allowedTypes = ['image/png', 'image/webp', 'image/jpeg']

    if (!allowedTypes.includes(file.type)) {
      onNewErrorMsg('Wrong input image format - Only png, jpeg and webp are allowed')
      return
    }

    const newImage = await fileToBase64(file)
    setImage(newImage)

    if (setValue) {
      const img = new window.Image()
      img.onload = () => {
        setValue(`${object}.width`, img.width)
        setValue(`${object}.height`, img.height)
        setValue(`${object}.ratio`, getAspectRatio(img.width, img.height))
      }
      img.src = newImage
    }
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return (
    <>
      <Box
        id="DropzoneContainer"
        sx={{
          width: size.width,
          maxWidth: maxSize.width,
          height: size.height,
          maxHeight: maxSize.height,
          position: 'relative',
          m: 0,
          p: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {!image && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'gray',
              border: '1px dotted gray',
              '&:hover': {
                border: '1px solid',
                color: palette.primary.main,
                borderColor: palette.primary.main,
                '& .MuiTypography-root': {
                  color: palette.primary.main,
                  fontWeight: 500,
                },
              },
            }}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <AddPhotoAlternate sx={{ ml: 0.5, fontSize: '1.7rem' }} />
          </Box>
        )}
        {image && (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'inline-block',
              overflow: 'hidden',
            }}
          >
            <Image
              key={image}
              src={image}
              loading="lazy"
              alt={'temp'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              width={0}
              height={0}
              sizes="100vw"
              quality={50}
            />
            {isNewImagePossible && addAdditionalRefObject && (
              <Box
                onClick={addAdditionalRefObject}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                  },
                  cursor: 'pointer',
                }}
              >
                <IconButton
                  onClick={addAdditionalRefObject}
                  disableRipple
                  sx={{
                    color: 'white',
                    border: 0,
                    boxShadow: 0,
                    p: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      border: 0,
                      boxShadow: 0,
                    },
                  }}
                >
                  <ControlPointDuplicate sx={{ fontSize: '1.4rem' }} />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
