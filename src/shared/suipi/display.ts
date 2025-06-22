import type { SuiClient, SuiMoveObject, SuiObjectResponse } from "@mysten/sui/client";

export interface DisplayObject {
    fields?: {
      fields?: {
        fields?: {
          contents?: any[];
        };
        contents?: any[];
      };
      contents?: any[];
    };
    id: {
      id: string;
    };
    version: number;
}

export const fetchDisplayObjectById = async(suiClient: SuiClient, objectId: string): Promise<DisplayObject | null> => {
    try {
      const resp = await suiClient.getObject({
        id: objectId,
        options: { showContent: true, showDisplay: true }
      });
      const content = resp.data?.content;
      if (content && typeof content === 'object' && 'fields' in content) {
        // Cast to unknown first to handle the type conversion safely
        return {
          fields: (content as any).fields,
          id: { id: objectId },
          version: 1
        } as DisplayObject;
      }
    } catch (error) {
      console.error('[NFT DEBUG] Error fetching display object:', error);
    }
    return null;
}

/**
 * Extracts display data from a Sui object response
 * @param objectResponse The response from getObject RPC call
 * @param fieldName The display field to extract (e.g., 'name', 'image_url', 'description')
 * @returns The processed display field value
 */
export function extractDisplayField(
    objectResponse: SuiObjectResponse,
    fieldName: string
): string | undefined {
    const display = objectResponse.data?.display;
    console.log('[Display DEBUG] Display object:', display);
    if (!display) return undefined;

    const data = display.data;
    console.log('[Display DEBUG] Display data:', data);
    if (!data) return undefined;

    // Get the raw value
    const value = data[fieldName];
    console.log('[Display DEBUG] Raw value for', fieldName, ':', value);
    if (!value) return undefined;

    // If the value is a template (contains {}), process it
    if (typeof value === 'string' && value.includes('{')) {
        const content = objectResponse.data?.content as SuiMoveObject;
        console.log('[Display DEBUG] Content for template processing:', content);
        if (!content?.fields) return value;

        // Replace all template variables
        return value.replace(/\{([^}]+)\}/g, (match, field) => {
            const fields = content.fields as Record<string, any>;
            console.log('[Display DEBUG] Replacing template', match, 'with field', field, 'value:', fields[field]);
            return fields[field]?.toString() || match;
        });
    }

    return value;
}