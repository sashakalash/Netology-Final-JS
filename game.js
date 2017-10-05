'use strict';
class Vector {
	constructor (x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	plus(vector) {
		if(!(vector instanceof Vector)) {
			throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
		}
		return new Vector(this.x + vector.x, this.y + vector.y);
	}
	times(factor) {
		return new Vector (this.x * factor, this.y * factor);
	}
}


class Actor {
	constructor (position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
		if(!(position instanceof Vector && size instanceof Vector && speed instanceof Vector)) {
			throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
		}
		this.pos = position;
		this.size = size;
		this.speed = speed;
	}
	act (){

	}
	get type() {
		return 'actor';
	}
	get left() {
		return this.pos.x;
	}
	get top() {
		return this.pos.y;
	}
	get right() {
		return this.pos.x + this.size.x;
	}
	get bottom() {
		return this.pos.y + this.size.y;
	}
	isIntersect (movingObj) {
		if(!(movingObj instanceof Actor) || movingObj === undefined) {
			throw new Error ('Можно использовать только ненулевой объект класса Actor');
		}
		if(movingObj === this) {
			return false;
		}
		return movingObj.left < this.right && 
		movingObj.right > this.left && 
		movingObj.top < this.bottom &&
		movingObj.bottom > this.top;

	}
}


class Level {
	constructor (grid, actors) {
		this.grid = grid || [];
		this.actors = actors || [];
		this.status = null;
		this.finishDelay = 1;
	}
	get player() {
		return this.actors.find(el => el.type === 'player');
	}
	get height() { 
		return this.grid.length;
	}
	get width() {
		return this.grid.reduce(function(memo, el) {
			if (el.length > memo) {
				memo = el.length;
			}
			return memo;
		}, 0);
	}
	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}
	actorAt(actor) {
		if(actor === undefined || !(actor instanceof Actor)) {
			throw new Error('Можно использовать только ненулевой объект класса Actor');
		}
		return this.actors.find(el => el.isIntersect(actor) === true);
	}
	obstacleAt(toPos, size) {
		if(!(toPos instanceof Vector && size instanceof Vector)) {
			throw new Error ('Можно использовать только объект класса Vector');
		}
		let movingObj = new Actor(toPos, size);
		let left = Math.ceil(movingObj.left);
		let right = Math.ceil(movingObj.right);
		let top = Math.ceil(movingObj.top); 
		let bottom = Math.ceil(movingObj.bottom);
		if(left < 0 || right > this.width || top < 0) {
			return 'wall';
		} else if(bottom > this.height) {
			return 'lava';
		}
		for(let x = left; x < right; x++) {
			for(let y = top; y < bottom; y++) {
				if(this.grid[x][y] !== undefined) {
					return this.grid[x][y];
				}
			}
		}
		return this.grid.forEach(el => el.find(el => el !== undefined));
	

	}
	removeActor(actor) {
		this.actors = this.actors.filter(el => el !== actor);

	}
	noMoreActors(typeObj){
		return this.actors.find(el => el.type === typeObj) === undefined;
	}
	playerTouched(typeObj, actor = new Actor()) {
		if(this.status === null) {
			if(typeObj === 'lava' || typeObj === 'fireball') {
				this.status = 'lost';
			}	
			if(typeObj === 'coin' && actor.type === 'coin') {
				this.removeActor(actor);
				if(this.noMoreActors(typeObj)) {
					this.status = 'won';
				}
			}
		}
	}
}

