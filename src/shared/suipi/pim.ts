import { SuiClient } from '@mysten/sui/client';
import { getNetworkVariable } from '@/shared/network-config';
import { generateConversationId } from '@/shared/cryptography';
import { Message, MessageStream } from '@/shared/types';
import { getItemRegistryDataWithStringKey, getPackageItemRegistry, DynItem, getItemRegistryDataWithAddressKey } from './pir';
import { PackagesEnum } from './pir';

const PIM_PACKAGE_ID_ORIGINAL = getNetworkVariable("PIM_PACKAGE_ID_ORIGINAL");


const  findValueByKeyInVecMap = (vecMap: any, keyToFind: string): string | null => {
    if (!vecMap || !vecMap.fields || !vecMap.fields.contents) {
      return null;
    }
    
    const entries = vecMap.fields.contents;
    
    for (const entry of entries) {
      if (entry.fields && entry.fields.key === keyToFind) {
        return entry.fields.value;
      }
    }
    
    return null;
}

export interface PrivasuiRegistries {
    chatRegistryId: string;
    profileRegistryId: string;
}

export interface PrivasuiMessageStream {
    id: string;
    owner: string;
    linked_stream_owner: string;
    linked_stream: string;
    data: {
      fields: {
        id: {
          id: string;
        };
        size: string;
      };
    };
    next_id: string;
}

export interface PimProfileInterface {
  created_at: string;
  owner: string;
  xpubkey: Uint8Array;
}

export const fetchPiMProfileByAddress = async (suiClient: SuiClient, address: string): Promise<PimProfileInterface | null> => {
  const {id: profileRegistryId } = await getPackageItemRegistry(suiClient, PackagesEnum.PIM, "profile::ProfileRegistry");
  let pimProfile = await getItemRegistryDataWithAddressKey(suiClient, profileRegistryId, address);
  
  if(!pimProfile){
    return null;
  }

  let ret: PimProfileInterface = {
    created_at: pimProfile.value.fields.created_at,
    owner: pimProfile.value.fields.owner,
    xpubkey: pimProfile.value.fields.xpubkey,
  };

  return ret;
}

export const fetchConversationOwnerStreamId = async (
    suiClient: SuiClient,
    currentAccountAddress: string,
    recipientAccountAddress: string,
  ): Promise<string | null> => {
        const conversationId = generateConversationId(currentAccountAddress, recipientAccountAddress);

        const {id: chatRegistryId } = await getPackageItemRegistry(suiClient, PackagesEnum.PIM, "chat::ChatRegistry");
  
        const conversationItem: DynItem | null = await getItemRegistryDataWithStringKey(suiClient, chatRegistryId, conversationId); 

        if(!conversationItem){
            return null;
        }
    
        //@ts-ignore
        let ownerStreamId = findValueByKeyInVecMap(conversationItem.value, currentAccountAddress);
    
        if(!ownerStreamId){
          return null;
        }
  
        return ownerStreamId;
}


export const fetchStreamMessages = async(
    suiClient: SuiClient,
    tableId: string,
    startIndex: number,
    endIndex: number = 0,
  ): Promise<Message[]> => {
    const messages: Message[] = [];
  
    console.log(
      `🔍 [fetchStreamMessages] Fetching messages from ${startIndex} to ${endIndex}`,
    );
  
    // Ensure indices are non-negative
    startIndex = Math.max(0, startIndex);
    endIndex = Math.max(0, endIndex);
  
    for (let i = startIndex; i >= endIndex; i--) {
      try {
        const { data: msgData } = await suiClient.getDynamicFieldObject({
          parentId: tableId,
          name: {
            type: "u64",
            value: i.toString(),
          },
        });
  
        if (!msgData?.content || !("fields" in msgData.content)) {
          console.log(`⚠️ No content for message ${i}`);
          continue;
        }
  
        //@ts-ignore
        const value = (msgData.content.fields as any).value.fields;
  
        messages.push({
          id: msgData.objectId,
          sender: value.sender,
          content: value.content,
          content_type: value.content_type,
          nonce: value.nonce,
          timestamp: value.timestamp,
          digest: msgData.digest,
        });
      } catch (err) {
        console.error(`❌ [fetchStreamMessages] Error fetching message ${i}:`,err);
      }
    }
  
    // Sort messages by timestamp for consistency
    return messages.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
}

  
export const fetchStreamById = async (suiClient: SuiClient, streamId: string): Promise<MessageStream | null> => {
    console.log("🔍 [fetchStreamById] streamId:", streamId);
    const stream = await suiClient.getObject({
      id: streamId,
      options: {
        showContent: true
      }
    });
  
    if(!stream || !stream.data?.content || !('fields' in stream.data.content)){
      return null;
    }
  
    console.log("🔍 [fetchStreamById] stream: ", streamId, stream.data.content.fields);
  
    const streamFields =stream.data.content.fields as unknown as PrivasuiMessageStream;
  
    if(!streamFields) {
      return null;
    }
  
    return {
      id: stream.data.objectId,
      owner: streamFields.owner,
      pair: streamFields.linked_stream_owner || streamFields.owner,
      pair_stream: streamFields.linked_stream || stream.data.objectId,
      messages: streamFields.data,
      next_id: streamFields.next_id,
    };
}
  
// TODO::AVAR - maybe we need to better read ... 
export const fetchStreams = async (suiClient: SuiClient, address: string): Promise<MessageStream[]> => {
    try {
      const streams = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${PIM_PACKAGE_ID_ORIGINAL}::stream::Stream<${PIM_PACKAGE_ID_ORIGINAL}::chat::Message>`
        },
        options: {
          showContent: true
        }
      });
  
      if(!streams || !streams.data || streams.data.length === 0){
        return [];
      }
  
      const parsedStreams: MessageStream[] = streams.data
        .map(stream => {
          if (stream.data?.content && 'fields' in stream.data.content) {
            const fields = stream.data.content.fields as any;
            return {
              id: stream.data.objectId,
              owner: fields.owner,
              pair: fields.linked_stream_owner || fields.owner,
              pair_stream: fields.linked_stream || stream.data.objectId,
              messages: fields.data,
              next_id: fields.next_id,
            };
          }
          return null;
        })
        .filter<MessageStream>((stream): stream is MessageStream => stream !== null);
  
        console.log("🔍 [fetchStreams] Parsed streams:", parsedStreams);
        return parsedStreams;
  
    } catch (error) {
      console.error('[useMessageStreams] Error fetching streams:', error);
      return [];
    } 
};


