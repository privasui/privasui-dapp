import { create } from "zustand";
import { StateStorage } from "zustand/middleware";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getRandomWord } from "@/shared/cryptography";

// Account type definition
export type Account = {
  uid: string; // Unique identifier for each account
  publicKey: string;
  privateKey: string;
  createdAt: number;
  name?: string; // Optional display name
};

// Keys for tracking active account and account list in localStorage
const ACTIVE_ACCOUNT_KEY = "privasui_active_account";
const ACCOUNT_LIST_KEY = "privasui_account_list"; // Stores just the public keys

// Custom storage implementation
const customStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await localStorage.getItem(name);
    } catch (error) {
      console.warn("Error getting from localStorage", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await localStorage.setItem(name, value);
    } catch (error) {
      console.warn("Error setting to localStorage", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await localStorage.removeItem(name);
    } catch (error) {
      console.warn("Error removing from localStorage", error);
    }
  },
};

// Helper function to get account key
const getAccountKey = (publicKey: string) => `privasui_publickey_${publicKey}`;

// Function to validate key pair - implement this based on your crypto library
const validateKeyPair = (publicKey: string, privateKey: string): boolean => {
  // TODO implement cryptography
  if (!publicKey || !privateKey) {
    return false;
  }
  return true;
};

const isValidAccount = (account: Account): boolean => {
  if (!account || !account.uid || !account.publicKey || !account.privateKey) {
    return false;
  }

  return validateKeyPair(account.publicKey, account.privateKey);
};

export type WalletAccountStore = {
  // In-memory state
  accounts: Account[];
  isInitialized: boolean;
  isInitializing: boolean;
  activeAccount: Account | undefined;

  // Actions

  initializeFromStorage: () => Promise<void>;

  // Returns account if successful
  addAccount: (ed25519KeyPair: Ed25519Keypair) => Promise<Account | undefined>;

  getAccountByUid: (uid: string) => Promise<Account | undefined>;
  getAccountByPublicKey: (publicKey: string) => Promise<Account | undefined>;

  removeAccountByUid: (uid: string) => Promise<boolean>;
  removeAccountByPublicKey: (publicKey: string) => Promise<boolean>;

  setActiveAccountByUid: (uid: string) => Promise<boolean>;
  setActiveAccountByPublicKey: (publicKey: string) => Promise<boolean>;
  resetActiveAccountSelection: () => Promise<boolean>;

  // Getters
  getActiveAccount: () => Promise<Account | undefined>;
  getAccounts: () => Promise<Account[]>;

  // Utilities
  clearAccounts: () => Promise<boolean>;
};