class LevelParser {
	constructor(dictionary) {
		this.dictionary = dictionary;
	}
	actorFromSymbol(symb) {
		if(symb !== undefined) {
			return this.dictionary[symb];
		}
	}
	obstacleFromSymbol(symb) {
		switch(symb) {
			case 'x':
				return 'wall';
			case '!':
				return 'lava';
			default: 
			break;	
		}
	}
	createGrid(stringsArr) {
		let newStringsArr = stringsArr.map(el => Array.from(el)); 
		return newStringsArr.map(el => 
			el.map(newEl => 
				this.obstacleFromSymbol(newEl)));
	}
	createActors(stringsArr) {
		let finalArr = [];
		if(this.dictionary === undefined) {
			return finalArr;
		}
		for (let y = 0; y < stringsArr.length; y++) {
			for (let x = 0; x < stringsArr[y].length; x++) {
				let symb = stringsArr[y][x]; //c помощью полученных координат получаем символ 
				let vector = new Vector(x, y); //используем координаты для создания вектора
				let actor = this.actorFromSymbol(symb);	//получаем данные из словаря по символу
				if(actor !== undefined && typeof actor === 'function') { // если функция для данного символа в словаре существуют 
					let movObj = new actor(vector); //получаем с помощью констурктора объект
					if(movObj instanceof Actor) { //проверяем, что это экземпляр Actor
						 finalArr.push(movObj);
					} 
				}
			}
		}	
		return finalArr;	
	}

	parse(stringsArr) {
		return new Level(this.createGrid(stringsArr), this.createActors(stringsArr));
	}
}


class Fireball extends Actor {
	constructor(pos, speed) {
		super(pos, new Vector(1, 1), speed);
	}
	get type() {
		return 'fireball';
	}
	getNextPosition(time = 1) {
		return new Vector(this.speed.x * time + this.pos.x, this.speed.y * time + this.pos.y);
	}
	handleObstacle() {
		this.speed = this.speed.times(-1);
	}
	act(time, level) {
		console.log(this)
		const nextPos = this.getNextPosition(time);
		// console.log(this.speed.x, this.pos.x);
		// console.log(nextPos);
		const obstacle = level.obstacleAt(nextPos, this.size);
		console.log(obstacle);
		if(obstacle !== undefined) {
			this.handleObstacle();
			console.log(this)
		}
		else {
			this.pos = nextPos;
			console.log(this)
		}

		
	}
}

const x = new Fireball(new Vector(1, 1), new Vector(1, 1));
const l = new Level([[,,,,,,], [,,,1], [1,,,,,,], [1,,,,,,,]]);
const y = x.act(2, l);

class HorizontalFireball extends Fireball {
	constructor(pos) {
		super();
		this.size = new Vector(1, 1);
		this.speed = new Vector(2,0);
	}
	act() {
		if(super.act() !== undefined) {
			this.getNextPosition(0);
		}
	}
}

class VerticalFireball extends HorizontalFireball {
	constructor(pos) {
		super();
		this.speed = new Vector(0, 2);
	}
}

class FireRain extends VerticalFireball {
	constructor(pos) {
		super();
		this.speed = new Vector(0, 3);
	}
	act() {
		if(super.act() !== undefined) {
			this.handleObstacle();
		}
	}
}





class Coin extends Actor {
	constructor(pos) {
		super();
		this.size = new Vector(0.6, 0.6);
		this.pos = this.pos.plus(-0.2, -0.1);
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2 * Math.PI;
	}
	get type() {
		return 'coin';
	}
	updateSpring(time = 1) {
		this.spring =+ this.springSpeed * time;
	}
	getSpringVector() {
		return new Vector(0, Math.sinus(this.spring) * this.springDist);
	}
	getNextPosition(time) {
		//Новый вектор равен базовому вектору положения, 
		//увеличенному на вектор подпрыгивания. Увеличивать нужно именно базовый 
		//вектор положения, который получен в конструкторе, а не текущий.
		return this.pos.plus(this.getSpringVector());
	}
	act(time) {
		this.pos = this.getNextPosition();
	}
}

class Player extends Actor {
	constructor(pos) {
		super();
		this.pos = this.pos.plus(0, -0.5);
		this.size = new Vector(0.8, 1,5);
	}
	get type() {
		return 'player';
	}
}
















