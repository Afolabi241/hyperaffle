// Bonding-curve economics for coins launched on the pad.
//
// Model: a constant-product virtual-reserve curve (pump.fun style). Each coin
// starts seeded with VIRTUAL_LIQUIDITY of virtual collateral so the very first
// buy has a non-zero price. As people buy, collateral flows in and tokens leave
// the curve, pushing the price (and market cap) up. When market cap reaches
// MIGRATION_MCAP the coin "graduates" and its liquidity migrates to a DEX.
//
// The constants are chosen to be self-consistent:
//   - market cap at 0 raised   = START_MCAP   ($2,000)
//   - market cap at graduation = MIGRATION_MCAP ($40,000)

export const TOTAL_SUPPLY = 1_000_000_000 // 1B tokens
export const START_MCAP = 2_000 // USD market cap at launch
export const MIGRATION_MCAP = 40_000 // USD market cap that triggers migration

// Virtual collateral seeded into the curve so price != 0 on the first buy.
// With the virtual token reserve set to TOTAL_SUPPLY, start mcap === this value.
export const VIRTUAL_LIQUIDITY = START_MCAP // $2,000 virtual liquidity

const VIRTUAL_TOKEN_0 = TOTAL_SUPPLY
const K = VIRTUAL_TOKEN_0 * VIRTUAL_LIQUIDITY // constant product

// Collateral that must be raised to move mcap from START -> MIGRATION.
export const RAISE_TO_MIGRATE =
  Math.sqrt(MIGRATION_MCAP * VIRTUAL_LIQUIDITY) - VIRTUAL_LIQUIDITY

export type CurveState = {
  raised: number // collateral raised so far (USD)
  marketCap: number // current market cap (USD)
  price: number // current price per token (USD)
  tokensSold: number // tokens bought off the curve
  virtualLiquidity: number // current collateral side of the virtual pool
  progress: number // 0..1 toward migration
  migrated: boolean
}

// Derive full curve state from how far along the raise a coin is (0..1).
export function curveState(progress: number): CurveState {
  const p = Math.max(0, Math.min(1, progress))
  const raised = p * RAISE_TO_MIGRATE
  const collReserve = VIRTUAL_LIQUIDITY + raised
  const tokenReserve = K / collReserve
  const price = (collReserve * collReserve) / K / TOTAL_SUPPLY
  const marketCap = price * TOTAL_SUPPLY
  return {
    raised,
    marketCap,
    price,
    tokensSold: VIRTUAL_TOKEN_0 - tokenReserve,
    virtualLiquidity: collReserve,
    progress: p,
    migrated: p >= 1,
  }
}
