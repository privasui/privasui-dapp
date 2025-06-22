import { MatrixRain } from './matrix-rain'
import { ConnectButton } from './connect-button'
import { useNavigate } from 'react-router';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect } from 'react';
import { RouteNames } from '@/routes';

export const Connect = () => {
  console.log("🔍 [Connect]");
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const walletConnected = Boolean(currentAccount?.address)

  useEffect(() => {
    if (walletConnected) {
      navigate(`/${RouteNames.CreateProfile}`, { replace: true })
    }
  }, [walletConnected])

  return (
    <div className='w-full h-full'>
      <div className='flex items-center justify-end p-2'>
        <ConnectButton />
      </div>
      <MatrixRain />
    </div>
  )
}
