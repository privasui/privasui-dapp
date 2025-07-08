import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { getNetworkVariable } from '@/shared/network-config';
import { EncryptedMessage} from '@/shared/cryptography';
import { fetchPiSharedObject } from "./pi";


const PRIVASUI_PACKAGE_ID_LATEST = getNetworkVariable("PRIVASUI_PACKAGE_ID_LATEST");


const TX_GAS_BUDGET_DEFAULT = 50_000_000;

// Create transaction object for profile creation (without executing it)
export const createProfileTx = async (
  client: SuiClient,
  xPublicKeyBytes: Uint8Array,
  name: string,
  avatarBytes: Uint8Array,
  lifetime: boolean,
  price: number,
): Promise<Transaction> => {
  const tx = new Transaction();

  console.log("🔍 TX lifetime:", lifetime);

  tx.setGasBudget(price + TX_GAS_BUDGET_DEFAULT);

  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(price))]);
  
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);

  // fetch the pi shared object with the initial shared version
  const piSharedObject = await fetchPiSharedObject(client);

  console.log("🔍 Move call lifetime:", lifetime);

  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::create_profile`,
    arguments: [
      tx.object('0x6'),
      tx.sharedObjectRef(piSharedObject),
      tx.object(paymentCoin),
      tx.pure.vector("u8", xPublicKeyBytes),
      tx.pure.string(name),
      tx.pure.vector("u8", avatarBytes),
      tx.pure.bool(lifetime),
      tx.pure.option("string", null),
    ]
  });

  return tx;
}


// Create transaction object for profile deletion (without executing it)
export const deleteProfileTx =async(
  client: SuiClient,
  profileId: string,
  avatarId: string,
): Promise<Transaction> => {
  const tx = new Transaction();
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);

  const piSharedObject = await fetchPiSharedObject(client);

  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::delete_profile`,
    arguments: [
      tx.sharedObjectRef(piSharedObject),
      tx.object(profileId),
      tx.object(avatarId)
    ]
  });

  return tx;
}


export const createConversationTx = async(
  client: SuiClient,
  recipient: string,
  encryptedMessage: EncryptedMessage,
): Promise<Transaction> => {
  const tx = new Transaction();
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);

  const piSharedObject = await fetchPiSharedObject(client);

  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::create_conversation`,
    arguments: [
      tx.object('0x6'),
      tx.sharedObjectRef(piSharedObject),
      tx.pure.address(recipient), // Pass recipient as address
      tx.pure.vector("u8", encryptedMessage.encryptedBytes), // Pass potentially encrypted message
      tx.pure.u8(1),
      tx.pure.vector("u8", encryptedMessage.nonceBytes),
      tx.pure.u64(0),
    ]
  });

  return tx;
}


export const sendMessageTx = async(
  client: SuiClient,
  streamId: string,
  encryptedMessage: EncryptedMessage,
): Promise<Transaction> => {
  const tx = new Transaction();
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);

  const piSharedObject = await fetchPiSharedObject(client);

  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::send_message`,
    arguments: [
      tx.object('0x6'),
      tx.sharedObjectRef(piSharedObject),
      tx.object(streamId),
      tx.pure.vector("u8", encryptedMessage.encryptedBytes),
      tx.pure.u8(1),
      tx.pure.vector("u8", encryptedMessage.nonceBytes),
    ]
  });

  return tx;
}


export const sendSuiPaymentTx = (
  recipient: string,
  mistAmount: BigInt,
): Transaction => {
  // Validate inputs
  if (!recipient.startsWith('0x')) {
    throw new Error('Invalid recipient address format');
  }
  // Create a new transaction block
  const tx = new Transaction();
  
  // Set gas budget
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);
  
  // Split coin from gas coin and send to recipient
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(mistAmount.valueOf()))]);
  
  // Transfer the split coin to the recipient
  tx.transferObjects([coin], tx.pure.address(recipient));
  
  return tx;
}

