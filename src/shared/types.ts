  // Add Avatar interface to match Move struct
  export interface Avatar {
    id: string;           // UID
    name: string;          // String
    image: Uint8Array;    // vector<u8> (base64 encoded in frontend)
    owner: string;        // address
  }
  
  export interface Message {
    id: string;
    content: Uint8Array;
    content_type: number;
    nonce: Uint8Array;
    timestamp: string;
    sender: string;
    decoded_content?: string;
    digest?: string;
  }
  
  export interface MessageStream {
      id: string;
      owner: string;
      pair: string;
      pair_stream: string;
      messages: {
        fields: {
          id: {
            id: string;
          };
          size: string;
        };
      };
      next_id: string;
    }

    // Define the ConversationMetadata interface
export interface ConversationMetadata {
  exists: boolean;
  ownerStreamId?: string;
  pairStreamId?: string;
  ownerNextId?: number;
  pairNextId?: number;
}
  
  export interface SuiObjectChange {
    type: string; // 'created', 'mutated', etc.
    objectId: string;
    objectType?: string;
    owner?: {
      AddressOwner?: string;
      ObjectOwner?: string;
    };
    // Other properties we might not need right now
  }
  