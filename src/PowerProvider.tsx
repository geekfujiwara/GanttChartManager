import { initialize } from "@microsoft/power-apps/app";
import { useEffect, useState, createContext, useContext, type ReactNode } from "react";

interface PowerProviderProps {
    children: ReactNode;
}

interface PowerContextType {
    isInitialized: boolean;
    error: Error | null;
}

const PowerContext = createContext<PowerContextType>({
    isInitialized: false,
    error: null
});

export const usePowerApps = () => useContext(PowerContext);

export default function PowerProvider({ children }: PowerProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const initApp = async () => {
            try {
                console.log('🔄 Initializing Power Platform SDK...');
                
                // アプリケーションの初期化
                await initialize();
                console.log('✅ Power Platform App initialized');
                
                // PowerDataRuntimeが完全に初期化されるのを待つ
                // Office 365 Usersサービスなどが使用可能になるまで待機
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                setIsInitialized(true);
                console.log('✅ Power Platform SDK initialization complete and ready');
            } catch (err) {
                console.error('❌ Failed to initialize Power Platform SDK:', err);
                setError(err as Error);
                // エラーが発生しても、開発モードでは続行させる
                setIsInitialized(false);
            }
        };
        
        initApp();
    }, []);

    return (
        <PowerContext.Provider value={{ isInitialized, error }}>
            {children}
        </PowerContext.Provider>
    );
}