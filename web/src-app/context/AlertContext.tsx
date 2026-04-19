import React, { createContext, useContext, useState, useCallback } from 'react'

interface AlertState {
    isVisible: boolean
    title: string
    message: string
    type: 'alert' | 'confirm'
    onConfirm?: () => void
    onCancel?: () => void
    resolvePromise?: (value: boolean) => void
}

interface AlertContextType {
    showAlert: (title: string, message: string) => void
    showConfirm: (title: string, message: string) => Promise<boolean>
    hideAlert: () => void
    alertState: AlertState
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<AlertState>({
        isVisible: false,
        title: '',
        message: '',
        type: 'alert'
    })

    const showAlert = useCallback((title: string, message: string) => {
        setAlertState({
            isVisible: true,
            title,
            message,
            type: 'alert'
        })
    }, [])

    const showConfirm = useCallback((title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setAlertState({
                isVisible: true,
                title,
                message,
                type: 'confirm',
                resolvePromise: resolve
            })
        })
    }, [])

    const hideAlert = useCallback(() => {
        if (alertState.resolvePromise) {
            alertState.resolvePromise(false)
        }
        setAlertState(prev => ({ ...prev, isVisible: false }))
    }, [alertState])

    const handleConfirm = useCallback(() => {
        if (alertState.resolvePromise) {
            alertState.resolvePromise(true)
        }
        setAlertState(prev => ({ ...prev, isVisible: false }))
    }, [alertState])

    const handleCancel = useCallback(() => {
        if (alertState.resolvePromise) {
            alertState.resolvePromise(false)
        }
        setAlertState(prev => ({ ...prev, isVisible: false }))
    }, [alertState])

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert, alertState }}>
            {children}
            {alertState.isVisible && (
                <CustomAlert
                    state={alertState}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </AlertContext.Provider>
    )
}

export const useAlert = () => {
    const context = useContext(AlertContext)
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider')
    }
    return context
}

// Inline CustomAlert component to avoid circular dependency or extra imports in Provider
import { AppColors } from '../constants/colors'

const CustomAlert: React.FC<{
    state: AlertState,
    onConfirm: () => void,
    onCancel: () => void
}> = ({ state, onConfirm, onCancel }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }} onClick={onCancel}>
            <div style={{
                backgroundColor: AppColors.card,
                borderRadius: '20px',
                padding: '24px',
                width: '90%',
                maxWidth: '380px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                border: `1px solid ${AppColors.border}`
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: AppColors.textPrimary
                }}>
                    {state.title}
                </h3>
                <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    color: AppColors.textSecondary
                }}>
                    {state.message}
                </p>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    {state.type === 'confirm' && (
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: `1px solid ${AppColors.border}`,
                                backgroundColor: 'transparent',
                                color: AppColors.textPrimary,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: AppColors.primaryOrange,
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '15px'
                        }}
                    >
                        {state.type === 'confirm' ? 'Confirm' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    )
}
