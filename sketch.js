//Scales everything
var scaleMult = 2.5;
// Holds the current Population
var population;
// Paragraphs for Meta-Data
var lifeP, maxFitP, minFitP, avgFitP, genP, popStatsP;
// Number of Iterations, when it reaches lifespan then the current generation is
// over.
var count = 0;
// Number of Rockets that reached the target
var targetReachedCount = 0;
// Count of Generations
var generations = 1;
// Target that Rockets want to reach
var target;

// Multiplier for Vectors
var maxforce = 0.3 * scaleMult;
// Mutliplier for the Game Speed
var speedMultiplier = 2;
// Lifespan of each Rocket
var lifespan = 300;
// Number of Rockets in Population
var popCount = 200;
// Tournamentcapacity
var tournamentSize = popCount * 0.05;
// Chance for Mutation
var mutationrate = 0.01;
// Elitism picks the best of each Generation and adds it to the next Generation
// without crossover or mutation
var elitism = true;
// Enables Mutations for Elitism
var elitismMutation = false;
// Exponential Multiplier for Distance (The closer the Rocket is the more
// Fitness it gets exponentially)
var distanceReward = 1.0;
// Rewards the Rockets that are very close to the target
var proximityReward = false;
// Distance to target that counts as hitting the target
var proximityToTarget = 7 * scaleMult;
// Obstacles
var obstacles = [];

function setup() {
	createCanvas(400 * scaleMult, 300 * scaleMult);
	population = new Population();
	lifeP = createP();
	maxFitP = createP();
	minFitP = createP();
	avgFitP = createP();
	popStatsP = createP();
	genP = createP();
	genP.html('Generation: ' + generations);
	// Target is being setup
	target = createVector(width / 2, 30 * scaleMult);
	obstacles.push(new Obstacle(160, 100, 80, 10));
	obstacles.push(new Obstacle(80, 180, 80, 10));
	obstacles.push(new Obstacle(230, 180, 80, 10));
	obstacles.push(new Obstacle(110, 70, 10, 80));
	obstacles.push(new Obstacle(280, 70, 10, 80));
}

function draw() {
	background(0);
	// Applies the Speed Multiplier
	for (var i = 0; i < speedMultiplier; i++) {
		population.run();
	}

	lifeP.html('Lifespan: ' + (count * speedMultiplier));
	count++;

	// If the condition is met, then the current Generation is done.
	if (count == (lifespan / speedMultiplier)) {
		population.evaluate();
		maxFitP.html('MAX Fitness: ' + population.maxfit);
		minFitP.html('MIN Fitness: ' + population.minfit);
		avgFitP.html('AVG Fitness: ' + population.avgfit / popCount);
		popStatsP.html('Population: ' + popCount + ' Target reached: '
				+ targetReachedCount + ' ('
				+ round(((targetReachedCount / popCount) * 100)) + '%)');
		population.selection();
		count = 0;
		targetReachedCount = 0;
		generations++;
		genP.html('Generation: ' + generations);
	}

	// Spawn Obstacles
	for (var i = 0; i < obstacles.length; i++) {
		obstacles[i].show();
	}

	// Spawn Target
	fill(10, 60, 255);
	ellipse(target.x, target.y, 16 * scaleMult, 16 * scaleMult);
}

