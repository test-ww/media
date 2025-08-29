"use client"; // <-- 确保这是客户端组件

import React, { useState } from 'react';
import { Box, IconButton, Stack, CircularProgress } from '@mui/material';
import theme from '../../theme';
import ImageDropzone from './ImageDropzone';
import { maxReferences, ReferenceObjectI, referenceTypeField } from '@/app/api/generate-image-utils';
import { FormInputTextLine } from '../ux-components/InputTextLine';
import FormInputChipGroup from '../ux-components/InputChipGroup';
import { Clear, ForkLeftSharp } from '@mui/icons-material';
import { GeminiButton } from '../ux-components/GeminiButton';
import { getDescriptionFromGemini } from '@/app/api/gemini/action';
import { getAuth } from 'firebase/auth'; // <-- 【核心修改】导入 getAuth

const { palette } = theme;

// [核心] 在组件外部定义汉化后的字段，避免在组件内部重复创建
const translatedReferenceTypeField = {
    ...referenceTypeField,
    label: '参考类型', // 汉化标签
    options: [ // 汉化选项
        { value: 'Person', label: '人物' },
        { value: 'Animal', label: '动物' },
        { value: 'Product', label: '产品' },
        { value: 'Style', label: '风格' },
        { value: 'Default', label: '默认' },
    ]
};

export const ReferenceBox = ({
 objectKey,
 currentReferenceObject,
 onNewErrorMsg,
 control,
 setValue,
 removeReferenceObject,
 addAdditionalRefObject,
 refPosition,
 refCount,
}: {
 objectKey: string;
 currentReferenceObject: ReferenceObjectI;
 onNewErrorMsg: (msg: string) => void;
 control: any;
 setValue: any;
 removeReferenceObject: (objectKey: string) => void;
 addAdditionalRefObject: (objectKey: string) => void;
 refPosition: number;
 refCount: number;
}) => {
 const noImageSet =
  !currentReferenceObject.base64Image;
 const noDescriptionSet =
  !currentReferenceObject.description;
 const noReferenceTypeSet =
  !currentReferenceObject.referenceType;
 const isNewRef = noImageSet && noReferenceTypeSet && noDescriptionSet;
 const isRefIncomplete = noImageSet || noReferenceTypeSet || noDescriptionSet;

 let IDoptions = [];
 for (let i = 1; i <= maxReferences; i++) IDoptions.push({ value: i.toString(), label: i.toString() });

 const [isGettingDescription, setIsGettingDescription] = useState(false);

 const getDescription = async () => {
    // ======================= 【核心修改】: 获取并传递 Token =======================
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        onNewErrorMsg("用户未登录，无法执行此操作。");
        return;
    }
    // ========================================================================

    if (noReferenceTypeSet || noImageSet) {
        onNewErrorMsg("请先上传图片并选择参考类型。");
        return;
    }

    setIsGettingDescription(true);
    try {
        // ======================= 【核心修改】: 获取并传递 Token =======================
        const idToken = await user.getIdToken(true); // 获取用户的认证令牌
        const geminiReturnedDescription = await getDescriptionFromGemini(
            currentReferenceObject.base64Image,
            currentReferenceObject.referenceType,
            idToken // 将令牌作为第三个参数传递
        );
        // ========================================================================

        if (typeof geminiReturnedDescription === 'object' && 'error' in geminiReturnedDescription) {
            onNewErrorMsg(geminiReturnedDescription.error);
        } else {
            setValue(`referenceObjects.${refPosition}.description`, geminiReturnedDescription as string);
        }
    } catch (error: any) {
        console.error("Error in getDescription:", error);
        onNewErrorMsg(error.message || "获取描述时发生未知错误。");
    } finally {
        setIsGettingDescription(false);
    }
 };

 return (
  <Stack
   key={objectKey + refPosition + '_stack'}
   direction="row"
   spacing={2.5}
   justifyContent="flex-start"
   alignItems="flex-start"
   sx={{ pt: 1, pl: 1, width: '100%' }}
  >
   <IconButton
    onClick={() => removeReferenceObject(objectKey)}
    disabled={isNewRef && refCount === 1}
    disableRipple
    sx={{
     border: 0,
     boxShadow: 0,
     p: 0,
     '&:hover': {
      color: palette.primary.main,
      backgroundColor: 'transparent',
      border: 0,
      boxShadow: 0,
     },
    }}
   >
    <Clear sx={{ fontSize: '1.3rem' }} />
   </IconButton>
   <ImageDropzone
    key={objectKey + refPosition + '_dropzone'}
    setImage={(base64Image: string) => setValue(`referenceObjects.${refPosition}.base64Image`, base64Image)}
    image={currentReferenceObject.base64Image}
    onNewErrorMsg={onNewErrorMsg}
    size={{ width: '5vw', height: '5vw' }}
    maxSize={{ width: 70, height: 70 }}
    object={`referenceObjects.${refPosition}`}
    setValue={setValue}
    addAdditionalRefObject={() => addAdditionalRefObject(objectKey)}
    isNewImagePossible={!isRefIncomplete && !currentReferenceObject.isAdditionalImage && refCount < maxReferences}
   />
   {!currentReferenceObject.isAdditionalImage && (
    <>
     <Box sx={{ width: '30%' }}>
      <FormInputChipGroup
       name={`referenceObjects.${refPosition}.referenceType`}
       label={translatedReferenceTypeField.label}
       key={objectKey + refPosition + '_type'}
       control={control}
       setValue={setValue}
       width="100%"
       field={translatedReferenceTypeField}
       required={false}
       disabled={noImageSet}
      />
     </Box>
     <Box>
      {!noReferenceTypeSet && (
       <Box sx={{ width: '100%' }}>
        <FormInputTextLine
         key={objectKey + refPosition + '_description'}
         control={control}
         label={'简短描述 (Short description)'}
         name={`referenceObjects.${refPosition}.description`}
         value={currentReferenceObject.description}
         required={false}
        />
        {isGettingDescription ? (
         <CircularProgress size={20} thickness={6} color="primary" />
        ) : (
         <GeminiButton onClick={getDescription} />
        )}
       </Box>
      )}
     </Box>
    </>
   )}
   {currentReferenceObject.isAdditionalImage && (
    <Box
     sx={{
      border: 'none',
      width: '50%',
     }}
    >
     <ForkLeftSharp sx={{ color: palette.primary.main, fontSize: '1.7rem' }} />
    </Box>
   )}
  </Stack>
 );
};
