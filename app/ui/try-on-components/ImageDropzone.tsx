'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, IconButton } from '@mui/material';
import { AddPhotoAlternate, Clear } from '@mui/icons-material';
import { UseFormSetValue, Control, useController } from 'react-hook-form';
import Image from 'next/image';

import { VirtualTryOnFormI, VtoImageObjectI } from '../../api/virtual-try-on-utils';
import theme from '../../theme';
const { palette } = theme;

interface ImageDropzoneProps {
  name: 'humanImage' | `garmentImages.${number}`;
  label: string;
  control: Control<VirtualTryOnFormI>;
  setValue: UseFormSetValue<VirtualTryOnFormI>;
  onNewErrorMsg: (error: string) => void;
}

const dropzoneStyles = {
  border: `2px dashed ${palette.grey[400]}`,
  borderRadius: 2,
  p: 2,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border .24s ease-in-out',
  height: '250px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  '&:hover': {
    borderColor: palette.primary.main,
  },
};

export default function ImageDropzone({ name, label, control, setValue, onNewErrorMsg }: ImageDropzoneProps) {
  const { field } = useController({ name, control });
  const imageValue: VtoImageObjectI = field.value as VtoImageObjectI;

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      onNewErrorMsg('Please upload a valid image file (PNG, JPEG).');
      return;
    }

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64Image = e.target?.result as string;
      const img = document.createElement('img');
      img.onload = () => {
        setValue(name, {
          base64Image: base64Image.split(',')[1],
          format: file.type,
          width: img.width,
          height: img.height,
          key: imageValue.key,
        }, { shouldValidate: true, shouldDirty: true });
      };
      img.src = base64Image;
    };
    reader.readAsDataURL(file);
  }, [setValue, name, onNewErrorMsg, imageValue.key]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    multiple: false,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(name, { base64Image: '', format: '', width: 0, height: 0, key: imageValue.key }, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Box {...getRootProps()} sx={{ ...dropzoneStyles, borderColor: isDragActive ? palette.primary.main : palette.grey[400] }}>
      <input {...getInputProps()} />
      {imageValue.base64Image ? (
        <>
          <Image
            src={`data:${imageValue.format};base64,${imageValue.base64Image}`}
            alt={label}
            fill
            style={{ objectFit: 'contain', borderRadius: '4px' }}
          />
          <IconButton onClick={handleClear} sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)'} }}>
            <Clear sx={{ color: 'white' }} />
          </IconButton>
        </>
      ) : (
        <>
          <AddPhotoAlternate sx={{ fontSize: 40, color: palette.grey[500], mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isDragActive ? 'Drop the image here...' : 'Drag & drop or click to upload'}
          </Typography>
        </>
      )}
    </Box>
  );
}
