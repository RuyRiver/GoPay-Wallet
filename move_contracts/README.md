# APT Transfer Module

This module provides functions to perform different types of APT (Aptos Coin) token transfers on the Aptos blockchain.

## Features

### 1. Fixed Amount Transfers
- `transfer_1APT`: Transfers exactly 1 APT to a predefined address
- `transfer_point_1_APT`: Transfers exactly 0.1 APT to a predefined address

### 2. Custom Transfers
- `transfer_simple`: Performs a direct APT transfer to any address
- `transfer_apt`: Performs a transfer with a 1% fee
- `transfer_with_fee`: Alternative version of fee transfer (different beneficiary address)

### 3. Utilities
- `register_coin_store`: Registers a coin store for an account

## How to Use

### Main Commands

```bash
# Transfer 1 APT
aptos % sources/transfer.move transfer_1APT <account_address>

# Transfer 0.1 APT
aptos % sources/transfer.move transfer_point_1_APT <account_address>

# Transfer APT with fee
aptos % sources/transfer.move transfer_apt <account_address> <recipient_address> <amount>

# Register a coin store
aptos % sources/transfer.move register_coin_store <account_address>
```

## Technical Details

- Amounts are handled in microAPT (1 APT = 100,000,000 microAPT)
- Fee transfers include a 1% charge
- All functions verify balance before performing the transfer
- Recipient addresses for fixed transfers are hardcoded in the contract

## Important Notes

- Make sure you have sufficient balance before performing any transfer
- The recipient account must have a registered coin store to receive APT
- Fee transfers automatically split the amount: 99% for the recipient and 1% for the fee address