export const useWalletAccountStore = create<WalletAccountStore>()(
  (set, get) => ({
    accounts: [],
    isInitialized: false,
    isInitializing: false,
    activeAccount: undefined,

    initializeFromStorage: async (): Promise<void> => {
      try {
        // Skip if already initializing
        if (get().isInitializing || get().isInitialized) {
          return;
        }

        set({ isInitializing: true });
        console.log("🔍 [Store] Starting initialization");

        // 1. Load account list
        const accountListJson = await customStorage.getItem(ACCOUNT_LIST_KEY);
        const publicKeys: string[] = accountListJson
          ? JSON.parse(accountListJson)
          : [];
        console.log(
          `🔍 [Store] Found ${publicKeys.length} account keys in storage`,
        );

        // 2. Load each account in parallel
        const accountPromises = publicKeys.map(async (publicKey) => {
          const accountKey = getAccountKey(publicKey);
          const accountJson = await customStorage.getItem(accountKey);

          if (accountJson) {
            try {
              const account = JSON.parse(accountJson);
              return isValidAccount(account) ? account : null;
            } catch (e) {
              console.error(`Failed to parse account for ${publicKey}`, e);
              return null;
            }
          }
          return null;
        });

        // Wait for all accounts to load
        const accountResults = await Promise.all(accountPromises);
        const loadedAccounts = accountResults.filter(Boolean) as Account[];

        // 3. Update accounts array FIRST
        set({ accounts: loadedAccounts });
        console.log(
          `🔍 [Store] Loaded ${loadedAccounts.length} valid accounts`,
        );

        // 4. Now get active account
        const activeAccountId = await customStorage.getItem(ACTIVE_ACCOUNT_KEY);
        console.log(
          `🔍 [Store] Active account in storage: ${activeAccountId?.substring(0, 8) || "none"}`,
        );

        // 5. Find active account in the loaded accounts
        let activeAccount: Account | undefined;

        if (activeAccountId && loadedAccounts.length > 0) {
          activeAccount = loadedAccounts.find((a) => a.uid === activeAccountId);
        }
        // 6. Update final state
        set({
          isInitialized: true,
          isInitializing: false,
          activeAccount,
        });

        console.log(
          `🔍 [Store] Initialization complete with ${loadedAccounts.length} accounts`,
        );
      } catch (error) {
        console.error("Failed to initialize accounts from storage", error);
        set({
          isInitialized: true,
          isInitializing: false,
          accounts: [],
          activeAccount: undefined,
        });
      }
    },

    addAccount: async (
      ed25519KeyPair: Ed25519Keypair,
    ): Promise<Account | undefined> => {
      const { getAccounts, getAccountByPublicKey, setActiveAccountByUid } =
        get();

      let accounts = await getAccounts();

      const publicKey = ed25519KeyPair.getPublicKey();
      const privateKey = ed25519KeyPair.getSecretKey();
      const mySuiAddress = publicKey.toSuiAddress();

      // Check if an account with this public key already exists
      if (accounts.some((a) => a.publicKey === mySuiAddress)) {
        console.warn(
          "Account with this public key already exists, returning existing account",
        );
        return getAccountByPublicKey(mySuiAddress);
      }

      console.log("Adding account ", mySuiAddress);

      // Create new account with UUID
      const newAccount: Account = {
        uid: mySuiAddress,
        publicKey: mySuiAddress,
        privateKey: privateKey.toString(),
        createdAt: Date.now(),
        name: `Wallet-${accounts.length + 1}-${getRandomWord()}`,
      };

      if (!isValidAccount(newAccount)) {
        console.error("Account is not valid");
        return;
      }

      try {
        // Update account list in storage
        const accountListJson = await customStorage.getItem(ACCOUNT_LIST_KEY);
        const publicKeys: string[] = accountListJson
          ? JSON.parse(accountListJson)
          : [];
        publicKeys.push(newAccount.publicKey);
        await customStorage.setItem(
          ACCOUNT_LIST_KEY,
          JSON.stringify(publicKeys),
        );

        console.log("Added account to storage", newAccount.publicKey);

        // Save account to storage
        await customStorage.setItem(
          getAccountKey(newAccount.publicKey),
          JSON.stringify(newAccount),
        );

        set({ accounts: [...accounts, newAccount] });

        accounts = await getAccounts();

        if (accounts.length === 1) {
          await setActiveAccountByUid(accounts[0].uid);
        }

        // If this is the first account, make it active
        // if (accounts.length === 0) {
        //   await customStorage.setItem(ACTIVE_ACCOUNT_KEY, newAccount.uid);
        //   await setActiveAccountByUid(newAccount.uid);
        //   const activeAccount = await getActiveAccount();
        //   set({ accounts: [newAccount], activeAccount });
        // } else {
        //   // dont change any active account
        //   set({ accounts: [...accounts, newAccount] });
        // }

        console.log(`Added new account: ${newAccount.uid.substring(0, 8)}...`);
        return newAccount;
      } catch (error) {
        console.error("Failed to add account", error);
        return undefined;
      }
    },

    getAccountByUid: async (uid: string): Promise<Account | undefined> => {
      return get().accounts.find((a) => a.uid === uid);
    },

    getAccountByPublicKey: async (
      publicKey: string,
    ): Promise<Account | undefined> => {
      return get().accounts.find((a) => a.publicKey === publicKey);
    },

    removeAccountByUid: async (uid: string): Promise<boolean> => {
      const {
        accounts,
        getActiveAccount,
        getAccountByUid,
        setActiveAccountByUid,
        resetActiveAccountSelection,
      } = get();
      const accountToRemove = await getAccountByUid(uid);
      const activeAccount = await getActiveAccount();

      if (!accountToRemove) {
        console.warn(`removeAccountByUid: No account found with uid: ${uid}`);
        return true;
      }

      try {
        // Remove from storage
        await customStorage.removeItem(
          getAccountKey(accountToRemove.publicKey),
        );

        // Update account list
        const accountListJson = await customStorage.getItem(ACCOUNT_LIST_KEY);
        const publicKeys: string[] = accountListJson
          ? JSON.parse(accountListJson)
          : [];
        const updatedPublicKeys = publicKeys.filter(
          (pk) => pk !== accountToRemove.publicKey,
        );
        await customStorage.setItem(
          ACCOUNT_LIST_KEY,
          JSON.stringify(updatedPublicKeys),
        );

        // Update active account if needed
        let newActiveAccount = activeAccount;

        if (activeAccount?.uid === uid) {
          const remainingAccounts = accounts.filter((a) => a.uid !== uid);
          newActiveAccount =
            remainingAccounts.length > 0 ? remainingAccounts[0] : undefined;

          if (newActiveAccount && newActiveAccount.uid) {
            await setActiveAccountByUid(newActiveAccount.uid);
          } else {
            await resetActiveAccountSelection();
          }
        }

        set({
          accounts: accounts.filter((a) => a.uid !== uid),
          activeAccount: newActiveAccount ? newActiveAccount : undefined,
        });

        console.log(`Removed account: ${uid.substring(0, 8)}...`);
        return true;
      } catch (error) {
        console.error("Failed to remove account", error);
        return false;
      }
    },

    removeAccountByPublicKey: async (publicKey: string): Promise<boolean> => {
      const account = await get().getAccountByPublicKey(publicKey);
      if (!account) return true;

      return get().removeAccountByUid(account.uid);
    },

    setActiveAccountByUid: async (uid: string): Promise<boolean> => {
      if (!uid) {
        console.warn("setActiveAccountByUid: Called with empty uid");
        return false;
      }

      const { accounts } = get();
      console.log(
        `🔍 [setActiveAccountByUid] Checking ${accounts.length} accounts for uid: ${uid.substring(0, 8)}`,
      );

      // Find account directly in the current accounts array
      const account = accounts.find((a) => a.uid === uid);

      if (!account) {
        console.warn(
          `setActiveAccountByUid: No account found with uid: ${uid}`,
        );
        return false;
      }

      try {
        // Update localStorage
        await customStorage.setItem(ACTIVE_ACCOUNT_KEY, uid);

        // Update state directly with the account we already found
        set({ activeAccount: account });

        console.log(`Set active account: ${uid.substring(0, 8)}...`);
        return true;
      } catch (error) {
        console.error("Failed to set active account", error);
        return false;
      }
    },

    setActiveAccountByPublicKey: async (
      publicKey: string,
    ): Promise<boolean> => {
      const account = await get().getAccountByPublicKey(publicKey);
      if (!account || !account.uid) return false;

      return get().setActiveAccountByUid(account.uid);
    },

    resetActiveAccountSelection: async (): Promise<boolean> => {
      await customStorage.removeItem(ACTIVE_ACCOUNT_KEY);
      set({ activeAccount: undefined });
      return true;
    },

    getActiveAccount: async (): Promise<Account | undefined> => {
      const { getAccountByUid } = get();
      const activeAccountUid = await customStorage.getItem(ACTIVE_ACCOUNT_KEY);
      if (!activeAccountUid) return undefined;

      return getAccountByUid(activeAccountUid.toString());
    },

    getAccounts: async (): Promise<Account[]> => {
      return get().accounts;
    },

    clearAccounts: async (): Promise<boolean> => {
      const { accounts, resetActiveAccountSelection } = get();

      try {
        // Remove each account from storage
        accounts.forEach(async (account) => {
          await customStorage.removeItem(getAccountKey(account.publicKey));
        });

        // Clear account list and active account
        await resetActiveAccountSelection();
        await customStorage.removeItem(ACCOUNT_LIST_KEY);

        set({
          accounts: [],
          activeAccount: undefined,
        });

        console.log("Cleared all accounts");
        return true;
      } catch (error) {
        console.error("Failed to clear accounts", error);
        return false;
      }
    },
  }),
);
