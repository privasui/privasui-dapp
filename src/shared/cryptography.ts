import { sha256 } from "@noble/hashes/sha256";
import { ed25519 } from "@noble/curves/ed25519";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { bech32 } from "bech32";
import { Buffer } from "buffer";
import sodium from "libsodium-wrappers";
import * as naclUtil from "tweetnacl-util";
import * as nacl from "tweetnacl";
import { blake2b } from "@noble/hashes/blake2b";

import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export interface EncryptedMessage {
  encryptedBytes: Uint8Array;
  nonceBytes: Uint8Array;
}

// Convert hex string to Uint8Array using Buffer
export function fromHex(hexString: string): Uint8Array {
  return new Uint8Array(Buffer.from(hexString, "hex"));
}

// Convert Uint8Array to hex string using Buffer
export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function toBase64(bytes: Uint8Array): string {
  return naclUtil.encodeBase64(bytes);
}

export function fromBase64(str: string): Uint8Array {
  return naclUtil.decodeBase64(str);
}

export function compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const getRandomWord = () =>
  wordlist[Math.floor(Math.random() * wordlist.length)];

export function generateRandomUsername(): string {
  const word1 = getRandomWord();
  const word2 = getRandomWord();
  const word3 = getRandomWord();
  return `${word1}-${word2}-${word3}`;
}

export function generateSeedPhrase(): string {
  return generateMnemonic(wordlist, 128);
}

export async function getRawEd25519KeypairFromSeedPhrase(
  seedPhrase: string,
): Promise<Ed25519Keypair> {
  try {
    await sodium.ready;
    // Convert seed phrase to bytes
    const seedBytes = new TextEncoder().encode(seedPhrase);
    // Use sha256 for key derivation to get deterministic bytes
    const hash = sha256(seedBytes);
    // Create an Ed25519Keypair from the derived seed
    let keypair = Ed25519Keypair.fromSecretKey(hash.slice(0, 32));
    return keypair;
  } catch (error) {
    console.error("[Key Derivation] Error deriving key from seed:", error);
    throw error;
  }
}

export async function getEd25519KeypairFromSeedPhrase(
  seedPhrase: string,
): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
  try {
    await sodium.ready;
    // Convert seed phrase to bytes
    const seedBytes = new TextEncoder().encode(seedPhrase);
    // Use sha256 for key derivation to get deterministic bytes
    const hash = sha256(seedBytes);
    // Create an Ed25519Keypair from the derived seed
    let keypair = Ed25519Keypair.fromSecretKey(hash.slice(0, 32));

    let suiPrivKey = keypair.getSecretKey().toString();

    // Decode
    const decoded = bech32.decode(suiPrivKey);
    const rawBytes = new Uint8Array(bech32.fromWords(decoded.words));

    // The first byte (0x00) is a prefix byte that indicates the key type in Sui
    // We need to remove it before passing to ed25519
    const privateKeyBytes = rawBytes.slice(1); // Skip the first byte
    const publicKey = ed25519.getPublicKey(privateKeyBytes);

    return {
      publicKey: publicKey,
      privateKey: privateKeyBytes,
    };
  } catch (error) {
    console.error("[Key Derivation] Error deriving key from seed:", error);
    throw error;
  }
}

export async function convertRawEd25519ToX25519(
  keypair: Ed25519Keypair,
): Promise<{ xPrivateKey: Uint8Array; xPublicKey: Uint8Array }> {
  try {
    await sodium.ready;
    let suiPrivKey = keypair.getSecretKey().toString();

    // Decode
    const decoded = bech32.decode(suiPrivKey);
    const rawBytes = new Uint8Array(bech32.fromWords(decoded.words));

    // The first byte (0x00) is a prefix byte that indicates the key type in Sui
    // We need to remove it before passing to ed25519
    const privateKeyBytes = rawBytes.slice(1); // Skip the first byte
    const publicKey = ed25519.getPublicKey(privateKeyBytes);

    const libsodiumPrivateKey = new Uint8Array(64);
    // First 32 bytes are the private key/seed
    libsodiumPrivateKey.set(privateKeyBytes, 0);
    // Last 32 bytes are the public key
    libsodiumPrivateKey.set(publicKey, 32);

    // Convert to X25519
    const xPrivateKey =
      sodium.crypto_sign_ed25519_sk_to_curve25519(libsodiumPrivateKey);
    const xPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

    return {
      xPrivateKey,
      xPublicKey,
    };
  } catch (error) {
    console.error("[Key Derivation] Error deriving key from seed:", error);
    throw error;
  }
}

