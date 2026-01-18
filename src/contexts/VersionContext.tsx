import { createContext, useContext } from 'react';

export interface VersionContextValue {
    readOnly: boolean;
    versionId?: string;
}

const VersionContext = createContext<VersionContextValue>({ readOnly: false });

export const VersionProvider = VersionContext.Provider;

export const useVersionContext = () => useContext(VersionContext);
