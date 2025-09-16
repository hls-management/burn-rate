export class WebInputHandler {
    inputHandler;
    constructor(inputHandler) {
        this.inputHandler = inputHandler;
    }
    /**
     * Handles build form submission and converts to game command
     */
    handleBuildForm(formData, gameState) {
        try {
            const buildType = formData.get('buildType');
            const quantityStr = formData.get('quantity');
            // Validate form data
            const validation = this.validateBuildForm({ buildType, quantity: quantityStr });
            if (!validation.success) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            const quantity = parseInt(quantityStr, 10);
            // Create command using existing InputHandler logic
            const command = {
                type: 'build',
                buildType: buildType,
                quantity
            };
            // Validate against game state
            const gameValidation = this.validateBuildCommand(command, gameState);
            if (!gameValidation.success) {
                return gameValidation;
            }
            return {
                success: true,
                command
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Build form processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Handles attack form submission and converts to game command
     */
    handleAttackForm(formData, gameState) {
        try {
            const frigatesStr = formData.get('frigates');
            const cruisersStr = formData.get('cruisers');
            const battleshipsStr = formData.get('battleships');
            const target = formData.get('target');
            // Validate form data
            const validation = this.validateAttackForm({
                frigates: frigatesStr,
                cruisers: cruisersStr,
                battleships: battleshipsStr,
                target
            });
            if (!validation.success) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            const frigates = parseInt(frigatesStr, 10) || 0;
            const cruisers = parseInt(cruisersStr, 10) || 0;
            const battleships = parseInt(battleshipsStr, 10) || 0;
            const attackFleet = { frigates, cruisers, battleships };
            // Create command
            const command = {
                type: 'attack',
                attackFleet,
                target: target || 'enemy'
            };
            // Validate against game state
            const gameValidation = this.validateAttackCommand(command, gameState);
            if (!gameValidation.success) {
                return gameValidation;
            }
            return {
                success: true,
                command
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Attack form processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Handles scan form submission and converts to game command
     */
    handleScanForm(formData, gameState) {
        try {
            const scanType = formData.get('scanType');
            // Validate form data
            const validation = this.validateScanForm({ scanType });
            if (!validation.success) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            // Create command
            const command = {
                type: 'scan',
                scanType: scanType
            };
            // Validate against game state
            const gameValidation = this.validateScanCommand(command, gameState);
            if (!gameValidation.success) {
                return gameValidation;
            }
            return {
                success: true,
                command
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Scan form processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Validates build form data
     */
    validateBuildForm(data) {
        const errors = [];
        const warnings = [];
        // Validate build type
        if (!data.buildType) {
            errors.push('Build type is required');
        }
        else {
            const validTypes = ['frigate', 'cruiser', 'battleship', 'reactor', 'mine'];
            if (!validTypes.includes(data.buildType)) {
                errors.push(`Invalid build type: ${data.buildType}`);
            }
        }
        // Validate quantity
        if (!data.quantity) {
            errors.push('Quantity is required');
        }
        else {
            const quantity = parseInt(data.quantity, 10);
            if (isNaN(quantity)) {
                errors.push('Quantity must be a number');
            }
            else if (quantity <= 0) {
                errors.push('Quantity must be positive');
            }
            else if (quantity > 10000) {
                errors.push('Quantity too large (maximum: 10,000)');
            }
            else if (quantity > 1000) {
                warnings.push('Large quantity may cause economic strain');
            }
        }
        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    } /**
    
   * Validates attack form data
     */
    validateAttackForm(data) {
        const errors = [];
        const warnings = [];
        // Validate fleet numbers
        const frigates = parseInt(data.frigates || '0', 10);
        const cruisers = parseInt(data.cruisers || '0', 10);
        const battleships = parseInt(data.battleships || '0', 10);
        if (isNaN(frigates) || frigates < 0) {
            errors.push('Frigates count must be a non-negative number');
        }
        if (isNaN(cruisers) || cruisers < 0) {
            errors.push('Cruisers count must be a non-negative number');
        }
        if (isNaN(battleships) || battleships < 0) {
            errors.push('Battleships count must be a non-negative number');
        }
        const totalShips = frigates + cruisers + battleships;
        if (totalShips === 0) {
            errors.push('Cannot attack with empty fleet');
        }
        else if (totalShips > 10000) {
            errors.push('Fleet too large (maximum: 10,000 ships)');
        }
        else if (totalShips > 1000) {
            warnings.push('Large fleet may take significant losses');
        }
        // Validate target
        if (!data.target) {
            errors.push('Target is required');
        }
        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validates scan form data
     */
    validateScanForm(data) {
        const errors = [];
        const warnings = [];
        // Validate scan type
        if (!data.scanType) {
            errors.push('Scan type is required');
        }
        else {
            const validTypes = ['basic', 'deep', 'advanced'];
            if (!validTypes.includes(data.scanType)) {
                errors.push(`Invalid scan type: ${data.scanType}`);
            }
        }
        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validates input against current game state and resources
     */
    validateInput(command, gameState) {
        const errors = [];
        const warnings = [];
        try {
            switch (command.type) {
                case 'build':
                    const buildValidation = this.validateBuildResources(command, gameState);
                    errors.push(...buildValidation.errors);
                    warnings.push(...buildValidation.warnings);
                    break;
                case 'attack':
                    const attackValidation = this.validateAttackFleet(command, gameState);
                    errors.push(...attackValidation.errors);
                    warnings.push(...attackValidation.warnings);
                    break;
                case 'scan':
                    const scanValidation = this.validateScanResources(command, gameState);
                    errors.push(...scanValidation.errors);
                    warnings.push(...scanValidation.warnings);
                    break;
            }
        }
        catch (error) {
            errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Converts web form data to command format
     */
    convertFormDataToCommand(formData, commandType) {
        try {
            switch (commandType) {
                case 'build':
                    return {
                        type: 'build',
                        buildType: formData.get('buildType'),
                        quantity: parseInt(formData.get('quantity'), 10)
                    };
                case 'attack':
                    return {
                        type: 'attack',
                        attackFleet: {
                            frigates: parseInt(formData.get('frigates'), 10) || 0,
                            cruisers: parseInt(formData.get('cruisers'), 10) || 0,
                            battleships: parseInt(formData.get('battleships'), 10) || 0
                        },
                        target: formData.get('target') || 'enemy'
                    };
                case 'scan':
                    return {
                        type: 'scan',
                        scanType: formData.get('scanType')
                    };
                default:
                    return null;
            }
        }
        catch (error) {
            console.error('Error converting form data to command:', error);
            return null;
        }
    }
    /**
     * Gets real-time validation feedback for forms
     */
    getValidationFeedback(data, commandType, gameState) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        try {
            switch (commandType) {
                case 'build':
                    const buildFeedback = this.getBuildValidationFeedback(data, gameState);
                    errors.push(...buildFeedback.errors);
                    warnings.push(...buildFeedback.warnings);
                    suggestions.push(...buildFeedback.suggestions);
                    break;
                case 'attack':
                    const attackFeedback = this.getAttackValidationFeedback(data, gameState);
                    errors.push(...attackFeedback.errors);
                    warnings.push(...attackFeedback.warnings);
                    suggestions.push(...attackFeedback.suggestions);
                    break;
                case 'scan':
                    const scanFeedback = this.getScanValidationFeedback(data, gameState);
                    errors.push(...scanFeedback.errors);
                    warnings.push(...scanFeedback.warnings);
                    suggestions.push(...scanFeedback.suggestions);
                    break;
            }
        }
        catch (error) {
            errors.push('Validation error occurred');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }
    /**
     * Private validation methods
     */
    validateBuildCommand(command, gameState) {
        if (!command.buildType || !command.quantity) {
            return { success: false, error: 'Invalid build command data' };
        }
        // Use existing InputHandler validation by creating a mock input string
        const inputString = `build ${command.quantity} ${command.buildType}`;
        return this.inputHandler.processCommand(inputString, gameState);
    }
    validateAttackCommand(command, gameState) {
        if (!command.attackFleet) {
            return { success: false, error: 'Invalid attack command data' };
        }
        const fleet = command.attackFleet;
        const inputString = `attack ${fleet.frigates} ${fleet.cruisers} ${fleet.battleships}`;
        return this.inputHandler.processCommand(inputString, gameState);
    }
    validateScanCommand(command, gameState) {
        if (!command.scanType) {
            return { success: false, error: 'Invalid scan command data' };
        }
        const inputString = `scan ${command.scanType}`;
        return this.inputHandler.processCommand(inputString, gameState);
    }
    validateBuildResources(command, gameState) {
        const errors = [];
        const warnings = [];
        if (!command.buildType || !command.quantity) {
            errors.push('Missing build parameters');
            return { success: false, errors, warnings };
        }
        const player = gameState.player;
        const costs = this.getBuildCosts(command.buildType);
        const totalMetalCost = costs.metal * command.quantity;
        const totalEnergyCost = costs.energy * command.quantity;
        // Check resources
        if (player.resources.metal < totalMetalCost) {
            errors.push(`Insufficient metal: need ${totalMetalCost.toLocaleString()}, have ${player.resources.metal.toLocaleString()}`);
        }
        if (player.resources.energy < totalEnergyCost) {
            errors.push(`Insufficient energy: need ${totalEnergyCost.toLocaleString()}, have ${player.resources.energy.toLocaleString()}`);
        }
        // Check for potential economic strain
        if (this.isUnitType(command.buildType)) {
            const upkeepCosts = this.getUpkeepCosts(command.buildType);
            const totalMetalUpkeep = upkeepCosts.metal * command.quantity;
            const totalEnergyUpkeep = upkeepCosts.energy * command.quantity;
            const projectedMetalIncome = player.resources.metalIncome - totalMetalUpkeep;
            const projectedEnergyIncome = player.resources.energyIncome - totalEnergyUpkeep;
            if (projectedMetalIncome < 0 || projectedEnergyIncome < 0) {
                errors.push(`Would cause economic stall: upkeep ${totalMetalUpkeep} Metal, ${totalEnergyUpkeep} Energy per turn`);
            }
            else if (projectedMetalIncome < 1000 || projectedEnergyIncome < 1000) {
                warnings.push('Low projected income after upkeep costs');
            }
        }
        return { success: errors.length === 0, errors, warnings };
    }
    validateAttackFleet(command, gameState) {
        const errors = [];
        const warnings = [];
        if (!command.attackFleet) {
            errors.push('Missing attack fleet data');
            return { success: false, errors, warnings };
        }
        const playerFleet = gameState.player.fleet.homeSystem;
        const attackFleet = command.attackFleet;
        // Check fleet availability
        if (playerFleet.frigates < attackFleet.frigates) {
            errors.push(`Insufficient frigates: need ${attackFleet.frigates}, have ${playerFleet.frigates}`);
        }
        if (playerFleet.cruisers < attackFleet.cruisers) {
            errors.push(`Insufficient cruisers: need ${attackFleet.cruisers}, have ${playerFleet.cruisers}`);
        }
        if (playerFleet.battleships < attackFleet.battleships) {
            errors.push(`Insufficient battleships: need ${attackFleet.battleships}, have ${playerFleet.battleships}`);
        }
        // Strategic warnings
        const totalAttacking = attackFleet.frigates + attackFleet.cruisers + attackFleet.battleships;
        const totalHome = playerFleet.frigates + playerFleet.cruisers + playerFleet.battleships;
        if (totalAttacking > totalHome * 0.8) {
            warnings.push('Sending most of your fleet leaves home system vulnerable');
        }
        return { success: errors.length === 0, errors, warnings };
    }
    validateScanResources(command, gameState) {
        const errors = [];
        const warnings = [];
        if (!command.scanType) {
            errors.push('Missing scan type');
            return { success: false, errors, warnings };
        }
        const player = gameState.player;
        const costs = { basic: 1000, deep: 2500, advanced: 4000 };
        const cost = costs[command.scanType];
        if (player.resources.energy < cost) {
            errors.push(`Insufficient energy: need ${cost.toLocaleString()}, have ${player.resources.energy.toLocaleString()}`);
        }
        else if (player.resources.energy < cost * 2) {
            warnings.push('Scan will use significant energy reserves');
        }
        return { success: errors.length === 0, errors, warnings };
    }
    getBuildValidationFeedback(data, gameState) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        if (!data.buildType || !data.quantity) {
            return { errors, warnings, suggestions };
        }
        const quantity = parseInt(data.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
            return { errors, warnings, suggestions };
        }
        const player = gameState.player;
        const costs = this.getBuildCosts(data.buildType);
        const totalMetalCost = costs.metal * quantity;
        const totalEnergyCost = costs.energy * quantity;
        // Resource availability feedback
        const metalRatio = totalMetalCost / player.resources.metal;
        const energyRatio = totalEnergyCost / player.resources.energy;
        if (metalRatio > 1) {
            suggestions.push(`Reduce quantity to ${Math.floor(player.resources.metal / costs.metal)} to afford with current metal`);
        }
        else if (metalRatio > 0.8) {
            warnings.push('Will use most of your metal reserves');
        }
        if (energyRatio > 1) {
            suggestions.push(`Reduce quantity to ${Math.floor(player.resources.energy / costs.energy)} to afford with current energy`);
        }
        else if (energyRatio > 0.8) {
            warnings.push('Will use most of your energy reserves');
        }
        // Strategic suggestions
        if (this.isUnitType(data.buildType)) {
            const currentFleet = player.fleet.homeSystem;
            const totalCurrent = currentFleet.frigates + currentFleet.cruisers + currentFleet.battleships;
            if (totalCurrent < 50 && data.buildType !== 'frigate') {
                suggestions.push('Consider building frigates first for a stronger foundation');
            }
        }
        else {
            // Structure suggestions
            if (data.buildType === 'reactor' && player.economy.reactors === 0) {
                suggestions.push('First reactor will significantly boost energy income');
            }
            else if (data.buildType === 'mine' && player.economy.mines === 0) {
                suggestions.push('First mine will significantly boost metal income');
            }
        }
        return { errors, warnings, suggestions };
    }
    getAttackValidationFeedback(data, gameState) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        const frigates = parseInt(data.frigates || '0', 10);
        const cruisers = parseInt(data.cruisers || '0', 10);
        const battleships = parseInt(data.battleships || '0', 10);
        if (isNaN(frigates) || isNaN(cruisers) || isNaN(battleships)) {
            return { errors, warnings, suggestions };
        }
        const playerFleet = gameState.player.fleet.homeSystem;
        const totalAttacking = frigates + cruisers + battleships;
        if (totalAttacking === 0) {
            suggestions.push('Select ships to include in your attack fleet');
            return { errors, warnings, suggestions };
        }
        // Fleet composition analysis
        const frigateRatio = frigates / totalAttacking;
        const cruiserRatio = cruisers / totalAttacking;
        const battleshipRatio = battleships / totalAttacking;
        if (frigateRatio > 0.8) {
            suggestions.push('Consider adding cruisers or battleships for better balance');
        }
        else if (battleshipRatio > 0.6) {
            suggestions.push('Heavy battleship fleets are slow but powerful');
        }
        else if (cruiserRatio > 0.6) {
            suggestions.push('Cruiser-heavy fleets are well-balanced');
        }
        // Strategic feedback
        const totalHome = playerFleet.frigates + playerFleet.cruisers + playerFleet.battleships;
        const attackRatio = totalAttacking / totalHome;
        if (attackRatio > 0.9) {
            warnings.push('Sending almost entire fleet - home system will be defenseless');
        }
        else if (attackRatio > 0.7) {
            warnings.push('Large attack leaves limited home defense');
        }
        else if (attackRatio < 0.1) {
            suggestions.push('Small raids may not be effective against strong defenses');
        }
        // Intelligence-based suggestions
        const intel = gameState.player.intelligence;
        if (intel.lastScanTurn > 0) {
            const knownFleet = intel.knownEnemyFleet;
            const knownTotal = knownFleet.frigates + knownFleet.cruisers + knownFleet.battleships;
            if (knownTotal > 0) {
                const attackVsKnown = totalAttacking / knownTotal;
                if (attackVsKnown < 0.5) {
                    warnings.push('Attack fleet may be too small based on intelligence');
                }
                else if (attackVsKnown > 2) {
                    suggestions.push('Attack fleet may be larger than necessary');
                }
            }
        }
        else {
            suggestions.push('Consider scanning enemy first for better intelligence');
        }
        return { errors, warnings, suggestions };
    }
    getScanValidationFeedback(data, gameState) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        if (!data.scanType) {
            suggestions.push('Select a scan type to get intelligence on the enemy');
            return { errors, warnings, suggestions };
        }
        const player = gameState.player;
        const intel = player.intelligence;
        const costs = { basic: 1000, deep: 2500, advanced: 4000 };
        const cost = costs[data.scanType];
        // Cost analysis
        const energyRatio = cost / player.resources.energy;
        if (energyRatio > 0.5) {
            warnings.push('Scan will use significant energy reserves');
        }
        // Intelligence history analysis
        if (intel.lastScanTurn > 0) {
            const turnsSinceLastScan = gameState.turn - intel.lastScanTurn;
            if (turnsSinceLastScan < 2) {
                suggestions.push('Recent scan data may still be accurate');
            }
            else if (turnsSinceLastScan > 5) {
                suggestions.push('Intelligence data is getting old - scan recommended');
            }
        }
        else {
            suggestions.push('No previous scans - intelligence will be very valuable');
        }
        // Scan type recommendations
        switch (data.scanType) {
            case 'basic':
                suggestions.push('Basic scan provides fleet size estimate - good for initial intelligence');
                break;
            case 'deep':
                suggestions.push('Deep scan reveals fleet composition and economy - best overall value');
                break;
            case 'advanced':
                suggestions.push('Advanced scan reveals strategic intent - useful for planning');
                break;
        }
        return { errors, warnings, suggestions };
    }
    /**
     * Helper methods
     */
    getBuildCosts(buildType) {
        const costs = {
            frigate: { metal: 4, energy: 2 },
            cruiser: { metal: 10, energy: 6 },
            battleship: { metal: 20, energy: 12 },
            reactor: { metal: 900, energy: 1200 },
            mine: { metal: 1500, energy: 600 }
        };
        return costs[buildType] || { metal: 0, energy: 0 };
    }
    getUpkeepCosts(unitType) {
        const upkeepCosts = {
            frigate: { metal: 2, energy: 1 },
            cruiser: { metal: 5, energy: 3 },
            battleship: { metal: 10, energy: 6 }
        };
        return upkeepCosts[unitType] || { metal: 0, energy: 0 };
    }
    isUnitType(buildType) {
        return ['frigate', 'cruiser', 'battleship'].includes(buildType);
    }
    /**
     * Handles simple command buttons (end turn, help, status, etc.)
     */
    handleSimpleCommand(commandType) {
        try {
            switch (commandType) {
                case 'end_turn':
                case 'endturn':
                case 'end':
                    return {
                        success: true,
                        command: { type: 'end_turn' }
                    };
                case 'status':
                    return {
                        success: true,
                        command: { type: 'status' }
                    };
                case 'help':
                    return {
                        success: true,
                        command: { type: 'help' }
                    };
                case 'quit':
                case 'exit':
                    return {
                        success: true,
                        command: { type: 'quit' }
                    };
                default:
                    return {
                        success: false,
                        error: `Unknown command: ${commandType}`
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Command processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Gets the underlying InputHandler instance
     */
    getInputHandler() {
        return this.inputHandler;
    }
    /**
     * Sanitizes and validates raw form input data
     */
    sanitizeFormData(formData) {
        const sanitized = {};
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                // Remove potentially dangerous characters and trim whitespace
                const cleaned = value
                    .trim()
                    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection characters
                    .replace(/[^\w\s\-\.]/g, '') // Keep only alphanumeric, spaces, hyphens, dots
                    .substring(0, 100); // Limit length
                sanitized[key] = cleaned;
            }
        }
        return sanitized;
    }
    /**
     * Validates form data structure and required fields
     */
    validateFormStructure(formData, requiredFields) {
        const errors = [];
        const warnings = [];
        // Check for required fields
        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(`${field} is required`);
            }
        }
        // Check for unexpected fields (potential security issue)
        const allowedFields = ['buildType', 'quantity', 'frigates', 'cruisers', 'battleships', 'target', 'scanType'];
        for (const [key] of formData.entries()) {
            if (!allowedFields.includes(key)) {
                warnings.push(`Unexpected field: ${key}`);
            }
        }
        return {
            success: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Provides command suggestions for auto-completion
     */
    getCommandSuggestions(commandType, gameState) {
        const suggestions = [];
        switch (commandType) {
            case 'build':
                const player = gameState.player;
                if (player.resources.metal >= 4 && player.resources.energy >= 2) {
                    suggestions.push('Build frigates for quick expansion');
                }
                if (player.resources.metal >= 900 && player.resources.energy >= 1200) {
                    suggestions.push('Build reactor for energy income');
                }
                if (player.resources.metal >= 1500 && player.resources.energy >= 600) {
                    suggestions.push('Build mine for metal income');
                }
                break;
            case 'attack':
                const fleet = gameState.player.fleet.homeSystem;
                const totalFleet = fleet.frigates + fleet.cruisers + fleet.battleships;
                if (totalFleet > 50) {
                    suggestions.push('Launch attack with balanced fleet composition');
                }
                else {
                    suggestions.push('Build more ships before attacking');
                }
                break;
            case 'scan':
                const intel = gameState.player.intelligence;
                if (intel.lastScanTurn === 0) {
                    suggestions.push('Perform basic scan for initial intelligence');
                }
                else {
                    const turnsSince = gameState.turn - intel.lastScanTurn;
                    if (turnsSince > 3) {
                        suggestions.push('Update intelligence with new scan');
                    }
                }
                break;
        }
        return suggestions;
    }
    /**
     * Handles batch command validation (for queued commands)
     */
    validateBatchCommands(commands, gameState) {
        const validCommands = [];
        const invalidCommands = [];
        const warnings = [];
        // Simulate game state changes for sequential validation
        let simulatedState = JSON.parse(JSON.stringify(gameState));
        for (const command of commands) {
            try {
                const validation = this.validateInput(command, simulatedState);
                if (validation.success) {
                    validCommands.push(command);
                    warnings.push(...validation.warnings);
                    // Update simulated state for next command validation
                    simulatedState = this.simulateCommandExecution(command, simulatedState);
                }
                else {
                    invalidCommands.push({
                        command,
                        error: validation.errors.join(', ')
                    });
                }
            }
            catch (error) {
                invalidCommands.push({
                    command,
                    error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }
        return {
            validCommands,
            invalidCommands,
            warnings
        };
    }
    /**
     * Simulates command execution for batch validation
     */
    simulateCommandExecution(command, gameState) {
        const simulated = JSON.parse(JSON.stringify(gameState));
        try {
            switch (command.type) {
                case 'build':
                    if (command.buildType && command.quantity) {
                        const costs = this.getBuildCosts(command.buildType);
                        simulated.player.resources.metal -= costs.metal * command.quantity;
                        simulated.player.resources.energy -= costs.energy * command.quantity;
                        if (this.isUnitType(command.buildType)) {
                            const unitType = command.buildType;
                            simulated.player.fleet.homeSystem[`${unitType}s`] += command.quantity;
                            const upkeep = this.getUpkeepCosts(unitType);
                            simulated.player.resources.metalIncome -= upkeep.metal * command.quantity;
                            simulated.player.resources.energyIncome -= upkeep.energy * command.quantity;
                        }
                    }
                    break;
                case 'attack':
                    if (command.attackFleet) {
                        // Subtract attacking fleet from home system
                        simulated.player.fleet.homeSystem.frigates -= command.attackFleet.frigates;
                        simulated.player.fleet.homeSystem.cruisers -= command.attackFleet.cruisers;
                        simulated.player.fleet.homeSystem.battleships -= command.attackFleet.battleships;
                    }
                    break;
                case 'scan':
                    if (command.scanType) {
                        const costs = { basic: 1000, deep: 2500, advanced: 4000 };
                        const cost = costs[command.scanType];
                        simulated.player.resources.energy -= cost;
                    }
                    break;
            }
        }
        catch (error) {
            // If simulation fails, return original state
            console.warn('Command simulation failed:', error);
        }
        return simulated;
    }
    /**
     * Gets detailed cost breakdown for a command
     */
    getCommandCostBreakdown(command) {
        const immediate = { metal: 0, energy: 0 };
        const ongoing = { metal: 0, energy: 0 };
        let description = '';
        try {
            switch (command.type) {
                case 'build':
                    if (command.buildType && command.quantity) {
                        const costs = this.getBuildCosts(command.buildType);
                        immediate.metal = costs.metal * command.quantity;
                        immediate.energy = costs.energy * command.quantity;
                        if (this.isUnitType(command.buildType)) {
                            const upkeep = this.getUpkeepCosts(command.buildType);
                            ongoing.metal = upkeep.metal * command.quantity;
                            ongoing.energy = upkeep.energy * command.quantity;
                            description = `Build ${command.quantity} ${command.buildType}(s) - includes ongoing upkeep`;
                        }
                        else {
                            description = `Build ${command.quantity} ${command.buildType}(s) - one-time cost`;
                        }
                    }
                    break;
                case 'scan':
                    if (command.scanType) {
                        const costs = { basic: 1000, deep: 2500, advanced: 4000 };
                        immediate.energy = costs[command.scanType];
                        description = `Perform ${command.scanType} scan - one-time cost`;
                    }
                    break;
                case 'attack':
                    description = 'Launch attack - no resource cost, but ships may be lost';
                    break;
                default:
                    description = 'No resource cost';
            }
        }
        catch (error) {
            description = 'Cost calculation failed';
        }
        return { immediate, ongoing, description };
    }
}
//# sourceMappingURL=WebInputHandler.js.map