// Holds a Population of Rockets
function Population() {
	this.rockets = [];
	this.popsize = popCount;
	this.matingpool = [];
	this.maxfit = 0;
	this.minfit = 999999;
	this.avgfit = 0;

	for (var i = 0; i < this.popsize; i++) {
		this.rockets[i] = new Rocket();
	}

	// Evaluates the Population held by an Instance of this Population
	this.evaluate = function() {
		// Calculates Meta-Data
		this.maxfit = 0;
		this.avgfit = 0;
		for (var i = 0; i < this.popsize; i++) {
			this.rockets[i].calcFitness();
			if (i == 0) {
				this.minfit = this.rockets[i].fitness;
			}
			if (this.rockets[i].fitness > this.maxfit) {
				this.maxfit = this.rockets[i].fitness;
			}

			if (this.rockets[i].fitness < this.minfit) {
				this.minfit = this.rockets[i].fitness;
			}
			this.avgfit += this.rockets[i].fitness;
		}

		// Normalizes Fitness
		/*
		 * for(var i = 0; i < this.popsize; i++){ this.rockets[i].fitness /=
		 * this.maxfit; }
		 */

		for (var i = 0; i < this.popsize; i++) {
			this.matingpool.push(this.rockets[i]);
			// Selection for the Mating pool,
			// the higher the Fitness of a Rocket the more often it is in the
			// matingpool
			// Fitness 70 = 700 X in matingpool
			// Fitness 3 = 30 X in matingpool
			/*
			 * var n = this.rockets[i].fitness; for(var j = 0; j < n; j++){
			 * this.matingpool.push(this.rockets[i]); }
			 */
		}
	}

	// Selection of new Rockets
	this.selection = function() {
		var newRockets = [];

		// Applies Elitism
		var elitismOffset = 0;
		if (elitism) {
			elitismOffset = 1;
			var bestRocket = this.rockets[0];
			// Searches for the best Rocket
			for (var i = 1; i < this.rockets.length; i++) {
				if (bestRocket.fitness == this.rockets[i].fitness) {
					// console.log('Equally fit Rockets found survivalTime
					// BestRocket: ' + bestRocket.survivalTime + ' survivalTime
					// Contestant: ' + this.rockets[i].survivalTime);
					if (bestRocket.survivalTime > this.rockets[i].survivalTime) {
						bestRocket = this.rockets[i];
					}
				} else if (bestRocket.fitness < this.rockets[i].fitness) {
					bestRocket = this.rockets[i];
				}
			}
			// Applies Elitism Mutation
			if (elitismMutation) {
				bestRocket.dna.mutation();
			}
			bestRocket = new Rocket(bestRocket.dna);
			bestRocket.best = true;
			newRockets[0] = bestRocket;
		}
		// Chooses parentA and parentB to create new Rockets based on the
		// Matingpool through crossover
		for (var i = elitismOffset; i < this.rockets.length; i++) {
			var parentA = this.tournament();
			var parentB = this.tournament();
			var child = parentA.crossover(parentB);
			newRockets[i] = new Rocket(child);
			child.mutation();
		}
		this.rockets = newRockets;
	}

	this.tournament = function() {
		var winner = random(this.matingpool);
		for (var i = 0; i < tournamentSize - 1; i++) {
			var contestant = random(this.matingpool);
			if (contestant.fitness == winner.fitness) {
				if (contestant.survivalTime < winner.survivalTime) {
					winner = contestant;
				}
			} else if (contestant.fitness > winner.fitness) {
				winner = contestant;
			}
		}
		return winner.dna;
	}

	// Calls the update() and show() function of every Rocket in this Population
	this.run = function() {
		// Draw the Rockets in reverse order, so that the Elite Rocket
		// will be drawn last and therefore be above all other Rockets
		for (var i = this.popsize - 1; i >= 0; i--) {
			this.rockets[i].update();
			this.rockets[i].show();
		}
	}

}

// Represents the "DNA" of Rockets, held by an Array of Vector2D
function DNA(genes) {
	// A Gene represents a Vector2D
	if (genes) {
		this.genes = genes;
	} else {
		this.genes = [];

		for (var i = 0; i < lifespan; i++) {
			this.genes[i] = p5.Vector.random2D();
			this.genes[i].setMag(maxforce);
		}
	}

	// Performs a Crossover of Genes between this DNA and the partnerDNA
	this.crossover = function(partner) {
		var newgenes = [];
		var mid = floor(random(this.genes.length));
		for (var i = 0; i < this.genes.length; i++) {
			if (i > mid) {
				newgenes[i] = this.genes[i];
			} else {
				newgenes[i] = partner.genes[i];
			}
		}
		return new DNA(newgenes);
	}

	// Applies the mutationrate to the Genes for this DNA
	this.mutation = function() {
		for (var i = 0; i < this.genes.length; i++) {
			var rnd = random();
			if (rnd <= mutationrate) {
				this.genes[i] = p5.Vector.random2D();
				this.genes[i].setMag(maxforce);
			}
		}
	}
}

