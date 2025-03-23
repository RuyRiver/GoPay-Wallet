address 0xd9e52d8d53e52d88fe1d92ac5589074c8984ff59b2859b3a9e094a8b77c23eca {
    module transfer {
        use aptos_framework::coin;
        use aptos_framework::aptos_coin;
        use std::signer;

        public entry fun transfer_1APT(account: signer) {
            let sender = signer::address_of(&account);
            let recipient = @0x23273f617a4cf4c9053d68a489111bbaeca4e04514d0f6228522f8117611a85c;
            let amount = 100000000; // 1 APT

            let sender_balance = coin::balance<aptos_coin::AptosCoin>(sender);
            assert!(sender_balance >= amount, 1);

            coin::transfer<aptos_coin::AptosCoin>(&account, recipient, amount);
        }

        public entry fun transfer_point_1_APT(account: signer) {
            let sender = signer::address_of(&account);
            let recipient = @0x264e1ccb0af681b996f06b687d50cd235811c198ddaea6deb9fc27bae2ab9f15;
            let amount = 10000000; // 0.1 APT

            let sender_balance = coin::balance<aptos_coin::AptosCoin>(sender);
            assert!(sender_balance >= amount, 1);

            coin::transfer<aptos_coin::AptosCoin>(&account, recipient, amount);
        }

        public entry fun transfer_apt(account: signer, recipient: address, amount: u64) {
            let sender = signer::address_of(&account);
            let fee_recipient: address = @0x38e7b5b2f1c25b29c2d755182da7a944ed5b2815726e69edaffc52ff3d7e2b10;
            let fee_amount = amount / 100;
            let transfer_amount = amount - fee_amount;

            let sender_balance = coin::balance<aptos_coin::AptosCoin>(sender);
            assert!(sender_balance >= amount, 1);

            coin::transfer<aptos_coin::AptosCoin>(&account, recipient, transfer_amount);
            coin::transfer<aptos_coin::AptosCoin>(&account, fee_recipient, fee_amount);
        }

        public entry fun register_coin_store(account: signer) {
            coin::register<aptos_coin::AptosCoin>(&account);
        }

        public entry fun transfer_simple(account: signer, recipient: address, amount: u64) {
            let sender = signer::address_of(&account);
            let sender_balance = coin::balance<aptos_coin::AptosCoin>(sender);
            assert!(sender_balance >= amount, 1);

            coin::transfer<aptos_coin::AptosCoin>(&account, recipient, amount);
        }

        public entry fun transfer_with_fee(account: signer, recipient: address, amount: u64) {
            let sender = signer::address_of(&account);
            let fee_recipient: address = @0x14cbbe64f43a8d635bbf88876a806fbec574cad26e7312021dd0876de7e2d9da;
            let fee_amount = amount / 100; // 1% del monto
            let transfer_amount = amount - fee_amount; // 99% del monto

            let sender_balance = coin::balance<aptos_coin::AptosCoin>(sender);
            assert!(sender_balance >= amount, 1);

            coin::transfer<aptos_coin::AptosCoin>(&account, recipient, transfer_amount);
            coin::transfer<aptos_coin::AptosCoin>(&account, fee_recipient, fee_amount);
        }
    }
}
