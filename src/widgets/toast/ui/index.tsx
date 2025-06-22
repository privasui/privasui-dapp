import { Toaster } from "react-hot-toast";

export const Toast = () => {
    return (
        <Toaster 
        position="bottom-right"
        toastOptions={{
        duration: 3,
        style: {
            width: 'auto',
            maxWidth: '420px',
            minWidth: '300px',
            fontFamily: 'monospace',
            border: '1px solid',
            background: '#121212',
            position: 'relative',
            paddingRight: '30px',
        },
        success: {
            style: {
            border: '1px solid #00ff00',
            color: '#00ff00',
            },
        },
        error: {
            style: {
            border: '1px solid #ff4d4d',
            color: '#ff4d4d',
            },
        },
        className: '',
        position: window.innerWidth < 768 ? 'bottom-center' : 'bottom-right',
        }}
        />  
    )
};