import { useEffect, useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
import { useWalletAccountStore } from "@/widgets/profile/model/use-wallet-accounts";
import { isDevnet, isTestnet } from "@/shared/network-config";
import { fetchDisplayObjectById, extractDisplayField, fetchDisplayConfig, fetchPiNSDisplayConfig } from "@/shared/suipi";

import { getNetworkVariable } from "@/shared/network-config";

const PINS_PACKAGE_ID_ORIGINAL = getNetworkVariable("PINS_PACKAGE_ID_ORIGINAL");
const PRIVASUI_PACKAGE_ID_ORIGINAL = getNetworkVariable("PRIVASUI_PACKAGE_ID_ORIGINAL");

export const AccountNFT = () => {
  const { activeAccount } = useWalletAccountStore();
  const suiClient = useSuiClient();
  const [nfts, setNfts] = useState<any[]>([]);
  const [displayMap, setDisplayMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNFTsAndDisplays = async () => {
      if (!activeAccount?.publicKey) return;
      setLoading(true);
      try {

        const privasuiDisplayConfig = await fetchDisplayConfig(suiClient as unknown as SuiClient);
        // console.log('iiiii [NFT DEBUG] Display config:', privasuiDisplayConfig);

        const pinsDisplayObject = await fetchPiNSDisplayConfig(suiClient as unknown as SuiClient);
        // console.log('iiiii [NFT DEBUG] Display config:', pinsDisplayObject);

        const DISPLAY_OBJECT_MAP: Record<string, string> = {
          [`${PRIVASUI_PACKAGE_ID_ORIGINAL}::avatar::Avatar`]: privasuiDisplayConfig.display_avatar_id,
          [`${PINS_PACKAGE_ID_ORIGINAL}::name::PiNameOwnership`]: pinsDisplayObject.pins_display_id,
        };

        // 1. Fetch all objects owned by the user
        const resp = await suiClient.getOwnedObjects({
          owner: activeAccount.publicKey,
          options: { showType: true, showContent: true, showDisplay: true },
        });
        // 2. Filter for likely NFTs
        const nftObjects = resp.data.filter((obj: any) => {
          let reason = '';
          if (!obj.data) {
            reason = 'No data';
          } else if (!obj.data.type) {
            reason = 'No type';
          } else if (typeof obj.data.type !== 'string') {
            reason = 'Type not string';
          } else if (!obj.data.type.includes('::')) {
            reason = 'Type does not include ::';
          } else if (obj.data.type.startsWith('0x2::coin::Coin')) {
            reason = 'Is coin';
          } else {
            reason = 'Included';
          }
          console.log('[NFT DEBUG] Object type:', obj.data?.type, 'Reason:', reason);
          return reason === 'Included';
        });

        console.log('[NFT DEBUG] All NFT objects:', nftObjects.map((obj: any) => ({
          type: obj.data?.type,
          id: obj.data?.objectId,
          content: obj.data?.content
        })));

        // 3. For each unique type, use the hardcoded display object ID (if present)
        const uniqueTypes = Array.from(new Set(
          nftObjects
            .map((obj: any) => obj.data?.type)
            .filter((type: string | undefined | null): type is string => !!type)
        ));
        
        console.log('[NFT DEBUG] Unique types:', uniqueTypes);
        
        const displayMapTemp: Record<string, any> = {};
        for (const type of uniqueTypes) {
          const displayObjectId = DISPLAY_OBJECT_MAP[type];
          console.log('[NFT DEBUG] Checking type:', type, 'with displayObjectId:', displayObjectId);
          if (displayObjectId) {
            const displayObj = await fetchDisplayObjectById(suiClient as unknown as SuiClient, displayObjectId);
            console.log('[NFT DEBUG] Display object for type', type, ':', displayObj);
            if (displayObj) displayMapTemp[type] = displayObj;
          }
        }
        setDisplayMap(displayMapTemp);
        // 4. Only keep NFTs with a display object
        const nftsWithDisplay = nftObjects.filter(
          (obj: any) => {
            console.log('[NFT DEBUG] Checking obj.data.type:', obj.data.type);
            return obj.data && obj.data.type && displayMapTemp[obj.data.type]
          }
        );
        console.log('[NFT DEBUG] NFTs with display:', nftsWithDisplay);
        setNfts(nftsWithDisplay);
      } finally {
        setLoading(false);
      }
    };
    fetchNFTsAndDisplays();
  }, [activeAccount, suiClient]);

  if (loading) {
    return <div className="w-full flex items-center justify-center py-8 text-primary font-mono">Loading NFTs...</div>;
  }

  if (!nfts.length) {
    return <div className="w-full py-8 text-center text-gray-400 font-mono">No NFTs with display found</div>;
  }

  return (
    <div className="w-full flex flex-col gap-4 p-4">
      {nfts.map((nft) => {
        const fields = nft.data?.content?.fields;
        const type = nft.data?.type;
        const display = displayMap[type];

        console.log('[NFT DEBUG] NFT Details:', {
          type,
          objectId: nft.data?.objectId,
          display,
          fields,
          content: nft.data?.content
        });
        
        // Extract all standard display fields
        const imageUrl = extractDisplayField(nft, 'image_url');
        const thumbnailUrl = extractDisplayField(nft, 'thumbnail_url');
        const name = extractDisplayField(nft, 'name') || fields?.name || type;
        const description = extractDisplayField(nft, 'description') || fields?.description;
        const projectUrl = extractDisplayField(nft, 'project_url');
        const creator = extractDisplayField(nft, 'creator');
        
        console.log('[NFT DEBUG] Extracted fields:', {
          imageUrl,
          thumbnailUrl,
          name,
          description,
          projectUrl,
          creator,
          fallbackImage: fields?.image ? 'Has fallback image' : 'No fallback image'
        });
        
        // If we don't have an image URL from the display but have image data in fields
        const fallbackImage = !imageUrl && fields?.image ? 
          `data:image/svg+xml;base64,${fields.image}` : undefined;
        
        const finalImageUrl = imageUrl || thumbnailUrl || fallbackImage;

        return (
          <div key={nft.data.objectId} className="border border-primary/30 rounded-lg p-3 bg-muted flex flex-row items-stretch gap-4 w-full">
            {finalImageUrl && (
              <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center bg-[#222] rounded">
                <img
                  src={finalImageUrl}
                  alt={name || 'NFT Image'}
                  className="w-24 h-24 object-contain rounded"
                  onError={(e) => {
                    console.error('[NFT ERROR] Failed to load image:', finalImageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {/* Main info and links */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="font-mono text-lg font-bold text-primary mb-1 break-all">{name || 'Unnamed NFT'}</div>
              {description && (
                <div className="font-mono text-xs text-gray-400 mb-1 truncate">{description}</div>
              )}
              {creator && (
                <div className="font-mono text-xs text-gray-500 mb-1">Created by: {creator}</div>
              )}
              {/* Spacer to push links to bottom */}
              <div className="flex-1" />
              <div className="flex flex-row items-center justify-end gap-3">
                {projectUrl && (
                  <a 
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-[#00ff00]/70 hover:text-[#00ff00] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Globe size={12} />
                    Project
                  </a>
                )}
                <a
                  href={`https://${isDevnet() ? 'devnet.' : isTestnet() ? 'testnet.' : ''}suivision.xyz/object/${nft.data.objectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-[#00ff00]/70 hover:text-[#00ff00] flex items-center gap-1 cursor-pointer transition-colors"
                  title={nft.data.objectId}
                >
                  <ExternalLink size={10} />
                  <span>{`${nft.data.objectId.slice(0, 8)}...${nft.data.objectId.slice(-6)}`}</span>
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
