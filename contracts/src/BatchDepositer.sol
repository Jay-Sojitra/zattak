// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RIFBatchDepositer {
    
    address public constant tRIF_TOKEN =
        0x19F64674D8A5B4E652319F5e239eFd3bc969A1fE;
    address public constant STAKING_CONTRACT =
        0xC4b091d97AD25ceA5922f09fe80711B7ACBbb16f ;

    function executeCallsAndDeposit(
        address[] calldata tokens, 
        uint256[] calldata amounts,
        uint256  amount
    ) external {
        require(tokens.length == amounts.length, "Tokens and amounts arrays must have same length");
        
        // Transfer specified amounts of tokens from user to this contract
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] > 0) {
                IERC20(tokens[i]).transferFrom(msg.sender, address(this), amounts[i]);
            }
        }

        uint256 tRIFReceived = amount;
        
        // If user received RIF tokens from the swaps, pull them to our contract for staking
        if (tRIFReceived > 0) {
        
            // Approve staking contract to spend the RIF tokens
            IERC20(tRIF_TOKEN).approve(STAKING_CONTRACT, tRIFReceived);

            // Call depositFor on the staking contract
            (bool depositSuccess, ) = STAKING_CONTRACT.call(
                abi.encodeWithSignature(
                    "depositFor(address,uint256)",
                    msg.sender,
                    tRIFReceived
                )
            );
            require(depositSuccess, "Deposit failed");
        }
    }
}
