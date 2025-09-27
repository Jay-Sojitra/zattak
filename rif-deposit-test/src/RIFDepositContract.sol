// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RIFDepositContract {
    address public constant TO_ADDRESS =
        0xAC4c6e212A361c968F1725b4d055b47E63F80b75;
    address public constant RIF_TOKEN =
        0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5;
    address public constant STAKING_CONTRACT =
        0x5Db91E24BD32059584bbdB831a901F1199f3D459;

    function executeCallsAndDeposit(
        address[] calldata tokens, 
        uint256[] calldata amounts, 
        bytes[] calldata callDataArray
    ) external {
        require(tokens.length == amounts.length, "Tokens and amounts arrays must have same length");
        
        // Transfer specified amounts of tokens from user to this contract
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] > 0) {
                IERC20(tokens[i]).transferFrom(msg.sender, address(this), amounts[i]);
            }
        }
        
        // Approve router to spend all transferred tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
            if (balance > 0) {
                IERC20(tokens[i]).approve(TO_ADDRESS, balance);
            }
        }
        
        // Check user's RIF balance before swaps
        uint256 userRifBalanceBefore = IERC20(RIF_TOKEN).balanceOf(msg.sender);
        
        // Execute low-level calls for each calldata in the array
        for (uint256 i = 0; i < callDataArray.length; i++) {
            (bool success, ) = TO_ADDRESS.call(callDataArray[i]);
            require(success, "Call failed");
        }

        // Check user's RIF balance after swaps to see how much RIF they received
        uint256 userRifBalanceAfter = IERC20(RIF_TOKEN).balanceOf(msg.sender);
        uint256 rifReceived = userRifBalanceAfter - userRifBalanceBefore;
        
        // If user received RIF tokens from the swaps, pull them to our contract for staking
        if (rifReceived > 0) {
            // Transfer the received RIF tokens from user to this contract
            IERC20(RIF_TOKEN).transferFrom(msg.sender, address(this), rifReceived);
            
            // Approve staking contract to spend the RIF tokens
            IERC20(RIF_TOKEN).approve(STAKING_CONTRACT, rifReceived);

            // Call depositFor on the staking contract
            (bool depositSuccess, ) = STAKING_CONTRACT.call(
                abi.encodeWithSignature(
                    "depositFor(address,uint256)",
                    msg.sender,
                    rifReceived
                )
            );
            require(depositSuccess, "Deposit failed");
        }
    }
}
