// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/RIFDepositContract.sol";

contract RIFDepositTest is Test {
    RIFDepositContract public rifContract;

    // Token addresses on Rootstock
    address constant RUSDT_TOKEN = 0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96;
    address constant USDT_TOKEN = 0x779Ded0c9e1022225f8E0630b35a9b54bE713736;
    address constant RIF_TOKEN = 0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5;
    address constant stRIF_TOKEN = 0x5Db91E24BD32059584bbdB831a901F1199f3D459;

    // Sushi Router address (TO_ADDRESS in the contract)
    address constant SUSHI_ROUTER = 0xAC4c6e212A361c968F1725b4d055b47E63F80b75;

    // Whale address that holds both RUSDT and USDT
    address constant WHALE = 0x004Ca129C71dA487AfD603Bb123b12398A3C5a23;

    // Test user (this is the address hardcoded in our calldata)
    address constant USER = 0x237b7244EA07073E86e6f11C42Db3a95378b181F;

    // Generated calldata from our script
    bytes constant RUSDT_TO_RIF_CALLDATA =
        hex"5f3bd1c8000000000000000000000000ef213441a85df4d7acbdae0cf78004e1e486bb96000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000004ca129c71da487afd603bb123b12398a3c5a230000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d50000000000000000000000000000000000000000000000001807dd0e1cf0a3b70000000000000000000000003b0aa7d38bf3c103bf02d1de2e37568cbed3d6e800000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001846be92b89000000000000000000000000ef213441a85df4d7acbdae0cf78004e1e486bb96000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d50000000000000000000000000000000000000000000000001826c7029b27e100000000000000000000000000004ca129c71da487afd603bb123b12398a3c5a23000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005101998aa1c289000101ef213441a85df4d7acbdae0cf78004e1e486bb9601ffff01022650756421f2e636d4138054331cbfafb55d9e003b0aa7d38bf3c103bf02d1de2e37568cbed3d6e800b1a329c1362d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    bytes constant USDT_TO_RIF_CALLDATA =
        hex"5f3bd1c8000000000000000000000000779ded0c9e1022225f8e0630b35a9b54be71373600000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000004ca129c71da487afd603bb123b12398a3c5a230000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d5000000000000000000000000000000000000000000000000f3eb1f57776cf2990000000000000000000000003b0aa7d38bf3c103bf02d1de2e37568cbed3d6e800000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001846be92b89000000000000000000000000779ded0c9e1022225f8e0630b35a9b54be71373600000000000000000000000000000000000000000000000000000000000f42400000000000000000000000002acc95758f8b5f583470ba265eb685a8f45fc9d5000000000000000000000000000000000000000000000000f524e82ebd7e3800000000000000000000000000004ca129c71da487afd603bb123b12398a3c5a23000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005101998aa1c283000101779ded0c9e1022225f8e0630b35a9b54be71373601ffff0157079b2d3071eb06cce6dbafb9b0306bcc49b020003b0aa7d38bf3c103bf02d1de2e37568cbed3d6e800f42404f5253000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    function setUp() public {
        // Create fork of Rootstock
        vm.createSelectFork("https://public-node.rsk.co");

        // Deploy our contract
        rifContract = new RIFDepositContract();
    }

    // function testWhaleBalances() view public {
    //     // Check whale balances
    //     uint256 rusdtBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
    //     uint256 usdtBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);

    //     console.log("Whale RUSDT balance:", rusdtBalance);
    //     console.log("Whale USDT balance:", usdtBalance);

    //     assertTrue(rusdtBalance > 0, "Whale should have RUSDT");
    //     assertTrue(usdtBalance > 0, "Whale should have USDT");
    // }

    // function testExecuteCallsAndDepositWithRUSDT() public {
    //     // Impersonate whale and approve our contract to spend tokens
    //     vm.startPrank(WHALE);
    //     uint256 approveAmount = 100000000000000000; // 0.1 RUSDT
    //     IERC20(RUSDT_TOKEN).approve(address(rifContract), approveAmount);

    //     // Also approve contract to spend RIF tokens (for pulling them back after swap)
    //     IERC20(RIF_TOKEN).approve(address(rifContract), type(uint256).max);
    //     vm.stopPrank();

    //     // Verify whale's RUSDT balance and our contract's allowance
    //     uint256 whaleBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
    //     uint256 allowance = IERC20(RUSDT_TOKEN).allowance(
    //         WHALE,
    //         address(rifContract)
    //     );

    //     console.log("Whale RUSDT balance:", whaleBalance);
    //     console.log("Contract allowance:", allowance);

    //     assertGt(whaleBalance, 0, "Whale should have RUSDT");
    //     assertEq(allowance, approveAmount, "Contract should have approval");

    //     // Prepare arrays for the new function signature
    //     address[] memory tokens = new address[](1);
    //     tokens[0] = RUSDT_TOKEN;

    //     uint256[] memory amounts = new uint256[](1);
    //     amounts[0] = approveAmount;

    //     bytes[] memory callDataArray = new bytes[](1);
    //     callDataArray[0] = RUSDT_TO_RIF_CALLDATA;

    //     // Record initial balances
    //     uint256 initialRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
    //     uint256 initialRIFBalance = IERC20(RIF_TOKEN).balanceOf(
    //         address(rifContract)
    //     );
    //     uint256 initialWhaleRIFBalance = IERC20(RIF_TOKEN).balanceOf(WHALE);
    //     uint256 initialWhalestRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);
    //     uint256 initialRIFBalanceInStakingContract = IERC20(RIF_TOKEN)
    //         .balanceOf(stRIF_TOKEN);

    //     console.log("Initial RUSDT balance:", initialRUSDTBalance);
    //     console.log("Initial contract RIF balance:", initialRIFBalance);
    //     console.log("Initial whale RIF balance:", initialWhaleRIFBalance);
    //     console.log("Initial whale stRIF balance:", initialWhalestRIFBalance);
    //     console.log(
    //         "Initial RIF balance in staking contract:",
    //         initialRIFBalanceInStakingContract
    //     );

    //     // Execute the function as the whale (since whale is the token holder)
    //     vm.prank(WHALE);
    //     rifContract.executeCallsAndDeposit(tokens, amounts, callDataArray);

    //     // Check final balances
    //     uint256 finalRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
    //     uint256 finalRIFBalance = IERC20(RIF_TOKEN).balanceOf(
    //         address(rifContract)
    //     );
    //     uint256 finalWhaleRIFBalance = IERC20(RIF_TOKEN).balanceOf(WHALE);
    //     uint256 finalWhalestRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);
    //     uint256 finalRIFBalanceInStakingContract = IERC20(RIF_TOKEN).balanceOf(
    //         stRIF_TOKEN
    //     );

    //     console.log("Final RUSDT balance:", finalRUSDTBalance);
    //     console.log("Final contract RIF balance:", finalRIFBalance);
    //     console.log("Final whale RIF balance:", finalWhaleRIFBalance);
    //     console.log("Final whale stRIF balance:", finalWhalestRIFBalance);
    //     console.log(
    //         "Final RIF balance in staking contract:",
    //         finalRIFBalanceInStakingContract
    //     );

    //     // Verify the flow worked:
    //     // 1. RUSDT was consumed
    //     assertEq(
    //         finalRUSDTBalance,
    //         initialRUSDTBalance - approveAmount,
    //         "RUSDT should have been consumed"
    //     );

    //     // 2. Contract should have 0 RIF (deposited to staking)
    //     assertEq(
    //         finalRIFBalance,
    //         0,
    //         "Contract should have 0 RIF after depositing to staking"
    //     );

    //     // 3. Function completed without reverting (which means deposit succeeded)
    //     console.log("SUCCESS: Full flow completed - RUSDT -> RIF -> Staked!");
    // }

    // function testExecuteCallsAndDepositWithUSDT() public {
    //     // Impersonate whale and approve our contract to spend tokens
    //     vm.startPrank(WHALE);
    //     uint256 approveAmount = 1000000; // 1 USDT (6 decimals)
    //     IERC20(USDT_TOKEN).approve(address(rifContract), approveAmount);

    //     // Also approve contract to spend RIF tokens (for pulling them back after swap)
    //     IERC20(RIF_TOKEN).approve(address(rifContract), type(uint256).max);
    //     vm.stopPrank();

    //     // Verify whale's USDT balance and our contract's allowance
    //     uint256 whaleBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
    //     uint256 allowance = IERC20(USDT_TOKEN).allowance(WHALE, address(rifContract));

    //     assertGt(whaleBalance, 0, "Whale should have USDT");
    //     assertEq(allowance, approveAmount, "Contract should have approval");

    //     // Prepare arrays for the new function signature
    //     address[] memory tokens = new address[](1);
    //     tokens[0] = USDT_TOKEN;

    //     uint256[] memory amounts = new uint256[](1);
    //     amounts[0] = approveAmount;

    //     bytes[] memory callDataArray = new bytes[](1);
    //     callDataArray[0] = USDT_TO_RIF_CALLDATA;

    //     // Record initial balances
    //     uint256 initialUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
    //     uint256 initialRIFBalance = IERC20(RIF_TOKEN).balanceOf(address(rifContract));

    //     console.log("Initial USDT balance:", initialUSDTBalance);
    //     console.log("Initial contract RIF balance:", initialRIFBalance);

    //     // Execute the function as the whale (since whale is the token holder)
    //     vm.prank(WHALE);
    //     rifContract.executeCallsAndDeposit(tokens, amounts, callDataArray);

    //     // Check final balances
    //     uint256 finalUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
    //     uint256 finalRIFBalance = IERC20(RIF_TOKEN).balanceOf(address(rifContract));

    //     console.log("Final USDT balance:", finalUSDTBalance);
    //     console.log("Final contract RIF balance:", finalRIFBalance);

    //     // Verify the flow worked:
    //     // 1. USDT was consumed
    //     assertEq(finalUSDTBalance, initialUSDTBalance - approveAmount, "USDT should have been consumed");

    //     // 2. Contract should have 0 RIF (deposited to staking)
    //     assertEq(finalRIFBalance, 0, "Contract should have 0 RIF after depositing to staking");

    //     console.log("SUCCESS: Full flow completed - USDT -> RIF -> Staked!");
    // }

    function testBothSwapsInOneCall() public {
        // Setup with whale address - approve both tokens
        vm.startPrank(WHALE);

        // Approve RUSDT (0.1 RUSDT with 18 decimals)
        uint256 rusdtAmount = 100000000000000000; // 0.1 RUSDT
        IERC20(RUSDT_TOKEN).approve(address(rifContract), rusdtAmount);

        // Approve USDT (1 USDT with 6 decimals)
        uint256 usdtAmount = 1000000; // 1 USDT
        IERC20(USDT_TOKEN).approve(address(rifContract), usdtAmount);

        // Also approve contract to spend RIF tokens (for pulling them back after swap)
        IERC20(RIF_TOKEN).approve(address(rifContract), type(uint256).max);

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
            address(rifContract)
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

        console.log("Initial whale stRIF balance:", initialWhaleStRIFBalance);
        // Execute both swaps as the whale
        vm.prank(WHALE);
        rifContract.executeCallsAndDeposit(tokens, amounts, callDataArray);

        // Check final balances
        uint256` finalRUSDTBalance = IERC20(RUSDT_TOKEN).balanceOf(WHALE);
        uint256 finalUSDTBalance = IERC20(USDT_TOKEN).balanceOf(WHALE);
        uint256 finalRIFBalance = IERC20(RIF_TOKEN).balanceOf(
            address(rifContract)
        );
        uint256 finalRIFBalanceInStakingContract = IERC20(RIF_TOKEN).balanceOf(
            stRIF_TOKEN
        );

        uint256 finalWhaleStRIFBalance = IERC20(stRIF_TOKEN).balanceOf(WHALE);

        console.log("Final whale stRIF balance:", finalWhaleStRIFBalance);

        console.log(
            "this much token is stacked:",
            finalWhaleStRIFBalance - initialWhaleStRIFBalance
        );

        console.log(
            "this much token is stacked:",
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

        console.log(
            "SUCCESS: Full flow completed - Both tokens -> RIF -> Staked!"
        );
    }
}


// forge test --fork-url https://public-node.rsk.co -vvv --match-test testBothSwapsInOneCall --via-ir 
