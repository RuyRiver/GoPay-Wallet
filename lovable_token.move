module LVT::lovable_token {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    struct LovableToken {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<LovableToken>(
            sender,
            b"Lovable Token",
            b"LVT",
            8,
            false,
        );
    }

    /// Registra un usuario para recibir el token LovableToken
    public entry fun register(account: &signer) {
        managed_coin::register<LovableToken>(account);
    }

    /// Acuña nuevos tokens LovableToken
    public entry fun mint(
        account: &signer,
        dst_addr: address,
        amount: u64,
    ) {
        managed_coin::mint<LovableToken>(account, dst_addr, amount);
    }

    /// Quema tokens LovableToken
    public entry fun burn(
        account: &signer,
        amount: u64,
    ) {
        managed_coin::burn<LovableToken>(account, amount);
    }
} 