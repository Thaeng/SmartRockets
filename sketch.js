var population;

var lifeP;
var maxFitP, minFitP, avgFitP, genP;
var count = 0;
var generations = 1;
var target;
var maxforce = 0.2;

var lifespan = 300;
var popCount = 200;
var mutationrate = 0.015;

var rx = 100;
var ry = 150;
var rw = 200;
var rh = 10;

function setup() {
    createCanvas(400,300);
    population = new Population();
    lifeP = createP();
    maxFitP = createP();
    minFitP = createP();
    avgFitP = createP();
    genP = createP();
    target = createVector(width/2, 50);
}

function draw() {
    background(0);
    population.run();
    lifeP.html('Lifespan: ' + count);
    genP.html('Generation: ' + generations);
    count++;
    
    if(count == lifespan){
        population.evaluate();
        maxFitP.html('MAX Fitness: ' + population.maxfit);
        minFitP.html('MIN Fitness: ' + population.minfit);
        avgFitP.html('AVG Fitness: ' + population.avgfit/popCount);
        population.selection();
        count = 0;
        generations++;
    }
    
    fill(255);
    rect(rx,ry,rw,rh);
    
    ellipse(target.x,target.y,16,16);
}

function Population(){
    this.rockets = [];
    this.popsize = popCount;
    this.matingpool = [];
    this.maxfit = 0;
    this.minfit = 999999;
    this.avgfit = 0;
    
    
    for(var i = 0; i <  this.popsize; i++){
        this.rockets[i] = new Rocket();
    }
    
    
    this.evaluate = function(){
        this.maxfit = 0;
        this.minfit = 999999;
        this.avgfit = 0;
        for(var i = 0; i < this.popsize; i++){
            this.rockets[i].calcFitness();
            if(this.rockets[i].fitness > this.maxfit){
                this.maxfit = this.rockets[i].fitness;
            }
            
            if(this.rockets[i].fitness < this.minfit){
                this.minfit = this.rockets[i].fitness;
            }            
            this.avgfit += this.rockets[i].fitness;
        }
        
        for(var i = 0; i < this.popsize; i++){
            this.rockets[i].fitness /= this.maxfit;
        }
        
        this.matingpool = [];
        for(var i = 0; i < this.popsize; i++){
            //Hier wird der matingpool befuellt
            //Je hoeher die Fitness ist desto
            //oefter wird die Rocket in den matingpool genommen
            //BSP: Fittnes 70 = 70mal im matingpool
            //BSP: Fitness 03 = 03mal im matingpool
            var n = this.rockets[i].fitness * 10;
            for(var j = 0; j < n; j++){
                this.matingpool.push(this.rockets[i]);   
            }
        }
    }
    
    this.selection = function(){
        var newRockets = [];
        for(var i = 0; i < this.rockets.length; i++){
            var parentA = random(this.matingpool).dna;
            var parentB = random(this.matingpool).dna;
            var child = parentA.crossover(parentB);
            newRockets[i] = new Rocket(child);
            child.mutation();
        }
        this.rockets = newRockets;   
    }
    
    this.run = function(){
        for(var i = 0; i <  this.popsize; i++){
            this.rockets[i].update();
            this.rockets[i].show();
        }
    }
    
        
}

function DNA(genes){
    
    //Falls genes existiert?!?
    if(genes){
        this.genes = genes;
    }else{
        this.genes = [];
    
        for(var i = 0; i < lifespan; i++){
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(maxforce);
        }
    }
    
    this.crossover = function(partner){
        var newgenes = [];
        var mid = floor(random(this.genes.length));
        for(var i = 0; i < this.genes.length; i++){
            if( i > mid){
                newgenes[i] = this.genes[i];
            }else{
                newgenes[i] = partner.genes[i];
            }
        }
        return new DNA(newgenes);
    }
    
    this.mutation = function(){
        for(var i = 0; i < this.genes; i++){
            if(random(1) < mutationrate){
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(maxforce);
            }
        }
    }
}

function Rocket(dna) {
    this.pos = createVector(width/2,height);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    if(dna){
        this.dna = dna;
    }else{
        this.dna = new DNA();
    }
    this.fitness = 0;
    this.completed = false;
    this.crashed = false;
    this.survivalTime = 0;
    this.walled = false;
    
    this.calcFitness = function(){
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        //this.fitness = (1000-(2.4875*d));
        
        this.fitness = ((d - width) * 0.6) * ((d-width) * 0.6);        
        
        //Distancemagnifier
        if(d <= 25){
            this.fitness *= 1.5;
        }else if(d <= 50){
            this.fitness *= 1.3;
        }else if(d <= 75){
            this.fitness *= 1.15;
        }/*else if(d <= 100){
            this.fitness *= 2;
        }else if(d > 100 && d < 150){
            this.fitness *= 0.5;
        }else if(d > 150){
            this.fitness *= 0.25;
        }*/
        
        //this.fitness *= (1+(this.survivalTime / (popCount/2)));
        
        if(this.completed){
            this.fitness *= 20;
        }
        
        if(this.crashed && !this.completed){
            this.fitness *= 0.4;
        }
        
        if(this.walled && !this.completed){
            this.fitness *= 0.6;
        }
        
        if(this.fitness == 0){
            this.fitness = 1;
        }        
    }
    
    this.applyForce = function(force){
        this.acc.add(force);
    }
    
    this.update = function(){
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        if(d < 10){
            this.completed = true;
            this.pos = target.copy();
        }
        
        if(this.pos.x > rx && this.pos.x < rx + rw && this.pos.y > ry && this.pos.y < ry + rh){
            this.crashed = true;
        }
        
        if(this.pos.x > width || this.pos.x < 0){
            this.walled = true;
        }
        
        if(this.pos.y > height || this.pos.y < 0){
            this.walled = true;
        }
        
        if(this.crashed || this.walled){
            this.survivalTime = count;
        }
        
        this.applyForce(this.dna.genes[count]);        
        if(!this.completed && !this.crashed && !this.walled){
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }
    
    this.show = function(){
        push();
        noStroke();
        fill(255,150);
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        rectMode(CENTER);
        rect(0,0, 25, 5);
        pop();
    }
}