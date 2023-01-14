var config = {
    baseBet: { value: 100, type: 'balance', label: 'Base Bet' },
    gamesToWait: { value: 100, type: 'text', label: 'Games to wait before making a bet' },
    minimumPayout: { value: 50, type: 'multiplier', label: 'Minimum Payout' },
    maximumPayout: { value: 150, type: 'multiplier', label: 'Maximum Payout' },
    maxBetOrMaxDeficit: {
        value: 'maxDeficit', type: 'radio', label: 'Max bet or max negative profit',
        options: {
            maxDeficit: { value: 100000, type: 'balance', label: 'Stop if deficit is more than' },
        }
    }
}

//Vars from config
var baseBet = config.baseBet.value;
var gamesToWait = config.gamesToWait.value;
var maxBetOrMaxDeficit = config.maxBetOrMaxDeficit.value;
if (maxBetOrMaxDeficit === "maxBet") {
    var maxBet = config.maxBetOrMaxDeficit.options.maxBet.value;
} else if (maxBetOrMaxDeficit === "maxDeficit") {
    var maxDeficit = config.maxBetOrMaxDeficit.options.maxDeficit.value;
}

//Internal vars
var currentPayout = config.minimumPayout.value;
var isBetting = false;
var userProfit = 0;
var isGoingUp = true;
var gamesWithoutMultiplier = GetGamesWithoutX(config.minimumPayout.value)
var bettedGames = 0;
var numberOfCashout = 0;

//Display Stuff
log('FIRST LAUNCH | WELCOME!');
console.log('It has been ' + gamesWithoutMultiplier + ' games without ' + config.minimumPayout.value + "x.")

//Game events
engine.on('GAME_STARTING', function () {
    //Do some pretty logs
    log('');
    log('NEW GAME')
    log('Games without ' + config.minimumPayout.value + 'x: ' + gamesWithoutMultiplier + '.');
    
    if(gamesWithoutMultiplier >= gamesToWait){
        //Do place the bet
        let tempBaseBet = ((baseBet / 100).toFixed()) * 100;
        engine.bet(config.baseBet.value, currentPayout);
        isBetting = true;
        let currentBetInBits = tempBaseBet / 100;
		let wantedProfit = (currentBetInBits * (currentPayout - 1)) + (userProfit / 100);
		log('Betting ' + currentBetInBits + ' right now, looking for ' + wantedProfit + ' bits total profit.')
    }else{
        //Not betting yet, inform user
        isBetting = false;
		let calculatedGamesToWait = gamesToWait - gamesWithoutMultiplier;
		if(calculatedGamesToWait == 1){
			log('Betting ' + ((baseBet / 100).toFixed()) + 'bit(s) next game!');
		}else{
			log('Waiting for ' + calculatedGamesToWait + ' more games with no ' + config.minimumPayout.value + 'x');
		}
    }
    
});

engine.on('GAME_ENDED', function () {
    let gameInfos = engine.history.first();
    if (isBetting) {
        if (!gameInfos.cashedAt) {
            log('Lost...');
            
            //Update variables
            userProfit -= ((baseBet / 100).toFixed() * 100);
            bettedGames++;
            if(isGoingUp){
                currentPayout += 1;
                if(currentPayout >= config.maximumPayout.value && isGoingUp){
                    isGoingUp = false;
                    log("Now going down.");
                }
            }else{
                currentPayout -= 1;
                if(currentPayout <= config.minimumPayout.value && !isGoingUp){
                    log("Now going up.");
                    isGoingUp = true;
                    currentPayout = config.minimumPayout.value;
                }
            }

            //Checks about max bet and max deficit
            if (maxBet != undefined && baseBet > maxBet) {
                stop("Script stopped. Max bet reached: " + maxBet / 100 + ". Profit is: " + userProfit / 100 + ".");
            } else if (maxDeficit != undefined && userProfit > maxDeficit) {
                stop("Script stopped. Max deficit reached: " + userProfit / 100 + ". Next bet would have been: " + baseBet / 100);
            }
        } else {
            //Won
            log('Won! Returning to base bet');
            //Reset variables, add this cashout to profit
            userProfit += config.baseBet.value;
            currentPayout = config.minimumPayout.value;
            baseBet = config.baseBet.value;
            bettedGames = 0;
            numberOfCashout++;
        }
    }
    if(gameInfos.bust >= currentPayout){
		gamesWithoutMultiplier = 0;
	}else{
		gamesWithoutMultiplier++;
	}
    log('Current profit: ' + userProfit / 100 + ' bits.');
    log('END GAME');
});

//Helping functions
function GetGamesWithoutX(theX) {
    let gamesArray = engine.history.toArray(); //Only 50 games, if not found, return 50
    let generatedGamesWithoutX = 0;

    for (var i = 0; i < gamesArray.length; i++) {
        if (gamesArray[i].bust >= theX) {
            break;
        }
        generatedGamesWithoutX++;
    }
    return generatedGamesWithoutX;
}
