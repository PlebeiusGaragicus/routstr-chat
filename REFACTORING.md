# Refactoring Plan: Modular Architecture for Routstr Chat

## Current Issues

### 1. **Scattered Wallet Logic**
Currently, wallet functionality is fragmented across:
- **hooks/**: `useCashuWallet`, `useCreateCashuWallet`, `useCashuToken`, `useWalletOperations`, `useNutzaps`, `useCashuHistory`
- **lib/**: `cashu.ts`, `cashuLightning.ts`
- **utils/**: `cashuUtils.ts`, `walletUtils.ts`
- **stores/**: `cashuStore.ts`, `nutzapStore.ts`, `transactionHistoryStore.ts`

### 2. **Scattered Chat Logic**
Chat functionality is spread across:
- **hooks/**: `useChatActions`, `useConversationState`
- **utils/**: `messageUtils`, `apiUtils`, `conversationUtils`
- **context/**: `ChatProvider`

### 3. **Scattered Nostr Logic**
Nostr infrastructure is distributed between:
- **hooks/**: `useNostr`, `useAuthor`, `useCurrentUser`, `useLoginActions`
- **lib/**: `nostr.ts`, `nostr-kinds.ts`, `nostrTimestamps.ts`
- **context/**: `NostrContext`, `NostrProvider`
- **utils/**: `nip60Utils`

### 4. **General Problems**
- ❌ No clear separation between domain logic and UI/infrastructure
- ❌ Hooks contain too much business logic (hard to test)
- ❌ Utils folder is a catch-all with no clear organization
- ❌ Difficult to understand dependencies between modules
- ❌ **Cannot easily extract wallet functionality for reuse in other projects**
- ❌ High cognitive load for new contributors

---

## Proposed Architecture

### Feature-Based Organization with Domain-Driven Design

```
src/
├── features/                    # Feature modules (self-contained domains)
│   ├── wallet/                  # 🎯 Wallet feature (easily extractable!)
│   │   ├── core/               # Pure business logic (framework-agnostic)
│   │   │   ├── domain/         # Domain models and types
│   │   │   │   ├── Proof.ts
│   │   │   │   ├── Token.ts
│   │   │   │   ├── Mint.ts
│   │   │   │   └── Transaction.ts
│   │   │   ├── services/       # Business logic services
│   │   │   │   ├── CashuWalletService.ts
│   │   │   │   ├── TokenService.ts
│   │   │   │   ├── MintService.ts
│   │   │   │   ├── LightningService.ts
│   │   │   │   └── NutzapService.ts
│   │   │   └── utils/          # Wallet-specific utilities
│   │   │       ├── balance.ts
│   │   │       ├── fees.ts
│   │   │       └── formatting.ts
│   │   ├── infrastructure/     # External dependencies & adapters
│   │   │   ├── api/           # API clients
│   │   │   │   └── cashu-mint-client.ts
│   │   │   ├── storage/       # Storage adapters
│   │   │   │   ├── ProofStorage.ts
│   │   │   │   └── WalletStorage.ts
│   │   │   └── nostr/         # Nostr integration for wallet
│   │   │       ├── nip60-adapter.ts
│   │   │       └── nutzap-adapter.ts
│   │   ├── state/             # State management
│   │   │   ├── cashuStore.ts
│   │   │   ├── nutzapStore.ts
│   │   │   └── transactionHistoryStore.ts
│   │   ├── hooks/             # React hooks for wallet
│   │   │   ├── useCashuWallet.ts
│   │   │   ├── useCashuToken.ts
│   │   │   ├── useLightning.ts
│   │   │   └── useWalletBalance.ts
│   │   ├── components/        # Wallet UI components
│   │   │   ├── WalletDisplay.tsx
│   │   │   ├── DepositModal.tsx
│   │   │   ├── SendTokenForm.tsx
│   │   │   └── MintSelector.tsx
│   │   ├── index.ts          # Public API (what to expose)
│   │   └── README.md         # Feature documentation
│   │
│   ├── chat/                  # Chat feature
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── Message.ts
│   │   │   │   ├── Conversation.ts
│   │   │   │   └── Model.ts
│   │   │   ├── services/
│   │   │   │   ├── ChatService.ts
│   │   │   │   ├── ConversationService.ts
│   │   │   │   ├── StreamingService.ts
│   │   │   │   └── MessageService.ts
│   │   │   └── utils/
│   │   │       ├── message-formatting.ts
│   │   │       └── thinking-parser.ts
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   │   └── ai-api-client.ts
│   │   │   └── storage/
│   │   │       └── ConversationStorage.ts
│   │   ├── state/
│   │   │   └── chatStore.ts
│   │   ├── hooks/
│   │   │   ├── useChatActions.ts
│   │   │   ├── useConversationState.ts
│   │   │   └── useStreamingResponse.ts
│   │   ├── components/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatMessages.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── MessageContent.tsx
│   │   ├── index.ts
│   │   └── README.md
│   │
│   └── nostr/                # Nostr feature (identity & relay management)
│       ├── core/
│       │   ├── domain/
│       │   │   ├── Event.ts
│       │   │   ├── User.ts
│       │   │   └── Relay.ts
│       │   ├── services/
│       │   │   ├── NostrService.ts
│       │   │   ├── RelayService.ts
│       │   │   ├── AuthService.ts
│       │   │   └── EventPublisher.ts
│       │   └── utils/
│       │       ├── nip-04.ts
│       │       ├── nip-44.ts
│       │       └── key-management.ts
│       ├── infrastructure/
│       │   ├── relay/
│       │   │   └── relay-pool.ts
│       │   └── storage/
│       │       └── NostrStorage.ts
│       ├── state/
│       │   └── nostrStore.ts
│       ├── hooks/
│       │   ├── useNostr.ts
│       │   ├── useCurrentUser.ts
│       │   └── useRelays.ts
│       ├── providers/
│       │   └── NostrProvider.tsx
│       ├── index.ts
│       └── README.md
│
├── shared/                    # Shared utilities and infrastructure
│   ├── types/                # Global TypeScript types
│   │   └── index.ts
│   ├── config/              # App-wide configuration
│   │   ├── constants.ts
│   │   └── env.ts
│   ├── lib/                 # Third-party library wrappers
│   │   └── query-client.ts
│   ├── hooks/               # Generic React hooks
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useDebounce.ts
│   └── utils/               # Generic utilities
│       ├── storage.ts
│       ├── formatting.ts
│       └── validation.ts
│
├── components/              # Shared/Layout UI components only
│   ├── ui/                 # Shadcn/Radix primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── layout/
│       ├── AppLayout.tsx
│       └── Header.tsx
│
└── app/                    # Next.js app directory (routes only)
    ├── layout.tsx
    ├── page.tsx
    └── ...
```

---

## Migration Strategy

### Phase 1: Extract Wallet Feature (Week 1-2)

**Goal**: Make wallet functionality a self-contained, reusable module

#### Step 1.1: Create Domain Models
```typescript
// features/wallet/core/domain/Proof.ts
export interface Proof {
  id: string;
  amount: number;
  secret: string;
  C: string;
}

// features/wallet/core/domain/Token.ts
export interface CashuToken {
  mint: string;
  proofs: Proof[];
  del?: string[];
}

// features/wallet/core/domain/Mint.ts
export interface Mint {
  url: string;
  info?: MintInfo;
  keysets?: MintKeyset[];
  active: boolean;
}
```

#### Step 1.2: Create Service Layer
```typescript
// features/wallet/core/services/CashuWalletService.ts
export class CashuWalletService {
  constructor(
    private storage: IWalletStorage,
    private mintClient: ICashuMintClient,
    private nostrAdapter?: INip60Adapter
  ) {}

  async createWallet(privkey: string, mints: string[]): Promise<Wallet> {
    // Pure business logic - no React, no hooks
  }

  async getBalance(): Promise<number> {
    // ...
  }

  async sendToken(amount: number, mintUrl: string): Promise<Token> {
    // ...
  }
}
```

#### Step 1.3: Create Infrastructure Adapters
```typescript
// features/wallet/infrastructure/storage/ProofStorage.ts
export interface IProofStorage {
  saveProofs(proofs: Proof[]): Promise<void>;
  getProofs(mintUrl: string): Promise<Proof[]>;
  removeProofs(proofs: Proof[]): Promise<void>;
}

export class LocalStorageProofAdapter implements IProofStorage {
  // Implementation using localStorage
}

export class Nip60ProofAdapter implements IProofStorage {
  // Implementation using Nostr NIP-60
}
```

#### Step 1.4: Create React Hooks (Thin wrappers)
```typescript
// features/wallet/hooks/useCashuWallet.ts
export function useCashuWallet() {
  const service = useWalletService(); // Dependency injection
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => service.getWallet()
  });
}
```

#### Step 1.5: Public API Export
```typescript
// features/wallet/index.ts
// Services (for framework-agnostic usage)
export { CashuWalletService } from './core/services/CashuWalletService';
export { TokenService } from './core/services/TokenService';

// Hooks (for React usage)
export { useCashuWallet } from './hooks/useCashuWallet';
export { useCashuToken } from './hooks/useCashuToken';

// Types
export type * from './core/domain';

// Components (optional)
export { WalletDisplay } from './components/WalletDisplay';
```

**Migration Checklist for Wallet:**
- [ ] Move `lib/cashu.ts` → `features/wallet/core/services/`
- [ ] Move `lib/cashuLightning.ts` → `features/wallet/core/services/LightningService.ts`
- [ ] Move `utils/cashuUtils.ts` → `features/wallet/core/utils/`
- [ ] Move `utils/walletUtils.ts` → `features/wallet/core/utils/`
- [ ] Move `stores/cashuStore.ts` → `features/wallet/state/`
- [ ] Move `stores/nutzapStore.ts` → `features/wallet/state/`
- [ ] Move hooks → `features/wallet/hooks/`
- [ ] Move wallet components → `features/wallet/components/`
- [ ] Create adapters for external dependencies
- [ ] Write `features/wallet/README.md` with usage examples

---

### Phase 2: Extract Chat Feature (Week 3)

**Migration Checklist:**
- [ ] Create domain models (Message, Conversation, Model)
- [ ] Extract `utils/apiUtils.ts` → `features/chat/infrastructure/api/`
- [ ] Extract `utils/messageUtils.ts` → `features/chat/core/utils/`
- [ ] Extract `utils/conversationUtils.ts` → `features/chat/core/utils/`
- [ ] Move `hooks/useChatActions.ts` → `features/chat/hooks/`
- [ ] Move chat components → `features/chat/components/`
- [ ] Create ChatService for business logic
- [ ] Create `features/chat/index.ts` public API

---

### Phase 3: Extract Nostr Feature (Week 4)

**Migration Checklist:**
- [ ] Create domain models (Event, User, Relay)
- [ ] Extract `lib/nostr.ts` → `features/nostr/core/services/`
- [ ] Extract NIP utilities → `features/nostr/core/utils/`
- [ ] Move `context/NostrContext.tsx` → `features/nostr/providers/`
- [ ] Move hooks → `features/nostr/hooks/`
- [ ] Create NostrService for relay management
- [ ] Create `features/nostr/index.ts` public API

---

### Phase 4: Cleanup & Reorganize Shared Code (Week 5)

**Migration Checklist:**
- [ ] Move generic hooks → `shared/hooks/`
- [ ] Move generic utils → `shared/utils/`
- [ ] Create `shared/types/` for global types
- [ ] Keep UI components in root `components/` (they're truly shared)
- [ ] Update all import paths
- [ ] Remove old `utils/`, `lib/`, `hooks/` folders

---

## Benefits of New Structure

### ✅ For External Contributors

1. **Clear Entry Points**: 
   - "Want to work on wallet? Look in `features/wallet/`"
   - "Want to fix chat? Look in `features/chat/`"

2. **Self-Documenting**:
   - Each feature has its own README
   - Clear separation: domain → services → infrastructure → UI

3. **Easy Testing**:
   - Core business logic has no React dependencies
   - Can test services in isolation
   - Mock infrastructure easily

### ✅ For Code Reuse

**Example: Using wallet in another project**

```typescript
// In another project (non-React)
import { CashuWalletService } from '@routstr/wallet';

const walletService = new CashuWalletService(
  new MyCustomStorage(),
  new CashuMintClient()
);

const balance = await walletService.getBalance();
```

```typescript
// In another React project
import { useCashuWallet, WalletDisplay } from '@routstr/wallet';

function App() {
  const { balance } = useCashuWallet();
  return <WalletDisplay balance={balance} />;
}
```

### ✅ For Maintainability

- **Dependency Injection**: Services don't hard-code dependencies
- **Testability**: Business logic separated from React
- **Boundaries**: Clear contracts between features
- **Scalability**: Add new features without touching existing ones

---

## Example: Before & After

### Before (Current)
```typescript
// hooks/useCashuWallet.ts - 482 lines of mixed concerns
- Nostr queries
- State management
- Business logic
- Error handling
- React hooks
- Cashu SDK calls
```

### After (Proposed)
```typescript
// features/wallet/core/services/CashuWalletService.ts
class CashuWalletService {
  async getWallet(): Promise<Wallet> {
    // Pure business logic
  }
}

// features/wallet/infrastructure/nostr/nip60-adapter.ts
class Nip60Adapter implements IWalletStorage {
  // Nostr-specific implementation
}

// features/wallet/hooks/useCashuWallet.ts (30 lines)
export function useCashuWallet() {
  const service = useWalletService();
  return useQuery(['wallet'], () => service.getWallet());
}
```

---

## Publishing Wallet as Standalone Package

Once refactored, you can publish the wallet feature:

```json
// package.json for @routstr/wallet
{
  "name": "@routstr/wallet",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./react": "./dist/hooks/index.js",
    "./components": "./dist/components/index.js"
  },
  "peerDependencies": {
    "react": ">=18",
    "@tanstack/react-query": ">=5"
  }
}
```

Usage in other projects:
```bash
npm install @routstr/wallet
```

---

## Step-by-Step Migration Commands

### 1. Create Feature Directories
```bash
mkdir -p features/wallet/{core/{domain,services,utils},infrastructure/{api,storage,nostr},state,hooks,components}
mkdir -p features/chat/{core/{domain,services,utils},infrastructure/{api,storage},state,hooks,components}
mkdir -p features/nostr/{core/{domain,services,utils},infrastructure/{relay,storage},state,hooks,providers}
mkdir -p shared/{types,config,lib,hooks,utils}
```

### 2. Start with Wallet Migration
```bash
# Move domain logic
mv lib/cashu.ts features/wallet/core/services/CashuWalletService.ts
mv lib/cashuLightning.ts features/wallet/core/services/LightningService.ts

# Move utilities
mv utils/cashuUtils.ts features/wallet/core/utils/
mv utils/walletUtils.ts features/wallet/core/utils/

# Move state
mv stores/cashuStore.ts features/wallet/state/
mv stores/nutzapStore.ts features/wallet/state/

# Move hooks
mv hooks/useCashuWallet.ts features/wallet/hooks/
mv hooks/useCashuToken.ts features/wallet/hooks/
mv hooks/useNutzaps.ts features/wallet/hooks/
```

### 3. Fix Imports
After moving files, update all imports:
```typescript
// Old
import { useCashuWallet } from '@/hooks/useCashuWallet';

// New
import { useCashuWallet } from '@/features/wallet';
```

---

## Testing Strategy

### Core Services (Pure Functions)
```typescript
// features/wallet/core/services/__tests__/CashuWalletService.test.ts
describe('CashuWalletService', () => {
  it('should calculate balance correctly', () => {
    const service = new CashuWalletService(mockStorage, mockClient);
    const balance = service.calculateBalance(mockProofs);
    expect(balance).toBe(1000);
  });
});
```

### Infrastructure Adapters
```typescript
// features/wallet/infrastructure/storage/__tests__/Nip60Adapter.test.ts
describe('Nip60Adapter', () => {
  it('should save proofs to Nostr', async () => {
    const adapter = new Nip60Adapter(mockNostr);
    await adapter.saveProofs(mockProofs);
    expect(mockNostr.event).toHaveBeenCalled();
  });
});
```

### React Hooks
```typescript
// features/wallet/hooks/__tests__/useCashuWallet.test.tsx
import { renderHook } from '@testing-library/react';

it('should fetch wallet data', async () => {
  const { result } = renderHook(() => useCashuWallet());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

---

## Documentation for Each Feature

Each feature should have a README:

### `features/wallet/README.md`
```markdown
# Wallet Feature

## Overview
Cashu ecash wallet with NIP-60 integration.

## Usage

### In React
\`\`\`tsx
import { useCashuWallet } from '@/features/wallet';

function MyComponent() {
  const { balance } = useCashuWallet();
  return <div>Balance: {balance}</div>;
}
\`\`\`

### Without React
\`\`\`ts
import { CashuWalletService } from '@/features/wallet';

const service = new CashuWalletService(storage, client);
const balance = await service.getBalance();
\`\`\`

## Architecture
- Core: Pure business logic
- Infrastructure: External dependencies
- Hooks: React integration
```

---

## Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 2 weeks | Extract Wallet Feature |
| Phase 2 | 1 week  | Extract Chat Feature |
| Phase 3 | 1 week  | Extract Nostr Feature |
| Phase 4 | 1 week  | Cleanup & Documentation |
| **Total** | **5 weeks** | **Complete Refactor** |

---

## Success Metrics

✅ **Wallet is 100% extractable** - Can be used in any JS project
✅ **All features have <100 LOC hooks** - Business logic moved to services
✅ **90%+ test coverage** - Core services fully tested
✅ **Documentation complete** - Each feature has README
✅ **New contributor onboarding < 1 hour** - Clear structure

---

## Questions & Considerations

1. **Do we want to keep using Zustand?**
   - Consider moving to services + React Query for server state
   - Keep Zustand only for UI state

2. **Monorepo or Separate Packages?**
   - Consider Turborepo/Nx if you want to publish `@routstr/wallet` separately

3. **TypeScript Strict Mode?**
   - Now is a good time to enable `strict: true`

4. **Testing Framework?**
   - Add Vitest for unit tests
   - Add Playwright for E2E

---

## Next Steps

1. **Review this plan** with the team
2. **Start with Phase 1** (Wallet) - it's the highest priority
3. **Create feature branch** `refactor/modular-architecture`
4. **Migrate incrementally** - don't break main
5. **Write tests** as you migrate
6. **Update documentation** continuously

---

**Questions? Start with `features/wallet/` and make it work. Then replicate the pattern for other features.**

