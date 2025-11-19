// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RIFDepositerOptimized
 * @notice Gas-optimized version that routes swap output directly to contract
 * @dev Saves ~50k gas by eliminating transferFrom of RIF tokens from user
 */
contract RIFDepositerOptimized {
    address public constant TO_ADDRESS =
        0xAC4c6e212A361c968F1725b4d055b47E63F80b75; // Sushi Router
    address public constant RIF_TOKEN =
        0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5;
    address public constant STAKING_CONTRACT =
        0x5Db91E24BD32059584bbdB831a901F1199f3D459;

    /**
     * @notice Execute swaps and deposit RIF to staking in one transaction
     * @dev IMPORTANT: The calldata must route RIF output to address(this), not msg.sender
     * @param tokens Array of input token addresses to swap from
     * @param amounts Array of input token amounts to swap
     * @param callDataArray Array of encoded swap calls for Sushi Router
     */
    function executeCallsAndDeposit(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes[] calldata callDataArray
    ) external {
        require(tokens.length == amounts.length, "Tokens and amounts arrays must have same length");

        // Transfer specified amounts of input tokens from user to this contract
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

        // Check contract's RIF balance before swaps
        uint256 rifBalanceBefore = IERC20(RIF_TOKEN).balanceOf(address(this));

        // Execute low-level calls for each calldata in the array
        // CRITICAL: These swaps must route RIF tokens to address(this)
        for (uint256 i = 0; i < callDataArray.length; i++) {
            (bool success, ) = TO_ADDRESS.call(callDataArray[i]);
            require(success, "Call failed");
        }

        // Check contract's RIF balance after swaps
        uint256 rifBalanceAfter = IERC20(RIF_TOKEN).balanceOf(address(this));
        uint256 rifReceived = rifBalanceAfter - rifBalanceBefore;

        // GAS OPTIMIZATION: RIF tokens are already in this contract!
        // No transferFrom needed - saves ~50k gas

        if (rifReceived > 0) {
            // Approve staking contract to spend the RIF tokens
            IERC20(RIF_TOKEN).approve(STAKING_CONTRACT, rifReceived);

            // Call depositFor on the staking contract for the user
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

    /**
     * @notice Testable version with configurable recipient
     * @dev Use this for testing when you need to specify a different recipient
     * @param tokens Array of input token addresses
     * @param amounts Array of input token amounts
     * @param callDataArray Array of swap calldata
     * @param recipient Address that will receive RIF from swaps (usually address(this))
     */
    function executeCallsAndDepositWithRecipient(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes[] calldata callDataArray,
        address recipient
    ) external {
        require(tokens.length == amounts.length, "Tokens and amounts arrays must have same length");
        require(recipient != address(0), "Invalid recipient");

        // Transfer input tokens from user to this contract
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] > 0) {
                IERC20(tokens[i]).transferFrom(msg.sender, address(this), amounts[i]);
            }
        }

        // Approve router to spend tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
            if (balance > 0) {
                IERC20(tokens[i]).approve(TO_ADDRESS, balance);
            }
        }

        // Check RIF balance before (of the recipient)
        uint256 rifBalanceBefore = IERC20(RIF_TOKEN).balanceOf(recipient);

        // Execute swaps
        for (uint256 i = 0; i < callDataArray.length; i++) {
            (bool success, ) = TO_ADDRESS.call(callDataArray[i]);
            require(success, "Call failed");
        }

        // Check RIF balance after
        uint256 rifBalanceAfter = IERC20(RIF_TOKEN).balanceOf(recipient);
        uint256 rifReceived = rifBalanceAfter - rifBalanceBefore;

        if (rifReceived > 0) {
            // If recipient is this contract, tokens are already here
            // If recipient is msg.sender (for testing), need to pull them
            if (recipient == msg.sender) {
                IERC20(RIF_TOKEN).transferFrom(msg.sender, address(this), rifReceived);
            }

            // Approve and deposit
            IERC20(RIF_TOKEN).approve(STAKING_CONTRACT, rifReceived);
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
