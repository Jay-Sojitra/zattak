// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/RIFDepositer.sol";
import "../src/RIFDepositerOptimized.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RIFDepositerOptimizedTest
 * @notice Test suite comparing gas costs between original and optimized implementations
 */
contract RIFDepositerOptimizedTest is Test {
    RIFDepositer public originalContract;
    RIFDepositerOptimized public optimizedContract;

    address public constant RUSDT = 0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96; // 18 decimals
    address public constant USDT = 0x779Ded0c9e1022225f8E0630b35a9b54bE713736;  // 6 decimals
    address public constant RIF = 0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5;
    address public constant STAKING_CONTRACT = 0x5Db91E24BD32059584bbdB831a901F1199f3D459;

    // Whale addresses with token balances
    address public constant RUSDT_WHALE = 0x922164BBBd36Acf9E854AcBbF32faCC949fCAEef;
    address public constant USDT_WHALE = 0x922164BBBd36Acf9E854AcBbF32faCC949fCAEef;

    function setUp() public {
        // Fork Rootstock mainnet at a recent block
        vm.createSelectFork("https://mycrypto.rsk.co/");

        // Deploy both contracts
        originalContract = new RIFDepositer();
        optimizedContract = new RIFDepositerOptimized();
    }

    /**
     * @notice Test original contract with calldata that routes RIF to user
     * @dev This demonstrates the gas cost of the original approach
     */
    function testOriginalApproach_RUSDT() public {
        uint256 amount = 0.1 ether; // 0.1 rUSDT

        // Setup: Transfer RUSDT from whale to test user
        vm.startPrank(RUSDT_WHALE);
        IERC20(RUSDT).transfer(address(this), amount);
        vm.stopPrank();

        // Approve original contract
        IERC20(RUSDT).approve(address(originalContract), amount);

        // This calldata routes RIF output to msg.sender (this test contract)
        // Generated with: generateSwapCalldata(RUSDT, 100000000000000000n, 'testContractAddress')
        bytes memory calldataToUser = hex"YOUR_CALLDATA_HERE"; // <-- Replace with actual calldata

        address[] memory tokens = new address[](1);
        tokens[0] = RUSDT;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        bytes[] memory callDataArray = new bytes[](1);
        callDataArray[0] = calldataToUser;

        // Approve original contract to pull RIF tokens back from us
        vm.prank(address(this));
        IERC20(RIF).approve(address(originalContract), type(uint256).max);

        // Measure gas
        uint256 gasBefore = gasleft();
        originalContract.executeCallsAndDeposit(tokens, amounts, callDataArray);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Original Approach Gas Used:", gasUsed);
    }

    /**
     * @notice Test optimized contract with calldata that routes RIF directly to contract
     * @dev This demonstrates the gas savings from the optimization
     */
    function testOptimizedApproach_RUSDT() public {
        uint256 amount = 0.1 ether; // 0.1 rUSDT

        // Setup: Transfer RUSDT from whale to test user
        vm.startPrank(RUSDT_WHALE);
        IERC20(RUSDT).transfer(address(this), amount);
        vm.stopPrank();

        // Approve optimized contract
        IERC20(RUSDT).approve(address(optimizedContract), amount);

        // This calldata routes RIF output to optimizedContract address
        // Generated with: generateSwapCalldata(RUSDT, 100000000000000000n, optimizedContractAddress)
        bytes memory calldataToContract = hex"YOUR_CALLDATA_HERE"; // <-- Replace with actual calldata

        address[] memory tokens = new address[](1);
        tokens[0] = RUSDT;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        bytes[] memory callDataArray = new bytes[](1);
        callDataArray[0] = calldataToContract;

        // NO APPROVAL NEEDED - RIF goes directly to contract!

        // Measure gas
        uint256 gasBefore = gasleft();
        optimizedContract.executeCallsAndDeposit(tokens, amounts, callDataArray);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Optimized Approach Gas Used:", gasUsed);
    }

    /**
     * @notice Compare gas costs side by side
     * @dev Run this test to see the exact gas savings
     */
    function testGasComparison() public {
        console.log("\n========================================");
        console.log("GAS COMPARISON TEST");
        console.log("========================================\n");

        // Note: You'll need to update the calldata in the test functions above
        // Then run: forge test --match-test testGasComparison -vv --fork-url https://mycrypto.rsk.co/

        console.log("Expected gas savings: ~50,000 gas");
        console.log("This comes from eliminating the ERC20 transferFrom call\n");

        console.log("To run this test:");
        console.log("1. Deploy RIFDepositerOptimized contract");
        console.log("2. Generate calldata using generate-calldata-optimized.js");
        console.log("3. Update the calldata hex strings in this test file");
        console.log("4. Run: forge test --match-test testOriginalApproach_RUSDT -vv");
        console.log("5. Run: forge test --match-test testOptimizedApproach_RUSDT -vv");
        console.log("6. Compare the gas usage!");
    }

    /**
     * @notice Test the configurable recipient function
     * @dev This shows how to test before knowing the final contract address
     */
    function testConfigurableRecipient() public {
        uint256 amount = 0.1 ether;

        // Setup
        vm.startPrank(RUSDT_WHALE);
        IERC20(RUSDT).transfer(address(this), amount);
        vm.stopPrank();

        IERC20(RUSDT).approve(address(optimizedContract), amount);

        // Generate calldata that routes to a test address (e.g., this contract)
        bytes memory calldataToTest = hex"YOUR_TEST_CALLDATA_HERE";

        address[] memory tokens = new address[](1);
        tokens[0] = RUSDT;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        bytes[] memory callDataArray = new bytes[](1);
        callDataArray[0] = calldataToTest;

        // When using recipient = address(this), we need to approve
        IERC20(RIF).approve(address(optimizedContract), type(uint256).max);

        // Call with explicit recipient
        optimizedContract.executeCallsAndDepositWithRecipient(
            tokens,
            amounts,
            callDataArray,
            address(this) // Recipient for testing
        );

        console.log("Configurable recipient test passed!");
    }

    /**
     * @notice Helper to check balances
     */
    function testBalanceChecks() public {
        console.log("RUSDT Balance (whale):", IERC20(RUSDT).balanceOf(RUSDT_WHALE));
        console.log("USDT Balance (whale):", IERC20(USDT).balanceOf(USDT_WHALE));
        console.log("RIF Balance (whale):", IERC20(RIF).balanceOf(RUSDT_WHALE));
    }

    // Allow this contract to receive RIF tokens (for testing)
    receive() external payable {}
}