// Rockets / Individuals
function Rocket(dna) {
	// Start Position
	this.pos = createVector(width / 2, height);
	// Base Velocity
	this.vel = createVector(0, 0);
	// Base Acceleration
	this.acc = createVector(0, 0);
	// DNA containing genes with Vector2Ds
	if (dna) {
		this.dna = dna;
	} else {
		this.dna = new DNA();
	}
	// Fitness represents a Value based on how well the Rocket is doing
	this.fitness = 0;
	// Completed = true means, that this Rocket has reached the target
	this.completed = false;
	// crashed = true means, that this Rocket has come into contact with the
	// obstacle
	this.crashed = false;
	// Count for how long this Rocket has survived
	this.survivalTime = -1;
	// walled = true means, that this Rocket has come into contact with either
	// side of the canvas
	this.walled = false;
	// Is set when this Rocket is the best in the current Population
	this.best = false;

	// Calculates the Fitness of this Rocket based on how close it is to the
	// target, how long it survived and if it crashed or walled.
	this.calcFitness = function() {
		var d = dist(this.pos.x, this.pos.y, target.x, target.y);

		// The closer this Rocket is to the target, the higher the fitness
		// becomes
		this.fitness = ((d - width) * distanceReward)
				* ((d - width) * distanceReward);

		// Slight Multiplier if this Rocket is very close (ProximityReward)
		if (proximityReward) {
			if (d <= 25) {
				this.fitness *= 1.5;
			} else if (d <= 50) {
				this.fitness *= 1.3;
			} else if (d <= 75) {
				this.fitness *= 1.15;
			}
		}

		// If this Rocket has reached the target, it gains an immense Fitness
		// boost
		if (this.completed) {
			this.fitness *= 2;
		} else {
			// If this Rocket crashed then the Fitness is reduced
			if (this.crashed && !this.completed) {
				this.fitness *= 0.1;
			}
			// If this Rocket walled then the Fitness is reduced
			if (this.walled && !this.completed) {
				this.fitness *= 0.2;
			}
			// If the Fitness of this Rocket becomes 0
			// or it didn't survive for longer than 40 iterations
			// or it is near the bottom of the screen then its Fitness becomes 1
			if (this.fitness == 0 || this.survivalTime < 40
					|| this.pos.y > (width - (width * 0.1))) {
				this.fitness = 1;
			}
		}
		// Reduces the fitness to a more normal Number
		this.fitness = round(this.fitness * 0.1);
	}

	// Applies a force to this Rocket
	this.applyForce = function(force) {
		this.acc.add(force);
	}

	// Updates all relevant Information of this Rocket
	// Checks if the Target was reached,
	// This Rocket crashed,
	// This Rocket walled,
	// sets the survivalTime and
	// moves its Position based on the applied force, the acceleration and
	// velocity
	this.update = function() {
		var d = dist(this.pos.x, this.pos.y, target.x, target.y);
		if (d * scaleMult < proximityToTarget && !this.completed) {
			targetReachedCount++;
			this.completed = true;
			this.pos = target.copy();
		}

		for (var i = 0; i < obstacles.length; i++) {
			if (obstacles[i].checkCollision(this.pos.x, this.pos.y)) {
				this.crashed = true;
			}
		}

		if (this.pos.x > width || this.pos.x < 0) {
			this.walled = true;
		}

		if (this.pos.y > height || this.pos.y < 0) {
			this.walled = true;
		}

		if (this.crashed || this.walled || this.completed) {
			if (this.survivalTime == -1) {
				this.survivalTime = count;
			}
		}

		this.applyForce(this.dna.genes[count]);
		if (!this.completed && !this.crashed && !this.walled) {
			this.vel.add(this.acc);
			this.pos.add(this.vel);
			this.acc.mult(0);
			this.vel.limit(7);
		}
	}

	this.show = function() {
		push();
		noStroke();
		if (this.best) {
			fill(255, 30, 30, 255);
		} else {
			fill(255, 165, 0, 150);
		}
		translate(this.pos.x, this.pos.y);
		rotate(this.vel.heading());
		rectMode(CENTER);
		rect(0, 0, 25 * scaleMult, 5 * scaleMult);
		pop();
	}
}

function Obstacle(x, y, w, h) {
	this.x = x * scaleMult;
	this.y = y * scaleMult;
	this.w = w * scaleMult;
	this.h = h * scaleMult;

	this.show = function() {
		push();
		fill(255, 255);
		rect(this.x, this.y, this.w, this.h);
		pop();
	}

	this.checkCollision = function(x, y) {
		if (x > this.x && x < this.x + this.w && y > this.y
				&& y < this.y + this.h) {
			return true;
		} else {
			return false;
		}
	}
}