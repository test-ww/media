"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirebaseInstances } from "../lib/firebase/client";
import { exportStandardFields, ExportMediaFormFieldsI } from "../api/export-utils";
import { fetchJsonFromStorage } from "../api/cloud-storage/action";


export interface appContextDataI {
  gcsURI?: string;
  userID?: string;
  user: User | null;
  exportMetaOptions?: ExportMediaFormFieldsI;
  isLoading: boolean;
  imageToEdit?: string;
  imageToVideo?: string;
  promptToGenerateImage?: string;
  promptToGenerateVideo?: string;
}
interface AppContextType {
  appContext: appContextDataI | null;
  setAppContext: React.Dispatch<React.SetStateAction<AppContextType["appContext"]>>;
  error: Error | string | null;
  setError: React.Dispatch<React.SetStateAction<Error | string | null>>;
}
export const appContextDataDefault: appContextDataI = {
  gcsURI: "",
  userID: "",
  user: null,
  exportMetaOptions: undefined,
  isLoading: true,
  imageToEdit: "",
  imageToVideo: "",
  promptToGenerateImage: "",
  promptToGenerateVideo: "",
};
const AppContext = createContext<AppContextType>({
  appContext: appContextDataDefault,
  setAppContext: () => {},
  error: null,
  setError: () => {},
});


export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [appContext, setAppContext] = useState<AppContextType["appContext"]>(appContextDataDefault);
  const [error, setError] = useState<Error | string | null>(null);

  useEffect(() => {
    const { auth } = getFirebaseInstances();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const gcsURI = `gs://${process.env.NEXT_PUBLIC_OUTPUT_BUCKET}`;
          const exportMetaOptionsURI = process.env.NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI!;
          console.log(
            "DEBUG: Constructed GCS output path for context:",
            gcsURI
          );

          const exportMetaOptions = await fetchJsonFromStorage(exportMetaOptionsURI);

          if (!exportMetaOptions) {
            throw new Error("Could not fetch export metadata options");
          }

          const ExportImageFormFields: ExportMediaFormFieldsI = { ...exportStandardFields, ...exportMetaOptions };

          setAppContext({
            ...appContextDataDefault,
            user: user,
            userID: user.uid,
            gcsURI: gcsURI,
            exportMetaOptions: ExportImageFormFields,
            isLoading: false,
          });
          setError(null);
        } catch (configError: any) {
          console.error("Failed to fetch app configuration:", configError);
          setError("无法加载应用配置。部分功能可能不可用。");

          setAppContext({
            ...appContextDataDefault,
            user: user,
            userID: user.uid,
            isLoading: false,
            exportMetaOptions: undefined,
          });
        }
      } else {
        setAppContext({
          ...appContextDataDefault,
          isLoading: false,
          user: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const contextValue = {
    appContext,
    setAppContext,
    error,
    setError,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
