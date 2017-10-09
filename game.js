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
    // форматирование: пробелов бы добавить, чтобы было понятно, что это к return относится
		movingObj.right > this.left &&
		movingObj.top < this.bottom &&
		movingObj.bottom > this.top;
	}
}


class Level {
	constructor (grid = [], actors = []) {
	  // здесь лучше создать копии массивов, чтобы нельзя было изменить поле объекта извне
		this.grid = grid;
		this.actors = actors;
		this.status = null;
		this.finishDelay = 1;
	}
	get player() {
	  // можно в конструкторе задать
		return this.actors.find(el => el.type === 'player');
	}
	get height() { 
    // можно в конструкторе задать
		return this.grid.length;
	}
	get width() {
    // можно в одну строчку написать с помощью Math.max и .map (не критично)
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
	  // проверка на undefined лишняя
		if(actor === undefined || !(actor instanceof Actor)) {
			throw new Error('Можно использовать только ненулевой объект класса Actor');
		}
		// сравнение с true лишнее
		return this.actors.find(el => el.isIntersect(actor) === true);
	}
	obstacleAt(toPos, size) {
		if(!(toPos instanceof Vector && size instanceof Vector)) {
			throw new Error ('Можно использовать только объект класса Vector');
		}
    // по хорошему тут можно обойтись без создания объекта, это немного путает
		let movingObj = new Actor(toPos, size);
		// let -> const
		let left = Math.floor(movingObj.left);
		let right = Math.ceil(movingObj.right);
		let top = Math.floor(movingObj.top); 
		let bottom = Math.ceil(movingObj.bottom);
		if(left < 0 || right > this.width || top < 0) {
			return 'wall';
		} else if(bottom > this.height) {
			return 'lava';
		}
		 for(let y = top; y < bottom; y++) {
			for(let x = left; x < right; x++) {
			  // лучше в переменную
				if(this.grid[y][x]) {
					return this.grid[y][x];
				}
			}
		}
		// лишняя строчка
		return undefined;
	}
	removeActor(actor) {
		this.actors = this.actors.filter(el => el !== actor);

	}
	// форматирование (пробел перед фигурной скобкой)
	noMoreActors(typeObj){
	  // здесь лучше использовать some
		return this.actors.find(el => el.type === typeObj) === undefined;
	}
	// не уверен, что значение по-умолчанию для actor
	playerTouched(typeObj, actor = new Actor()) {
	  // можно обратить if и уменьшить вложенность
		if(this.status === null) {
			if(typeObj === 'lava' || typeObj === 'fireball') {
				this.status = 'lost';
				// тут можно написать return
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
    // лучше создать копию объекта
		this.dictionary = dictionary;
	}
	actorFromSymbol(symb) {
	  // лишняя проверка
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
      // default не нужен
			default:
			break;
		}
	}
	createGrid(stringsArr) {
	  // тут можно обойтись двумя map вместо 3
    // строку в массив можно преобразовывать с помощью split
		let newStringsArr = stringsArr.map(el => Array.from(el));
		return newStringsArr.map(el =>
			el.map(newEl =>
				this.obstacleFromSymbol(newEl)));
	}
	createActors(stringsArr) {
		let finalArr = [];
		// лишняя проверка, в конструкторе задаётся в любом случае
		if(this.dictionary === undefined) {
			return finalArr;
		}
		for (let y = 0; y < stringsArr.length; y++) {
			for (let x = 0; x < stringsArr[y].length; x++) {
				let symb = stringsArr[y][x]; //c помощью полученных координат получаем символ
				let vector = new Vector(x, y); //используем координаты для создания вектора
        // в данном случае в actor будет класс или undefined, а по названию переменной похоже, что там объект
				let actor = this.actorFromSymbol(symb);	//получаем данные из словаря по символу
        // проверка на undefined лишняя
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
		// старайтесь избегать тренарных операций сравнения (тут лучше просто if)
		obstacle? this.handleObstacle() : this.pos = nextPos;
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos) {
		const speed = new Vector(2, 0);
		super(pos, speed);
	}
}


class VerticalFireball extends HorizontalFireball {
	constructor(pos) {
		super(pos);
		// скорость должна задаваться через базовый конструктор
		this.speed = new Vector(0, 2);
	}
}

class FireRain extends VerticalFireball {
	constructor(pos) {
		super(pos);
    // скорость должна задаваться через базовый конструктор
		this.speed = new Vector(0, 3);
		// this.beginingPos = this.pos;
	}
	handleObstacle() {
	  // ошибка, см. описание
		this.pos = new Vector(this.pos.x, 0);
	}
}




class Coin extends Actor {
	constructor(pos) {
		const size = new Vector(0.6, 0.6);
		super(pos, size);
		this.fixPos = this.pos;
		// должно задаваться через базовый конструктор
		this.pos = this.pos.plus(new Vector(0.2, 0.1));
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
  // это лишнее тут
  'x': 'wall',
  '!': 'lava',
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  // второй раз
  'v': FireRain
}
const parser = new LevelParser(actorDict);

loadLevels().then(levels => {
  return runGame(JSON.parse(levels), parser, DOMDisplay)
}).then(result => alert('Вы выиграли!'));

















