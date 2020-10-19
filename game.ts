enum Direction {
  UP, RIGHT, DOWN, LEFT
};

interface GridElement {
  color: string;
  getGridPosition: () => Array<Point>;
}

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equal(point: Point) {
    return this.x == point.x && this.y == point.y;
  }
}

class Board {
  height: number;
  width: number;
  ctx: CanvasRenderingContext2D;
  gridElementSize: number;
  gridSize: Point;
  readonly color: string = 'black';

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.width = width;
    this.height = height;
    this.gridElementSize = 20;
    this.gridSize = new Point(this.width / this.gridElementSize - 1, this.height / this.gridElementSize - 1);
  }

  calculateCenter(): Point {
    const x = this.gridSize.x / 2;
    const y = this.gridSize.y / 2;
    return new Point(x, y);
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  fillRectGrid(point: Point) {
    this.ctx.fillRect(
      this.gridElementSize * point.x,
      this.gridElementSize * point.y,
      this.gridElementSize,
      this.gridElementSize
    );
  }

  attach(gridElement: GridElement) {
    const positions = gridElement.getGridPosition();
    this.ctx.fillStyle = gridElement.color;
    for (const position of positions) {
      this.fillRectGrid(position)
    }
  }

  dettach(gridElement: GridElement) {
    const positions = gridElement.getGridPosition();
    this.ctx.fillStyle = this.color;
    for (const position of positions) {
      this.fillRectGrid(position)
    }
  }

  showGameOver(score: number) {
    this.ctx.font = '30px Comic Sans MS';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("Game fucking over", this.width / 2, this.height / 2);
    this.ctx.font = '20px Comic Sans MS';
    this.ctx.fillText(`Score: ${score}`, this.width / 2, this.height / 2 + 30);
  }
};

class Snake implements GridElement {
  length: number;
  board: Board;
  direction: Direction;
  readonly color: string = 'green';
  position: Point[];

  constructor(board: Board) {
    this.length = 1;
    this.board = board;
    this.direction = Direction.RIGHT;
    this.position = [];
  }

  increaseLength() {
    ++this.length;
  }

  getGridPosition() {
    if (!this.position.length) {
      this.position.push(this.board.calculateCenter())
    }
    return this.position;
  }

  changeDirection(direction: Direction) {
    if (this.direction === direction) return;
    if (this.length === 1) this.direction = direction;
    if (this.direction === Direction.UP && direction === Direction.DOWN) return;
    if (this.direction === Direction.RIGHT && direction === Direction.LEFT) return;
    if (this.direction === Direction.DOWN && direction === Direction.UP) return;
    if (this.direction === Direction.LEFT && direction === Direction.RIGHT) return;
    this.direction = direction;
  }

  isAboutToCrash() {
    const nextMove = this.getNextMove();
    for (const pos of this.position) {
      if (nextMove.equal(pos)) {
        return true;
      }
    }
    return false;
  }

  getNextMove() {
    const head = this.position[this.position.length - 1];

    switch (this.direction) {
      case Direction.UP:
        return new Point(head.x, (this.board.gridSize.y + head.y) % (this.board.gridSize.y + 1));
      case Direction.RIGHT:
        return new Point((head.x + 1) % (this.board.gridSize.x + 1), head.y);
      case Direction.DOWN:
        return new Point(head.x, (head.y + 1) % (this.board.gridSize.y + 1));
      case Direction.LEFT:
        return new Point((this.board.gridSize.x + head.x) % (this.board.gridSize.x + 1), head.y);
    }
  }

  move() {
    this.position.push(this.getNextMove());
    if (this.length !== this.position.length)
      this.position.splice(0, 1);
  }
}

class Food implements GridElement {
  board: Board;
  readonly color: string = 'red';
  position: Point[];

  constructor(board: Board) {
    this.board = board;
    this.position = [];
  }

  getGridPosition(): Array<Point> {
    if (!this.position.length) {
      this.position = [new Point(
        Math.floor(Math.random() * this.board.gridSize.x),
        Math.floor(Math.random() * this.board.gridSize.y)
      )];
    }
    return this.position;
  }
}


class Referee {
  snake: Snake;
  board: Board;
  food: Food;

  constructor(board: Board, snake: Snake) {
    this.board = board;
    this.snake = snake;
    this.food = this.createNewFood()
  }

  isSnakeAboutToEat() {
    const nextMove = this.snake.getNextMove();
    const foodPosition = this.food.getGridPosition()[0];
    return nextMove.equal(foodPosition);
  }

  isColliding(gridElementOne: GridElement, gridElementTwo: GridElement) {
    for (const gridPositionOfFirst of gridElementOne.getGridPosition()) {
      for (const gridPositionOfSecond of gridElementTwo.getGridPosition()) {
        if (gridPositionOfFirst.equal(gridPositionOfSecond)) {
          return true;
        }
      }
    }
    return false;
  }

  createNewFood() {
    let food: Food;
    do {
      food = new Food(this.board);
    }
    while (this.isColliding(food, this.snake));
    return food;
  }

  run() {
    this.board.attach(this.food);
    let interval = 100;
    const gameLoop = () => {
      if (this.isSnakeAboutToEat()) {
        this.board.dettach(this.food);
        this.snake.increaseLength();
        this.food = this.createNewFood();
        this.board.attach(this.food);
        interval = interval * 0.9;
      }
      if (this.snake.isAboutToCrash()) {
        this.board.showGameOver(this.snake.length - 1);
        return;
      }
      this.board.dettach(snake);
      this.snake.move();
      this.board.attach(snake);
      setTimeout(gameLoop, interval)
    };
    gameLoop();
  }
}


const canvas = document.getElementById('game') as HTMLCanvasElement;

const board = new Board(canvas, canvas.width, canvas.height);
const snake = new Snake(board);
const referee = new Referee(board, snake);

board.draw();
board.attach(snake);

referee.run();

const gestures: { x: number | null, y: number | null } = { x: null, y: null };

window.addEventListener('touchstart', event => {
  gestures.x = event.touches[0].clientX;
  gestures.y = event.touches[0].clientY;
}, false)

window.addEventListener('touchmove', event => {
  event.preventDefault();

  if (!gestures.x || !gestures.y) {
    return;
  }

  const x = event.touches[0].clientX;
  const y = event.touches[0].clientY;
  const xDiff = gestures.x - x;
  const yDiff = gestures.y - y;

  if (!(Math.abs(xDiff) + Math.abs(yDiff) > 50)) return;
  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      snake.changeDirection(Direction.LEFT);
    } else {
      snake.changeDirection(Direction.RIGHT);
    }
  } else {
    if (yDiff > 0) {
      snake.changeDirection(Direction.UP);
    } else {
      snake.changeDirection(Direction.DOWN);
    }
  }
  gestures.x = null;
  gestures.y = null;
}, false)

window.addEventListener('keydown', event => {
  event.preventDefault();

  switch (event.key) {
    case "ArrowUp":
      snake.changeDirection(Direction.UP);
      break;
    case "ArrowRight":
      snake.changeDirection(Direction.RIGHT);
      break;
    case "ArrowDown":
      snake.changeDirection(Direction.DOWN);
      break;
    case "ArrowLeft":
      snake.changeDirection(Direction.LEFT);
      break;
  }
}, false)
