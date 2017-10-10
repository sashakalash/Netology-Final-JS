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
		if(!(position instanceof Vector)) {
			throw new Error ('Позицией объекта может быть только вектор типа Vector');
		}
		if(!(size instanceof Vector)) {
			throw new Error ('Размером объекта может быть только вектор типа Vector');
		}
		if(!(speed instanceof Vector)) {
			throw new Error ('Скоростью объекта может быть только вектор типа Vector');
		}
		this.pos = position;
		this.size = size;
		this.speed = speed;
	}
	act (){}
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
	constructor (grid = [], actors = []) {
		const gridSet = grid;
		const actorsArr = actors;
		this.grid = gridSet;
		this.actors = actorsArr;
		this.status = null;
		this.finishDelay = 1;
		this.player = this.actors.find(el => el.type === 'player');
		this.height = this.grid.length;
		this.width = Math.max(0,...this.grid.map(el => el.length));
	}
	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}
	actorAt(actor) {
		if(!(actor instanceof Actor)) {
			throw new Error('Можно использовать только ненулевой объект класса Actor');
		}
		return this.actors.find(el => el.isIntersect(actor));
	}
	obstacleAt(toPos, size) {
		if(!(toPos instanceof Vector && size instanceof Vector)) {
			throw new Error ('Можно использовать только объект класса Vector');
		}
		const left = Math.floor(toPos.x);
		const right = Math.ceil(toPos.x + size.x);
		const top = Math.floor(toPos.y); 
		const bottom = Math.ceil(toPos.y + size.y);
		if(left < 0 || right > this.width || top < 0) {
			return 'wall';
		} else if(bottom > this.height) {
			return 'lava';
		}
		 for(let y = top; y < bottom; y++) {
			for(let x = left; x < right; x++) {
				let isObstacle = this.grid[y][x];
				if(isObstacle) {
					return isObstacle;
				}
			}
		}	
	}
	removeActor(actor) {
		this.actors = this.actors.filter(el => el !== actor);

	}
	noMoreActors(typeObj) {
		return !(this.actors.some(el => el.type === typeObj));
	}
	playerTouched(typeObj, actor) {
		if(this.status !== null) {
			return;
		}
		if(typeObj === 'lava' || typeObj === 'fireball') {
			this.status = 'lost';
			return;
		} 	
		if(typeObj === 'coin' && actor.type === 'coin') {
			this.removeActor(actor);
			if(this.noMoreActors(typeObj)) {
				this.status = 'won';
			}
		}
	}
}

class LevelParser {
	constructor(dictionary) {
		const actorsDict = dictionary;
		this.dictionary = actorsDict;
	}
	actorFromSymbol(symb) {
		return this.dictionary[symb];
	}
	obstacleFromSymbol(symb) {
		if(symb === 'x') {
			return 'wall';
		} else if (symb === '!') {
			return 'lava';
		}
	}
	createGrid(stringsArr) {
		return stringsArr.map(el => el.split('').map(newEl => 
				this.obstacleFromSymbol(newEl)));
	}
	createActors(stringsArr) {
		let finalArr = [];
		for (let y = 0; y < stringsArr.length; y++) {
			for (let x = 0; x < stringsArr[y].length; x++) {
				let symb = stringsArr[y][x]; //c помощью полученных координат получаем символ 
				let vector = new Vector(x, y); //используем координаты для создания вектора
				let objClass = this.actorFromSymbol(symb);	//получаем данные из словаря по символу
				if(typeof objClass === 'function') { // если функция для данного символа в словаре существуют 
					let movObj = new objClass(vector); //получаем с помощью констурктора объект
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
		const size = new Vector(1, 1);
		super(pos, size, speed);
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
		const nextPos = this.getNextPosition(time);
		const obstacle = level.obstacleAt(nextPos, this.size);
		if(obstacle) {
			this.handleObstacle(); 
		} else {
			this.pos = nextPos;
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos) {
		const speed = new Vector(2, 0);
		super(pos, speed);
	}
}


class VerticalFireball extends Fireball {
	constructor(pos) {
		const speed = new Vector(0, 2);
		super(pos, speed);
	}
}

class FireRain extends Fireball {
	constructor(pos) {
		const speed = new Vector(0, 3);
		super(pos, speed);
		this.beginingPos = this.pos;
	}
	handleObstacle() {
		this.pos = this.beginingPos;
	}
}

class Coin extends Actor {
	constructor(pos) {
		const size = new Vector(0.6, 0.6);
		const getPos = new Vector(pos.x + 0.2, pos.y + 0.1);
		super(getPos, size);
		this.fixPos = pos;
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.round((Math.random() * 2 * Math.PI) * 100) / 100;
	}
	get type() {
		return 'coin';
	}
	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	}
	getSpringVector() {
		let y = Math.sin(this.spring) * this.springDist;
		return new Vector(0, y);
	}
	getNextPosition(time) {
		this.updateSpring(time);
		this.pos = this.fixPos.plus(this.getSpringVector());
		return this.pos;
	}
	act(time) {
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
	constructor(pos) {
		super(pos);
		this.pos = this.pos.plus(new Vector(0, -0.5));
		this.size = new Vector(0.8, 1.5);
	}
	get type() {
		return 'player';
	}
}


const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
};
const parser = new LevelParser(actorDict);

loadLevels().then(levels => {
  return runGame(JSON.parse(levels), parser, DOMDisplay)
}).then(result => alert('Вы выиграли!'));

















