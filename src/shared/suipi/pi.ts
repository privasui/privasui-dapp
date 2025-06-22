import { SuiClient } from '@mysten/sui/client';
import { getNetworkVariable } from '@/shared/network-config';

const PI_OBJECT_ID = getNetworkVariable("PI_OBJECT_ID");

// ** fetch the pi shared object with the initial shared version
export const fetchPiSharedObject = async (client: SuiClient): Promise<any> => {
    const sharedObject = await client.getObject({
      id: PI_OBJECT_ID,
      options: { showContent: true, showOwner: true }
    });
  
    if (!sharedObject.data?.owner || typeof sharedObject.data.owner !== 'object' || !('Shared' in sharedObject.data.owner)) {
      throw new Error('Object is not a shared object');
    }
  
    const initialSharedVersion = Number(sharedObject.data.owner.Shared.initial_shared_version);
  
    return {
      objectId: PI_OBJECT_ID,
      mutable: true,
      initialSharedVersion: initialSharedVersion
    }
}