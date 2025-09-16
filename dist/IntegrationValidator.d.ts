export interface ValidationResult {
    passed: boolean;
    testName: string;
    error?: string;
    duration?: number;
}
export declare class IntegrationValidator {
    /**
     * Runs comprehensive integration tests
     */
    static runFullValidation(): Promise<{
        allPassed: boolean;
        results: ValidationResult[];
        summary: {
            total: number;
            passed: number;
            failed: number;
            duration: number;
        };
    }>;
    /**
     * Tests game engine creation and basic functionality
     */
    private static testGameEngineCreation;
    /**
     * Tests CLI interface creation
     */
    private static testCLIInterfaceCreation;
    /**
     * Tests game initialization system
     */
    private static testGameInitialization;
    /**
     * Tests error handling system
     */
    private static testErrorHandling;
    /**
     * Tests basic game flow
     */
    private static testBasicGameFlow;
    /**
     * Tests command processing
     */
    private static testCommandProcessing;
    /**
     * Tests turn progression over multiple turns
     */
    private static testTurnProgression;
    /**
     * Tests victory conditions
     */
    private static testVictoryConditions;
    /**
     * Tests resource validation
     */
    private static testResourceValidation;
    /**
     * Tests fleet validation
     */
    private static testFleetValidation;
    /**
     * Tests economic stall conditions
     */
    private static testEconomicStall;
    /**
     * Tests invalid command handling
     */
    private static testInvalidCommands;
    /**
     * Tests a full game cycle
     */
    private static testFullGameCycle;
    /**
     * Tests system recovery capabilities
     */
    private static testSystemRecovery;
    /**
     * Displays validation results
     */
    static displayResults(results: ValidationResult[], summary: any): void;
}
//# sourceMappingURL=IntegrationValidator.d.ts.map