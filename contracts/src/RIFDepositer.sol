// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RIFDepositer
 * @notice Allows users to swap multiple tokens to RIF and stake in one transaction
 * @dev Slippage is handled by the router - if any swap fails, entire tx reverts
 */
contract RIFDepositer {
    /// @notice Sushiswap Router address on Rootstock
    address public constant TO_ADDRESS = 0xAC4c6e212A361c968F1725b4d055b47E63F80b75;

    /// @notice RIF token address on Rootstock
    address public constant RIF_TOKEN = 0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5;

    /// @notice stRIF staking contract address on Rootstock
    address public constant STAKING_CONTRACT = 0x5Db91E24BD32059584bbdB831a901F1199f3D459;

    /// @dev Custom errors save gas compared to require strings
    error ArrayLengthMismatch();
    error CallFailed(uint256 callIndex);
    error DepositFailed();

    /**
     * @notice Executes token swaps to RIF and stakes the received RIF
     * @dev All swaps are atomic - if any fails, entire transaction reverts
     * @param tokens Array of token addresses to swap from
     * @param amounts Array of amounts to swap (must match tokens length)
     * @param callDataArray Array of encoded swap calls (must match tokens length)
     */
    function executeCallsAndDeposit(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes[] calldata callDataArray
    ) external {
        // Validate array lengths match
        uint256 length = tokens.length;
        if (length != amounts.length || length != callDataArray.length) {
            revert ArrayLengthMismatch();
        }

        // Single loop: Transfer tokens from user and approve router
        // Using unchecked for loop counter saves gas (overflow impossible with realistic array sizes)
        for (uint256 i; i < length; ) {
            uint256 amount = amounts[i];
            if (amount > 0) {
                address token = tokens[i];
                // Transfer tokens from user to this contract
                IERC20(token).transferFrom(msg.sender, address(this), amount);
                // Approve router to spend the exact amount we received
                IERC20(token).approve(TO_ADDRESS, amount);
            }
            unchecked {
                ++i;
            }
        }

        // Record contract's RIF balance before swaps
        uint256 contractRifBalanceBefore = IERC20(RIF_TOKEN).balanceOf(address(this));

        // Execute swap calls - router will revert if slippage exceeded
        for (uint256 i; i < length; ) {
            (bool success, ) = TO_ADDRESS.call(callDataArray[i]);
            if (!success) {
                revert CallFailed(i);
            }
            unchecked {
                ++i;
            }
        }

        // Calculate how much RIF user received from swaps
        uint256 contractRifBalanceAfter = IERC20(RIF_TOKEN).balanceOf(address(this));
        uint256 rifReceived;
        unchecked {
            // Safe because contractRifBalanceAfter >= contractRifBalanceBefore after successful swaps
            rifReceived = contractRifBalanceAfter - contractRifBalanceBefore;
        }

        // Stake the received RIF tokens
        if (rifReceived > 0) {
            // Approve staking contract
            IERC20(RIF_TOKEN).approve(STAKING_CONTRACT, rifReceived);

            // Stake on behalf of user
            (bool depositSuccess, ) = STAKING_CONTRACT.call(
                abi.encodeWithSignature("depositFor(address,uint256)", msg.sender, rifReceived)
            );
            if (!depositSuccess) {
                revert DepositFailed();
            }
        }
    }
}
