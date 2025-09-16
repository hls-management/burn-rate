#!/usr/bin/env node

import { GameInitializer } from './dist/GameInitializer.js';
import { IntegrationValidator } from './dist/IntegrationValidator.js';

async function testIntegration() {
  console.log('🚀 Testing Burn Rate Integration...\n');

  try {
    // Test 1: System Health Check
    console.log('1. Running system health check...');
    const systemCheck = await GameInitializer.performSystemCheck();
    
    if (systemCheck.isHealthy) {
      console.log('✅ System health check passed');
    } else {
      console.log('❌ System health issues detected');
      systemCheck.checks.forEach(check => {
        if (!check.passed) {
          console.log(`   - ${check.name}: ${check.error}`);
        }
      });
    }

    // Test 2: Game Initialization
    console.log('\n2. Testing game initialization...');
    const gameSetup = await GameInitializer.createQuickStartGame();
    
    if (gameSetup.isValid) {
      console.log('✅ Game initialization successful');
    } else {
      console.log('❌ Game initialization failed');
      gameSetup.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Test 3: Basic Game Operations
    console.log('\n3. Testing basic game operations...');
    const engine = gameSetup.gameEngine;
    
    // Test turn processing
    const turnResult = engine.processTurn([]);
    if (turnResult.success) {
      console.log('✅ Turn processing works');
    } else {
      console.log('❌ Turn processing failed');
      turnResult.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Test game state validation
    const validation = engine.validateGameState();
    if (validation.isValid) {
      console.log('✅ Game state validation works');
    } else {
      console.log('❌ Game state validation failed');
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Test 4: Full Integration Validation
    console.log('\n4. Running comprehensive integration tests...');
    const fullValidation = await IntegrationValidator.runFullValidation();
    
    const passedTests = fullValidation.results.filter(r => r.passed).length;
    const totalTests = fullValidation.results.length;
    
    console.log(`✅ Integration tests: ${passedTests}/${totalTests} passed`);
    
    if (!fullValidation.allPassed) {
      console.log('\n❌ Failed tests:');
      fullValidation.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.testName}: ${result.error}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    const allTestsPassed = systemCheck.isHealthy && 
                          gameSetup.isValid && 
                          turnResult.success && 
                          validation.isValid && 
                          fullValidation.allPassed;

    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Burn Rate is ready for use.');
      console.log('\nTo start the game, run: npm start');
      console.log('For debug mode, run: npm run start:debug');
      console.log('For help, run: node dist/cli.js --help');
    } else {
      console.log('❌ Some tests failed. Please review the errors above.');
    }

    process.exit(allTestsPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
    process.exit(1);
  }
}

testIntegration();