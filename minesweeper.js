let startBtn   = document.querySelector('#start');
startBtn.addEventListener('click', event => {
  let rowInput   = document.querySelector('#rows');
  let colInput   = document.querySelector('#columns');
  let mineInput  = document.querySelector('#mines');

  let pregame    = document.querySelector('#pregame');
  let tbody      = document.querySelector('tbody');
  let table      = document.querySelector('table');
  let gameStatus = document.querySelector('#game-status');
  let mineCount  = document.querySelector('#mine-count');
  let timer      = document.querySelector('#timer');
  let start      = true
  let numColors  = [null, 'blue', 'green', 'red', 'purple', 'darkred', '#007B7B', 'brown', 'grey']
  let boardRow   = rowInput.value
  let boardCol   = colInput.value;
  let mines      = mineInput.value;
  let board      = makeBoard(boardRow, boardCol);
  let gameTime;
  let gameOver   = false;
  mineCount.innerText = mines;
  timer.innerText = 0;

  pregame.style.display = 'none';
  rowInput.style.display = 'none';
  colInput.style.display = 'none';
  mineInput.style.display = 'none';
  startBtn.style.display = 'none';
  function Cell (row, column) {
      this.row       = row;
      this.column    = column;
      this.hasMine   = false;
      this.nearMine  = 0;
      this.revealed  = false;
      // this.flagged   = false;
      // this.qMarked   = false;
      this.locked    = false;
      this.marked    = '';
      this.display   = '';
      this.elem    = table.children[row].children[column];

      this.reveal    = (arg) => {

          if (this.marked) {
              return;
          }

          this.elem.innerHTML = this.display;
          this.elem.style.backgroundColor = '#fff';
          this.revealed = true;

          if (!this.nearMine && arg === 'recursive')  {
              let neighbors = adjCells(this);
              for (let i = 0; i < neighbors.length; i++) {

                  if (!neighbors[i].revealed) {
                      neighbors[i].reveal();
                      if (!neighbors[i].nearMine) {
                          neighbors[i].reveal('recursive');
                      }
                  }
              }
          }
      }

      this.getNum   = () => {
          this.nearMine = adjCells(this).filter(el => el.hasMine).length;

          if (!this.hasMine && this.nearMine !== 0) {
              this.elem.style.color = numColors[this.nearMine];
              this.display = this.nearMine;
          }
      }
      this.setFlag  = () => {
          // this.flagged = true;
          if (this.revealed) {
              return;
          }
          this.marked  = '&#x2691';
          this.elem.innerHTML = this.marked;
          this.elem.style.color = '#ded2b3';
          mineCount.innerText = Number(mineCount.innerText) - 1;
      }
      this.removeIndicators = () => {
          this.marked  = '';
          this.elem.innerHTML = this.marked;
          this.getNum();
          mineCount.innerText = Number(mineCount.innerText) + 1;
      }
  }

  function makeBoard(rows, columns) {
      let result = [];
      for (let r = 0; r < rows; r++) {
          let tr = document.createElement('tr');
          for (let c = 0; c < columns; c++) {
              tr.appendChild(document.createElement('td'));
          }
          table.appendChild(tr);
      }

      tbody = table;
      console.log(tbody)
      for (let r = 0; r < rows; r++) {
          let boardRow = [];
          for (let c = 0; c < columns; c++) {
              boardRow.push(new Cell(r, c));
          }
          result.push(boardRow);
      }
      return result;
  }

  function adjCells(cell) {
      result = [
          [-1, -1], [-1, 0], [-1, +1],
          [0, -1],            [0, +1],
          [+1, -1], [+1, 0], [+1, +1]
      ]
      .map(function (position) {
          try {
              return board[cell.row + position[0]][cell.column + position[1]];
          } catch (e) {
              // Screw these errors... do nothing
          }
      }, 0)
      .filter(function (index) {
          return index !== undefined;
      })
      return result;
  }

  function lockCells(cell) {
      cell.locked = true;
      let neighbors = adjCells(cell);
      for (let i = 0; i < neighbors.length; i++) {
          neighbors[i].locked = true;
      }
  }

  function setMines(event) {
      let rows = board.length;
      let columns = board[0].length;
      let minesLeft = mines;
      while (minesLeft > 0) {
          let row = Math.floor(Math.random() * rows);
          let column = Math.floor(Math.random() * columns);
          let cell = board[row][column];
          if (cell.locked) {
              continue;
          }

          cell.display = '&#x1F4A3';
          cell.elem.style.color = 'black';
          cell.hasMine = true;
          cell.locked  = true;
          minesLeft--;
      }
  }

  function setNums() {
      board.forEach(row => {
          row.forEach(cell => cell.getNum());
      })
  }

  function reveal(cell, recursive) {
      if (cell.revealed) {
          return
      }
      cell.reveal();
  }

  function endGame(cell, str) {
      gameOver = true;
      clearInterval(gameTime);
      if (str === 'loss') {
          for (let r = 0; r < board.length; r++) {
              board[r].forEach(el => {
                  el.hasMine ? (reveal(el)) : null
              })

          }
          cell.elem.style.backgroundColor = 'red';
          gameStatus.innerHTML = 'Game Over';
      }
      if (str === 'win') {
          gameStatus.innerHTML = 'Victory';

          for (let r = 0; r < board.length; r++) {
              board[r].forEach(el => el.hasMine ? (!el.marked ? el.setFlag() : null) : null)
          }
      }
  }

  table.addEventListener('click', (event) => {
      if (gameOver) {
          return
      }
      let cell;
      for (let row = 0; row < board.length; row++) {
          let foundCell = board[row].filter(function (cell) {
              console.log(cell.elem === event.target);
              return cell.elem === event.target;
          })[0];
          if (foundCell) {
              cell = foundCell;
              break;
          }
      }

      if (start) {
          lockCells(cell);
          setMines(event);
          setNums();
          gameTime = setInterval(function () {
              timer.innerText = Number(timer.innerText) + 1;
          }, 1000)
          start = false;
      }

      //End game as loss if mine is clicked
      if (cell.hasMine && cell.marked !== '&#x2691') {
          endGame(cell, 'loss');
      } else {
          cell.reveal('recursive');
      }

      let unrevealed = 0;
      board.forEach(row => {
          row.forEach(cell => cell.revealed ? null : unrevealed++)
      })

      //End game as victory if only cells left are mines
      console.log('Unrevealed cells: ' + unrevealed);
      if (unrevealed === mines) {
          endGame(cell, 'win');
      }
  });

  table.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (gameOver) {
          return;
      }
      let cell;
      for (let row = 0; row < board.length; row++) {
          let foundCell = board[row].filter(function (cell) {
              console.log(cell.elem === event.target);
              return cell.elem === event.target;
          })[0];
          if (foundCell) {
              cell = foundCell;
              break;
          }
      }
      if (cell.revealed && cell.nearMine) {
          let neighbors = adjCells(cell);
          let markedNeighbors = neighbors.filter(el => el.marked === '&#x2691');

          if (markedNeighbors.length === cell.nearMine) {
              neighbors.forEach(el => {
                  if (el.hasMine && el.marked !== '&#x2691') {
                      endGame(el, 'loss');
                      return;
                  }
                  el.reveal('recursive')
              });
          }
      } else {
          switch (cell.marked) {
              case '':
                  cell.setFlag();
                  break;
              case '&#x2691':
                  cell.removeIndicators()
                  break;
          }
      }
      let unrevealed = 0;
      board.forEach(row => {
          row.forEach(cell => cell.revealed ? null : unrevealed++)
      })

      //End game as victory if only cells left are mines
      console.log('Unrevealed cells: ' + unrevealed);
      if (unrevealed === mines) {
          endGame(cell, 'win');
      }

  })

})