// Create transaction object for PINS name registration (without executing it)
export const createNameRegistrationTx = async (
  client: SuiClient,
  name: string,
  lifetime: boolean,
  price: number,
): Promise<Transaction> => {
  const tx = new Transaction();

  console.log("🔍 AVAR:: [createNameRegistrationTx] TX_GAS_BUDGET", TX_GAS_BUDGET_DEFAULT);

  tx.setGasBudget(price + TX_GAS_BUDGET_DEFAULT);

  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(price))]);
  
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);

  // fetch the pi shared object with the initial shared version
  const piSharedObject = await fetchPiSharedObject(client);

  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::register_piname`,
    arguments: [
      tx.object('0x6'),
      tx.sharedObjectRef(piSharedObject),
      tx.object(paymentCoin),
      tx.pure.string(name),
      tx.pure.bool(lifetime),
    ]
  });

  return tx;
}

// Create transaction object for NFT transfer (without executing it)
export const createNftTransferTx = (
  recipient: string,
  objectId: string,
): Transaction => {
  // Validate inputs
  if (!recipient.startsWith('0x')) {
    throw new Error('Invalid recipient address format');
  }
  
  if (!objectId.startsWith('0x')) {
    throw new Error('Invalid object ID format');
  }

  const tx = new Transaction();
  
  // Set gas budget
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);
  
  // Transfer the NFT object to the recipient
  tx.transferObjects([tx.object(objectId)], tx.pure.address(recipient));
  
  return tx;
}

// Create transaction object for PiNS name transfer (without executing it)
export const createPiNSTransferTx = async (
  client: SuiClient,
  recipient: string,
  objectId: string,
): Promise<Transaction> => {
  // Validate inputs
  if (!recipient.startsWith('0x')) {
    throw new Error('Invalid recipient address format');
  }
  
  if (!objectId.startsWith('0x')) {
    throw new Error('Invalid object ID format');
  }

  const tx = new Transaction();
  
  // Set gas budget
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);
  
  // Fetch the pi shared object
  const piSharedObject = await fetchPiSharedObject(client);
  
  // Use the correct PiNS transfer function with proper parameters
  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::transfer_piname`,
    arguments: [
      tx.object('0x6'),                    // clock: &Clock
      tx.sharedObjectRef(piSharedObject),  // pi: &mut Pi
      tx.object(objectId),                 // ownership: PiNameOwnership
      tx.pure.address(recipient),          // recipient: address
    ]
  });
  
  return tx;
}

// Create transaction object for setting PiNS name sale price (without executing it)
export const createSetPiNameSalePriceTx = async (
  client: SuiClient,
  name: string,
  price: number,
): Promise<Transaction> => {
  const tx = new Transaction();
  
  // Set gas budget
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);
  
  // Fetch the pi shared object
  const piSharedObject = await fetchPiSharedObject(client);
  
  // Use the set_piname_sale_price function
  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::set_piname_sale_price`,
    arguments: [
      tx.object('0x6'),                    // clock: &Clock
      tx.sharedObjectRef(piSharedObject),  // pi: &mut Pi
      tx.pure.string(name),                // name: String
      tx.pure.u64(BigInt(price)),          // price_lamports: u64
    ]
  });
  
  return tx;
};

// Create transaction object for unsetting PiNS name sale price (without executing it)
export const createUnsetPiNameSalePriceTx = async (
  client: SuiClient,
  name: string,
): Promise<Transaction> => {
  const tx = new Transaction();
  
  // Set gas budget
  tx.setGasBudget(TX_GAS_BUDGET_DEFAULT);
  
  // Fetch the pi shared object
  const piSharedObject = await fetchPiSharedObject(client);
  
  // Use the unset_piname_sale_price function
  tx.moveCall({
    target: `${PRIVASUI_PACKAGE_ID_LATEST}::app::unset_piname_sale_price`,
    arguments: [
      tx.object('0x6'),                    // clock: &Clock
      tx.sharedObjectRef(piSharedObject),  // pi: &mut Pi
      tx.pure.string(name),                // name: String
    ]
  });
  
  return tx;
};

// Price management functionality has been removed as it's not implemented in the Move contracts


