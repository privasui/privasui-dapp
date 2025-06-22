import toast from 'react-hot-toast'; // Or your preferred toast library

// Enhanced toast utility with duration control and dismissal
export const addToast = {
  success: (message: string, duration?: number) => {
    toast.success(message, {
      duration: duration || 4000, // Use provided duration or default
      style: {
        fontFamily: 'monospace',
        border: '1px solid #00ff00',
        background: '#121212',
        color: '#00ff00',
      },
    });
  },
  
  error: (message: string, duration?: number) => {
    toast.error(message, {
      duration: duration || 7000, // Use provided duration or default
      style: {
        fontFamily: 'monospace',
        border: '1px solid #ff4d4d',
        background: '#121212',
        color: '#ff4d4d',
      },
    });
  },
  
  info: (message: string, duration?: number) => {
    toast(message, {
      duration: duration || 5000,
      style: {
        fontFamily: 'monospace',
        border: '1px solid #3291ff',
        background: '#121212',
        color: '#3291ff',
      },
    });
  },
  
  // Clear all toasts
  dismissAll: () => {
    toast.dismiss();
  },
  
  // Dismiss a specific toast if you have its ID
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
  
  // Get toast ID when creating (for manual dismissal later)
  successWithId: (message: string, duration?: number) => {
    return toast.success(message, {
      duration: duration || 4000,
      style: {
        fontFamily: 'monospace',
        border: '1px solid #00ff00',
        background: '#121212',
        color: '#00ff00',
      },
    });
  },
  
  // Translate common errors to user-friendly messages
  formatError: (error: Error): string => {
    const errorMsg = error.message.toLowerCase();
    
    // Gas balance errors
    if (errorMsg.includes("no valid gas coins found")) {
      return "You don't have any SUI tokens to pay for transaction fees. Please get some SUI before continuing.";
    } 
    
    if (errorMsg.includes("balance of gas object") && errorMsg.includes("is lower than the needed amount")) {
      // Extract the available and needed amounts if possible
      const matches = errorMsg.match(/balance of gas object (\d+) is lower than the needed amount: (\d+)/i);
      if (matches && matches.length >= 3) {
        const available = parseInt(matches[1]) / 1000000000;
        const needed = parseInt(matches[2]) / 1000000000;
        return `Insufficient SUI balance. Available: ${available.toFixed(3)} SUI, Required: ${needed.toFixed(3)} SUI`;
      }
      return "Insufficient SUI balance for this transaction. Please add more SUI to your wallet.";
    }
    
    // Account errors
    if (errorMsg.includes("no account found")) {
      return "Account not found or not connected";
    }
    
    // Transaction errors
    if (errorMsg.includes("transaction validator signing failed")) {
      return "Transaction failed during validation. Please try again.";
    }
    
    // Return the original message if no specific handler
    return `Error: ${error.message}`;
  }
}; 