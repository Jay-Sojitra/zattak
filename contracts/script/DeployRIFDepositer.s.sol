// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/RIFDepositer.sol";

contract DeployRIFDepositer is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy RIFDepositer contract
        // No constructor parameters needed as all addresses are hardcoded constants
        RIFDepositer depositer = new RIFDepositer();
        
        console.log("RIFDepositer deployed at:", address(depositer));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        
        // Log the hardcoded addresses for verification
        console.log("Sushiswap Router:", depositer.TO_ADDRESS());
        console.log("RIF Token:", depositer.RIF_TOKEN());
        console.log("Staking Contract:", depositer.STAKING_CONTRACT());
        
        vm.stopBroadcast();
    }
}