export async function convertEd25519ToX25519(
  privateKey: Uint8Array,
  publicKey: Uint8Array,
): Promise<{ xPrivateKey: Uint8Array; xPublicKey: Uint8Array }> {
  await sodium.ready;
  const libsodiumPrivateKey = new Uint8Array(64);
  // First 32 bytes are the private key/seed
  libsodiumPrivateKey.set(privateKey, 0);
  // Last 32 bytes are the public key
  libsodiumPrivateKey.set(publicKey, 32);

  // Convert to X25519
  const xPrivateKey =
    sodium.crypto_sign_ed25519_sk_to_curve25519(libsodiumPrivateKey);
  const xPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

  return {
    xPrivateKey,
    xPublicKey,
  };
}

export async function generateEncKey(
  xPrivateKey: Uint8Array,
  xPublicKey: Uint8Array,
): Promise<Uint8Array> {
  await sodium.ready;
  // STEP 1: Compute the shared secret (do this once)
  const sharedSecret = sodium.crypto_scalarmult(xPrivateKey, xPublicKey);
  console.log("Shared Secret (hex):", sodium.to_hex(sharedSecret));

  // STEP 2: Derive a key suitable for encryption from the shared secret
  // The key derivation adds another security layer
  const encKey = sodium.crypto_generichash(
    sodium.crypto_secretbox_KEYBYTES, // desired key length
    sharedSecret, // input key material
  );

  return encKey;
}

export async function generateSharedKey(
  xPrivateKey: Uint8Array,
  xPublicKey: Uint8Array,
): Promise<Uint8Array> {
  await sodium.ready;
  return sodium.crypto_scalarmult(xPrivateKey, xPublicKey);
}

export async function encryptMessageWithSharedKey(
  xSharedKeyBytes: Uint8Array,
  message: string,
): Promise<EncryptedMessage> {
  await sodium.ready;
  const encKey = sodium.crypto_generichash(
    sodium.crypto_secretbox_KEYBYTES, // desired key length
    xSharedKeyBytes, // input key material
  );

  // STEP 3: Use the derived key for encryption
  const nonceBytes = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const messageBytes = sodium.from_string(message);

  // Encrypt with the shared key (symmetric encryption)
  const encryptedBytes = sodium.crypto_secretbox_easy(
    messageBytes,
    nonceBytes,
    encKey,
  );

  return {
    encryptedBytes,
    nonceBytes,
  };
}

export async function decryptMessageWithSharedKey(
  xSharedKeyBytes: Uint8Array,
  encryptedMessage: EncryptedMessage,
): Promise<string> {
  try {
    await sodium.ready;
    const encKey = sodium.crypto_generichash(
      sodium.crypto_secretbox_KEYBYTES, // desired key length
      xSharedKeyBytes, // input key material
    );

    // STEP 4: Decrypt with the same shared key
    const decrypted = sodium.crypto_secretbox_open_easy(
      encryptedMessage.encryptedBytes,
      encryptedMessage.nonceBytes,
      encKey,
    );

    return sodium.to_string(decrypted);
  } catch (error) {
    return "";
  }
}

export function validateKeys(
  profilePrivateKey: Uint8Array,
  profilePublicKey: Uint8Array | string,
): boolean {
  try {
    // Derive public key from private key
    const keyPair = nacl.sign.keyPair.fromSecretKey(profilePrivateKey);
    const derivedPublicKey = keyPair.publicKey;

    // Convert profile public key to buffer for comparison
    const profilePublicKeyBuffer =
      profilePublicKey instanceof Uint8Array
        ? Buffer.from(profilePublicKey)
        : Buffer.from(profilePublicKey, "hex");

    // Compare the derived public key with the profile's public key
    // If they match, they're from the same keypair
    return (
      Buffer.compare(Buffer.from(derivedPublicKey), profilePublicKeyBuffer) ===
      0
    );
  } catch (error) {
    console.error("Error validating keypair:", error);
    return false;
  }
}

/**
 * Generates a consistent conversation ID hash from two addresses,
 * matching the Move implementation's logic
 */
export function generateConversationId(addr1: string, addr2: string): string {
  // Remove '0x' prefix if present
  const cleanAddr1 = addr1.startsWith("0x") ? addr1.slice(2) : addr1;
  const cleanAddr2 = addr2.startsWith("0x") ? addr2.slice(2) : addr2;

  // Convert addresses to BigInt for comparison (similar to u256 in Move)
  const addr1BigInt = BigInt("0x" + cleanAddr1);
  const addr2BigInt = BigInt("0x" + cleanAddr2);

  // Order addresses consistently based on numeric value
  let bytes: Buffer;
  if (addr1BigInt < addr2BigInt) {
    bytes = Buffer.concat([
      Buffer.from(cleanAddr1, "hex"),
      Buffer.from(cleanAddr2, "hex"),
    ]);
  } else {
    bytes = Buffer.concat([
      Buffer.from(cleanAddr2, "hex"),
      Buffer.from(cleanAddr1, "hex"),
    ]);
  }

  // Generate blake2b hash (256 bits) and return as hex string
  const hash = blake2b(bytes, { dkLen: 32 }); // 32 bytes = 256 bits
  return toHex(hash);
}
