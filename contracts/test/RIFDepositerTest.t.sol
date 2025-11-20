// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/RIFDepositer.sol";

contract RIFDepositerTest is Test {
    RIFDepositer public rifDepositer;

    // Token addresses on Rootstock
    address constant RUSDT_TOKEN = 0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96;
    address constant USDT_TOKEN = 0x779Ded0c9e1022225f8E0630b35a9b54bE713736;
    address constant RIF_TOKEN = 0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5;
    address constant stRIF_TOKEN = 0x5Db91E24BD32059584bbdB831a901F1199f3D459;

    // Sushi Router address (TO_ADDRESS in the contract)
    address constant SUSHI_ROUTER = 0xAC4c6e212A361c968F1725b4d055b47E63F80b75;

    // Whale address that holds both RUSDT and USDT
    address constant WHALE = 0x922164BBBd36Acf9E854AcBbF32faCC949fCAEef;

    // Test user (this is the address hardcoded in our calldata)
    address constant USER = 0x237b7244EA07073E86e6f11C42Db3a95378b181F;

    // Generated calldata from our script (updated with contract address as recipient)
    // Note: hex literals in Solidity should NOT have 0x prefix
    // Latest calldata generated from generate-calldata.js script
    bytes constant RUSDT_TO_RIF_CALLDATA =
        hex"5f3bd1c8000000000000000000000000ef213441a85df4d7acbdae0cf78004e1e486bb96000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000014b437488d0e6562e4f61e377bef895233fdd9170000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d5000000000000000000000000000000000000000000000000256163be6cdf630a000000000000000000000000d2b37ade14708bf18904047b1e31f8166d39612b00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001846be92b89000000000000000000000000ef213441a85df4d7acbdae0cf78004e1e486bb96000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d500000000000000000000000000000000000000000000000025917a1d4aafa00000000000000000000000000014b437488d0e6562e4f61e377bef895233fdd9170000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000051019a9fdfef46000101ef213441a85df4d7acbdae0cf78004e1e486bb9601ffff0154daedb78bb6f8fc165efe240774361493f36ef500d2b37ade14708bf18904047b1e31f8166d39612b00b1a32996462e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    bytes constant USDT_TO_RIF_CALLDATA =
        hex"5f3bd1c8000000000000000000000000779ded0c9e1022225f8e0630b35a9b54be71373600000000000000000000000000000000000000000000000000000000000f424000000000000000000000000014b437488d0e6562e4f61e377bef895233fdd9170000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d500000000000000000000000000000000000000000000000160bb3e6d6651ffc2000000000000000000000000d2b37ade14708bf18904047b1e31f8166d39612b00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001846be92b89000000000000000000000000779ded0c9e1022225f8e0630b35a9b54be71373600000000000000000000000000000000000000000000000000000000000f42400000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d5000000000000000000000000000000000000000000000001628102475b41b00000000000000000000000000014b437488d0e6562e4f61e377bef895233fdd9170000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000051019a9fdfef4a000101779ded0c9e1022225f8e0630b35a9b54be71373601ffff0157079b2d3071eb06cce6dbafb9b0306bcc49b02000d2b37ade14708bf18904047b1e31f8166d39612b00f42404b1413100000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    function setUp() public {
        // Create fork of Rootstock using environment variable
        string memory rpcUrl = vm.envOr("ROOTSTOCK_RPC_URL", string("https://public-node.rsk.co"));
        vm.createSelectFork(rpcUrl);

        // Deploy our contract
        rifDepositer = RIFDepositer(0x14b437488D0e6562E4f61E377BEF895233fdd917);
    }

    function testWhaleBalances() public view {
        // Check whale balances
        uint256 rusdtBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 usdtBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);

        console.log("Whale RUSDT balance:", rusdtBalance);
        console.log("Whale USDT balance:", usdtBalance);

        assertTrue(rusdtBalance > 0, "Whale should have RUSDT");
        assertTrue(usdtBalance > 0, "Whale should have USDT");
    }

    function testExecuteCallsAndDepositWithRUSDT() public {
        // Impersonate whale and approve our contract to spend tokens
        vm.startPrank(WHALE);
        uint256 approveAmount = 100000000000000000; // 0.1 RUSDT
        IERC20(RUSDT_TOKEN).approve(address(rifDepositer), approveAmount);
        // Note: No need to approve RIF tokens - contract gets them directly from swap
        vm.stopPrank();

        // Verify whale's RUSDT balance and our contract's allowance
        uint256 whaleBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 allowance = IERC20(RUSDT_TOKEN).allowance(
            WHALE,
            address(rifDepositer)
        );

        console.log("Whale RUSDT balance:", whaleBalance);
        console.log("Contract allowance:", allowance);

        assertGt(whaleBalance, 0, "Whale should have RUSDT");
        assertEq(allowance, approveAmount, "Contract should have approval");

        // Prepare arrays for the new function signature
        address[] memory tokens = new address[](1);
        tokens[0] = RUSDT_TOKEN;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = approveAmount;

        bytes[] memory callDataArray = new bytes[](1);
        callDataArray[0] = RUSDT_TO_RIF_CALLDATA;

        // Record initial balances
        uint256 initialRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 initialRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifDepositer)
        );
        uint256 initialWhaleRIFBalance = IERC20(RIF_TOKEN).balanceOf(WHALE);
        uint256 initialWhalestRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);
        uint256 initialRIFBalanceInStakingContract = IERC20(RIF_TOKEN)
            .balanceOf(stRIF_TOKEN);

        // console.log("Initial RUSDT balance:", initialRUSDTBalance);
        console.log("Initial contract RIF balance:", initialRIFBalance);
        console.log("Initial whale RIF balance:", initialWhaleRIFBalance);
        console.log("Initial whale stRIF balance:", initialWhalestRIFBalance);
        console.log(
            "Initial RIF balance in staking contract:",
            initialRIFBalanceInStakingContract
        );

        console.log("=== BEFORE STAKING ===");
        console.log("User stRIF balance BEFORE:", initialWhalestRIFBalance);

        // Execute the function as the whale (since whale is the token holder)
        vm.prank(WHALE);
        rifDepositer.executeCallsAndDeposit(tokens, amounts, callDataArray);

        console.log("=== AFTER STAKING ===");

        // Check final balances
        uint256 finalRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 finalRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifDepositer)
        );
        uint256 finalWhaleRIFBalance = IERC20(RIF_TOKEN).balanceOf(WHALE);
        uint256 finalWhalestRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);
        uint256 finalRIFBalanceInStakingContract = IERC20(RIF_TOKEN).balanceOf(
            stRIF_TOKEN
        );

        console.log("Final RUSDT balance:", finalRUSDTBalance);
        console.log("Final contract RIF balance:", finalRIFBalance);
        console.log("Final whale RIF balance:", finalWhaleRIFBalance);
        console.log("User stRIF balance AFTER:", finalWhalestRIFBalance);
        console.log(
            "stRIF INCREASE:",
            finalWhalestRIFBalance - initialWhalestRIFBalance
        );
        console.log(
            "Final RIF balance in staking contract:",
            finalRIFBalanceInStakingContract
        );

        // Verify the flow worked:
        // 1. RUSDT was consumed
        assertEq(
            finalRUSDTBalance,
            initialRUSDTBalance - approveAmount,
            "RUSDT should have been consumed"
        );

        assertEq(
            initialWhaleRIFBalance,
            finalWhaleRIFBalance,
            "RIF balance should be the same for WHALE"
        );

        // 2. Contract should have 0 RIF (deposited to staking)
        assertEq(
            finalRIFBalance,
            0,
            "Contract should have 0 RIF after depositing to staking"
        );

        //check JUST the stRIF balance of the whale increased 
        assertGt(
            finalWhalestRIFBalance,
            initialWhalestRIFBalance,
            "stRIF balance should have increased for WHALE"
        );

        // 3. Function completed without reverting (which means deposit succeeded)
        console.log("SUCCESS: Full flow completed - RUSDT -> RIF -> Staked!");
    }

    function testExecuteCallsAndDepositWithUSDT() public {
        // Impersonate whale and approve our contract to spend tokens
        vm.startPrank(WHALE);
        uint256 approveAmount = 1000000; // 1 USDT (6 decimals)
        IERC20(USDT_TOKEN).approve(address(rifDepositer), approveAmount);
        // Note: No need to approve RIF tokens - contract gets them directly from swap
        vm.stopPrank();

        // Verify whale's USDT balance and our contract's allowance
        uint256 whaleBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
        uint256 allowance = IERC20(USDT_TOKEN).allowance(
            WHALE,
            address(rifDepositer)
        );

        assertGt(whaleBalance, 0, "Whale should have USDT");
        assertEq(allowance, approveAmount, "Contract should have approval");

        // Prepare arrays for the new function signature
        address[] memory tokens = new address[](1);
        tokens[0] = USDT_TOKEN;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = approveAmount;

        bytes[] memory callDataArray = new bytes[](1);
        callDataArray[0] = USDT_TO_RIF_CALLDATA;

        // Record initial balances
        uint256 initialUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
        uint256 initialRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifDepositer)
        );

        console.log("Initial USDT balance:", initialUSDTBalance);
        console.log("Initial contract RIF balance:", initialRIFBalance);

        uint256 initialWhalestRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);
        console.log("=== BEFORE STAKING ===");
        console.log("User stRIF balance BEFORE:", initialWhalestRIFBalance);

        // Execute the function as the whale (since whale is the token holder)
        vm.prank(WHALE);
        rifDepositer.executeCallsAndDeposit(tokens, amounts, callDataArray);

        console.log("=== AFTER STAKING ===");

        // Check final balances
        uint256 finalUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
        uint256 finalRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifDepositer)
        );

        uint256 finalWhalestRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);
        console.log("Final USDT balance:", finalUSDTBalance);
        console.log("Final contract RIF balance:", finalRIFBalance);
        console.log("User stRIF balance AFTER:", finalWhalestRIFBalance);
        console.log(
            "stRIF INCREASE:",
            finalWhalestRIFBalance - initialWhalestRIFBalance
        );

        // Verify the flow worked:
        // 1. USDT was consumed
        assertEq(
            finalUSDTBalance,
            initialUSDTBalance - approveAmount,
            "USDT should have been consumed"
        );

        assertGt(
            finalWhalestRIFBalance,
            initialWhalestRIFBalance,
            "stRIF balance should have increased for WHALE"
        );

        // 2. Contract should have 0 RIF (deposited to staking)
        assertEq(
            finalRIFBalance,
            0,
            "Contract should have 0 RIF after depositing to staking"
        );

        console.log("SUCCESS: Full flow completed - USDT -> RIF -> Staked!");
    }

    function testBothSwapsInOneCall() public {
        // Setup with whale address - approve both tokens
        vm.startPrank(WHALE);

        // Approve RUSDT (0.1 RUSDT with 18 decimals)
        uint256 rusdtAmount = 100000000000000000; // 0.1 RUSDT
        IERC20(RUSDT_TOKEN).approve(address(rifDepositer), rusdtAmount);

        // Approve USDT (1 USDT with 6 decimals)
        uint256 usdtAmount = 1000000; // 1 USDT
        IERC20(USDT_TOKEN).approve(address(rifDepositer), usdtAmount);
        // Note: No need to approve RIF tokens - contract gets them directly from swap

        vm.stopPrank();

        // Prepare arrays for both tokens
        address[] memory tokens = new address[](2);
        tokens[0] = RUSDT_TOKEN;
        tokens[1] = USDT_TOKEN;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = rusdtAmount;
        amounts[1] = usdtAmount;

        bytes[] memory callDataArray = new bytes[](2);
        callDataArray[0] = RUSDT_TO_RIF_CALLDATA;
        callDataArray[1] = USDT_TO_RIF_CALLDATA;

        // Record initial balances
        uint256 initialRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 initialUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
        uint256 initialRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifDepositer)
        );
        uint256 initialRIFBalanceInStakingContract = IERC20(RIF_TOKEN)
            .balanceOf(stRIF_TOKEN);

        console.log("Initial RUSDT balance:", initialRUSDTBalance);
        console.log("Initial USDT balance:", initialUSDTBalance);
        console.log("Initial contract RIF balance:", initialRIFBalance);
        console.log(
            "Initial RIF balance in staking contract:",
            initialRIFBalanceInStakingContract
        );

        uint256 initialWhaleStRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);

        console.log("=== BEFORE STAKING ===");
        console.log("User stRIF balance BEFORE:", initialWhaleStRIFBalance);

        // Execute both swaps as the whale
        vm.prank(WHALE);
        rifDepositer.executeCallsAndDeposit(tokens, amounts, callDataArray);

        console.log("=== AFTER STAKING ===");

        // Check final balances
        uint256 finalRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 finalUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
        uint256 finalRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifDepositer)
        );
        uint256 finalRIFBalanceInStakingContract = IERC20(RIF_TOKEN).balanceOf(
            stRIF_TOKEN
        );

        uint256 finalWhaleStRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);

        console.log("User stRIF balance AFTER:", finalWhaleStRIFBalance);
        console.log(
            "stRIF INCREASE:",
            finalWhaleStRIFBalance - initialWhaleStRIFBalance
        );

        console.log(
            "this much token is stacked (whale token balance difference):",
            finalWhaleStRIFBalance - initialWhaleStRIFBalance
        );

        console.log(
            "this much token is stacked (staking contract balance difference):",
            finalRIFBalanceInStakingContract -
                initialRIFBalanceInStakingContract
        );

        console.log("Final RUSDT balance:", finalRUSDTBalance);
        console.log("Final USDT balance:", finalUSDTBalance);
        console.log("Final contract RIF balance:", finalRIFBalance);
        console.log(
            "Final RIF balance in staking contract:",
            finalRIFBalanceInStakingContract
        );

        // Verify the flow worked:
        // 1. Both tokens were consumed
        assertEq(
            finalRUSDTBalance,
            initialRUSDTBalance - rusdtAmount,
            "RUSDT should have been consumed"
        );
        assertEq(
            finalUSDTBalance,
            initialUSDTBalance - usdtAmount,
            "USDT should have been consumed"
        );

        // 2. Contract should have 0 RIF (deposited to staking)
        assertEq(
            finalRIFBalance,
            0,
            "Contract should have 0 RIF after depositing to staking"
        );

        assertGt(
            finalWhaleStRIFBalance,
            initialWhaleStRIFBalance,
            "stRIF balance should have increased for WHALE"
        );

        console.log(
            "SUCCESS: Full flow completed - Both tokens -> RIF -> Staked!"
        );
    }
}

// forge test --fork-url ${ROOTSTOCK_RPC_URL} -vvv --match-test testBothSwapsInOneCall 
